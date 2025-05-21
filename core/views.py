from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView # Для создания эндпоинта для логина
from .models import TalentProfile, Event, Application
from .serializers import UserSerializer, TalentProfileSerializer, EventSerializer, ApplicationSerializer
from django.db.models import Q
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from functools import reduce
import operator

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        TalentProfile.objects.create(user=user, skills="", preferences="", bio="")
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    if request.method == 'POST':
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            response = Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
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
    except TalentProfile.DoesNotExist:
        return Response({'error': 'Profile not found'}, status=404)

    user_skills = set(profile.skills.split(', '))
    events = Event.objects.all()
    matched_events = []

    for event in events:
        required_skills = set(event.required_skills.split(', '))
        common_skills = user_skills.intersection(required_skills)
        # Рекомендует пользователю, если совпадает >= 80% требуемых навыков
        if len(common_skills) / len(required_skills) >= 0.8:
            matched_events.append(event)

    serializer = EventSerializer(matched_events, many=True)
    return Response(serializer.data)

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
                return TalentProfile.objects.filter(user=self.request.user).order_by('id')
            return TalentProfile.objects.none()
    def perform_update(self, serializer):
        print(f"Полученные данные: {serializer.initial_data}")  # Логирование входных данных
        print(f"Валидированные данные: {serializer.validated_data}")  # Логирование после валидации
        serializer.save(user=self.request.user)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-date') # Сортировка по дате
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticated]
#    pagination_class = None  # Отключаем пагинацию, если не нужна
    # Настройка фильтров данных для запросов пользователей
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['required_skills', 'date']  # Поля для фильтрации

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)  

class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class RecommendationView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = EventSerializer

    def get_queryset(self):
        profile = TalentProfile.objects.get(user=self.request.user)
        user_skills = set(profile.skills.split(', '))
        events = Event.objects.all()
        matched_events = []

        for event in events:
            required_skills = set(event.required_skills.split(', '))
            common_skills = user_skills.intersection(required_skills)
            if len(common_skills) / len(required_skills) >= 0.8:
                matched_events.append(event.id)

        return Event.objects.filter(id__in=matched_events).order_by('-date')
