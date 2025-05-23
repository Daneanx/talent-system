import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ event, isOrganizer = false }) => {
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
    }, [event]); // Добавляем event в зависимости

    // Проверка на валидность объекта события для рендеринга
    if (!event || typeof event !== 'object') {
        console.error('EventCard: Invalid event object for rendering', event);
        return null;
    }

    // Форматирование даты с проверкой
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
    
    // Получение списка навыков
    const getSkills = () => {
        return event.required_skills ? event.required_skills.split(',').map(s => s.trim()).filter(s => s) : [];
    };

    const handleClick = () => {
        if (isOrganizer) {
            navigate(`/organizer/events/${event.id}/edit`);
        } else {
            navigate(`/events/${event.id}`);
        }
    };
    
    // Определяем классы для статуса
    const getStatusClass = () => {
        if (!event.status) return 'status-draft';
        
        switch(event.status) {
            case 'published': return 'status-published';
            case 'closed': return 'status-closed';
            case 'cancelled': return 'status-cancelled';
            default: return 'status-draft';
        }
    };

    const getStatusText = () => {
        if (!event.status) return 'Черновик';
        
        switch(event.status) {
            case 'published': return 'Опубликовано';
            case 'closed': return 'Закрыто';
            case 'cancelled': return 'Отменено';
            default: return 'Черновик';
        }
    };

    // Определяем URL изображения и добавляем базовый URL бэкенда, если путь относительный
    const imageUrl = event.image 
        ? (event.image.startsWith('http') ? event.image : `http://127.0.0.1:8000${event.image}`)
        : null;

    // Отладочный лог перед рендером JSX
    console.log('EventCard rendering with:', { imageUrl, imageLoadError, eventId: event.id, eventTitle: event.title });

    return (
        <div className="event-card" onClick={handleClick}>
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
                <div className={`event-status ${getStatusClass()}`}>
                    {getStatusText()}
                </div>
            </div>
            <div className="event-card-content">
                <h3 className="event-title">{event.title || 'Без названия'}</h3>
                <p className="event-date">{formatDate(event.date)}</p>
                <div className="event-location">
                    <i className="fas fa-map-marker-alt"></i> {event.location || 'Локация не указана'}
                </div>
                
                {/* Отображение ограничения по факультетам */}
                {event.faculty_restriction && event.faculties && event.faculties.length > 0 && (
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
                    {getSkills().map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                    ))}
                </div>
                {isOrganizer && (
                    <div className="event-applications-count">
                        <i className="fas fa-users"></i> Заявок: {event.applications_count || 0}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventCard; 