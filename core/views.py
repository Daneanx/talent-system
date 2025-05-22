from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView # Для создания эндпоинта для логина
from .models import TalentProfile, OrganizerProfile, Event, Application, Faculty
from .serializers import (UserSerializer, TalentProfileSerializer, OrganizerProfileSerializer, 
                        EventSerializer, ApplicationSerializer, FacultySerializer)
from django.db.models import Q
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from functools import reduce
import operator
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from rest_framework import serializers

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Создание пустого профиля для пользователя
        TalentProfile.objects.create(user=user, skills="", preferences="", bio="")
        # Генерация токена
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': serializer.data,
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'userType': 'talent'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_organizer(request):
    print("Начинаем регистрацию организатора:", request.data)
    
    user_data = {
        'username': request.data.get('username'),
        'email': request.data.get('email'),
        'password': request.data.get('password')
    }
    
    # Проверяем и создаем пользователя
    user_serializer = UserSerializer(data=user_data)
    if user_serializer.is_valid():
        user = user_serializer.save()
        print(f"Создан пользователь с ID: {user.id}")
        
        try:
            # Создаем профиль организатора
            organizer_data = {
                'user': user.id,
                'organization_name': request.data.get('organization_name'),
                'description': request.data.get('description', ''),
                'contact_info': request.data.get('contact_info'),
                'website': request.data.get('website', '')
            }
            
            print(f"Данные организатора: {organizer_data}")
            
            # Создаем профиль напрямую через модель, минуя сериализатор
            organizer_profile = OrganizerProfile.objects.create(
                user=user,
                organization_name=organizer_data['organization_name'],
                description=organizer_data['description'],
                contact_info=organizer_data['contact_info'],
                website=organizer_data['website']
            )
            
            # Генерируем токен для пользователя
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': user_serializer.data,
                'organizer': {
                    'id': organizer_profile.id,
                    'organization_name': organizer_profile.organization_name,
                    'description': organizer_profile.description,
                    'contact_info': organizer_profile.contact_info,
                    'website': organizer_profile.website,
                    'verified': organizer_profile.verified
                },
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'userType': 'organizer'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # В случае ошибки удаляем пользователя
            user.delete()
            print(f"Ошибка при создании профиля организатора: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    print(f"Ошибки в данных пользователя: {user_serializer.errors}")
    return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    if request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            # Определяем тип пользователя
            user_type = 'organizer' if hasattr(user, 'organizerprofile') else 'talent'
            response = Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'userType': user_type
            }, status=status.HTTP_200_OK)
            response.set_cookie(
                key='access_token',
                value=str(refresh.access_token),
                httponly=True,
                secure=False,  # Для разработки
                samesite='Lax',
            )
            return response
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response({'error': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_application(request):
    serializer = ApplicationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Метод рекомендаций
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=401)

    try:
        profile = TalentProfile.objects.get(user=request.user)
        
        # Проверяем, что навыки не пустые
        if not profile.skills or not profile.skills.strip():
            print(f"У пользователя {request.user.username} нет навыков")
            return Response([])
        
        user_skills = set(s.strip().lower() for s in profile.skills.split(',') if s.strip())
        events = Event.objects.filter(status='published')
        matched_events = []

        for event in events:
            # Проверяем, что требуемые навыки не пустые
            if not event.required_skills or not event.required_skills.strip():
                continue
                
            required_skills = set(s.strip().lower() for s in event.required_skills.split(',') if s.strip())
            common_skills = user_skills.intersection(required_skills)
            
            # Рекомендуем мероприятие, если у пользователя есть хотя бы один из требуемых навыков
            if common_skills:
                match_percentage = len(common_skills) / len(required_skills) if required_skills else 0
                # Если совпадение больше или равно 50%, добавляем в рекомендации
                if match_percentage >= 0.5:
                    matched_events.append(event)

        serializer = EventSerializer(matched_events, many=True)
        return Response(serializer.data)
    
    except TalentProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=404)
    except Exception as e:
        print(f"Ошибка при получении рекомендаций: {str(e)}")
        return Response({'error': 'Error while getting recommendations'}, status=500)

