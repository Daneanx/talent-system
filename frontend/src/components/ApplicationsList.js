import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './ApplicationsList.css'; // Используем собственный CSS файл

const ApplicationsList = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await api.get('api/applications/');
            
            let applicationsData = [];
            if (response.data) {
                if (Array.isArray(response.data)) {
                    applicationsData = response.data;
                } else if (response.data.results && Array.isArray(response.data.results)) {
                    applicationsData = response.data.results;
                }
            }
            
            setApplications(applicationsData);
            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки заявок:', err);
            setError('Не удалось загрузить список ваших заявок');
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    };

    const getStatusText = (status) => {
        switch(status) {
            case 'pending': return 'На рассмотрении';
            case 'approved': return 'Одобрено';
            case 'rejected': return 'Отклонено';
            default: return 'Неизвестно';
        }
    };

    const getStatusClass = (status) => {
        switch(status) {
            case 'pending': return 'status-pending';
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            default: return '';
        }
    };

    if (loading) return <div className="text-center mt-5">Загрузка...</div>;
    if (error) return <div className="alert alert-danger mt-3">{error}</div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Мои заявки на участие в мероприятиях</h2>

            {applications.length === 0 ? (
                <div className="alert alert-info">
                    <p>У вас пока нет поданных заявок. Вы можете найти интересные мероприятия в разделе "Рекомендации".</p>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => navigate('/recommendations')}
                    >
                        Перейти к рекомендациям
                    </button>
                </div>
            ) : (
                <div className="row">
                    {applications.map(application => (
                        <div className="col-md-6 col-lg-4 mb-4" key={application.id}>
                            <div className="card h-100 application-card">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">{application.event.title}</h5>
                                    <span className={`badge ${getStatusClass(application.status)}`}>
                                        {getStatusText(application.status)}
                                    </span>
                                </div>
                                <div className="card-body">
                                    <p><strong>Организатор:</strong> {application.event.organization_name}</p>
                                    <p><strong>Дата мероприятия:</strong> {formatDate(application.event.date)}</p>
                                    <p><strong>Дата подачи заявки:</strong> {formatDate(application.created_at)}</p>
                                    
                                    {application.message && (
                                        <div className="mt-3">
                                            <h6>Ваше сообщение:</h6>
                                            <p className="text-muted">{application.message}</p>
                                        </div>
                                    )}
                                    
                                    {application.organizer_comment && (
                                        <div className="mt-3 organizer-comment">
                                            <h6>Комментарий организатора:</h6>
                                            <p className="text-muted">{application.organizer_comment}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="card-footer">
                                    <button 
                                        className="btn btn-outline-primary" 
                                        onClick={() => navigate(`/events/${application.event.id}`)}
                                    >
                                        Просмотреть мероприятие
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ApplicationsList; 