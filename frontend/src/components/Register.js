import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        skills: '',
        preferences: '',
        bio: ''
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Проверка совпадения паролей
        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }

        try {
            console.log('Sending user data:', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData.confirmPassword
            });
            
            const userResponse = await api.post('api/register/', {
                username: formData.username,
                email: formData.email,
                password: formData.password
            });
            
            console.log('User response:', userResponse.data);
            
            if (userResponse.data.token) {
                // Сохраняем токен для аутентификации
                localStorage.setItem('token', userResponse.data.token);
                localStorage.setItem('userType', 'talent');
                // Устанавливаем токен для будущих запросов
                api.defaults.headers.common['Authorization'] = `Bearer ${userResponse.data.token}`;
                
                // Обновляем профиль таланта с дополнительными данными
                await api.post('api/profiles/', {
                    skills: formData.skills,
                    preferences: formData.preferences,
                    bio: formData.bio
                });
                
                navigate('/profile');
            } else {
                setError('Не удалось создать пользователя');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Произошла ошибка при регистрации');
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="text-center mb-4">Регистрация таланта</h2>
                            {error && <div className="alert alert-danger">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Имя пользователя:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email:</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Пароль:</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Подтверждение пароля:</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Навыки (через запятую):</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="skills"
                                        value={formData.skills}
                                        onChange={handleChange}
                                        placeholder="Например: танцы, пение, актерское мастерство"
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Предпочтения:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="preferences"
                                        value={formData.preferences}
                                        onChange={handleChange}
                                        placeholder="Например: концерты, фестивали"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">О себе:</label>
                                    <textarea
                                        className="form-control"
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        rows="3"
                                    />
                                </div>
                                <div className="d-grid">
                                    <button type="submit" className="btn btn-primary">
                                        Зарегистрироваться
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register; 