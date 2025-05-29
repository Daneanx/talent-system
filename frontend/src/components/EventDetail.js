import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import './EventDetail.css';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const userType = localStorage.getItem('userType');
    const [message, setMessage] = useState('');
    const [applicationSuccess, setApplicationSuccess] = useState(false);
    const [applicationError, setApplicationError] = useState('');
    const [isSkillsExpanded, setIsSkillsExpanded] = useState(true);
    
    useEffect(() => {
        fetchEvent();
    }, [id]);

    const fetchEvent = async () => {
        try {
            const response = await api.get(`api/events/${id}/`);
            setEvent(response.data);
            console.log('Загруженное мероприятие:', response.data);
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
            

            const eventId = parseInt(id, 10);
            
            await api.post('api/applications/', {
                event_id: eventId, 
                message: message
            });
            
            // Если заявка успешно создана
            setApplicationSuccess(true);
            setMessage('');
        } catch (err) {
            console.error('Ошибка при подаче заявки:', err.response || err);
            console.log('Full error object:', err);
            console.log('Error response data:', err.response?.data);
            

            const errorMessage = err.response?.data?.detail || 
                               err.response?.data?.error || 
                               'Ошибка при подаче заявки. Проверьте, не подавали ли вы заявку ранее.';
            
            let finalErrorMessage = errorMessage;

            if (err.response?.data?.message && typeof err.response.data.message === 'string') {
                const messageString = err.response.data.message;
                const detailMatch = messageString.match(/"detail":\s*"(.*?)"/);
                if (detailMatch && detailMatch[1]) {
                    finalErrorMessage = detailMatch[1];
                } else {
                    finalErrorMessage = messageString;
                }
            }

            setApplicationError(finalErrorMessage);
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

    // Получение массива названий навыков из массива объектов навыков
    const getSkills = (requiredSkills) => {
        if (!Array.isArray(requiredSkills)) {
            console.error('EventDetail: requiredSkills is not an array', requiredSkills);
            return [];
        }
        return requiredSkills;
    };

    const toggleSkills = () => {
        setIsSkillsExpanded(!isSkillsExpanded);
    };

    if (loading) return <div className="text-center mt-5">Загрузка...</div>;
    if (error) return <div className="alert alert-danger mt-5 container">{error}</div>;
    if (!event) return <div className="alert alert-warning mt-5 container">Мероприятие не найдено</div>;

    console.log('Rendering applicationError:', applicationError);

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
                            <span>Организатор: {event.organizer?.id ? (<Link to={`/organizer/${event.organizer.id}`} className="organizer-link">{event.organization_name || 'Не указан'}</Link>) : (event.organization_name || 'Не указан')}</span>
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
                        <h3 className="skills-toggle-header" onClick={toggleSkills} style={{ cursor: 'pointer' }}>
                            Требуемые навыки <i className={`fas ${isSkillsExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                        </h3>
                        <div className={`skills-container ${isSkillsExpanded ? 'expanded' : 'collapsed'}`}>
                            {getSkills(event.required_skills).map((skill) => (
                                <span 
                                    key={skill.id} 
                                    className={`skill-tag color-${(skill.id % 5) + 1}`}
                                >
                                    {skill.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="col-lg-4">
                    <div className="card shadow-sm application-card">
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
                                {/* Отображаем ошибку подачи заявки */}
                                <div className="alert alert-danger" style={{ display: applicationError ? 'block' : 'none' }}>
                                    <p>{applicationError}</p>
                                </div>
                                
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
                                            className="pinterest-like-button w-100"
                                            disabled={event.status !== 'published'}
                                        >
                                            {event.status === 'published' ? 'Подать заявку' : 'Мероприятие недоступно для заявок'}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="alert alert-info">
                                        Только студенты с указанными навыками могут подавать заявки на участие в мероприятиях.
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