import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './EventDetail.css';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userType, setUserType] = useState(localStorage.getItem('userType'));
    const [message, setMessage] = useState('');
    const [applicationSuccess, setApplicationSuccess] = useState(false);
    const [applicationError, setApplicationError] = useState('');
    
    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const response = await api.get(`api/events/${id}/`);
            setEvent(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки мероприятия:', err);
            setError('Ошибка загрузки данных мероприятия');
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setApplicationError('');
        setApplicationSuccess(false);

        try {
            console.log('Отправка заявки на мероприятие ID:', id);
            
            // Преобразуем id в число, если он в виде строки
            const eventId = parseInt(id, 10);
            
            const response = await api.post('api/applications/', {
                event_id: eventId, // Используем правильное имя поля event_id вместо event
                message: message
            });
            
            // Если заявка успешно создана
            setApplicationSuccess(true);
            setMessage('');
        } catch (err) {
            console.error('Ошибка при подаче заявки:', err.response || err);
            // Устанавливаем текст ошибки из ответа или общее сообщение
            setApplicationError(
                err.response?.data?.detail || 
                err.response?.data?.error || 
                'Ошибка при подаче заявки. Проверьте, что вы не подавали заявку ранее.'
            );
        }
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        if (!dateString) return 'Дата не указана';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString('ru-RU', options);
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Некорректная дата';
        }
    };

    // Получение массива навыков
    const getSkills = (skillsString) => {
        if (!skillsString) return [];
        return skillsString.split(',').map(skill => skill.trim());
    };

    if (loading) return <div className="text-center mt-5">Загрузка...</div>;
    if (error) return <div className="alert alert-danger mt-5 container">{error}</div>;
    if (!event) return <div className="alert alert-warning mt-5 container">Мероприятие не найдено</div>;

    return (
        <div className="event-detail-container container mt-5">
            <div className="row">
                <div className="col-lg-8">
                    <div className="event-header">
                        <h1 className="event-title">{event.title}</h1>
                        <div className={`event-status status-${event.status || 'draft'}`}>
                            {event.status === 'published' && 'Опубликовано'}
                            {event.status === 'draft' && 'Черновик'}
                            {event.status === 'closed' && 'Закрыто'}
                            {event.status === 'cancelled' && 'Отменено'}
                        </div>
                    </div>
                    
                    <div className="event-image-container">
                        {event.image ? (
                            <img 
                                src={event.image.startsWith('http') ? event.image : `http://127.0.0.1:8000${event.image}`}
                                alt={event.title}
                                className="event-image-full"
                            />
                        ) : (
                            <div className="event-no-image-full">
                                <i className="fas fa-image"></i>
                                <div>Изображение отсутствует</div>
                            </div>
                        )}
                    </div>
                    
                    <div className="event-meta">
                        <div className="meta-item">
                            <i className="fas fa-calendar"></i>
                            <span>{formatDate(event.date)}</span>
                        </div>
                        
                        <div className="meta-item">
                            <i className="fas fa-map-marker-alt"></i>
                            <span>{event.location || 'Локация не указана'}</span>
                        </div>
                        
                        <div className="meta-item">
                            <i className="fas fa-user"></i>
                            <span>Организатор: {event.organization_name || 'Не указан'}</span>
                        </div>
                    </div>
                    
                    {/* Отображение ограничения по факультетам */}
                    {event.faculty_restriction && event.faculties && Array.isArray(event.faculties) && event.faculties.length > 0 && (
                         <div className="event-faculties-restriction">
                             <i className="fas fa-building"></i>
                             Ограничено по факультетам:
                             <ul>
                                 {event.faculties.map(faculty => (
                                     <li key={faculty.id}>{faculty.name}</li>
                                 ))}
                             </ul>
                         </div>
                    )}

                    <div className="event-description">
                        <h3>Описание</h3>
                        <p>{event.description}</p>
                    </div>
                    
                    <div className="event-skills">
                        <h3>Требуемые навыки</h3>
                        <div className="skills-container">
                            {getSkills(event.required_skills).map((skill, index) => (
                                <span key={index} className="skill-tag">{skill}</span>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="col-lg-4">
                    <div className="application-card">
                        <h3>Заявка на участие</h3>
                        
                        {applicationSuccess ? (
                            <div className="application-success">
                                <div className="success-icon">✓</div>
                                <h3>Заявка успешно отправлена!</h3>
                                <p>Организатор рассмотрит вашу заявку и свяжется с вами.</p>
                                <div className="success-actions">
                                    <button className="btn btn-outline-secondary" onClick={() => navigate('/applications')}>
                                        Мои заявки
                                    </button>
                                    <button className="btn btn-primary" onClick={() => navigate('/recommendations')}>
                                        К рекомендациям
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {applicationError && (
                                    <div className="alert alert-danger">
                                        {applicationError}
                                    </div>
                                )}
                                
                                {userType === 'talent' ? (
                                    <form onSubmit={handleApply}>
                                        <div className="mb-3">
                                            <label htmlFor="message" className="form-label">Сообщение организатору:</label>
                                            <textarea
                                                id="message"
                                                className="form-control"
                                                rows="5"
                                                value={message}
                                                onChange={handleInputChange}
                                                placeholder="Расскажите почему вы подходите для данного мероприятия..."
                                            ></textarea>
                                        </div>
                                        
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary w-100"
                                            disabled={event.status !== 'published'}
                                        >
                                            {event.status === 'published' ? 'Подать заявку' : 'Мероприятие недоступно для заявок'}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="alert alert-info">
                                        Только таланты могут подавать заявки на участие в мероприятиях.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="mt-4">
                <button 
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                >
                    Назад
                </button>
            </div>
        </div>
    );
};

export default EventDetail; 