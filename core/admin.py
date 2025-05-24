from django.contrib import admin
from .models import Event, TalentProfile, Application, OrganizerProfile, Skill

admin.site.register(Event)
admin.site.register(TalentProfile)
admin.site.register(Application)
admin.site.register(OrganizerProfile)
admin.site.register(Skill)