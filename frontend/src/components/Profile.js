import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        skills: '',
        preferences: '',
        bio: ''
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
            // Добавляем проверку наличия токена
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Токен отсутствует, пожалуйста, войдите в систему');
                setLoading(false);
                return;
            }
            
            const response = await api.get('api/profiles/');
            
            // Данные могут прийти как массив или как объект с полем results
            let profileData;
            if (Array.isArray(response.data)) {
                profileData = response.data[0];
            } else if (response.data.results && response.data.results.length > 0) {
                profileData = response.data.results[0];
            } else {
                profileData = response.data;
            }
            
            setProfile(profileData);
                    setFormData({
                skills: profileData.skills || '',
                preferences: profileData.preferences || '',
                bio: profileData.bio || ''
                    });
            setLoading(false);
            } catch (err) {
            console.error('Ошибка загрузки профиля:', err);
            
            // Проверяем, является ли ошибка 401 (неавторизован)
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
                await api.put(`api/profiles/${profile.id}/`, formData);
                setSaveSuccess(true);
                setIsEditing(false);
                
                // Обновляем данные профиля
                fetchProfile();
            } else {
                setError('Не удалось определить ID профиля');
            }
        } catch (err) {
            console.error('Ошибка обновления профиля:', err);
            setError('Ошибка при сохранении профиля');
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
                                <h2 className="card-title">Профиль таланта</h2>
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
                                <label className="form-label">Навыки:</label>
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
                                    <div className="mb-4">
                                        <h5>Навыки:</h5>
                                        <div className="skills-container">
                                            {formData.skills.split(',').map((skill, index) => (
                                                <span key={index} className="skill-badge">
                                                    {skill.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <h5>Предпочтения:</h5>
                                        <div className="skills-container">
                                            {formData.preferences
                                                ? formData.preferences.split(',').map((pref, index) => (
                                                    <span key={index} className="preference-badge">
                                                        {pref.trim()}
                                                    </span>
                                                ))
                                                : <p className="text-muted">Не указаны</p>
                                            }
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h5>О себе:</h5>
                                        <p className="bio-text">
                                            {formData.bio || <span className="text-muted">Не указано</span>}
                                        </p>
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

export default Profile;