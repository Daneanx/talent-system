import React, { useState, useEffect, useCallback } from 'react';
// import axios from 'axios'; // Удаляем неиспользуемый импорт
import api from '../api';
import './Profile.css';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [preferences, setPreferences] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [error, setError] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchSkills();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('api/profiles/');
            if (response.data.results && response.data.results.length > 0) {
                const userProfile = response.data.results[0];
                setProfile(userProfile);
                setFirstName(userProfile.user?.first_name || '');
                setLastName(userProfile.user?.last_name || '');
                setPreferences(userProfile.preferences || '');
                setBio(userProfile.bio || '');
                setAvatarPreview(userProfile.avatar || null);
                // Устанавливаем выбранные навыки из профиля
                if (userProfile.skills && Array.isArray(userProfile.skills)) {
                    if (userProfile.skills.length > 0 && typeof userProfile.skills[0] === 'number') {
                        setSelectedSkills(userProfile.skills);
                    } else if (userProfile.skills.length > 0 && typeof userProfile.skills[0] === 'object' && userProfile.skills[0] !== null && userProfile.skills[0].id !== undefined) {
                        setSelectedSkills(userProfile.skills.map(skill => skill.id));
                    } else {
                        setSelectedSkills([]);
                    }
                } else {
                    setSelectedSkills([]);
                }
            }
            setLoading(false);
        } catch (err) {
            console.error('Ошибка при загрузке профиля:', err);
            setError('Не удалось загрузить профиль');
            setLoading(false);
        }
    };

    const fetchSkills = async () => {
        try {
            const response = await api.get('api/skills/');
            console.log('Данные получены с api/skills/', response.data);
            // Проверяем, что ответ содержит поле results и что results является массивом
            if (response.data && Array.isArray(response.data.results)) {
                setAvailableSkills(response.data.results);
            } else {
                console.error('Неожиданный формат данных навыков или results не является массивом:', response.data);
                setAvailableSkills([]); // Устанавливаем пустой массив, чтобы избежать ошибок
            }
        } catch (err) {
            console.error('Ошибка при загрузке навыков:', err);
            setAvailableSkills([]); // Устанавливаем пустой массив в случае ошибки запроса
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('Размер файла не должен превышать 5MB');
                return;
            }
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

    const handleSkillSelect = (skillId) => {
        setSelectedSkills(prev => {
            if (prev.includes(skillId)) {
                return prev.filter(id => id !== skillId);
            } else {
                return [...prev, skillId];
            }
        });
    };

    const handleEditClick = () => {
        setIsEditing(true);
        setSaveSuccess(false);
        setError('');
    };

    const handleCancelClick = () => {
        if (profile) {
            setFirstName(profile.user?.first_name || '');
            setLastName(profile.user?.last_name || '');
            if (profile.skills && Array.isArray(profile.skills)) {
                if (profile.skills.length > 0 && typeof profile.skills[0] === 'number') {
                    setSelectedSkills(profile.skills);
                } else if (profile.skills.length > 0 && typeof profile.skills[0] === 'object' && profile.skills[0] !== null && profile.skills[0].id !== undefined) {
                    setSelectedSkills(profile.skills.map(skill => skill.id));
                } else {
                    setSelectedSkills([]);
                }
            }
            setPreferences(profile.preferences || '');
            setBio(profile.bio || '');
            setAvatar(null);
            setAvatarPreview(profile.avatar || null);
        }
        setIsEditing(false);
        setError('');
        setSaveSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSaveSuccess(false);
        setIsUploading(true);

        const formData = new FormData();
        formData.append('user.first_name', firstName);
        formData.append('user.last_name', lastName);

        // Отправляем только ID навыков
        selectedSkills.forEach(skillId => {
            if (skillId !== undefined && skillId !== null) {
                formData.append('skills', skillId);
            }
        });

        formData.append('preferences', preferences);
        formData.append('bio', bio);

        if (avatar) {
            formData.append('avatar', avatar);
        }

        try {
            const response = await api.patch(
                `api/profiles/${profile.id}/`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data) {
                setProfile(response.data);
                if (response.data.skills && Array.isArray(response.data.skills)) {
                    setSelectedSkills(response.data.skills.map(skill => skill.id));
                }
                setFirstName(response.data.user?.first_name || '');
                setLastName(response.data.user?.last_name || '');
                setAvatar(null);
                setAvatarPreview(response.data.avatar || null);
                setSaveSuccess(true);
                setIsEditing(false);
                setTimeout(() => setSaveSuccess(false), 3000);
                fetchSkills();
                // Перезагружаем страницу после успешного сохранения
                window.location.reload();
            }
        } catch (err) {
            console.error('Ошибка при сохранении профиля:', err);
            setError(err.response?.data?.detail || 'Ошибка при сохранении профиля');
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) return <div className="text-center mt-5">Загрузка...</div>;
    if (error && !profile) return <div className="alert alert-danger mt-3">{error}</div>;

    return (
        <div className="container profile-container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow-sm profile-card">
                        <div className="card-body">
                            <div className="profile-header-row mb-4 d-flex justify-content-between align-items-center">
                                <h2 className="card-title mb-0 profile-title">Мой профиль</h2>
                                {!isEditing && profile && (
                                    <button className="btn btn-outline-primary btn-sm edit-profile-button" onClick={handleEditClick}>
                                        Редактировать
                                    </button>
                                )}
                            </div>
                            
                            {saveSuccess && (
                                <div className="alert alert-success">
                                    Профиль успешно обновлен
                                </div>
                            )}
                            {error && profile && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}

                            <div className="profile-content">
                                <div className="profile-header text-center mb-4">
                                    <div className="avatar-container mb-3 position-relative">
                                        <img
                                            src={avatarPreview || '/media/avatars/default-avatar.png'}
                                            alt="Аватар"
                                            className={`avatar-image ${isUploading ? 'uploading' : ''}`}
                                            style={{
                                                width: 150,
                                                height: 150,
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '3px solid #eee',
                                                transition: 'all 0.3s ease'
                                            }}
                                        />
                                        {isEditing && (
                                            <div className="avatar-overlay">
                                                <label htmlFor="avatarUpload" className="btn btn-outline-light btn-sm">
                                                    {avatarPreview ? 'Изменить' : 'Загрузить'}
                                                </label>
                                                <input
                                                    type="file"
                                                    className="form-control d-none"
                                                    id="avatarUpload"
                                                    accept="image/*"
                                                    onChange={handleAvatarChange}
                                                    disabled={isUploading}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {isEditing ? (
                                        <div className="row g-2 mb-3">
                                            <div className="col">
                                                <input
                                                    type="text"
                                                    className="form-control text-center"
                                                    placeholder="Имя"
                                                    value={firstName}
                                                    onChange={handleFirstNameChange}
                                                    disabled={isUploading}
                                                />
                                            </div>
                                            <div className="col">
                                                <input
                                                    type="text"
                                                    className="form-control text-center"
                                                    placeholder="Фамилия"
                                                    value={lastName}
                                                    onChange={handleLastNameChange}
                                                    disabled={isUploading}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <h3>{firstName} {lastName}</h3>
                                    )}
                                </div>

                                <div className="profile-details">
                                    <div className="mb-3">
                                        <label className="form-label">Навыки:</label>
                                        {isEditing ? (
                                            <div className="skills-selection">
                                                {availableSkills && Array.isArray(availableSkills) && availableSkills.map(skill => (
                                                    <button
                                                        key={skill.id}
                                                        type="button"
                                                        className={`skill-tile ${selectedSkills.includes(skill.id) ? 'selected' : ''}`}
                                                        onClick={() => handleSkillSelect(skill.id)}
                                                        disabled={isUploading}
                                                    >
                                                        {skill.name}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="skills-container">
                                                {selectedSkills && selectedSkills.length > 0 ? (
                                                    selectedSkills.map(skillId => {
                                                        const skill = Array.isArray(availableSkills) ? availableSkills.find(s => s.id === skillId) : null;
                                                        return skill ? (
                                                            <span key={skill.id} className="skill-badge">{skill.name}</span>
                                                        ) : null;
                                                    })
                                                ) : (
                                                    <p className="text-muted">Здесь как-то пусто... пора это исправить!</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Предпочтения:</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={preferences}
                                                onChange={(e) => setPreferences(e.target.value)}
                                                disabled={isUploading}
                                            />
                                        ) : (
                                            <p>{preferences || 'Не указаны'}</p>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">О себе:</label>
                                        {isEditing ? (
                                            <textarea
                                                className="form-control"
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                rows="3"
                                                disabled={isUploading}
                                            ></textarea>
                                        ) : (
                                            <p>{bio || 'Не указано'}</p>
                                        )}
                                    </div>

                                    {!isEditing && profile && (
                                        <div className="additional-details mt-4 pt-4 border-top">
                                            <p><strong>Факультет:</strong> {profile.faculty?.name || 'Не указан'}</p>
                                            <p><strong>Уровень образования:</strong> {profile.education_level_display || 'Не указан'}</p>
                                            <p><strong>Курс:</strong> {profile.course || 'Не указан'}</p>
                                        </div>
                                    )}
                                    
                                </div>
                            </div>

                            {isEditing && (
                                <div className="d-flex justify-content-end mt-4">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary me-2" 
                                        onClick={handleCancelClick} 
                                        disabled={isUploading}
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        onClick={handleSubmit}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? 'Сохранение...' : 'Сохранить'}
                                    </button>
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