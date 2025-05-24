import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import './EventForm.css';

const EventForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        required_skill_ids: [],
        date: '',
        location: '',
        image: null,
        status: 'draft',
        faculty_restriction: false,
        faculty_ids: []
    });
    const [faculties, setFaculties] = useState([]);
    const [availableSkills, setAvailableSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    const fetchFaculties = async () => {
        try {
            const response = await api.get('api/faculties/');
            console.log('Получены факультеты:', response.data);
            setFaculties(response.data.results);
        } catch (err) {
            console.error('Ошибка загрузки факультетов:', err);
            setError('Не удалось загрузить список факультетов');
        }
    };

    const fetchSkills = async () => {
        try {
            const response = await api.get('api/skills/');
            console.log('Получены навыки:', response.data);
            setAvailableSkills(response.data.results);
        } catch (err) {
            console.error('Ошибка загрузки навыков:', err);
            setError('Не удалось загрузить список навыков');
        }
    };

    const fetchEvent = useCallback(async () => {
        try {
            const response = await api.get(`api/events/${id}/`);
            const event = response.data;
            setFormData({
                ...event,
                date: event.date.split('T')[0],
                faculty_ids: event.faculties.map(f => f.id),
                required_skill_ids: event.required_skills.map(s => s.id)
            });
            if (event.image) {
                setImagePreview(event.image);
            }
            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки мероприятия:', err);
            setError('Не удалось загрузить данные мероприятия');
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchFaculties();
        fetchSkills();
        if (id) {
            fetchEvent();
        } else {
            setLoading(false);
        }
    }, [id, fetchEvent]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        
        if (type === 'file') {
            const file = files[0];
            setFormData(prev => ({ ...prev, image: file }));
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                };
                reader.readAsDataURL(file);
            }
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'faculty_ids') {
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            setFormData(prev => ({ ...prev, faculty_ids: selectedOptions }));
        } else if (name === 'required_skill_ids') {
            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
            setFormData(prev => ({ ...prev, required_skill_ids: selectedOptions }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'faculty_ids') {
                    formData[key].forEach(id => {
                        formDataToSend.append('faculty_ids', id);
                    });
                } else if (key === 'required_skill_ids') {
                    formData[key].forEach(id => {
                        formDataToSend.append('required_skill_ids', id);
                    });
                } else if (key === 'image' && formData[key]) {
                    formDataToSend.append('image', formData[key]);
                } else if (key !== 'faculties' && key !== 'required_skills') {
                    formDataToSend.append(key, formData[key]);
                }
            });

            if (id) {
                await api.patch(`api/events/${id}/`, formDataToSend);
            } else {
                await api.post('api/events/', formDataToSend);
            }
            navigate('/organizer/dashboard');
        } catch (err) {
            console.error('Ошибка сохранения мероприятия:', err);
            setError(err.response?.data?.detail || 'Ошибка при сохранении мероприятия');
        }
    };

    if (loading) return <div className="text-center mt-5">Загрузка...</div>;

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title text-center mb-4">
                                {id ? 'Редактирование мероприятия' : 'Создание мероприятия'}
                            </h2>
                            
                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Название мероприятия</label>
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
                                    <label className="form-label">Описание</label>
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
                                    <label className="form-label">Требуемые навыки</label>
                                    <select
                                        className="form-select"
                                        name="required_skill_ids"
                                        multiple
                                        value={formData.required_skill_ids}
                                        onChange={handleChange}
                                        required
                                    >
                                        {Array.isArray(availableSkills) && availableSkills.map(skill => (
                                            <option key={skill.id} value={skill.id}>
                                                {skill.name}
                                            </option>
                                        ))}
                                    </select>
                                    <small className="form-text text-muted">
                                        Удерживайте Ctrl (Cmd на Mac) для выбора нескольких навыков
                                    </small>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Дата</label>
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
                                    <label className="form-label">Место проведения</label>
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
                                    <label className="form-label">Изображение</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        name="image"
                                        onChange={handleChange}
                                        accept="image/*"
                                    />
                                    {imagePreview && (
                                        <div className="mt-2">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="img-preview"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            name="faculty_restriction"
                                            checked={formData.faculty_restriction}
                                            onChange={handleChange}
                                            id="facultyRestriction"
                                        />
                                        <label className="form-check-label" htmlFor="facultyRestriction">
                                            Ограничить доступ по факультетам
                                        </label>
                                    </div>
                                </div>

                                {formData.faculty_restriction && (
                                    <div className="mb-3">
                                        <label className="form-label">Доступные факультеты</label>
                                        <select
                                            className="form-select"
                                            name="faculty_ids"
                                            multiple
                                            value={formData.faculty_ids}
                                            onChange={handleChange}
                                            required={formData.faculty_restriction}
                                        >
                                            {Array.isArray(faculties) && faculties.map(faculty => (
                                                <option key={faculty.id} value={faculty.id}>
                                                    {faculty.name}
                                                </option>
                                            ))}
                                        </select>
                                        <small className="form-text text-muted">
                                            Удерживайте Ctrl (Cmd на Mac) для выбора нескольких факультетов
                                        </small>
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary w-100">
                                    {id ? 'Сохранить изменения' : 'Создать мероприятие'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventForm; 