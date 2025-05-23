import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import EventCard from './EventCard';
import './OrganizerDashboard.css';

const OrganizerDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('events');
    const [events, setEvents] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [organizerProfile, setOrganizerProfile] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [comments, setComments] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [eventsResponse, profileResponse, applicationsResponse] = await Promise.all([
                api.get('api/events/?organizer=me'),
                api.get('api/organizer/profiles/'),
                api.get('api/applications/')
            ]);
            
            // Проверяем и обрабатываем ответ с событиями
            let eventsData = [];
            if (eventsResponse.data) {
                if (Array.isArray(eventsResponse.data)) {
                    eventsData = eventsResponse.data;
                } else if (eventsResponse.data.results && Array.isArray(eventsResponse.data.results)) {
                    eventsData = eventsResponse.data.results;
                }
                // Если данные не в нужном формате, используем пустой массив
            }
            setEvents(eventsData);
            
            // Если мы получили массив профилей, берем первый (текущего организатора)
            let profileData = null;
            if (profileResponse.data) {
                if (Array.isArray(profileResponse.data) && profileResponse.data.length > 0) {
                    profileData = profileResponse.data[0];
                } else if (profileResponse.data.results && profileResponse.data.results.length > 0) {
                    profileData = profileResponse.data.results[0];
                } else {
                    profileData = profileResponse.data;
                }
            }
            setOrganizerProfile(profileData);
            
            // Проверяем и обрабатываем ответ с заявками
            let applicationsData = [];
            if (applicationsResponse.data) {
                if (Array.isArray(applicationsResponse.data)) {
                    applicationsData = applicationsResponse.data;
                } else if (applicationsResponse.data.results && Array.isArray(applicationsResponse.data.results)) {
                    applicationsData = applicationsResponse.data.results;
                }
                // Если данные не в нужном формате, используем пустой массив
            }
            setApplications(applicationsData);
            
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Ошибка загрузки данных');
            setLoading(false);
        }
    };

    const handleStatusChange = async (applicationId, newStatus) => {
        try {
            await api.patch(`api/applications/${applicationId}/`, {
                status: newStatus,
                organizer_comment: comments[applicationId] || ''
            });
            // Обновляем список заявок
            fetchData();
        } catch (err) {
            setError('Ошибка при обновлении статуса заявки');
        }
    };

    const handleEventStatusChange = async (eventId, newStatus) => {
        try {
            await api.patch(`api/events/${eventId}/`, {
                status: newStatus
            });
            // Обновляем список мероприятий
            fetchData();
        } catch (err) {
            setError('Ошибка при обновлении статуса мероприятия');
        }
    };

    // Фильтрация событий по поиску и статусу
    const filteredEvents = () => {
        // Проверяем, что events - это массив
        if (!Array.isArray(events)) {
            return [];
        }
        
        let filtered = [...events];
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(event => 
                (event.title && event.title.toLowerCase().includes(term)) || 
                (event.description && event.description.toLowerCase().includes(term)) ||
                (event.location && event.location.toLowerCase().includes(term))
            );
        }
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(event => event.status === statusFilter);
        }
        
        return filtered;
    };

    // Обработчик изменений в полях комментариев
    const handleCommentChange = (applicationId, value) => {
        setComments(prevComments => ({
            ...prevComments,
            [applicationId]: value
        }));
    };

    if (loading) return <div className="text-center mt-5">Загрузка...</div>;
    if (error) return <div className="alert alert-danger mt-3">{error}</div>;

    return (
        <div className="organizer-dashboard">
            <div className="dashboard-header">
                <h2>Панель управления организатора</h2>
                <h4>{organizerProfile?.organization_name}</h4>
                <button 
                    className="create-event-button"
                    onClick={() => navigate('/organizer/events/create')}
                >
                    <i className="fas fa-plus"></i> Создать мероприятие
                </button>
            </div>

            <div className="tabs-container">
                <button 
                    className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
                    onClick={() => setActiveTab('events')}
                >
                    Мероприятия
                </button>
                <button 
                    className={`tab-button ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    Заявки
                </button>
            </div>

            {activeTab === 'events' && (
                <>
                    <div className="filter-container">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Поиск мероприятий..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="status-filter">
                            <label>Статус: </label>
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="status-select"
                            >
                                <option value="all">Все</option>
                                <option value="draft">Черновик</option>
                                <option value="published">Опубликовано</option>
                                <option value="closed">Закрыто</option>
                                <option value="cancelled">Отменено</option>
                            </select>
                        </div>
                    </div>

                    <div className="masonry-grid">
                        {filteredEvents().length > 0 ? (
                            filteredEvents().map(event => (
                                <EventCard key={event.id} event={event} isOrganizer={true} />
                            ))
                        ) : (
                            <div className="no-events">
                                <p>Мероприятий не найдено</p>
                                <button 
                                    className="create-new-btn"
                                    onClick={() => navigate('/organizer/events/create')}
                                >
                                    Создать новое мероприятие
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'applications' && (
                <div className="applications-container">
                    <h3>Заявки на мероприятия</h3>
                    {applications.length > 0 ? (
                        <div className="applications-list">
                            {applications.map(application => (
                                <div key={application.id} className="application-card">
                                    <div className="application-header">
                                        <h4>{application.event.title}</h4>
                                        <span className={`application-status status-${application.status}`}>
                                            {application.status === 'pending' ? 'На рассмотрении' : 
                                             application.status === 'approved' ? 'Одобрено' : 'Отклонено'}
                                        </span>
                                    </div>
                                    <div className="application-content">
                                        <div className="applicant-info">
                                            <p><strong>Талант:</strong> {application.user.first_name} {application.user.last_name} ({application.user.username})</p>
                                            <p><strong>Навыки:</strong> {application.talent_profile?.skills}</p>
                                            <p><strong>Дата подачи:</strong> {new Date(application.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="application-message">
                                            <p><strong>Сообщение:</strong></p>
                                            <p>{application.message || 'Сообщение отсутствует'}</p>
                                        </div>
                                        
                                        <div className="organizer-comment mt-3">
                                            <p><strong>Ваш комментарий:</strong></p>
                                            <textarea 
                                                className="form-control"
                                                placeholder="Оставьте комментарий для таланта..."
                                                value={comments[application.id] || application.organizer_comment || ''}
                                                onChange={(e) => handleCommentChange(application.id, e.target.value)}
                                                rows="3"
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="application-actions">
                                        <div className="status-section">
                                            <label className="status-label">Решение:</label>
                                            <select 
                                                value={application.status}
                                                onChange={(e) => handleStatusChange(application.id, e.target.value)}
                                                className="status-select"
                                            >
                                                <option value="pending">На рассмотрении</option>
                                                <option value="approved">Одобрено</option>
                                                <option value="rejected">Отклонено</option>
                                            </select>
                                        </div>
                                        <div className="action-buttons">
                                            <button 
                                                className="save-decision-btn"
                                                onClick={() => handleStatusChange(application.id, application.status)}
                                            >
                                                Сохранить решение
                                            </button>
                                            <button 
                                                className="view-profile-btn"
                                                onClick={() => navigate(`/talents/${application.user.id}`)}
                                            >
                                                Профиль таланта
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-applications">
                            <p>Заявок пока нет</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrganizerDashboard; 