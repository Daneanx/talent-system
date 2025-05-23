from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TalentProfile, OrganizerProfile, Event, Application, Faculty
from datetime import date
import re

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_first_name(self, value):
        """Нормализует имя: удаляет лишние пробелы."""
        if value:
            # Удаляем лишние пробелы
            cleaned_value = value.strip()
            if cleaned_value:
                return cleaned_value # Возвращаем значение без изменения регистра
        # Если поле опционально, можно вернуть None или пустую строку
        # В данном случае, т.к. поле required на фронтенде, считаем его обязательным при заполнении.
        # Если оно может быть пустым, нужно добавить allow_blank=True в поле сериализатора.
        return value # Возвращаем оригинальное значение, если пустое/None

    def validate_last_name(self, value):
        """Нормализует фамилию: удаляет лишние пробелы."""
        if value:
            # Удаляем лишние пробелы
            cleaned_value = value.strip()
            if cleaned_value:
                return cleaned_value # Возвращаем значение без изменения регистра
        return value # Возвращаем оригинальное значение, если пустое/None

    def create(self, validated_data):
        # Извлекаем first_name и last_name, чтобы передать их create_user
        first_name = validated_data.pop('first_name', None)
        last_name = validated_data.pop('last_name', None)
        user = User.objects.create_user(**validated_data)
        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        user.save()
        return user

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ['id', 'name', 'short_name', 'description']

class TalentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=False)
    faculty = FacultySerializer(read_only=True)
    faculty_id = serializers.PrimaryKeyRelatedField(
        queryset=Faculty.objects.all(),
        source='faculty',
        write_only=True,
        required=False
    )
    education_level_display = serializers.CharField(source='get_education_level_display', read_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    # Явно добавляем поля пользователя для обновления через профиль
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)

    def validate_skills(self, value):
        print(f"Проверяем навыки: {value}")  # Логирование
        if value is None:
            return ""
        if not value.strip():
            raise serializers.ValidationError("Поле навыков не может быть пустым.")
        # Проверка на наличие разделения навыков запятыми и на отсутствие некорректных символов
        skills = [skill.strip() for skill in value.split(',')]
        if not all(skill for skill in skills):
            raise serializers.ValidationError("Навыки должны быть разделены запятыми без пустых значений.")
        print(f"Входные данные навыков (сырые): {value}")
        if not all(re.match(r'^[a-zA-Zа-яА-ЯёЁ0-9\s]+$', skill) for skill in skills):
            raise serializers.ValidationError("Навыки могут содержать только буквы, цифры и пробелы.")
        return ', '.join(skills)

    def validate_preferences(self, value):
        if value and not re.match(r'^[a-zA-Zа-яА-ЯёЁ0-9\s,]+$', value):
            raise serializers.ValidationError("Предпочтения могут содержать только буквы, цифры, пробелы и запятые.")
        return value

    def update(self, instance, validated_data):
        print(f"TalentProfileSerializer update: Instance -> {instance}")
        print(f"TalentProfileSerializer update: Validated data -> {validated_data}")

        # Извлекаем вложенные данные пользователя, если они присутствуют
        user_data = validated_data.pop('user', None)

        # Обновляем поля TalentProfile
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Сохраняем изменения профиля таланта
        instance.save()

        # Если данные пользователя присутствуют, обновляем связанный объект User
        if user_data:
            # Получаем сериализатор для связанного пользователя
            user_serializer = self.fields['user']
            # Передаем только те данные пользователя, которые пришли в запросе
            user_serializer.update(instance.user, user_data)

        # Примечание: При использовании multipart/form-data, фронтенд может отправлять поля
        # first_name и last_name не как вложенный объект user, а на верхнем уровне.
        # В этом случае, логика обновления пользователя выше не сработает.
        # Если это так, необходимо будет обрабатывать эти поля на верхнем уровне здесь.
        # Например:
        # if 'first_name' in validated_data:
        #     instance.user.first_name = validated_data['first_name']
        # if 'last_name' in validated_data:
        #     instance.user.last_name = validated_data['last_name']
        # instance.user.save()
        # Однако, с UserSerializer(read_only=False), вложенный подход предпочтительнее.

        print(f"TalentProfileSerializer update: Profile after save -> {instance.avatar.name if instance.avatar else 'No avatar'}")
        return instance

    class Meta:
        model = TalentProfile
        fields = [
            'id', 'user', 'skills', 'preferences', 'bio', 
            'faculty', 'faculty_id', 'education_level',
            'education_level_display', 'course', 'avatar',
            'first_name', 'last_name'
        ]
        read_only_fields = ['id']

class OrganizerProfileSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    events_count = serializers.SerializerMethodField()
    avatar = serializers.ImageField(required=False, allow_null=True)

    def get_events_count(self, obj):
        return obj.user.events.count()

    def update(self, instance, validated_data):
        print(f"OrganizerProfileSerializer update: Instance -> {instance}")
        print(f"OrganizerProfileSerializer update: Validated data -> {validated_data}")

        instance.organization_name = validated_data.get('organization_name', instance.organization_name)
        instance.description = validated_data.get('description', instance.description)
        instance.contact_info = validated_data.get('contact_info', instance.contact_info)
        instance.website = validated_data.get('website', instance.website)
        if 'avatar' in validated_data:
            instance.avatar = validated_data['avatar']

        instance.save()
        print(f"OrganizerProfileSerializer update: Profile after save -> {instance.avatar.name if instance.avatar else 'No avatar'}")
        return instance

    class Meta:
        model = OrganizerProfile
        fields = ['id', 'user', 'organization_name', 'description', 'contact_info', 
                 'website', 'verified', 'events_count', 'avatar']
        read_only_fields = ['verified']

class EventSerializer(serializers.ModelSerializer):
    organizer = UserSerializer(read_only=True)
    applications_count = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()
    faculties = FacultySerializer(many=True, read_only=True)
    faculty_ids = serializers.PrimaryKeyRelatedField(
        queryset=Faculty.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='faculties'
    )

    def get_applications_count(self, obj):
        return obj.application_set.count()

    def get_organization_name(self, obj):
        try:
            return obj.organizer.organizerprofile.organization_name
        except OrganizerProfile.DoesNotExist:
            return None

    def validate_required_skills(self, value):
        if not value.strip():
            raise serializers.ValidationError("Поле требуемых навыков не может быть пустым.")
        skills = [skill.strip() for skill in value.split(',')]
        if not all(skill for skill in skills):
            raise serializers.ValidationError("Навыки должны быть разделены запятыми без пустых значений.")
        if not all(re.match(r'^[a-zA-Zа-яА-ЯёЁ0-9\s]+$', skill) for skill in skills):
            raise serializers.ValidationError("Навыки могут содержать только буквы, цифры и пробелы.")
        return ', '.join(skills)

    def validate_date(self, value):
        if value < date.today():
            raise serializers.ValidationError("Дата мероприятия не может быть в прошлом.")
        return value

    def validate(self, data):
        if data.get('faculty_restriction') and not data.get('faculties'):
            raise serializers.ValidationError(
                {"faculties": "При включении ограничения по факультетам необходимо выбрать хотя бы один факультет."}
            )
        return data

    class Meta:
        model = Event
        fields = ['id', 'organizer', 'organization_name', 'title', 'description', 
                 'required_skills', 'date', 'image', 'location', 'status', 
                 'created_at', 'updated_at', 'applications_count', 'faculty_restriction',
                 'faculties', 'faculty_ids']
        read_only_fields = ['id', 'organizer', 'created_at', 'updated_at']

class ApplicationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    event = EventSerializer(read_only=True)
    talent_profile = serializers.SerializerMethodField()

    def get_talent_profile(self, obj):
        try:
            if hasattr(obj.user, 'talent_profile'):
                return TalentProfileSerializer(obj.user.talent_profile).data
            return None
        except Exception:
            return None

    class Meta:
        model = Application
        fields = ['id', 'user', 'event', 'status', 'created_at', 
                 'message', 'organizer_comment', 'talent_profile']
        read_only_fields = ['user', 'created_at']