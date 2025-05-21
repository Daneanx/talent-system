from django.db import models
from django.contrib.auth.models import User

# TalentProfile хранит навыки и предпочтения таланта.
class TalentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    skills = models.CharField(max_length=200)  # Например, "танцы, пение"
    preferences = models.CharField(max_length=200)  # Например, "концерты, фестивали"
    bio = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

# OrganizerProfile хранит информацию об организаторе
class OrganizerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    organization_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    contact_info = models.CharField(max_length=200)  # Телефон, email и т.д.
    website = models.URLField(blank=True)
    verified = models.BooleanField(default=False)  # Подтвержденный организатор или нет

    def __str__(self):
        return f"{self.organization_name} ({self.user.username})"

# Event содержит информацию о мероприятии, включая требуемые навыки.
class Event(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('published', 'Опубликовано'),
        ('closed', 'Закрыто'),
        ('cancelled', 'Отменено')
    ]

    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=100)
    description = models.TextField()
    date = models.DateField()
    required_skills = models.CharField(max_length=200)  # Например, "танцы, вокал"
    image = models.ImageField(upload_to='events/', blank=True, null=True)
    location = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

# Application связывает таланта и мероприятие для подачи заявки.
class Application(models.Model):
    STATUS_CHOICES = [
        ('pending', 'На рассмотрении'),
        ('approved', 'Одобрено'),
        ('rejected', 'Отклонено')
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey('Event', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    message = models.TextField(blank=True)  # Сообщение от таланта
    organizer_comment = models.TextField(blank=True)  # Комментарий организатора

    def __str__(self):
        return f"{self.user.username} - {self.event.title}"

#class Application(models.Model):
#    talent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
#    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='applications')
#    status = models.CharField(max_length=20, choices=[
#        ('pending', 'Pending'),
#        ('approved', 'Approved'),
#        ('rejected', 'Rejected'),
#    ], default='pending')
#    created_at = models.DateTimeField(auto_now_add=True)
#
#    def __str__(self):
#        return f"{self.talent.username} -> {self.event.title}"