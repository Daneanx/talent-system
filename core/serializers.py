from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TalentProfile, OrganizerProfile, Event, Application
from datetime import date
import re

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class TalentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    def validate_skills(self, value):
        print(f"Проверяем навыки: {value}")  # Логирование
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

    class Meta:
        model = TalentProfile
        fields = ['id', 'user', 'skills', 'preferences', 'bio']
        read_only_fields = ['user']

    def update(self, instance, validated_data):
        instance.skills = validated_data.get('skills', instance.skills)
        instance.preferences = validated_data.get('preferences', instance.preferences)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.save()
        return instance

class OrganizerProfileSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    events_count = serializers.SerializerMethodField()

    def get_events_count(self, obj):
        return obj.user.events.count()

    class Meta:
        model = OrganizerProfile
        fields = ['id', 'user', 'organization_name', 'description', 'contact_info', 
                 'website', 'verified', 'events_count']
        read_only_fields = ['verified']

class EventSerializer(serializers.ModelSerializer):
    organizer = UserSerializer(read_only=True)
    applications_count = serializers.SerializerMethodField()
    organization_name = serializers.SerializerMethodField()

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

    class Meta:
        model = Event
        fields = ['id', 'organizer', 'organization_name', 'title', 'description', 
                 'required_skills', 'date', 'image', 'location', 'status', 
                 'created_at', 'updated_at', 'applications_count']
        read_only_fields = ['id', 'organizer', 'created_at', 'updated_at']

class ApplicationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    event = EventSerializer(read_only=True)
    talent_profile = serializers.SerializerMethodField()

    def get_talent_profile(self, obj):
        try:
            return TalentProfileSerializer(obj.user.talentprofile).data
        except TalentProfile.DoesNotExist:
            return None

    class Meta:
        model = Application
        fields = ['id', 'user', 'event', 'status', 'created_at', 
                 'message', 'organizer_comment', 'talent_profile']
        read_only_fields = ['user', 'created_at']