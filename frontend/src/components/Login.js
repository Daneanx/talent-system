import React, { useState } from 'react';
import api from '../api';

const Login = ({ setToken, setUserType }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        console.log('Отправляемые данные:', { username, password });
        try {
            const response = await api.post('api/login/', { username, password });
            console.log('Ответ сервера:', response.data);
            
            const accessToken = response.data.access;
            const userType = response.data.userType;
            
            setToken(accessToken);
            if (userType) {
                setUserType(userType);
                localStorage.setItem('userType', userType);
            } else {
                // Если тип пользователя не вернулся, делаем дополнительный запрос для проверки
                try {
                    // Устанавливаем токен для запроса
                    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    
                    // Проверяем, есть ли профиль организатора
                    const orgResponse = await api.get('api/organizer/profiles/');
                    if (orgResponse.data.length > 0 || (orgResponse.data.results && orgResponse.data.results.length > 0)) {
                        setUserType('organizer');
                        localStorage.setItem('userType', 'organizer');
                    } else {
                        setUserType('talent');
                        localStorage.setItem('userType', 'talent');
                    }
                } catch (e) {
                    // Если ошибка - вероятно это обычный пользователь
                    setUserType('talent');
                    localStorage.setItem('userType', 'talent');
                }
            }
            
            localStorage.setItem('token', accessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            setError('');
        } catch (err) {
            console.error('Ошибка входа:', err.response?.data || err.message);
            setError(
                err.response?.data?.detail || 'Ошибка входа. Проверьте данные.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center">Вход</h2>
            <form onSubmit={handleSubmit} className="col-md-6 mx-auto">
                <div className="mb-3">
                    <label className="form-label">Имя пользователя:</label>
                    <input
                        type="text"
                        className="form-control"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Пароль:</label>
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button 
                    type="submit" 
                    className="btn btn-primary w-100" 
                    disabled={isLoading}
                >
                    {isLoading ? 'Вход...' : 'Войти'}
                </button>
            </form>
            {error && <p className="text-danger text-center mt-3">{error}</p>}
        </div>
    );
};

export default Login;