# Данный файл является своего рода кастомным обработчиком ошибок, он сделан для того, чтобы пользователь лучше
# понимал, что за ошибку выдаёт моя приложуха :P

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        custom_response_data = {
            'error': True,
            'message': response.data.get('detail', 'Произошла ошибка'),
            'status': response.status_code
        }
        if isinstance(response.data, dict):
            custom_response_data['errors'] = response.data
        response.data = custom_response_data
    return response