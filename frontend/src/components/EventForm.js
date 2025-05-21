import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import './EventForm.css';

const EventForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        required_skills: '',
        location: '',
        status: 'draft',
        image: null
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(isEditing);
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        if (isEditing) {
            fetchEvent();
        }
    }, [id]);

    const fetchEvent = async () => {
        try {
            const response = await api.get(`api/events/${id}/`);
            const event = response.data;
            
            setFormData({
                title: event.title,
                description: event.description,
                date: event.date,
                required_skills: event.required_skills,
                location: event.location,
                status: event.status,
                image: null // Изображение нужно загружать заново
            });
            
            // Если есть изображение, устанавливаем предпросмотр
            if (event.image) {
                setImagePreview(`http://127.0.0.1:8000${event.image}`);
            }
            
            setLoading(false);
        } catch (err) {
            setError('Ошибка загрузки мероприятия');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'image') {
            if (files && files[0]) {
                setFormData(prev => ({
                    ...prev,
                    image: files[0]
                }));
                
                // Создаем URL для предпросмотра
                const previewURL = URL.createObjectURL(files[0]);
                setImagePreview(previewURL);
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Функция для очистки изображения
    const clearImage = () => {
        setFormData(prev => ({
            ...prev,
            image: null
        }));
        setImagePreview(null);
        // Очищаем input file
        const fileInput = document.querySelector('input[name="image"]');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        try {
            console.log('Отправка данных:', Object.fromEntries(data.entries()));
            
            if (isEditing) {
                await api.patch(`api/events/${id}/`, data);
            } else {
                await api.post('api/events/', data);
            }
            navigate('/organizer/dashboard');
        } catch (err) {
            console.error('Ошибка при сохранении мероприятия:', err.response || err);
            setError(
                err.response?.data?.detail || 
                err.response?.data?.message || 
                err.response?.data?.error || 
                'Ошибка при сохранении мероприятия. Проверьте формат изображения.'
            );
        }
    };

    if (loading) return <div className="text-center mt-5">Загрузка...</div>;

    return (
        <div className="container mt-4">
            <h2>{isEditing ? 'Редактирование мероприятия' : 'Создание мероприятия'}</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Название мероприятия:</label>
                    <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Описание:</label>
                    <textarea
                        className="form-control"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Дата проведения:</label>
                    <input
                        type="date"
                        className="form-control"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Требуемые навыки (через запятую):</label>
                    <input
                        type="text"
                        className="form-control"
                        name="required_skills"
                        value={formData.required_skills}
                        onChange={handleChange}
                        placeholder="Например: танцы, пение, актерское мастерство"
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Место проведения:</label>
                    <input
                        type="text"
                        className="form-control"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label">Статус:</label>
                    <select
                        className="form-select"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <option value="draft">Черновик</option>
                        <option value="published">Опубликовано</option>
                        <option value="closed">Закрыто</option>
                        <option value="cancelled">Отменено</option>
                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label">Изображение:</label>
                    <div className="d-flex align-items-center gap-3">
                        <input
                            type="file"
                            className="form-control"
                            name="image"
                            onChange={handleChange}
                            accept="image/*"
                        />
                        {imagePreview && (
                            <button 
                                type="button" 
                                className="btn btn-sm btn-danger"
                                onClick={clearImage}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>
                    
                    {imagePreview && (
                        <div className="image-preview-container mt-3">
                            <img 
                                src={imagePreview} 
                                alt="Предпросмотр" 
                                className="image-preview" 
                            />
                        </div>
                    )}
                </div>

                <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                        {isEditing ? 'Сохранить изменения' : 'Создать мероприятие'}
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => navigate('/organizer/dashboard')}
                    >
                        Отмена
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EventForm; 