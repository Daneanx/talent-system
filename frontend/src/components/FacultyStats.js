import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FacultyStats.css';

const FacultyStats = () => {
    const [facultyData, setFacultyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFacultyStats = async () => {
            try {
                const response = await axios.get('/api/faculty/stats/', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setFacultyData(response.data);
                setLoading(false);
            } catch (err) {
                setError('Ошибка при загрузке данных факультета');
                setLoading(false);
            }
        };

        fetchFacultyStats();
    }, []);

    if (loading) {
        return (
            <div className="faculty-stats-container">
                <div className="loading-spinner">Загрузка...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="faculty-stats-container">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    if (!facultyData.faculty) {
        return (
            <div className="faculty-stats-container">
                <div className="no-faculty-message">
                    <h2>Информация о факультете</h2>
                    <p>{facultyData.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="faculty-stats-container">
            <div className="faculty-info">
                <h2>{facultyData.faculty.name}</h2>
                <h3>{facultyData.faculty.short_name}</h3>
                <p className="faculty-description">{facultyData.faculty.description}</p>
            </div>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Участники факультета</h3>
                    <div className="stat-value">{facultyData.stats.total_users}</div>
                    <p>студентов зарегистрировано</p>
                </div>
                
                <div className="stat-card">
                    <h3>Активность</h3>
                    <div className="stat-value">{facultyData.stats.total_applications}</div>
                    <p>подано заявок на мероприятия</p>
                </div>
            </div>
        </div>
    );
};

export default FacultyStats; 