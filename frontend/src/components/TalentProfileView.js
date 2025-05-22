import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './Profile.css'; // Переиспользуем стили из компонента Profile

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
            // Получаем профиль таланта по его ID пользователя
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

            // Отправляем сообщение таланту
            await api.post(`api/messages/send/`, {
                recipient_id: id,
                message: message
            });

            setMessageSent(true);
            setMessage('');
            // Закрываем модальное окно через 3 секунды
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
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card profile-card">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h2 className="card-title">Профиль таланта</h2>
                            </div>
                            
                            <div className="profile-header mb-4">
                                <h3>{user.username}</h3>
                                <p className="text-muted">{user.email}</p>
                            </div>
                            
                            <div className="mb-4">
                                <h5>Навыки:</h5>
                                <div className="skills-container">
                                    {profile.skills.split(',').map((skill, index) => (
                                        <span key={index} className="skill-badge">
                                            {skill.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <h5>Предпочтения:</h5>
                                <div className="skills-container">
                                    {profile.preferences
                                        ? profile.preferences.split(',').map((pref, index) => (
                                            <span key={index} className="preference-badge">
                                                {pref.trim()}
                                            </span>
                                        ))
                                        : <p className="text-muted">Не указаны</p>
                                    }
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <h5>О себе:</h5>
                                <div className="bio-container">
                                    {profile.bio ? (
                                        <p>{profile.bio}</p>
                                    ) : (
                                        <p className="text-muted">Не указано</p>
                                    )}
                                </div>
                            </div>
                            
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

            {/* Модальное окно для отправки сообщения */}
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