class TalentProfileViewSet(viewsets.ModelViewSet):
    queryset = TalentProfile.objects.all()
    serializer_class = TalentProfileSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Проверяем, существует ли профиль для текущего пользователя
        user = self.request.user
        profile, created = TalentProfile.objects.get_or_create(user=user)
        if not created:
            # Если профиль уже существует, обновляем его
            serializer.update(profile, serializer.validated_data)
        else:
            # Если профиль новый, сохраняем
            serializer.save(user=user)
            
    def get_queryset(self):
        if self.request.user.is_authenticated:
            # Проверяем, если передан параметр user_id, то возвращаем конкретный профиль
            user_id = self.kwargs.get('user_id')
            if user_id:
                return TalentProfile.objects.filter(user_id=user_id).order_by('id')
            # Иначе возвращаем профиль текущего пользователя
            return TalentProfile.objects.filter(user=self.request.user).order_by('id')
        return TalentProfile.objects.none()
        
    def perform_update(self, serializer):
        print(f"Полученные данные: {serializer.initial_data}")  # Логирование входных данных
        print(f"Валидированные данные: {serializer.validated_data}")  # Логирование после валидации
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='talent/(?P<user_id>[^/.]+)')
    def get_talent_profile(self, request, user_id=None):
        try:
            profile = TalentProfile.objects.get(user_id=user_id)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except TalentProfile.DoesNotExist:
            return Response({"detail": "Профиль таланта не найден"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OrganizerProfileViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizerProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return OrganizerProfile.objects.filter(user=self.request.user)
        return OrganizerProfile.objects.none()

class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-date')
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['required_skills', 'date', 'status', 'faculty']
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        queryset = Event.objects.all()
        if self.request.query_params.get('organizer') == 'me':
            return queryset.filter(organizer=self.request.user)
        
        # Фильтрация по факультету
        faculty_id = self.request.query_params.get('faculty')
        if faculty_id:
            if faculty_id == 'all':
                return queryset
            return queryset.filter(faculty_id=faculty_id)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)

class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'organizerprofile'):
            # Для организатора показываем заявки на его мероприятия
            return Application.objects.filter(event__organizer=user)
        else:
            # Для таланта показываем его заявки
            return Application.objects.filter(user=user)

    def perform_create(self, serializer):
        print(f"Создание заявки, данные: {self.request.data}")
        
        # Проверяем наличие event_id в данных
        event_id = self.request.data.get('event_id')
        if not event_id:
            raise serializers.ValidationError({"detail": "Отсутствует ID мероприятия (event_id)"})
        
        try:
            # Получаем объект мероприятия по ID
            event = Event.objects.get(id=event_id)
            
            # Проверка на дубликаты заявок
            existing_application = Application.objects.filter(
                user=self.request.user,
                event=event
            ).exists()
            
            if existing_application:
                raise serializers.ValidationError({"detail": "Вы уже подали заявку на это мероприятие"})
            
            # Сохраняем заявку с текущим пользователем и найденным мероприятием
            serializer.save(
                user=self.request.user, 
                event=event
            )
            
        except Event.DoesNotExist:
            raise serializers.ValidationError({"detail": f"Мероприятие с ID {event_id} не найдено"})
        except Exception as e:
            print(f"Ошибка при создании заявки: {str(e)}")
            raise serializers.ValidationError({"detail": str(e)})

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        application = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['pending', 'approved', 'rejected']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        application.status = new_status
        application.organizer_comment = request.data.get('comment', '')
        application.save()
        return Response(ApplicationSerializer(application).data)

class RecommendationView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer

    def get_queryset(self):
        try:
            profile = TalentProfile.objects.get(user=self.request.user)
            
            # Логируем навыки пользователя для отладки
            print(f"Навыки пользователя {self.request.user.username}: {profile.skills}")
            
            # Проверяем, что навыки не пустые
            if not profile.skills or not profile.skills.strip():
                print(f"У пользователя {self.request.user.username} нет навыков")
                return Event.objects.filter(status='published').order_by('-date')
            
            user_skills = set(s.strip().lower() for s in profile.skills.split(',') if s.strip())
            print(f"Обработанные навыки пользователя: {user_skills}")
            
            events = Event.objects.filter(status='published')
            matched_events = []

            for event in events:
                print(f"Проверка мероприятия {event.title}, требуемые навыки: {event.required_skills}")
                
                # Проверяем, что требуемые навыки не пустые
                if not event.required_skills or not event.required_skills.strip():
                    continue
                
                required_skills = set(s.strip().lower() for s in event.required_skills.split(',') if s.strip())
                print(f"Обработанные требуемые навыки: {required_skills}")
                
                common_skills = user_skills.intersection(required_skills)
                print(f"Общие навыки: {common_skills}")
                
                # Рекомендуем мероприятие, если у пользователя есть хотя бы один из требуемых навыков
                if common_skills:
                    match_percentage = len(common_skills) / len(required_skills) if required_skills else 0
                    print(f"Процент совпадения: {match_percentage * 100:.2f}%")
                    
                    # Если совпадение больше или равно 50%, добавляем в рекомендации
                    if match_percentage >= 0.5:
                        matched_events.append(event.id)
                        print(f"Мероприятие {event.title} добавлено в рекомендации")

            return Event.objects.filter(id__in=matched_events).order_by('-date')
        except TalentProfile.DoesNotExist:
            print(f"Профиль для пользователя {self.request.user.username} не найден")
            return Event.objects.filter(status='published').order_by('-date')
        except Exception as e:
            print(f"Ошибка при получении рекомендаций: {str(e)}")
            return Event.objects.filter(status='published').order_by('-date')
