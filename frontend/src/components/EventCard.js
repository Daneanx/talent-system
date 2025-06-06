import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import './EventCard.css';

const EventCard = ({ event, isOrganizer = false, isDashboardCard = false }) => {
    const navigate = useNavigate();
    const [imageLoadError, setImageLoadError] = useState(false);
    
    // Для отладки - вывод данных изображения в консоль
    useEffect(() => {
        // Проверка на валидность объекта события перед логированием
        if (!event || typeof event !== 'object') {
             console.error('EventCard: Invalid event object for effect logging', event);
             return;
         }
        console.log('EventCard render:', { 
            id: event.id,
            title: event.title,
            has_image: Boolean(event.image),
            image_path: event.image 
        });
        // Сбрасываем состояние ошибки загрузки изображения при смене мероприятия
        setImageLoadError(false);
    }, [event]);

    if (!event || typeof event !== 'object') {
        console.error('EventCard: Invalid event object for rendering', event);
        return null;
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'Дата не указана';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.error('EventCard: Invalid date string for formatting', dateString);
                return 'Некорректная дата';
            }
            return date.toLocaleDateString('ru-RU', options);
        } catch (e) {
            console.error('Error formatting date:', e);
            return 'Некорректная дата';
        }
    };
    
    const getSkills = (limit = isDashboardCard ? 3 : Infinity) => {
        if (!event || !Array.isArray(event.required_skills)) {
            return [];
        }
        return event.required_skills.slice(0, limit).map(skill => skill.name);
    };
    
    const hasMoreSkills = event && Array.isArray(event.required_skills) && event.required_skills.length > (isDashboardCard ? 3 : Infinity);

    const handleClick = () => {
        if (isOrganizer) {
            navigate(`/organizer/events/${event.id}/edit`);
        } else {
            navigate(`/events/${event.id}`);
        }
    };
    
    // Вспомогательная функция для получения текста и класса статуса заявки
    const getApplicationStatusDisplay = (status) => {
        switch(status) {
            case 'pending': return { text: 'В ожидании', class: 'status-application-pending' };
            case 'approved': return { text: 'Одобрено', class: 'status-application-approved' };
            case 'rejected': return { text: 'Отклонено', class: 'status-application-rejected' };
            default: return { text: '', class: '' };
        }
    };

    // Вспомогательная функция для получения текста и класса статуса мероприятия
    const getEventStatusDisplay = (status) => {
        switch(status) {
            case 'published': return { text: 'Опубликовано', class: 'status-published' };
            case 'draft': return { text: 'Черновик', class: 'status-draft' };
            case 'closed': return { text: 'Закрыто', class: 'status-closed' };
            case 'cancelled': return { text: 'Отменено', class: 'status-cancelled' };
            default: return { text: '', class: '' };
        }
    };

    const imageUrl = event.image 
        ? (event.image.startsWith('http') ? event.image : `http://127.0.0.1:8000${event.image}`)
        : null;

    // Отладочный лог перед рендером JSX
    console.log('EventCard rendering with:', { imageUrl, imageLoadError, eventId: event.id, eventTitle: event.title, isDashboardCard });

    return (
        <div className={`event-card ${isDashboardCard ? 'event-card-dashboard' : ''}`} onClick={handleClick}>
            <div className="event-card-header">
                {imageUrl && !imageLoadError ? (
                    <img 
                        src={imageUrl}
                        alt={event.title || 'Изображение мероприятия'}
                        className="event-image"
                        onError={() => setImageLoadError(true)}
                    />
                ) : (
                    <div className="event-image event-no-image">
                        <i className="fas fa-image"></i>
                        <span>{event.title ? event.title.substring(0, 1).toUpperCase() : '?'}</span>
                    </div>
                )}
                {isDashboardCard ? (
                    <div className={`event-status ${getEventStatusDisplay(event.status).class}`}>
                        {getEventStatusDisplay(event.status).text}
                    </div>
                ) : (
                    event.user_application_status ? (
                        <div className={`event-status ${getApplicationStatusDisplay(event.user_application_status).class}`}>
                            {getApplicationStatusDisplay(event.user_application_status).text}
                        </div>
                    ) : null
                )}
            </div>
            <div className="event-card-content">
                <h3 className="event-title">{event.title || 'Без названия'}</h3>
                <p className="event-date">{formatDate(event.date)}</p>
                
                {!isDashboardCard && (
                    <div className="event-location">
                        <i className="fas fa-map-marker-alt"></i> {event.location || 'Локация не указана'}
                    </div>
                )}
                
                {/* Отображение ограничения по факультетам (не отображается для карточек дашборда)*/}
                {!isDashboardCard && event.faculty_restriction && event.faculties && event.faculties.length > 0 && (
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

                <div className="event-skills">
                    {getSkills().map((skillName, index) => (
                        <span key={index} className={`skill-tag color-${(index % 5) + 1}`}>{skillName}</span>
                    ))}
                    {hasMoreSkills && <span className="skill-tag skill-more">...</span>}
                </div>
                {isOrganizer && !isDashboardCard && (
                    <div className="event-applications-count">
                        <i className="fas fa-users"></i> Заявок: {event.applications_count || 0}
                    </div>
                )}
            </div>
        </div>
    );
};

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    image: PropTypes.string,
    date: PropTypes.string,
    location: PropTypes.string,
    required_skills: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
    })),
    faculty_restriction: PropTypes.bool,
    faculties: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
    })),
    applications_count: PropTypes.number,
    status: PropTypes.string,
    user_application_status: PropTypes.string,
  }).isRequired,
  isOrganizer: PropTypes.bool,
  isDashboardCard: PropTypes.bool,
};

export default EventCard; 