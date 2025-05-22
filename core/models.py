from django.db import models
from django.contrib.auth.models import User


class Faculty(models.Model):
    name = models.CharField(max_length=255, verbose_name="Название факультета")
    short_name = models.CharField(max_length=50, verbose_name="Короткое название")
    description = models.TextField(blank=True, null=True, verbose_name="Описание")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Факультет"
        verbose_name_plural = "Факультеты"
        ordering = ['name']

    def __str__(self):
        return self.name

# TalentProfile хранит навыки и предпочтения таланта.
class TalentProfile(models.Model):
    EDUCATION_LEVELS = [
        ('bachelor', 'Бакалавриат'),
        ('master', 'Магистратура'),
        ('specialist', 'Специалитет'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='talent_profile')
    skills = models.TextField(blank=True, null=True)
    preferences = models.TextField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, verbose_name="Факультет")
    education_level = models.CharField(max_length=20, choices=EDUCATION_LEVELS, blank=True, null=True, verbose_name="Уровень образования")
    course = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name="Курс")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Профиль таланта"
        verbose_name_plural = "Профили талантов"

    def __str__(self):
        return f"Профиль {self.user.username}"

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
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateTimeField()
    required_skills = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='event_images/', null=True, blank=True)
    location = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="Факультет")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Мероприятие"
        verbose_name_plural = "Мероприятия"
        ordering = ['-date']

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