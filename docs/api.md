# API Documentation

## POST /api/register/
Регистрация пользователя.
- **Request**: `{ "username": "string", "email": "string", "password": "string" }`
- **Response**: `{ "id": int, "username": "string", "email": "string" }`

## GET/POST /api/profiles/
Работа с профилями талантов.
- **GET**: Получить список профилей.
- **POST**: Создать профиль `{ "skills": "string", "preferences": "string", "bio": "string" }`.

## GET/POST /api/events/
Работа с мероприятиями.
- **GET**: Получить список мероприятий.
- **POST**: Создать мероприятие `{ "title": "string", "description": "string", "date": "YYYY-MM-DDTHH:MM:SSZ", "required_skills": "string", "image": "file" }`.

## Аутентификация
Все запросы, кроме `/api/register/` и `/api/login/`, требуют заголовок `Authorization: Bearer <token>`.

## Эндпоинты

### Регистрация пользователя
- **URL**: `/api/register/`
- **Метод**: POST
- **Тело запроса**:
  ```json
  {
      "username": "string",
      "password": "string",
      "email": "string"
  }

### Управление заявками
- **URL**: `/api/applications/`
- **Метод**: GET, POST
- **GET**:
  - Возвращает список заявок текущего пользователя.
  - Ответ (200):
    ```json
    [
        {
            "id": 1,
            "user": 4,
            "event": 1,
            "status": "pending",
            "created_at": "2025-05-06T12:00:00Z"
        }
    ]