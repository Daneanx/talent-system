import json
from rest_framework.test import APIClient, APITestCase
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from core.models import Event, TalentProfile
from datetime import date
from django.utils import timezone
from datetime import datetime, date

class APITests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        # Очистка старых данных перед тестом
        User.objects.all().delete()
        TalentProfile.objects.all().delete()
        Event.objects.all().delete()

        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.profile = TalentProfile.objects.create(user=self.user, skills='Python')
        self.event = Event.objects.create(
            organizer=self.user,
            title='Test Event',
            description='Test Description',
            required_skills='Python',
            date=date(2025, 6, 1)
        )
        refresh = RefreshToken.for_user(self.user)
        self.token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    # Тесты для /api/login/
    
    # Проверка логина
    def test_login(self):
        response = self.client.post('/api/login/', {'username': 'testuser', 'password': 'testpass'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    # Тесты для /api/register/
        
    # Проверки успешности регистрации
    def test_register_user_success(self):
        data = {'username': 'newuser', 'password': 'newpass123', 'email': 'newuser@example.com'}
        response = self.client.post('/api/register/', data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['username'], 'newuser')
        self.assertEqual(User.objects.count(), 2)

    def test_register_user_missing_fields(self):
        data = {'username': 'newuser'}  # Отсутствует пароль
        response = self.client.post('/api/register/', data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('password', response.data)

    def test_register_user_duplicate_username(self):
        data = {'username': 'testuser', 'password': 'newpass123'}  # Такой username уже есть
        response = self.client.post('/api/register/', data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('username', response.data)

    # Тесты для /api/profiles/
        
    # Проверки взаимодействий с профилем таланта
    def test_get_profile(self):
        response = self.client.get('/api/profiles/')
        print("Response data:", response.data)  # Отладочный вывод
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['user']['id'], self.user.id)
        self.assertEqual(response.data['results'][0]['skills'], 'Python')

    def test_update_profile(self):
        data = {'skills': 'Python, Django', 'preferences': 'Remote', 'bio': 'Developer'}
        response = self.client.post('/api/profiles/', data, format='json')
        self.assertEqual(response.status_code, 201)
        updated_profile = TalentProfile.objects.get(user=self.user)
        self.assertEqual(updated_profile.skills, 'Python, Django')
        self.assertEqual(updated_profile.preferences, 'Remote')

    def test_get_profile_unauthenticated(self):
        self.client.credentials()  # Убираем токен
        response = self.client.get('/api/profiles/')
        self.assertEqual(response.status_code, 401)

    # Тесты для /api/recommendations/
        
    # Проверки работы системы рекомендаций
    def test_get_recommendations(self):
        response = self.client.get('/api/recommendations/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Test Event')

    def test_get_recommendations_no_matching_skills(self):
        self.profile.skills = 'Java'
        self.profile.save()
        response = self.client.get('/api/recommendations/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

    def test_get_recommendations_unauthenticated(self):
        self.client.credentials()  # Убираем токен
        response = self.client.get('/api/recommendations/')
        self.assertEqual(response.status_code, 401)
        self.assertIn('detail', response.data)

    # Тесты для /api/applications/
        
    # Проверки подачи заявки на участие в мероприятии
    def test_application_creation(self):
        data = {'event': self.event.id}
        response = self.client.post('/api/applications/', data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['user'], self.user.id)
        self.assertEqual(response.data['event'], self.event.id)

    def test_application_creation_invalid_event(self):
        data = {'event': 999}  # Несуществующий ID события
        response = self.client.post('/api/applications/', data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('event', response.data)  # Проверяем наличие ошибки для 'event'
        self.assertEqual(response.data['event'][0].code, 'does_not_exist')  # Проверяем код ошибки

    def test_application_creation_unauthenticated(self):
        self.client.credentials()  # Убираем токен
        data = {'event': self.event.id}
        response = self.client.post('/api/applications/', data, format='json')
        self.assertEqual(response.status_code, 401)

    # Тесты для /api/events/
    
    # Проверка получения рекомендаций (мероприятий)
    def test_get_events(self):
        response = self.client.get('/api/events/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Test Event')

    # Проверка создания мероприятий
    def test_create_event(self):
        data = {
            'title': 'New Event',
            'description': 'New Description',
            'required_skills': 'Django',
            'date': date(2025, 7, 1).isoformat()  # Используем date и преобразуем в строку
        }
        response = self.client.post('/api/events/', data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['title'], 'New Event')
        self.assertEqual(Event.objects.count(), 2)

    # Проверка попытки создания мероприятия, будучи неавторизованным
    def test_create_event_unauthenticated(self):
        self.client.credentials()  # Убираем токен
        data = {
            'title': 'New Event',
            'description': 'New Description',
            'required_skills': 'Django',
            'date': date(2025, 7, 1).isoformat()
        }
        response = self.client.post('/api/events/', data, format='json')
        self.assertEqual(response.status_code, 401)

    # Проверка пагинации
    def test_event_pagination(self):
    # Создаём 15 событий
        for i in range(15):
            Event.objects.create(
                organizer=self.user,
                title=f'Event {i}',
                description='Description',
                required_skills='Python',
                date=date(2025, 6, 1)
            )
        response = self.client.get('/api/events/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 10)  # PAGE_SIZE = 10
        self.assertEqual(response.data['count'], 16)  # 15 новых + 1 из setUp
        self.assertIsNotNone(response.data['next'])
        self.assertIsNone(response.data['previous'])

    # Проверка фильтров для запросов пользователей
    
    def test_event_filter_by_skills(self):
        Event.objects.create(
            organizer=self.user,
            title='Java Event',
            description='Description',
            required_skills='Java',
            date=date(2025, 6, 2)
        )
        response = self.client.get('/api/events/?required_skills=Python')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['required_skills'], 'Python')

    def test_event_filter_by_date(self):
        Event.objects.create(
            organizer=self.user,
            title='Another Event',
            description='Description',
            required_skills='Python',
            date=date(2025, 6, 2)
        )
        response = self.client.get('/api/events/?date=2025-06-01')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['date'], '2025-06-01')