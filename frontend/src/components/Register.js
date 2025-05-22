import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Register = ({ setToken, setUserType }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        skills: '',
        preferences: '',
        bio: '',
        faculty_id: '',
        education_level: '',
        course: ''
    });
    const [faculties, setFaculties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchFaculties();
    }, []);

    const fetchFaculties = async () => {
        try {
            const response = await api.get('api/faculties/');
            setFaculties(response.data);
        } catch (err) {
            console.error('Ошибка загрузки факультетов:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('api/register/', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                skills: formData.skills,
                preferences: formData.preferences,
                bio: formData.bio,
                faculty_id: formData.faculty_id,
                education_level: formData.education_level,
                course: formData.course
            });

            setToken(response.data.token);
            setUserType(response.data.userType);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('userType', response.data.userType);
            api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
            
            await api.post('api/profiles/', {
                skills: formData.skills,
                preferences: formData.preferences,
                bio: formData.bio
            });

            navigate('/profile');
        } catch (err) {
            console.error('Ошибка регистрации:', err);
            setError(err.response?.data?.detail || 'Ошибка при регистрации');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-body">
                            <h2 className="card-title text-center mb-4">Регистрация таланта</h2>
                            
                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}
                            
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Имя пользователя:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Email:</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Пароль:</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Подтвердите пароль:</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Факультет:</label>
                                    <select
                                        className="form-control"
                                        name="faculty_id"
                                        value={formData.faculty_id}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Выберите факультет</option>
                                        {faculties.map(faculty => (
                                            <option key={faculty.id} value={faculty.id}>
                                                {faculty.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Уровень образования:</label>
                                    <select
                                        className="form-control"
                                        name="education_level"
                                        value={formData.education_level}
                                        onChange={handleChange}
                                    >
                                        <option value="">Выберите уровень образования</option>
                                        <option value="bachelor">Бакалавриат</option>
                                        <option value="master">Магистратура</option>
                                        <option value="specialist">Специалитет</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Курс:</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="course"
                                        value={formData.course}
                                        onChange={handleChange}
                                        min="1"
                                        max="6"
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Навыки:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="skills"
                                        value={formData.skills}
                                        onChange={handleChange}
                                        placeholder="Например: танцы, пение, рисование"
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">Предпочтения:</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="preferences"
                                        value={formData.preferences}
                                        onChange={handleChange}
                                        placeholder="Например: концерты, фестивали"
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="form-label">О себе:</label>
                                    <textarea
                                        className="form-control"
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        rows="3"
                                    ></textarea>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >
                                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register; 