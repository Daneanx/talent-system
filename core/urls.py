from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (TalentProfileViewSet, OrganizerProfileViewSet, EventViewSet, 
                   ApplicationViewSet, RecommendationView, register_user, 
                   register_organizer, login, FacultyViewSet, create_application,
                   FacultyStatsView, UserActivityStatsView, SkillViewSet,
                   OrganizerProfilePublicView)
from rest_framework_simplejwt.views import TokenObtainPairView 

router = DefaultRouter()
router.register(r'profiles', TalentProfileViewSet)
router.register(r'organizer/profiles', OrganizerProfileViewSet, basename='organizer-profile')
router.register(r'events', EventViewSet)
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'faculties', FacultyViewSet)
router.register(r'skills', SkillViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_user, name='register'),
    path('register/organizer/', register_organizer, name='register-organizer'),
    path('login/', login, name='login'),
    path('recommendations/', RecommendationView.as_view(), name='recommendations'),
    path('apply/', create_application, name='create-application'),
    path('faculty/stats/', FacultyStatsView.as_view(), name='faculty-stats'),
    path('user/activity/stats/', UserActivityStatsView.as_view(), name='user-activity-stats'),
    path('organizers/<int:pk>/', OrganizerProfilePublicView.as_view(), name='organizer-public-profile'),
]