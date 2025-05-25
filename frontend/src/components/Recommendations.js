import React, { useState, useEffect } from 'react';
import api from '../api';
import EventCard from './EventCard';
import './Recommendations.css';
import { useNavigate } from 'react-router-dom';

const Recommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('recommended');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('all');
    const [isSkillsFilterExpanded, setIsSkillsFilterExpanded] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
        fetchFaculties();
        fetchSkills();
    }, []);

    const fetchData = async () => {
        try {
            // Запрашиваем рекомендации и все опубликованные мероприятия
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
            // Проверяем, является ли response.data объектом с полем results (как в случае пагинации)
            if (eventsData && eventsData.results && Array.isArray(eventsData.results)) {
                 eventsData = eventsData.results; // Используем массив из results
            } else if (!Array.isArray(eventsData)) {
                 eventsData = []; // Если не массив и не объект с results, считаем пустым
            }
            setAllEvents(eventsData);
            
            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки рекомендаций или мероприятий:', err);
            setError('Ошибка загрузки данных');
            setLoading(false);
        }
    };

    const fetchFaculties = async () => {
        try {
            const response = await api.get('api/faculties/');
             // Убедимся, что получаем массив из results
            if (response.data && Array.isArray(response.data.results)) {
                 setFaculties(response.data.results);
             } else {
                 setFaculties([]); // Устанавливаем пустой массив, если данные не в ожидаемом формате
             }
        } catch (err) {
            console.error('Ошибка загрузки факультетов:', err);
            // Обрабатываем ошибку загрузки факультетов, но не блокируем отображение мероприятий
        }
    };

    const fetchSkills = async () => {
        try {
            const response = await api.get('api/skills/');
            if (response.data && Array.isArray(response.data.results)) {
                setAvailableSkills(response.data.results);
            } else {
                setAvailableSkills([]);
            }
        } catch (err) {
            console.error('Ошибка загрузки навыков:', err);
        }
    };

    const handleSkillToggle = (skillId) => {
        setSelectedSkills(prev => {
            if (prev.includes(skillId)) {
                return prev.filter(id => id !== skillId);
            } else {
                return [...prev, skillId];
            }
        });
    };

    const toggleSkillsFilter = () => {
        setIsSkillsFilterExpanded(!isSkillsFilterExpanded);
    };

    const handleFacultyChange = (e) => {
        setSelectedFaculty(e.target.value);
    };

    const filteredEvents = () => {
        let events = activeTab === 'recommended' ? recommendations : allEvents;
        
        // Фильтрация по поисковому запросу
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            events = events.filter(event => 
                event.title.toLowerCase().includes(term) || 
                event.description.toLowerCase().includes(term) ||
                event.location.toLowerCase().includes(term) ||
                 // Добавляем поиск по факультетам, если они есть в объекте события
                 (event.faculties && event.faculties.some(f => f.name.toLowerCase().includes(term)))
            );
        }
        
        // Фильтрация по выбранному факультету
        if (selectedFaculty !== 'all') {
            events = events.filter(event => {
                 // Мероприятие подходит, если у него нет ограничений по факультетам
                 // ИЛИ оно имеет ограничения И выбранный факультет есть в списке доступных
                 return !event.faculty_restriction || (event.faculty_restriction && event.faculties.some(f => String(f.id) === selectedFaculty));
            });
        }

        // Фильтрация по выбранным навыкам
        if (selectedSkills.length > 0) {
            events = events.filter(event => {
                const eventSkillIds = event.required_skills ? event.required_skills.map(s => s.id) : [];
                return selectedSkills.some(skillId => eventSkillIds.includes(skillId));
            });
        }
        
        return events;
    };

    if (loading) return <div className="text-center mt-5">Загрузка...</div>;

    return (
        <div className="recommendations-container">
            <div className="recommendations-header">
                <div className="header-and-button">
                    <h2>Мероприятия</h2>
                    {/* Проверяем, что пользователь - талант и добавляем кнопку */}
                    {localStorage.getItem('userType') !== 'organizer' && (
                         <button 
                            className="pinterest-like-button ms-auto"
                            onClick={() => navigate('/applications')}
                        >
                            Мои заявки
                        </button>
                    )}
                </div>
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
                    {/* Фильтр по факультетам */}
                    {Array.isArray(faculties) && faculties.length > 0 && (
                        <div className="faculty-filter">
                            <label htmlFor="facultyFilter" className="form-label">Фильтр по факультету:</label>
                            <select
                                id="facultyFilter"
                                className="form-select"
                                value={selectedFaculty}
                                onChange={handleFacultyChange}
                            >
                                <option value="all">Все факультеты</option>
                                {faculties.map(faculty => (
                                    <option key={faculty.id} value={faculty.id}>
                                        {faculty.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="skills-filter">
                        <h4 className="skills-filter-header" onClick={toggleSkillsFilter} style={{ cursor: 'pointer' }}>
                            Фильтр по навыкам <i className={`fas ${isSkillsFilterExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                        </h4>
                        <div className={`skills-tags ${isSkillsFilterExpanded ? 'expanded' : 'collapsed'}`}>
                            {Array.isArray(availableSkills) && availableSkills.map(skill => (
                                <span 
                                    key={skill.id} 
                                    className={`skill-tag ${selectedSkills.includes(skill.id) ? 'active' : ''}`}
                                    onClick={() => handleSkillToggle(skill.id)}
                                >
                                    {skill.name}
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