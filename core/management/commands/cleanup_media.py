import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db.models import F

from core.models import Event, TalentProfile # Импортируйте ваши модели

class Command(BaseCommand):
    help = 'Очищает неиспользуемые медиафайлы (изображения мероприятий и аватары талантов)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Запуск очистки медиафайлов...'))

        media_root = settings.MEDIA_ROOT
        if not media_root:
            self.stdout.write(self.style.ERROR('MEDIA_ROOT не определен в settings.py'))
            return

        # 1. Получаем список всех файлов в папке MEDIA_ROOT
        all_media_files = set()
        for root, _, files in os.walk(media_root):
            for file in files:
                # Формируем путь относительно MEDIA_ROOT
                relative_path = os.path.relpath(os.path.join(root, file), media_root)
                # Используем слеши '/' для стандартизации путей, как в URL
                all_media_files.add(relative_path.replace(os.sep, '/'))

        self.stdout.write(f'Найдено {len(all_media_files)} файлов в папке медиа.')

        # 2. Получаем список медиафайлов, которые используются в моделях
        used_media_files = set()

        # Для изображений мероприятий
        # Используем F() expression для получения чистого значения поля без преобразований
        used_media_files.update(Event.objects.exclude(image='').exclude(image__isnull=True).values_list('image', flat=True))

        # Для аватаров талантов
        used_media_files.update(TalentProfile.objects.exclude(avatar='').exclude(avatar__isnull=True).values_list('avatar', flat=True))

        self.stdout.write(f'Найдено {len(used_media_files)} используемых медиафайлов в базе данных.')

        # 3. Определяем неиспользуемые файлы
        unused_media_files = all_media_files - used_media_files

        self.stdout.write(f'Найдено {len(unused_media_files)} неиспользуемых медиафайлов.')

        # 4. Удаляем неиспользуемые файлы
        deleted_count = 0
        for relative_path in unused_media_files:
            full_path = os.path.join(media_root, relative_path.replace('/', os.sep))
            try:
                # Проверяем, что файл существует перед удалением
                if os.path.exists(full_path) and os.path.isfile(full_path):
                    os.remove(full_path)
                    self.stdout.write(self.style.SUCCESS(f'Удален: {relative_path}'))
                    deleted_count += 1
                else:
                    # Если файл не существует на диске, но числится как неиспользуемый (что странно), пропускаем
                     self.stdout.write(self.style.WARNING(f'Файл не найден на диске (пропущен): {relative_path}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Ошибка при удалении файла {relative_path}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Очистка завершена. Удалено {deleted_count} файлов.'))
