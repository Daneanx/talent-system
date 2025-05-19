import React, { useState } from 'react';
import axios from 'axios';
// import api from '../api'; - на будущее, для перехода на куки

const Login = ({ setToken }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Отправляемые данные:', { username, password });
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/login/', { username, password });
            console.log('Ответ сервера:', response.data);
            setToken(response.data.access); // Сохраняем токен в состоянии
            setError('');
        } catch (err) {
            console.error('Ошибка входа:', err.response?.data || err.message);
            setError(
                err.response?.data?.detail || 'Ошибка входа. Проверьте данные.'
            );
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
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Пароль:</label>
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100">Войти</button>
            </form>
            {error && <p className="text-danger text-center mt-3">{error}</p>}
        </div>
    );
};

export default Login;