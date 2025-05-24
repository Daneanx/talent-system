import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import './UserActivity.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const UserActivity = () => {
    const [activityData, setActivityData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchActivityStats = async () => {
            try {
                const response = await axios.get('/api/user/activity/stats/', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setActivityData(response.data);
                setLoading(false);
            } catch (err) {
                setError('Ошибка при загрузке данных активности');
                setLoading(false);
            }
        };

        fetchActivityStats();
    }, []);

    if (loading) {
        return (
            <div className="user-activity-container">
                <div className="loading-spinner">Загрузка...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-activity-container">
                <div className="error-message">{error}</div>
            </div>
        );
    }

    const skillLabels = activityData.skill_stats ? Object.keys(activityData.skill_stats) : [];
    const skillCounts = activityData.skill_stats ? Object.values(activityData.skill_stats) : [];

    const chartData = {
        labels: skillLabels,
        datasets: [
            {
                label: 'Количество мероприятий',
                data: skillCounts,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Соотношение мероприятий по навыкам',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Количество',
                },
            },
        },
    };

    return (
        <div className="user-activity-container">
            <h2>Моя активность</h2>

            <div className="activity-stats-cards">
                <div className="stat-card">
                    <h3>Всего заявок</h3>
                    <div className="stat-value">{activityData.total_applications}</div>
                </div>
                <div className="stat-card">
                    <h3>Одобренные заявки</h3>
                    <div className="stat-value">{activityData.approved_applications}</div>
                </div>
            </div>
            
            {skillLabels.length > 0 && (
                <div className="activity-chart">
                    <Bar data={chartData} options={chartOptions} />
                </div>
            )}

        </div>
    );
};

export default UserActivity; 