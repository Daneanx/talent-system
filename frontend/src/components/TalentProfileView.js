import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './Profile.css';

const TalentProfileView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messageSent, setMessageSent] = useState(false);
    const [sendError, setSendError] = useState('');

    useEffect(() => {
        fetchTalentProfile();
    }, [id]);

    const fetchTalentProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get(`api/profiles/talent/${id}/`);
            setProfile(response.data);
            setUser(response.data.user);
            setLoading(false);
        } catch (err) {
            console.error('Ошибка при загрузке профиля таланта:', err);
            setError('Не удалось загрузить информацию о профиле таланта');
            setLoading(false);
        }
    };

    const handleContactClick = () => {
        setContactModalOpen(true);
    };

    const handleCloseModal = () => {
        setContactModalOpen(false);
        setSendError('');
    };

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    };

    const handleSendMessage = async () => {
        try {
            if (!message.trim()) {
                setSendError('Сообщение не может быть пустым');
                return;
            }

            await api.post(`api/messages/send/`, {
                recipient_id: id,
                message: message
            });

            setMessageSent(true);
            setMessage('');
            setTimeout(() => {
                setContactModalOpen(false);
                setMessageSent(false);
            }, 3000);
        } catch (err) {
            console.error('Ошибка при отправке сообщения:', err);
            setSendError('Не удалось отправить сообщение');
        }
    };

    if (loading) return <div className="text-center mt-5">Загрузка...</div>;
    if (error) return <div className="alert alert-danger mt-3">{error}</div>;
    if (!profile) return <div className="alert alert-warning mt-3">Профиль таланта не найден</div>;

    return (
        <div className="container profile-container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow-sm profile-card">
                        <div className="card-body">
                            <div className="profile-header-row mb-4 d-flex justify-content-between align-items-center">
                                <h2 className="card-title mb-0 profile-title">Профиль таланта</h2>
                                {/* Кнопка редактирования здесь не нужна для организатора */}
                            </div>
                            
                            {/* Сообщения об успехе/ошибке редактирования здесь не нужны */}

                            <div className="profile-content">
                                <div className="profile-header text-center mb-4">
                                    <div className="avatar-container mb-3 position-relative">
                                        {profile.avatar ? (
                                            <img
                                                src={profile.avatar}
                                                alt="Аватар"
                                                className="avatar-image"
                                                style={{
                                                    width: 150,
                                                    height: 150,
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '3px solid #eee',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            />
                                        ) : (
                                            <div className="avatar-placeholder d-flex justify-content-center align-items-center" style={{
                                                width: 150,
                                                height: 150,
                                                borderRadius: '50%',
                                                border: '3px solid #eee',
                                                transition: 'all 0.3s ease'
                                            }}>
                                                {}
                                            </div>
                                        )}
                                    </div>
                                    {/* Отображаем полное имя, если доступно, иначе username */}
                                    <h3>{user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}</h3>
                                    <p className="text-muted">{user.email}</p>
                                </div>
                            </div>
                            
                            <div className="profile-details">
                                {/* Секция Навыков */}
                                <div className="mb-3">
                                    <label className="form-label">Навыки:</label>
                                    <div className="skills-container">
                                        {profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0 ? (
                                            profile.skills.map((skill, index) => (
                                                <span key={index} className="skill-badge">
                                                    {/* Предполагаем, что объект навыка имеет поле 'name' */}
                                                    {skill.name || skill}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-muted">Навыки не указаны</p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Секция Предпочтений */}
                                <div className="mb-3">
                                     <label className="form-label">Предпочтения:</label>
                                    {profile.preferences ? (
                                        <p>{profile.preferences}</p>
                                    ) : (
                                        <p className="text-muted">Не указаны</p>
                                    )}
                                </div>
                                
                                {/* Секция О себе */}
                                <div className="mb-3">
                                    <label className="form-label">О себе:</label>
                                    {profile.bio ? (
                                        <p>{profile.bio}</p>
                                    ) : (
                                        <p className="text-muted">Не указано</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Дополнительные поля (Факультет, Уровень образования, Курс) - размещаем вне profile-details для соответствия Profile.js */}
                            {profile.user?.faculty && (
                                <div className="mb-3">
                                    <label className="form-label">Факультет:</label>
                                    <p>{profile.user.faculty}</p>
                                </div>
                            )}
                            
                            {profile.user?.education_level && (
                                <div className="mb-3">
                                    <label className="form-label">Уровень образования:</label>
                                    <p>{profile.user.education_level}</p>
                                </div>
                            )}

                            {profile.user?.course && (
                                <div className="mb-3">
                                    <label className="form-label">Курс:</label>
                                    <p>{profile.user.course}</p>
                                </div>
                            )}

                            {/* Кнопки сохранения/отмены здесь не нужны */}

                            <div className="text-center mt-4">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => navigate(-1)}
                                >
                                    Назад
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {}
            {contactModalOpen && (
                <div className="contact-modal-overlay">
                    <div className="contact-modal">
                        <div className="contact-modal-header">
                            <h3>Сообщение для {user?.username || 'таланта'}</h3>
                            <button className="close-button" onClick={handleCloseModal}>×</button>
                        </div>
                        
                        <div className="contact-modal-body">
                            {messageSent ? (
                                <div className="alert alert-success">
                                    Сообщение успешно отправлено!
                                </div>
                            ) : (
                                <>
                                    {sendError && (
                                        <div className="alert alert-danger">
                                            {sendError}
                                        </div>
                                    )}
                                    
                                    <div className="form-group">
                                        <label>Введите сообщение:</label>
                                        <textarea
                                            className="form-control"
                                            rows="5"
                                            value={message}
                                            onChange={handleMessageChange}
                                            placeholder="Ваше сообщение..."
                                        ></textarea>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="contact-modal-footer">
                            {!messageSent && (
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleSendMessage}
                                >
                                    Отправить
                                </button>
                            )}
                            <button 
                                className="btn btn-secondary"
                                onClick={handleCloseModal}
                            >
                                {messageSent ? 'Закрыть' : 'Отмена'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TalentProfileView; 