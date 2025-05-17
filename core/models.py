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

# Event содержит информацию о мероприятии, включая требуемые навыки.
class Event(models.Model):
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')
    title = models.CharField(max_length=100)
    description = models.TextField()
    date = models.DateField()
    required_skills = models.CharField(max_length=200)  # Например, "танцы, вокал"
    image = models.ImageField(upload_to='events/', blank=True, null=True)

    def __str__(self):
        return self.title

# Application связывает таланта и мероприятие для подачи заявки.
class Application(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey('Event', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

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