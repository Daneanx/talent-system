import React, { useState, useEffect } from 'react';
import api from '../services/api';

const EventsList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [faculties, setFaculties] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');

    useEffect(() => {
        fetchFaculties();
        fetchEvents();
    }, []);

    const fetchFaculties = async () => {
        try {
            const response = await api.get('api/faculties/');
            setFaculties(response.data);
        } catch (err) {
            console.error('Ошибка загрузки факультетов:', err);
        }
    };

    const fetchEvents = async (facultyId = '') => {
        try {
            setLoading(true);
            const url = facultyId ? `api/events/?faculty=${facultyId}` : 'api/events/';
            const response = await api.get(url);
            setEvents(response.data);
            setError('');
        } catch (err) {
            console.error('Ошибка загрузки мероприятий:', err);
            setError('Не удалось загрузить мероприятия');
        } finally {
            setLoading(false);
        }
    };

    const handleFacultyChange = (e) => {
        const facultyId = e.target.value;
        setSelectedFaculty(facultyId);
        fetchEvents(facultyId);
    };

    if (loading) {
        return <div className="text-center mt-5"><div className="spinner-border" role="status"></div></div>;
    }

    if (error) {
        return <div className="alert alert-danger mt-5">{error}</div>;
    }

    return (
        <div className="container mt-4">
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="form-group">
                        <label htmlFor="facultyFilter" className="form-label">Фильтр по факультету:</label>
                        <select
                            id="facultyFilter"
                            className="form-select"
                            value={selectedFaculty}
                            onChange={handleFacultyChange}
                        >
                            <option value="">Все факультеты</option>
                            {faculties.map(faculty => (
                                <option key={faculty.id} value={faculty.id}>
                                    {faculty.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="row">
                {events.map(event => (
                    <div key={event.id} className="col-md-6 mb-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title">{event.title}</h5>
                                <p className="card-text">{event.description}</p>
                                <div className="mb-2">
                                    <small className="text-muted">
                                        <i className="bi bi-calendar"></i> {new Date(event.date).toLocaleDateString()}
                                    </small>
                                </div>
                                <div className="mb-2">
                                    <small className="text-muted">
                                        <i className="bi bi-geo-alt"></i> {event.location}
                                    </small>
                                </div>
                                {event.faculty && (
                                    <div className="mb-2">
                                        <small className="text-muted">
                                            <i className="bi bi-building"></i> {event.faculty.name}
                                        </small>
                                    </div>
                                )}
                                <div className="d-grid">
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => handleApply(event.id)}
                                    >
                                        Подать заявку
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventsList; 