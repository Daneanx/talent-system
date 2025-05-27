import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const OrganizerRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        organization_name: '',
        description: '',
        contact_info: '',
        website: ''
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setIsSubmitting(true);

        try {
            if (formData.password !== formData.confirmPassword) {
                setError('Пароли не совпадают');
                setIsSubmitting(false);
                return;
            }

            const requestData = {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                organization_name: formData.organization_name,
                description: formData.description || '',
                contact_info: formData.contact_info,
                website: formData.website || ''
            };

            console.log('Sending registration data:', requestData);

            const response = await api.post('api/register/organizer/', requestData);
            console.log('Registration response:', response.data);

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userType', 'organizer');
                api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

                if (response.data.organizer_id) {
                    localStorage.setItem('organizerId', response.data.organizer_id);
                }

                navigate('/organizer/dashboard');
                window.location.reload();
            } else {
                setError('Не удалось получить токен авторизации');
            }
        } catch (err) {
            console.error('Registration error:', err.response || err);
            if (err.response && err.response.data) {
                // Более подробная обработка ошибок
                if (typeof err.response.data === 'object') {
                    const errorMessages = [];
                    for (const key in err.response.data) {
                        if (Array.isArray(err.response.data[key])) {
                            errorMessages.push(`${key}: ${err.response.data[key].join(', ')}`);
                        } else {
                            errorMessages.push(`${key}: ${err.response.data[key]}`);
                        }
                    }
                    setError(errorMessages.join('\n'));
                } else {
                    setError(err.response.data);
                }
            } else {
                setError('Произошла ошибка при регистрации');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="text-center mb-4">Регистрация организатора</h2>
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
                                    <label className="form-label">Название организации:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="organization_name"
                                        value={formData.organization_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Описание организации:</label>
                                    <textarea
                                        className="form-control"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="3"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Контактная информация:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="contact_info"
                                        value={formData.contact_info}
                                        onChange={handleChange}
                                        placeholder="Телефон, email для связи"
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Веб-сайт:</label>
                                    <input
                                        type="url"
                                        className="form-control"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div className="d-grid">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary pinterest-like-button"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
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

export default OrganizerRegister; 