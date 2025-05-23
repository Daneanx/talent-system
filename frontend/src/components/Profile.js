import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [skills, setSkills] = useState('');
    const [preferences, setPreferences] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [error, setError] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Отсутствует токен авторизации.');
                    return;
                }
                const response = await axios.get('http://127.0.0.1:8000/api/profiles/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('Ответ профиля:', response.data);

                // Универсальная обработка
                let data = null;
                if (Array.isArray(response.data)) {
                    data = response.data[0];
                } else if (response.data.results && response.data.results.length > 0) {
                    data = response.data.results[0];
                } else if (response.data.id) {
                    data = response.data;
                }

                if (data) {
                    setProfile(data);
                    setFirstName(data.user?.first_name || '');
                    setLastName(data.user?.last_name || '');
                    setSkills(data.skills || '');
                    setPreferences(data.preferences || '');
                    setBio(data.bio || '');
                    setAvatarPreview(data.avatar || null);
                } else {
                    setError('Профиль не найден');
                }
            } catch (err) {
                setError('Ошибка загрузки профиля');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Проверка размера файла (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('Размер файла не должен превышать 5MB');
                return;
            }
            // Проверка типа файла
            if (!file.type.startsWith('image/')) {
                setError('Файл должен быть изображением');
                return;
            }
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleFirstNameChange = (e) => {
        setFirstName(e.target.value);
    };

    const handleLastNameChange = (e) => {
        setLastName(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaveSuccess(false);
        setIsUploading(true);
        
        const formData = new FormData();
        formData.append('user.first_name', firstName);
        formData.append('user.last_name', lastName);
        formData.append('skills', skills);
        formData.append('preferences', preferences);
        formData.append('bio', bio);
        
        if (avatar) {
            formData.append('avatar', avatar);
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.patch(
                `http://127.0.0.1:8000/api/profiles/${profile.id}/`,
                formData,
                {
                headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            if (response.data) {
            setAvatar(null);
            setAvatarPreview(null);
                // Обновляем профиль без перезагрузки страницы
                setProfile(response.data);
                // Обновляем локальные состояния имени и фамилии из ответа
                setFirstName(response.data.user?.first_name || '');
                setLastName(response.data.user?.last_name || '');
                setSaveSuccess(true);
                // Очищаем успешное сообщение через 3 секунды
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (err) {
            console.error('Ошибка при сохранении профиля:', err);
            setError(err.response?.data?.detail || 'Ошибка при сохранении профиля');
        } finally {
            setIsUploading(false);
        }
    };

    if (!profile) return <div className="text-center mt-5">Загрузка...</div>;

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-7">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title text-center mb-4">Мой профиль</h2>
                            {saveSuccess && (
                                <div className="alert alert-success">
                                    Профиль успешно обновлен
                                </div>
                            )}
                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}
                            <hr />
                            <div className="mb-3">
                                <label className="form-label">Имя:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="first_name"
                                    value={firstName}
                                    onChange={handleFirstNameChange}
                                    disabled={isUploading}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Фамилия:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="last_name"
                                    value={lastName}
                                    onChange={handleLastNameChange}
                                    disabled={isUploading}
                                />
                            </div>
                            <div className="text-center mb-4 position-relative">
                                <div className="avatar-container">
                                <img
                                        src={avatarPreview || `/media/avatars/default-avatar.png`}
                                    alt="Аватар"
                                        className={`avatar-image ${isUploading ? 'uploading' : ''}`}
                                        style={{ 
                                            width: 120, 
                                            height: 120, 
                                            borderRadius: '50%', 
                                            objectFit: 'cover', 
                                            border: '2px solid #eee',
                                            transition: 'all 0.3s ease'
                                        }}
                                />
                                    {isUploading && (
                                        <div className="avatar-overlay">
                                            <div className="spinner-border text-light" role="status">
                                                <span className="visually-hidden">Загрузка...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2">
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleAvatarChange}
                                        className="form-control" 
                                        disabled={isUploading}
                                    />
                                </div>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Факультет:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={profile.faculty?.name || ''}
                                        disabled
                                        onClick={() => alert('Если хотите сменить факультет - обратитесь к администратору')}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Уровень образования:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={profile.education_level_display || ''}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Курс:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={profile.course || ''}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Навыки:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={skills}
                                        onChange={(e) => setSkills(e.target.value)}
                                        disabled={isUploading}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Предпочтения:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={preferences}
                                        onChange={(e) => setPreferences(e.target.value)}
                                        disabled={isUploading}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">О себе:</label>
                                    <textarea
                                        className="form-control"
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        disabled={isUploading}
                                    />
                                </div>
                                <div className="d-flex justify-content-end">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Сохранение...
                                            </>
                                        ) : (
                                            'Сохранить'
                                        )}
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

export default Profile;