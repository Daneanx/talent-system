from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.views import APIView # Импортируем APIView
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView # Для создания эндпоинта для логина
from .models import TalentProfile, OrganizerProfile, Event, Application, Faculty
from .serializers import (UserSerializer, TalentProfileSerializer, OrganizerProfileSerializer, 
                        EventSerializer, ApplicationSerializer, FacultySerializer)
from django.db.models import Q, Count
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from functools import reduce
import operator
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser
from rest_framework import serializers
from collections import Counter # Импортируем Counter для подсчета навыков

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    try:
        print(f"Регистрация пользователя, данные: {request.data}")
        # Передаем все данные, включая first_name и last_name, в сериализатор
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Создание профиля для пользователя с передачей всех данных
            profile = TalentProfile.objects.create(
                user=user,
                skills=request.data.get('skills', ''),
                preferences=request.data.get('preferences', ''),
                bio=request.data.get('bio', ''),
                faculty_id=request.data.get('faculty_id'),
                education_level=request.data.get('education_level'),
                course=request.data.get('course')
            )
            print(f"Создан профиль таланта с ID: {profile.id}")
            
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
    print(f"Создание заявки, данные: {request.data}")
    
    # Проверяем наличие event_id в данных
    event_id = request.data.get('event_id')
    if not event_id:
        return Response({"detail": "Отсутствует ID мероприятия (event_id)"}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Получаем объект мероприятия по ID
        event = Event.objects.get(id=event_id)

        # Получаем профиль текущего пользователя (таланта)
        try:
            talent_profile = request.user.talent_profile
            user_faculty = talent_profile.faculty
        except TalentProfile.DoesNotExist:
             # Если у пользователя нет профиля таланта, он не может подать заявку как талант
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
        
        # Создаем сериализатор для валидации и сохранения
        serializer = ApplicationSerializer(data=request.data)
        if serializer.is_valid():
            # Сохраняем заявку с текущим пользователем и найденным мероприятием
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
                # Если профиль уже существует, обновляем его
                serializer.update(profile, serializer.validated_data)
            except TalentProfile.DoesNotExist:
                print(f"Создание нового профиля для {user.username}")
                # Если профиль новый, сохраняем
                serializer.save(user=user)
                
        except Exception as e:
            print(f"Ошибка в perform_create: {str(e)}")
            # В случае исключения создаем новый профиль с минимальными данными
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
                # Иначе возвращаем профиль текущего пользователя
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
            # Проверяем размер файла (5MB)
            if self.request.FILES['avatar'].size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Размер файла не должен превышать 5MB")
            # Проверяем тип файла
            if not self.request.FILES['avatar'].content_type.startswith('image/'):
                raise serializers.ValidationError("Файл должен быть изображением")
        
        # Сохраняем изменения
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
        # В EventViewSet мы хотим иметь возможность фильтровать по любому статусу при необходимости
        status_filter = self.request.query_params.get('status')
        if status_filter:
             # Обрабатываем множественные статусы, если нужно, но пока просто фильтруем по одному
             queryset = queryset.filter(status=status_filter)

        # Фильтрация по факультету
        faculty_id = self.request.query_params.get('faculty')
        if faculty_id and faculty_id != 'all':
             try:
                 # Проверяем, что факультет с таким ID существует
                 faculty = Faculty.objects.get(id=faculty_id)
                 # Фильтруем мероприятия, которые либо не имеют ограничения по факультету,
                 # либо имеют ограничение и указанный факультет есть в списке доступных
                 queryset = queryset.filter(
                     Q(faculty_restriction=False) | Q(faculties=faculty)
                 ).distinct()
             except Faculty.DoesNotExist:
                 # Если факультет не найден, возвращаем пустой queryset или все мероприятия (в зависимости от логики)
                 # Пока вернем пустой, так как запрос на несуществующий факультет некорректен
                 return Event.objects.none()

        # Фильтрация по required_skills и date будет обрабатываться DjangoFilterBackend
        # Убедимся, что фильтры из filterset_fields применяются АВТОМАТИЧЕСКИ DjangoFilterBackend-ом
        # Этот get_queryset метод в основном для специфичной логики, типа 'organizer=me' и ручной фильтрации по факультету

        return queryset

class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        try:
            user = self.request.user
            if hasattr(user, 'organizerprofile'):
                # Для организатора показываем заявки на его мероприятия
                return Application.objects.filter(event__organizer=user).order_by('-created_at')
            else:
                # Для таланта показываем его заявки
                return Application.objects.filter(user=user).order_by('-created_at')
        except Exception as e:
            print(f"Ошибка в ApplicationViewSet.get_queryset: {str(e)}")
            return Application.objects.none()

    def perform_create(self, serializer):
        print(f"Создание заявки, данные: {self.request.data}")
        
        # Проверяем наличие event_id в данных
        event_id = self.request.data.get('event_id')
        if not event_id:
            raise serializers.ValidationError({"detail": "Отсутствует ID мероприятия (event_id)"})
        
        try:
            # Получаем объект мероприятия по ID
            event = Event.objects.get(id=event_id)
            user = self.request.user

            # Получаем профиль текущего пользователя (таланта)
            try:
                talent_profile = user.talent_profile
                user_faculty = talent_profile.faculty
            except TalentProfile.DoesNotExist:
                 # Если у пользователя нет профиля таланта, он не может подать заявку как талант
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
            
            # Сохраняем заявку с текущим пользователем и найденным мероприятием
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
            profile = TalentProfile.objects.get(user=self.request.user)
            
            # Проверяем, что навыки не пустые
            if not profile.skills or not profile.skills.strip():
                print(f"У пользователя {self.request.user.username} нет навыков")
                # Если навыков нет, возвращаем мероприятия, не ограниченные по факультетам
                return Event.objects.filter(status='published', faculty_restriction=False).order_by('-date')
            
            user_skills = set(s.strip().lower() for s in profile.skills.split(',') if s.strip())
            events = Event.objects.filter(status='published')
            matched_events = []

            for event in events:
                # Проверяем соответствие факультета, если ограничение включено
                if event.faculty_restriction:
                    # Проверяем, существует ли факультет у пользователя и входит ли он в список доступных
                    if profile.faculty is None or profile.faculty not in event.faculties.all():
                        continue # Пропускаем мероприятие, если факультет не соответствует
                
                # Проверяем, что требуемые навыки не пустые, если мероприятие не ограничено по факультету
                # или у пользователя нет навыков, но мероприятие не имеет ограничений по факультетам.
                # Если мероприятие ограничено по факультетам и факультет соответствует, навыки все равно проверяются.
                
                # Если у мероприятия нет требуемых навыков, оно не может быть рекомендовано по навыкам
                if not event.required_skills or not event.required_skills.strip():
                     # Но если оно не ограничено по факультетам, мы все равно можем его показать, если у пользователя нет навыков
                     if not event.faculty_restriction and (not profile.skills or not profile.skills.strip()):
                          matched_events.append(event.id) # Добавляем, если нет ограничений и нет навыков у пользователя
                     continue # Пропускаем, если есть требуемые навыки, но их нет у пользователя
                
                required_skills = set(s.strip().lower() for s in event.required_skills.split(',') if s.strip())
                common_skills = user_skills.intersection(required_skills)
                
                # Рекомендуем мероприятие, если у пользователя есть хотя бы один из требуемых навыков
                # и оно прошло проверку факультета
                if common_skills:
                    match_percentage = len(common_skills) / len(required_skills) if required_skills else 0
                    # Снижаем порог до 30%
                    if match_percentage >= 0.3:
                        matched_events.append(event.id)

            # Убедимся, что в рекомендациях нет дубликатов и они отсортированы
            recommended_events_queryset = Event.objects.filter(id__in=list(set(matched_events))).order_by('-date')

            # Если у пользователя нет навыков, мы уже вернули только нефакультетские мероприятия выше
            # Если навыки есть, добавляем к рекомендациям мероприятия без ограничений по факультетам,
            # которые могли не пройти порог по навыкам, но могут быть интересны.
            if profile.skills and profile.skills.strip():
                 non_restricted_events = Event.objects.filter(status='published', faculty_restriction=False).exclude(id__in=matched_events).order_by('-date')
                 # Объединяем queryset'ы. Это может быть неэффективно для очень больших данных, но для начала подойдет.
                 # В более продвинутой реализации можно использовать Union.
                 combined_queryset = list(recommended_events_queryset) + list(non_restricted_events)
                 # Сортируем объединенный список по дате
                 combined_queryset.sort(key=lambda x: x.date, reverse=True)
                 return Event.objects.filter(id__in=[event.id for event in combined_queryset]) # Возвращаем queryset из ID
            
            return recommended_events_queryset # Если навыков нет, возвращаем только те, что прошли проверку выше

        except TalentProfile.DoesNotExist:
            # Если у пользователя нет профиля таланта, показываем все нефакультетские опубликованные мероприятия
            return Event.objects.filter(status='published', faculty_restriction=False).order_by('-date')
        except Exception as e:
            print(f"Ошибка при получении рекомендаций: {str(e)}")
            return Event.objects.none()

class FacultyStatsView(APIView): # Меняем с RetrieveAPIView на APIView
    permission_classes = [IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        try:
            # Получаем профиль текущего пользователя
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
            
            # Получаем статистику
            total_users = TalentProfile.objects.filter(faculty=faculty).count()
            
            # Получаем все заявки от пользователей данного факультета
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

            # Проверяем, является ли пользователь талантом
            if not hasattr(user, 'talent_profile'):
                 return Response({
                     'message': 'Эта страница доступна только для пользователей-талантов.'
                 }, status=status.HTTP_403_FORBIDDEN)

            # Общее количество поданных заявок
            total_applications = Application.objects.filter(user=user).count()

            # Количество одобренных заявок
            approved_applications = Application.objects.filter(user=user, status='approved').count()

            # Статистика по навыкам из мероприятий, на которые пользователь подал заявку
            # Получаем мероприятия, на которые пользователь подал заявку
            applied_events = Event.objects.filter(application__user=user)

            skill_list = []
            for event in applied_events:
                if event.required_skills:
                    # Разделяем навыки по запятой и добавляем в список, убирая пробелы и пустые строки
                    skills = [s.strip() for s in event.required_skills.split(',') if s.strip()]
                    skill_list.extend(skills)

            # Подсчитываем частоту каждого навыка
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
