import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Recommendations = ({ token }) => {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/recommendations/?page=${page}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setEvents(response.data.results || response.data);
                setHasNext(!!response.data.next);
                setError(null);
            } catch (err) {
                console.error('Ошибка загрузки рекомендаций:', err.response?.data || err.message);
                setError('Не удалось загрузить рекомендации');
            }
        };
        fetchRecommendations();
    }, [token, page]);

    const handleNextPage = () => {
        if (hasNext) {
            setPage(page + 1);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            setPage(page - 1);
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center">Рекомендации мероприятий</h2>
            {error && <p className="text-danger text-center">{error}</p>}
            {events.length === 0 && !error ? (
                <p className="text-center">Нет доступных мероприятий</p>
            ) : (
                <div className="row">
                    {events.map((event) => (
                        <div key={event.id} className="col-md-4 mb-4">
                            <div className="card">
                                {event.image && (
                                    <img
                                        src={`http://127.0.0.1:8000${event.image}`}
                                        className="card-img-top"
                                        alt={event.title}
                                    />
                                )}
                                <div className="card-body">
                                    <h5 className="card-title">{event.title}</h5>
                                    <p className="card-text">{event.description}</p>
                                    <p className="card-text">
                                        <strong>Навыки:</strong> {event.required_skills}
                                    </p>
                                    <p className="card-text">
                                        <strong>Дата:</strong> {new Date(event.date).toLocaleDateString()}
                                    </p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={async () => {
                                            try {
                                                await axios.post(
                                                    'http://127.0.0.1:8000/api/applications/',
                                                    { event: event.id },
                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                );
                                                alert('Заявка подана!');
                                            } catch (err) {
                                                setError('Ошибка при подаче заявки');
                                            }
                                        }}
                                    >
                                        Подать заявку
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="d-flex justify-content-between mt-4">
                <button
                    className="btn btn-secondary"
                    onClick={handlePrevPage}
                    disabled={page === 1}
                >
                    Предыдущая
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={handleNextPage}
                    disabled={!hasNext}
                >
                    Следующая
                </button>
            </div>
        </div>
    );
};

export default Recommendations;