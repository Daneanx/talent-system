import axios from 'axios';

// Получаем токен из localStorage при инициализации
const token = localStorage.getItem('token');

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/',
  withCredentials: true,
  headers: {
    'Authorization': token ? `Bearer ${token}` : ''
  }
});

// Перехватчик запросов для проверки валидности токена
api.interceptors.request.use(
  config => {
    // Получаем текущий токен перед каждым запросом
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      config.headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    // Не устанавливаем Content-Type для FormData, чтобы браузер сам установил
    // правильный заголовок с boundary для multipart/form-data
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Перехватчик ответов для обработки ошибок авторизации и прочих ошибок
api.interceptors.response.use(
  response => response,
  error => {
    const originalRequest = error.config;
    
    // Если ошибка 401 (Unauthorized), можно попробовать обновить токен
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Здесь можно добавить логику обновления токена, если необходимо
      // Например, запрос к эндпоинту обновления токена
      
      // Если не удалось обновить токен, выход из системы
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      
      // Если страница не login, перенаправляем на страницу входа
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/';
      }
    }
    
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

export default api;