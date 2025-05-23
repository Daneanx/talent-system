from django.db import migrations

def load_agu_faculties(apps, schema_editor):
    Faculty = apps.get_model('core', 'Faculty')
    faculties = [
        (1, 'Агро-биологический факультет'),
        (2, 'Факультет иностранных языков'),
        (3, 'Факультет истории и социальных коммуникаций'),
        (4, 'Факультет наук о Земле, химии и техносферной безопасности'),
        (5, 'Факультет педагогики, психологии, гостеприимства и спорта'),
        (6, 'Факультет физики, математики и инженерных технологий'),
        (7, 'Факультет филологии и журналистики'),
        (8, 'Факультет цифровых технологий и кибербезопасности'),
        (9, 'Факультет экономики и права'),
        (10, 'Каспийская высшая школа перевода'),
        (11, 'Колледж Астраханского государственного университета им. В.Н. Татищева'),
        (12, 'Филиал ФГБОУ ВО «Астраханский государственный университет имени В.Н. Татищева» в г. Знаменске Астраханской области'),
    ]
    for id, name in faculties:
        Faculty.objects.update_or_create(id=id, defaults={'name': name, 'short_name': name[:50], 'description': ''})

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_faculty_alter_event_options_and_more'),
    ]

    operations = [
        migrations.RunPython(load_agu_faculties),
    ] 