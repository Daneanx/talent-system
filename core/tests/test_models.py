from django.test import TestCase
from django.contrib.auth.models import User
from core.models import Event, TalentProfile, Application
from datetime import date 

class ModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.event = Event.objects.create(
            organizer=self.user,
            title='Test Event',
            description='Test Description',
            required_skills='Python',
            date=date(2025, 6, 1) 
        )
        self.profile = TalentProfile.objects.create(user=self.user, skills='Python')

    def test_event_creation(self):
        self.assertEqual(self.event.title, 'Test Event')
        self.assertEqual(self.event.required_skills, 'Python')

    def test_application_creation(self):
        application = Application.objects.create(user=self.user, event=self.event)
        self.assertEqual(application.user, self.user)
        self.assertEqual(application.event, self.event)
        self.assertEqual(application.status, 'pending')