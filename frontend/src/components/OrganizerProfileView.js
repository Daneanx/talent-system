import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import './OrganizerProfileView.css';

const OrganizerProfileView = () => {
    const { organizerId } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrganizerProfile = async () => {
            try {
                // !!! НАПОМИНАЛКА ДЛЯ ЗАБЫВАЛКИ !!!
                // Эндпоинт для получения профиля организатора по ID может отличаться.
                // Возможно, потребуется создать новый эндпоинт на бэкенде,
                // который принимает ID организатора и возвращает его публичный профиль.
                // В этом примере я использую заглушку или предполагаемый эндпоинт.
                
                if (!organizerId) {
                    setError("Идентификатор организатора не указан в URL.");
                    setLoading(false);
                    return;
                }

                const response = await api.get(`/api/organizers/${organizerId}/`);
                
                setProfile(response.data);
                setLoading(false);

            } catch (err) {
                console.error('Error fetching organizer profile:', err);
                setError('Ошибка загрузки профиля организатора');
                setLoading(false);
            }
        };

        fetchOrganizerProfile();
    }, [organizerId]);

    if (loading) return <div className="text-center mt-5">Загрузка профиля...</div>;
    if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>;
    if (!profile) return <div className="alert alert-warning text-center mt-5">Профиль организатора не найден.</div>;


    return (
        <div className="organizer-profile-view">
            <div className="profile-header">
                <h2>{profile.organization_name}</h2>
                {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="website-link">
                        <i className="fas fa-globe"></i> Веб-сайт
                    </a>
                )}
            </div>

            <div className="profile-content">
                {profile.description && (
                    <div className="profile-section">
                        <h3>О компании</h3>
                        <p>{profile.description}</p>
                    </div>
                )}

                {profile.contact_info && (
                    <div className="profile-section">
                        <h3>Контактная информация</h3>
                        <p>{profile.contact_info}</p>
                    </div>
                )}

                {profile.events && profile.events.length > 0 && (
                    <div className="profile-section">
                        <h3>Мероприятия</h3>
                        <div className="events-grid">
                            {profile.events.map(event => (
                                <div key={event.id} className="event-card">
                                    <h4>{event.title}</h4>
                                    <p>{event.description}</p>
                                    <div className="event-meta">
                                        <span><i className="fas fa-calendar"></i> {new Date(event.date).toLocaleDateString()}</span>
                                        <span><i className="fas fa-map-marker-alt"></i> {event.location}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizerProfileView; 