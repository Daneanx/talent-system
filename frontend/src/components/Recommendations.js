import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Recommendations = ({ token }) => {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ next: null, previous: null, count: 0 });
    const [filters, setFilters] = useState({ required_skills: '', date: '' });

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const params = new URLSearchParams({ page });
                if (filters.required_skills) params.append('required_skills', filters.required_skills);
                if (filters.date) params.append('date', filters.date);
                const response = await axios.get(`http://127.0.0.1:8000/api/recommendations/?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEvents(response.data.results);
                setPagination({
                    next: response.data.next,
                    previous: response.data.previous,
                    count: response.data.count
                });
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Не удалось загрузить рекомендации';
                const errorDetails = err.response?.data?.errors
                    ? Object.values(err.response.data.errors).join(', ')
                    : '';
                setError(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
            }
        };
        fetchRecommendations();
    }, [token, page, filters]);

    const handleApply = async (eventId) => {
        try {
            await axios.post(
                'http://127.0.0.1:8000/api/applications/',
                { event: eventId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Заявка подана!');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Ошибка подачи заявки';
            const errorDetails = err.response?.data?.errors
                ? Object.values(err.response.data.errors).join(', ')
                : '';
            setError(`${errorMessage}${errorDetails ? `: ${errorDetails}` : ''}`);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);  // Сбрасываем страницу при изменении фильтров
    };

    return (
        <div>
            <h2>Рекомендации мероприятий</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div>
                <label>
                    Навыки:
                    <input
                        type="text"
                        name="required_skills"
                        value={filters.required_skills}
                        onChange={handleFilterChange}
                    />
                </label>
                <label>
                    Дата:
                    <input
                        type="date"
                        name="date"
                        value={filters.date}
                        onChange={handleFilterChange}
                    />
                </label>
            </div>
            <ul>
                {events.map(event => (
                    <li key={event.id}>
                        <h3>{event.title}</h3>
                        <p>{event.description}</p>
                        <p>Требуемые навыки: {event.required_skills}</p>
                        <p>Дата: {event.date}</p>
                        <button onClick={() => handleApply(event.id)}>Подать заявку</button>
                    </li>
                ))}
            </ul>
            <div>
                <button
                    disabled={!pagination.previous}
                    onClick={() => setPage(page - 1)}
                >
                    Назад
                </button>
                <span> Страница {page} </span>
                <button
                    disabled={!pagination.next}
                    onClick={() => setPage(page + 1)}
                >
                    Вперед
                </button>
            </div>
        </div>
    );
};

export default Recommendations;