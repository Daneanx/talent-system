# Generated by Django 5.2.1 on 2025-05-24 13:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0013_skill_remove_talentprofile_skills_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='event',
            name='required_skills',
        ),
        migrations.AddField(
            model_name='event',
            name='required_skills',
            field=models.ManyToManyField(related_name='events', to='core.skill', verbose_name='Требуемые навыки'),
        ),
    ]
