import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EventCard.css';

const EventCard = ({ event, isOrganizer = false }) => {
    const navigate = useNavigate();
    
    // Проверка на валидность объекта события
    if (!event || typeof event !== 'object') {
        console.error('EventCard: Invalid event object', event);
        return null;
    }
    
    // Для отладки - вывод данных изображения в консоль
    useEffect(() => {
        console.log('EventCard render:', { 
            id: event.id,
            title: event.title,
            has_image: Boolean(event.image),
            image_path: event.image 
        });
    }, [event]);

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
    
    // Локализация статуса
    const getStatusText = () => {
        if (!event.status) return 'Черновик';
        
        switch(event.status) {
            case 'published': return 'Опубликовано';
            case 'closed': return 'Закрыто';
            case 'cancelled': return 'Отменено';
            default: return 'Черновик';
        }
    };

    // Безопасное разделение строки с навыками
    const getSkills = () => {
        if (!event.required_skills) return [];
        return event.required_skills.split(',').map(skill => skill.trim());
    };
    
    // Формирование полного URL для изображения
    const getImageUrl = () => {
        if (!event.image) return null;
        // Если путь уже содержит полный URL, возвращаем его
        if (event.image.startsWith('http')) {
            return event.image;
        }
        // Иначе добавляем базовый URL сервера
        return `http://127.0.0.1:8000${event.image}`;
    };

    const imageUrl = getImageUrl();

    return (
        <div className="event-card" onClick={handleClick}>
            <div className="event-card-header">
                {imageUrl ? (
                    <div 
                        className="event-image" 
                        style={{backgroundImage: `url(${imageUrl})`}}
                        onError={(e) => {
                            console.error('Image load error:', imageUrl);
                            e.target.onerror = null; 
                            e.target.style.display = 'none';
                        }}
                    ></div>
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