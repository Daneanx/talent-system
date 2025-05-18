from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TalentProfile, Event, Application
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
        if not value.strip():
            raise serializers.ValidationError("Поле навыков не может быть пустым.")
        # Проверяем, что навыки разделены запятыми и не содержат некорректных символов
        skills = [skill.strip() for skill in value.split(',')]
        if not all(skill for skill in skills):
            raise serializers.ValidationError("Навыки должны быть разделены запятыми без пустых значений.")
        if not all(re.match(r'^[a-zA-Z0-9\s]+$', skill) for skill in skills):
            raise serializers.ValidationError("Навыки могут содержать только буквы, цифры и пробелы.")
        return ', '.join(skills)

    def validate_preferences(self, value):
        if value and not re.match(r'^[a-zA-Z0-9\s,]+$', value):
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

class EventSerializer(serializers.ModelSerializer):
    organizer = UserSerializer(read_only=True)
    date = serializers.DateField()

    def validate_required_skills(self, value):
        if not value.strip():
            raise serializers.ValidationError("Поле требуемых навыков не может быть пустым.")
        skills = [skill.strip() for skill in value.split(',')]
        if not all(skill for skill in skills):
            raise serializers.ValidationError("Навыки должны быть разделены запятыми без пустых значений.")
        if not all(re.match(r'^[a-zA-Z0-9\s]+$', skill) for skill in skills):
            raise serializers.ValidationError("Навыки могут содержать только буквы, цифры и пробелы.")
        return ', '.join(skills)

    def validate_date(self, value):
        if value < date.today():
            raise serializers.ValidationError("Дата мероприятия не может быть в прошлом.")
        return value

    class Meta:
        model = Event
        fields = ['id', 'organizer', 'title', 'description', 'required_skills', 'date', 'image']
        read_only_fields = ['id', 'organizer']

class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['id', 'user', 'event', 'status', 'created_at']
        read_only_fields = ['user', 'created_at']