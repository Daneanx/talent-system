import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './OrganizerProfile.css';

const OrganizerProfile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        organization_name: '',
        description: '',
        contact_info: '',
        website: ''
    });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // Проверяем наличие токена
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен отсутствует, пожалуйста, войдите в систему');
                setLoading(false);
                return;
            }

            const response = await api.get('api/organizer/profiles/');
            
            // Данные могут прийти как массив или как объект с полем results
            let profileData;
            if (Array.isArray(response.data) && response.data.length > 0) {
                profileData = response.data[0];
            } else if (response.data.results && response.data.results.length > 0) {
                profileData = response.data.results[0];
            } else {
                profileData = response.data;
            }
            
            setProfile(profileData);
            setFormData({
                organization_name: profileData.organization_name || '',
                description: profileData.description || '',
                contact_info: profileData.contact_info || '',
                website: profileData.website || ''
            });
            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки профиля организатора:', err);
            
            // Проверяем ошибку авторизации
            if (err.response && err.response.status === 401) {
                setError('Токен отсутствует или недействителен, пожалуйста, войдите в систему');
                // Перенаправляем на страницу входа
                localStorage.removeItem('token');
                localStorage.removeItem('userType');
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } else {
                setError('Ошибка загрузки профиля. Пожалуйста, попробуйте позже.');
            }
            
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaveSuccess(false);
        
        try {
            if (profile && profile.id) {
                await api.put(`api/organizer/profiles/${profile.id}/`, formData);
                setSaveSuccess(true);
                setIsEditing(false);
                
                // Обновляем данные профиля
                fetchProfile();
            } else {
                setError('Не удалось определить ID профиля организатора');
            }
        } catch (err) {
            console.error('Ошибка обновления профиля:', err);
            setError('Ошибка при сохранении профиля организатора');
        }
    };

    if (loading) return <div className="text-center mt-5">Загрузка...</div>;
    if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>;

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card profile-card">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2 className="card-title">Профиль организатора</h2>
                                {!isEditing && (
                                    <button 
                                        className="btn btn-primary" 
                                        onClick={() => setIsEditing(true)}
                                    >
                                        Редактировать
                                    </button>
                                )}
                            </div>
                            
                            {saveSuccess && (
                                <div className="alert alert-success">
                                    Профиль успешно сохранен!
                                </div>
                            )}
                            
                            {isEditing ? (
                                <form onSubmit={handleSubmit}>
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
                                    <div className="mb-3">
                                        <label className="form-label">Описание организации:</label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows="5"
                                        />
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button type="submit" className="btn btn-success">
                                            Сохранить
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div>
                                    <div className="info-item">
                                        <h5>Название организации:</h5>
                                        <p>{formData.organization_name}</p>
                                    </div>
                                    
                                    <div className="info-item">
                                        <h5>Контактная информация:</h5>
                                        <p>{formData.contact_info || <span className="text-muted">Не указана</span>}</p>
                                    </div>
                                    
                                    <div className="info-item">
                                        <h5>Веб-сайт:</h5>
                                        <p>
                                            {formData.website ? (
                                                <a href={formData.website} target="_blank" rel="noopener noreferrer">
                                                    {formData.website}
                                                </a>
                                            ) : (
                                                <span className="text-muted">Не указан</span>
                                            )}
                                        </p>
                                    </div>
                                    
                                    <div className="info-item">
                                        <h5>Описание организации:</h5>
                                        <div className="description-box">
                                            {formData.description || <span className="text-muted">Не указано</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizerProfile; 