import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import EventCard from './EventCard';
import './Recommendations.css';

const Recommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('recommended');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [recResponse, eventsResponse] = await Promise.all([
                api.get('api/recommendations/'),
                api.get('api/events/?status=published')
            ]);
            
            // Обрабатываем данные рекомендаций
            let recommendationsData = recResponse.data;
            if (!Array.isArray(recommendationsData)) {
                recommendationsData = recommendationsData?.results || [];
            }
            setRecommendations(recommendationsData);
            
            // Обрабатываем данные всех событий
            let eventsData = eventsResponse.data;
            if (!Array.isArray(eventsData)) {
                eventsData = eventsData?.results || [];
            }
            setAllEvents(eventsData);
            
            // Извлекаем все уникальные навыки из событий
            const skillsSet = new Set();
            if (Array.isArray(eventsData)) {
                eventsData.forEach(event => {
                    if (event.required_skills) {
                        event.required_skills.split(',').forEach(skill => {
                            skillsSet.add(skill.trim());
                        });
                    }
                });
            }
            setAvailableSkills(Array.from(skillsSet));
            
            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки рекомендаций:', err);
            setError('Ошибка загрузки рекомендаций');
            setLoading(false);
        }
    };

    const handleSkillToggle = (skill) => {
        setSelectedSkills(prev => {
            if (prev.includes(skill)) {
                return prev.filter(s => s !== skill);
            } else {
                return [...prev, skill];
            }
        });
    };

    const filteredEvents = () => {
        let events = activeTab === 'recommended' ? recommendations : allEvents;
        
        // Фильтрация по поисковому запросу
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            events = events.filter(event => 
                event.title.toLowerCase().includes(term) || 
                event.description.toLowerCase().includes(term) ||
                event.location.toLowerCase().includes(term)
            );
        }
        
        // Фильтрация по выбранным навыкам
        if (selectedSkills.length > 0) {
            events = events.filter(event => {
                const eventSkills = event.required_skills.split(',').map(s => s.trim());
                return selectedSkills.some(skill => eventSkills.includes(skill));
            });
        }
        
        return events;
    };

    if (loading) return <div className="text-center mt-5">Загрузка...</div>;

    return (
        <div className="recommendations-container">
            <div className="recommendations-header">
                <h2>Мероприятия</h2>
                <div className="search-filter-container">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Поиск мероприятий..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-control"
                        />
                    </div>
                    <div className="skills-filter">
                        <span className="skills-filter-label">Фильтр по навыкам:</span>
                        <div className="skills-tags">
                            {availableSkills.map(skill => (
                                <span 
                                    key={skill} 
                                    className={`skill-tag ${selectedSkills.includes(skill) ? 'active' : ''}`}
                                    onClick={() => handleSkillToggle(skill)}
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="tabs-container">
                    <button 
                        className={`tab-button ${activeTab === 'recommended' ? 'active' : ''}`}
                        onClick={() => setActiveTab('recommended')}
                    >
                        Рекомендованные
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        Все мероприятия
                    </button>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="masonry-grid">
                {filteredEvents().length > 0 ? filteredEvents().map((event) => (
                    <EventCard key={event.id} event={event} />
                )) : (
                    <div className="no-results">
                        <p>Мероприятий не найдено</p>
                        {activeTab === 'recommended' && (
                            <p>
                                Попробуйте обновить ваш профиль с навыками или посмотрите 
                                <button 
                                    className="btn-link"
                                    onClick={() => setActiveTab('all')}
                                >
                                    все мероприятия
                                </button>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recommendations;