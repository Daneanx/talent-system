from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_organizer_profile'),
    ]

    operations = [
        migrations.AddField(
            model_name='application',
            name='message',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='application',
            name='organizer_comment',
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name='application',
            name='status',
            field=models.CharField(choices=[('pending', 'На рассмотрении'), ('approved', 'Одобрено'), ('rejected', 'Отклонено')], default='pending', max_length=20),
        ),
    ] 