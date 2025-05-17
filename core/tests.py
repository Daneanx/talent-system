from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth.models import User

class APITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'test123'
        }

    def test_register_user(self):
        response = self.client.post('/api/register/', self.user_data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.objects.count(), 1)