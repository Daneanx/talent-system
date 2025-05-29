import axios from 'axios';

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
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      config.headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => response,
  error => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      
      if (!window.location.pathname.includes('login')) {
        window.location.href = '/';
      }
    }
    
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

export default api;