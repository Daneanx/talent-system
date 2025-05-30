from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView # Для создания эндпоинта для логина
from .models import TalentProfile, OrganizerProfile, Event, Application, Faculty, Skill
from .serializers import (UserSerializer, TalentProfileSerializer, OrganizerProfileSerializer, 
                        EventSerializer, ApplicationSerializer, FacultySerializer, SkillSerializer)
from django.db.models import Q, Count
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from functools import reduce
import operator
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from rest_framework import serializers
from collections import Counter

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    try:
        print(f"Регистрация пользователя, данные: {request.data}")
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            profile = TalentProfile.objects.create(
                user=user,
                preferences=request.data.get('preferences', ''),
                bio=request.data.get('bio', ''),
                faculty_id=request.data.get('faculty_id'),
                education_level=request.data.get('education_level'),
                course=request.data.get('course')
            )
            print(f"Создан профиль таланта с ID: {profile.id}")
            
            skills_data = request.data.get('skills')
            if skills_data and isinstance(skills_data, list):
                profile.skills.set(skills_data)
                print(f"Установлены навыки для профиля {profile.id}: {skills_data}")

            # Генерация токена
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': serializer.data,
                'token': str(refresh.access_token),
                'refresh': str(refresh),
                'userType': 'talent'
            }, status=status.HTTP_201_CREATED)
        print(f"Ошибки валидации при регистрации: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Ошибка при регистрации пользователя: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_organizer(request):
    print("Начинаем регистрацию организатора:", request.data)
    
    user_data = {
        'username': request.data.get('username'),
        'email': request.data.get('email'),
        'password': request.data.get('password')
    }
    
    user_serializer = UserSerializer(data=user_data)
    if user_serializer.is_valid():
        user = user_serializer.save()
        print(f"Создан пользователь с ID: {user.id}")
        
        try:
            organizer_data = {
                'user': user.id,
                'organization_name': request.data.get('organization_name'),
                'description': request.data.get('description', ''),
                'contact_info': request.data.get('contact_info'),
                'website': request.data.get('website', '')
            }
            
            print(f"Данные организатора: {organizer_data}")
            
            organizer_profile = OrganizerProfile.objects.create(
                user=user,
                organization_name=organizer_data['organization_name'],
                description=organizer_data['description'],
                contact_info=organizer_data['contact_info'],
                website=organizer_data['website']
            )
            
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
    print(f"Создание заявки, данные: {request.data}")
    
    event_id = request.data.get('event_id')
    if not event_id:
        return Response({"detail": "Отсутствует ID мероприятия (event_id)"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        event = Event.objects.get(id=event_id)

        try:
            talent_profile = request.user.talent_profile
            user_faculty = talent_profile.faculty
        except TalentProfile.DoesNotExist:
             return Response({"detail": "У вас нет профиля таланта для подачи заявки"}, status=status.HTTP_400_BAD_REQUEST)

        # Проверка ограничения по факультетам
        if event.faculty_restriction:
            if user_faculty is None or user_faculty not in event.faculties.all():
                 return Response(
                     {"detail": "Это мероприятие ограничено по факультетам, и ваш факультет не соответствует."},
                     status=status.HTTP_403_FORBIDDEN
                 )

        # Проверка на дубликаты заявок
        existing_application = Application.objects.filter(
            user=request.user,
            event=event
        ).exists()
        
        if existing_application:
            return Response({"detail": "Вы уже подали заявку на это мероприятие"}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = ApplicationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                user=request.user, 
                event=event
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Event.DoesNotExist:
        return Response({"detail": f"Мероприятие с ID {event_id} не найдено"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Ошибка при создании заявки: {str(e)}")
        return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TalentProfileViewSet(viewsets.ModelViewSet):
    queryset = TalentProfile.objects.all()
    serializer_class = TalentProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        try:
            # Проверяем, существует ли профиль для текущего пользователя
            user = self.request.user
            try:
                profile = TalentProfile.objects.get(user=user)
                print(f"Найден существующий профиль для {user.username}")
                serializer.update(profile, serializer.validated_data)
            except TalentProfile.DoesNotExist:
                print(f"Создание нового профиля для {user.username}")
                serializer.save(user=user)
                
        except Exception as e:
            print(f"Ошибка в perform_create: {str(e)}")
            TalentProfile.objects.get_or_create(
                user=self.request.user,
                defaults={'skills': "", 'preferences': "", 'bio': ""}
            )
            
    def get_queryset(self):
        try:
            if self.request.user.is_authenticated:
                # Проверяем, если передан параметр user_id, то возвращаем конкретный профиль
                user_id = self.kwargs.get('user_id')
                if user_id:
                    return TalentProfile.objects.filter(user_id=user_id).order_by('id')
                return TalentProfile.objects.filter(user=self.request.user).order_by('id')
            return TalentProfile.objects.none()
        except Exception as e:
            print(f"Ошибка в TalentProfileViewSet.get_queryset: {str(e)}")
            return TalentProfile.objects.none()
        
    def perform_update(self, serializer):
        print(f"TalentProfileViewSet perform_update: Request data -> {self.request.data}")
        print(f"TalentProfileViewSet perform_update: Validated data -> {serializer.validated_data}")
        
        # Проверяем наличие файла в запросе
        if 'avatar' in self.request.FILES:
            print(f"Получен новый файл аватара: {self.request.FILES['avatar']}")
            if self.request.FILES['avatar'].size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Размер файла не должен превышать 5MB")
            if not self.request.FILES['avatar'].content_type.startswith('image/'):
                raise serializers.ValidationError("Файл должен быть изображением")

        instance = serializer.save()
        
        print(f"TalentProfileViewSet perform_update: Profile after save -> {instance.avatar.name if instance.avatar else 'No avatar'}")
        return instance

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
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return OrganizerProfile.objects.filter(user=self.request.user)
        return OrganizerProfile.objects.none()

    def perform_update(self, serializer):
        print(f"OrganizerProfileViewSet perform_update: Request data -> {self.request.data}")
        print(f"OrganizerProfileViewSet perform_update: Validated data -> {serializer.validated_data}")
        serializer.save()
        print(f"OrganizerProfileViewSet perform_update: Profile after save -> {serializer.instance.avatar.name if serializer.instance.avatar else 'No avatar'}")

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
    filterset_fields = ['required_skills', 'date', 'status']
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        queryset = Event.objects.all().order_by('-date')

        # Фильтрация по организатору
        if self.request.query_params.get('organizer') == 'me':
            queryset = queryset.filter(organizer=self.request.user)
        
        # Фильтрация по статусу (если не 'published', так как RecommendationView фильтрует только опубликованные)
        status_filter = self.request.query_params.get('status')
        if status_filter:
             queryset = queryset.filter(status=status_filter)

        # Фильтрация по факультету
        faculty_id = self.request.query_params.get('faculty')
        if faculty_id and faculty_id != 'all':
             try:
                 faculty = Faculty.objects.get(id=faculty_id)

                 queryset = queryset.filter(
                     Q(faculty_restriction=False) | Q(faculties=faculty)
                 ).distinct()
             except Faculty.DoesNotExist:

                 return Event.objects.none()


        return queryset

class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            user = self.request.user
            if hasattr(user, 'organizerprofile'):

                return Application.objects.filter(event__organizer=user).order_by('-created_at')
            else:

                return Application.objects.filter(user=user).order_by('-created_at')
        except Exception as e:
            print(f"Ошибка в ApplicationViewSet.get_queryset: {str(e)}")
            return Application.objects.none()

    def perform_create(self, serializer):
        print(f"Создание заявки, данные: {self.request.data}")
        

        event_id = self.request.data.get('event_id')
        if not event_id:
            raise serializers.ValidationError({"detail": "Отсутствует ID мероприятия (event_id)"})
        
        try:

            event = Event.objects.get(id=event_id)
            user = self.request.user


            try:
                talent_profile = user.talent_profile
                user_faculty = talent_profile.faculty
            except TalentProfile.DoesNotExist:

                 raise serializers.ValidationError({"detail": "У вас нет профиля таланта для подачи заявки"})

            # Проверка ограничения по факультетам
            if event.faculty_restriction:
                if user_faculty is None or user_faculty not in event.faculties.all():
                     raise serializers.ValidationError(
                         {"detail": "Это мероприятие ограничено по факультетам, и ваш факультет не соответствует."}
                     )

            # Проверка на дубликаты заявок
            existing_application = Application.objects.filter(
                user=user,
                event=event
            ).exists()
            
            if existing_application:
                raise serializers.ValidationError({"detail": "Вы уже подали заявку на это мероприятие"})
            

            serializer.save(
                user=user, 
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
            talent_profile = self.request.user.talent_profile
            talent_skills = set(talent_profile.skills.all())
            events = Event.objects.filter(status='published')
            
            recommended_events = []
            for event in events:
                event_skills = set(event.required_skills.all())

                if talent_skills & event_skills:
                    recommended_events.append(event)
            
            return recommended_events
            
        except TalentProfile.DoesNotExist:
            return Event.objects.none()
        except Exception as e:
            print(f"Ошибка в RecommendationView.get_queryset: {str(e)}")
            return Event.objects.none()

class FacultyStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        try:
            talent_profile = request.user.talent_profile
            
            if not talent_profile or not talent_profile.faculty:
                return Response({
                    'faculty': None,
                    'message': 'Нет информации',
                    'stats': {
                        'total_users': 0,
                        'total_applications': 0
                    }
                })
            
            faculty = talent_profile.faculty
            
            total_users = TalentProfile.objects.filter(faculty=faculty).count()
            
            faculty_users = TalentProfile.objects.filter(faculty=faculty).values_list('user_id', flat=True)
            total_applications = Application.objects.filter(user_id__in=faculty_users).count()
            
            return Response({
                'faculty': {
                    'id': faculty.id,
                    'name': faculty.name,
                    'short_name': faculty.short_name,
                    'description': faculty.description
                },
                'stats': {
                    'total_users': total_users,
                    'total_applications': total_applications
                }
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserActivityStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            user = request.user

            if not hasattr(user, 'talent_profile'):
                 return Response({
                     'message': 'Эта страница доступна только для пользователей-талантов.'
                 }, status=status.HTTP_403_FORBIDDEN)

            total_applications = Application.objects.filter(user=user).count()

            approved_applications = Application.objects.filter(user=user, status='approved').count()

            # Статистика по навыкам из мероприятий, на которые пользователь подал заявку
            applied_events = Event.objects.filter(application__user=user)

            skill_list = []
            for event in applied_events:
                if event.required_skills.exists():
                    skill_list.extend(event.required_skills.values_list('name', flat=True))

            skill_counts = dict(Counter(skill_list))

            return Response({
                'total_applications': total_applications,
                'approved_applications': approved_applications,
                'skill_stats': skill_counts
            })

        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all().order_by('name')
    serializer_class = SkillSerializer
    permission_classes = [AllowAny]
    pagination_class = None 
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            if self.request.user.is_authenticated and (self.request.user.is_staff or hasattr(self.request.user, 'organizerprofile')):
                return [permissions.IsAuthenticated()]
            return [permissions.IsAdminUser()]
        return [AllowAny()]

class OrganizerProfilePublicView(RetrieveAPIView):
    queryset = OrganizerProfile.objects.all()
    serializer_class = OrganizerProfileSerializer
    permission_classes = [AllowAny]
    lookup_field = 'pk'
