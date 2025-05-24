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

# Skill содержит информацию о навыках.
class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="Название навыка")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Навык"
        verbose_name_plural = "Навыки"
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
    skills = models.ManyToManyField(Skill, blank=True, verbose_name="Навыки")
    preferences = models.TextField(blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, verbose_name="Факультет")
    education_level = models.CharField(max_length=20, choices=EDUCATION_LEVELS, blank=True, null=True, verbose_name="Уровень образования")
    course = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name="Курс")
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Профиль таланта"
        verbose_name_plural = "Профили талантов"

    def __str__(self):
        return f"Профиль {self.user.username}"

    def get_education_level_display(self):
        """Возвращает отображаемое значение для поля education_level"""
        for code, display in self.EDUCATION_LEVELS:
            if code == self.education_level:
                return display
        return ""

# OrganizerProfile хранит информацию об организаторе
class OrganizerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    organization_name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    contact_info = models.CharField(max_length=200)  # Телефон, email и т.д.
    website = models.URLField(blank=True)
    verified = models.BooleanField(default=False)  # Подтвержденный организатор или нет
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    def __str__(self):
        return f"{self.organization_name} ({self.user.username})"

# Event содержит информацию о мероприятии, включая требуемые навыки.
class Event(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('published', 'Опубликовано'),
        ('closed', 'Закрыто'),
        ('cancelled', 'Отменено'),
    ]

    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=200)
    description = models.TextField()
    required_skills = models.ManyToManyField(Skill, related_name='events', verbose_name="Требуемые навыки")
    date = models.DateField()
    image = models.ImageField(upload_to='events/', null=True, blank=True)
    location = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    faculty_restriction = models.BooleanField(default=False, verbose_name="Ограничение по факультетам")
    faculties = models.ManyToManyField(Faculty, blank=True, related_name='events', verbose_name="Доступные факультеты")

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Мероприятие"
        verbose_name_plural = "Мероприятия"
        ordering = ['-date']

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