import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = ({ token }) => {
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false); // Состояние для режима редактирования
    const [formData, setFormData] = useState({
        skills: '',
        preferences: '',
        bio: '',
    });

    useEffect(() => {
        
        const fetchProfile = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/profiles/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.data.results && response.data.results.length > 0) {
                    const userProfile = response.data.results[0];
                    setProfile(userProfile);
                    // Инициализируем форму текущими данными
                    setFormData({
                        skills: userProfile.skills,
                        preferences: userProfile.preferences || '',
                        bio: userProfile.bio || '',
                    });
                } else {
                    setError('Профиль не найден');
                }
                setIsLoading(false);
            } catch (err) {
                console.error('Ошибка загрузки профиля:', err.response?.data || err.message);
                setError('Не удалось загрузить профиль');
                setIsLoading(false);
            }
        };

        if (token) {
            fetchProfile();
        } else {
            setError('Токен отсутствует, пожалуйста, войдите в систему');
            setIsLoading(false);
        }
    }, [token]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const [successMessage, setSuccessMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        if (!formData.skills.trim()) {
            setError('Поле навыков не может быть пустым');
            return;
        }
        try {
            const response = await axios.put(
                `http://127.0.0.1:8000/api/profiles/${profile.id}/`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setProfile(response.data);
            setIsEditing(false);
            setError('');
        } catch (err) {
            console.error('Детали ошибки:', err.response?.data);
            setError(err.response?.data?.message || 'Не удалось обновить профиль');
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <div>Загрузка...</div>;
    }

    if (error) {
        return <div className="text-danger text-center">{error}</div>;
    }

    if (!profile) {
        return <div className="text-center">Профиль не найден</div>;
    }

    return (
        <div className="container mt-5">
            <h2 className="text-center">Профиль</h2>
            <div className="card">
                <div className="card-body">
                    {successMessage && (
                        <div className="alert alert-success">{successMessage}</div>
                    )}
                    {isEditing ? (
                        // Форма редактирования
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Навыки:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleInputChange}
                                    placeholder="Например: танцы, пение, актерство"
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
                                    onChange={handleInputChange}
                                    placeholder="Например: концерты, постоянная работа"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">О себе:</label>
                                <textarea
                                    className="form-control"
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    placeholder="Расскажите о себе"
                                    rows="3"
                                />
                            </div>
                            <div className="d-flex justify-content-between">
                                <button type="submit" className="btn btn-success" disabled={isSaving}>
                                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            skills: profile.skills,
                                            preferences: profile.preferences || '',
                                            bio: profile.bio || '',
                                        });
                                    }}
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    ) : (
                        // Отображение профиля
                        <>
                            <h5 className="card-title">{profile.user.username}</h5>
                            <p><strong>Email:</strong> {profile.user.email}</p>
                            <p><strong>Навыки:</strong> {profile.skills}</p>
                            <p>
                                <strong>Предпочтения:</strong>{' '}
                                {profile.preferences || 'Не указаны'}
                            </p>
                            <p>
                                <strong>О себе:</strong> {profile.bio || 'Не указано'}
                            </p>
                            <button
                                className="btn btn-primary"
                                onClick={() => setIsEditing(true)}
                            >
                                Редактировать
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;