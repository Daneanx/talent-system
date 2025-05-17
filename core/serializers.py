from rest_framework import serializers
from django.contrib.auth.models import User
from .models import TalentProfile, Event, Application
from datetime import date

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

    class Meta:
        model = Event
        fields = ['id', 'organizer', 'title', 'description', 'required_skills', 'date', 'image']
        read_only_fields = ['id', 'organizer']

class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ['id', 'user', 'event', 'status', 'created_at']
        read_only_fields = ['user', 'created_at']