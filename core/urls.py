from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TalentProfileViewSet, EventViewSet, ApplicationViewSet, RecommendationView, register_user, get_recommendations
from rest_framework_simplejwt.views import TokenObtainPairView # Для создания эндпоинта для логина

router = DefaultRouter()
router.register(r'profiles', TalentProfileViewSet)
router.register(r'events', EventViewSet)
router.register(r'applications', ApplicationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_user, name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('recommendations/', get_recommendations, name='recommendations'),
    path('api/recommendations/', RecommendationView.as_view(), name='recommendations'),
    
]