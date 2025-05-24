import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import EventCard from './EventCard';
import './TalentDashboard.css';

const TalentDashboard = () => {
  const [events, setEvents] = useState([]);
  const [advertIndex, setAdvertIndex] = useState(0); // Индекс для большого рекламного блока
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const response = await api.get('/api/profiles/');
        console.log('Данные профиля:', response.data);
        const userData = response.data.user;
        if (userData) {
           setUserName(userData.first_name || userData.username || '');
        } else {
            setUserName('Талант'); // Fallback имя, если данных пользователя нет
        }
      } catch (err) {
        console.error('Ошибка при загрузке имени пользователя:', err);
        setUserName('Талант'); // Fallback имя при ошибке
      }
    };
    fetchUserName();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Доброй ночи';
    if (hour < 12) return 'Доброе утро';
    if (hour < 17) return 'Добрый день';
    if (hour < 24) return 'Добрый вечер';
    return 'Здравствуйте';
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/recommendations/');
        const eventsData = Array.isArray(response.data) ? response.data : (response.data.results || []);
        console.log('Получено мероприятий с бэкенда:', eventsData.length, eventsData);
        setEvents(eventsData);
        setLoading(false);
      } catch (err) {
        console.error('Ошибка при загрузке рекомендаций:', err);
        setError('Не удалось загрузить рекомендации.');
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  useEffect(() => {
    if (events.length > 1) {
      const intervalId = setInterval(() => {
        setAdvertIndex(prevIndex => (prevIndex + 1) % events.length);
      }, 9000);

      return () => clearInterval(intervalId);
    } else if (events.length === 1) {
        // Если только одно мероприятие, оно будет отображаться в большом блоке
        // Маленькие карточки не отобразятся
        setAdvertIndex(0);
    }
  }, [events]);

  const currentAdvertEvent = events.length > 0 ? events[advertIndex] : null;
  const otherEvents = events.filter(event => event.id !== (currentAdvertEvent ? currentAdvertEvent.id : null)).slice(0, 4);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    delete api.defaults.headers.common['Authorization'];
    navigate('/');
  };

  return (
    <div className="talent-dashboard-container">
      <div className="sidebar">
        <h3 className="sidebar-title">{getGreeting()}{userName ? ', ' + userName : ''}</h3>
        <ul className="sidebar-nav">
          <li>
            <Link to="/profile" className="sidebar-link">
              <i className="fas fa-user"></i> Мой профиль
            </Link>
          </li>
          <li>
            <Link to="/recommendations" className="sidebar-link">
              <i className="fas fa-calendar-alt"></i> Мероприятия и Заявки
            </Link>
          </li>
          <li>
            <Link to="/faculty" className="sidebar-link">
              <i className="fas fa-university"></i> Мой факультет
            </Link>
          </li>
          <li>
            <Link to="/activity" className="sidebar-link">
              <i className="fas fa-chart-line"></i> Активность
            </Link>
          </li>
          <li>
            <button onClick={handleLogout} className="sidebar-link logout-link">
              <i className="fas fa-sign-out-alt"></i> Выйти
            </button>
          </li>
        </ul>
      </div>

      <div className="main-content">
        <h1 className="main-content-title">Рекомендованные мероприятия</h1>
        
        {loading && <div className="loading-indicator">Загрузка рекомендаций...</div>}
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && events.length === 0 && (
          <div className="no-recommendations">
            <p>Пока нет рекомендованных мероприятий.</p>
            <Link to="/events" className="btn btn-primary">Смотреть все мероприятия</Link>
          </div>
        )}

        {/* Большой рекламный блок */}
        {!loading && !error && currentAdvertEvent && (
          <div className="event-advert-container" onClick={() => navigate(`/events/${currentAdvertEvent.id}`)}>
            <div className="event-advert fade-in" key={currentAdvertEvent.id}>
              <img src={currentAdvertEvent.image || '/placeholder-event.png'} alt={currentAdvertEvent.title} className="advert-image" />
              <div className="event-advert-gradient"></div>
              <div className="advert-content">
                <h3>{currentAdvertEvent.title}</h3>
                <p>{currentAdvertEvent.short_description || currentAdvertEvent.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Сетка из 4 карточек мероприятий */}
        {!loading && !error && otherEvents.length > 0 && (
          <div className="events-grid">
            <h2 className="events-grid-title">Другие мероприятия</h2>
            <div className="events-grid-container">
              {otherEvents.map(event => (
                <div className="events-grid-item" key={event.id}>
                  <EventCard event={event} isDashboardCard={true} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TalentDashboard;