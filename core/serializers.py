from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TalentProfile, OrganizerProfile, Event, Application, Faculty, Skill
from datetime import date
import re
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    organizer_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'organizer_id')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }
    
    def get_organizer_id(self, obj):
        """Возвращает ID профиля организатора, если пользователь является организатором."""
        try:
            return obj.organizerprofile.id
        except OrganizerProfile.DoesNotExist:
            return None

    def validate_password(self, value):
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate_first_name(self, value):
        """Нормализует имя: удаляет лишние пробелы."""
        if value:
            cleaned_value = value.strip()
            if cleaned_value:
                return cleaned_value 
        return value

    def validate_last_name(self, value):
        """Нормализует фамилию: удаляет лишние пробелы."""
        if value:
            cleaned_value = value.strip()
            if cleaned_value:
                return cleaned_value
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = '__all__'

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'

class TalentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=False)
    faculty = FacultySerializer(read_only=True)
    faculty_id = serializers.PrimaryKeyRelatedField(
        queryset=Faculty.objects.all(),
        source='faculty',
        write_only=True,
        allow_null=True,
        required=False
    )
    education_level_display = serializers.CharField(source='get_education_level_display', read_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)

    skills = SkillSerializer(many=True, read_only=True)

    def validate_preferences(self, value):
        if value and not re.match(r'^[a-zA-Zа-яА-ЯёЁ0-9\s,]+$', value):
            raise serializers.ValidationError("Предпочтения могут содержать только буквы, цифры, пробелы и запятые.")
        return value

    def update(self, instance, validated_data):
        print(f"TalentProfileSerializer update: Instance -> {instance}")
        print(f"TalentProfileSerializer update: Validated data -> {validated_data}")
        skills_data = validated_data.pop('skills', None)
        user_data = validated_data.pop('user', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if skills_data is not None:
            instance.skills.set(skills_data)

        if user_data:
            user_serializer = self.fields['user']
            user_serializer.update(instance.user, user_data)

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
    required_skills = SkillSerializer(many=True, read_only=True)
    required_skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source='required_skills'
    )

    user_application_status = serializers.SerializerMethodField()

    def get_applications_count(self, obj):
        return obj.application_set.count()

    def get_organization_name(self, obj):
        try:
            return obj.organizer.organizerprofile.organization_name
        except OrganizerProfile.DoesNotExist:
            return None

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

    def get_user_application_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                application = obj.application_set.get(user=request.user)
                return application.status
            except Application.DoesNotExist:
                return None
        return None

    def create(self, validated_data):
        required_skills_data = validated_data.pop('required_skills', [])
        faculties_data = validated_data.pop('faculties', [])

        user = self.context['request'].user

        event = Event.objects.create(organizer=user, **validated_data)

        event.required_skills.set(required_skills_data)
        event.faculties.set(faculties_data)

        return event

    class Meta:
        model = Event
        fields = [
            'id', 'organizer', 'organization_name', 'title', 'description',
            'required_skills', 'required_skill_ids', 'date', 'image', 'location', 'status',
            'created_at', 'updated_at', 'applications_count', 'faculty_restriction',
            'faculties', 'faculty_ids', 'user_application_status'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user_application_status']

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