# Данный файл является своего рода кастомным обработчиком ошибок, он сделан для того, чтобы пользователь лучше
# понимал, что за ошибку выдаёт моя приложуха :P

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from rest_framework.exceptions import APIException

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is None:
        # Если DRF не обработает ошибку, создаём свою
        custom_response_data = {
            'error': True,
            'message': str(exc),
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR
        }
    else:
        # Формируем пользовательский ответ
        custom_response_data = {
            'error': True,
            'message': response.data.get('detail', 'Произошла ошибка'),
            'status': response.status_code
        }
        if isinstance(response.data, dict) and 'detail' not in response.data:
            custom_response_data['errors'] = response.data
        elif isinstance(exc, ValidationError):
            custom_response_data['errors'] = exc.message_dict if hasattr(exc, 'message_dict') else response.data

    return Response(custom_response_data, status=custom_response_data['status'])