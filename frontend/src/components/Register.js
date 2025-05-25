import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import PropTypes from 'prop-types';
import './Register.css'; // Новый CSS-файл

const AGU_FACULTIES = [
  { id: 1, name: 'Агро-биологический факультет' },
  { id: 2, name: 'Факультет иностранных языков' },
  { id: 3, name: 'Факультет истории и социальных коммуникаций' },
  { id: 4, name: 'Факультет наук о Земле, химии и техносферной безопасности' },
  { id: 5, name: 'Факультет педагогики, психологии, гостеприимства и спорта' },
  { id: 6, name: 'Факультет физики, математики и инженерных технологий' },
  { id: 7, name: 'Факультет филологии и журналистики' },
  { id: 8, name: 'Факультет цифровых технологий и кибербезопасности' },
  { id: 9, name: 'Факультет экономики и права' },
  { id: 10, name: 'Каспийская высшая школа перевода' },
  { id: 11, name: 'Колледж Астраханского государственного университета им. В.Н. Татищева' },
  { id: 12, name: 'Филиал ФГБОУ ВО «Астраханский государственный университет имени В.Н. Татищева» в г. Знаменске Астраханской области' },
];

const Register = ({ setToken, setUserType }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    preferences: '',
    bio: '',
    faculty_id: '',
    education_level: '',
    course: '',
    skills: [] // Изменяем на массив для выбранных навыков
  });
  const faculties = AGU_FACULTIES;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableSkills, setAvailableSkills] = useState([]); // Состояние для доступных навыков

  useEffect(() => {
      // Загрузка списка навыков при монтировании компонента
      const fetchSkills = async () => {
          try {
              const response = await api.get('api/skills/');
              // Проверяем, что ответ является массивом, так как пагинация отключена
              if (response.data && Array.isArray(response.data)) {
                  setAvailableSkills(response.data);
              } else {
                  console.error('Неожиданный формат данных навыков или ответ не является массивом:', response.data);
                  setAvailableSkills([]); // Устанавливаем пустой массив, чтобы избежать ошибок
              }
          } catch (err) {
              console.error('Ошибка загрузки навыков:', err);
              // Обработка ошибки загрузки навыков, возможно, вывод сообщения пользователю
          }
      };

      fetchSkills();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Обработчик выбора/снятия выбора навыка
  const handleSkillSelect = (skillId) => {
      setFormData(prevState => {
          const selectedSkills = prevState.skills;
          if (selectedSkills.includes(skillId)) {
              // Навык уже выбран, удаляем его
              return {
                  ...prevState,
                  skills: selectedSkills.filter(id => id !== skillId)
              };
          } else {
              // Навык не выбран, добавляем его
              return {
                  ...prevState,
                  skills: [...selectedSkills, skillId]
              };
          }
      });
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
    if (!formData.faculty_id) {
      setError('Пожалуйста, выберите факультет!');
      setLoading(false);
      return;
    }

    try {
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        skills: formData.skills, // Отправляем массив ID навыков
        preferences: formData.preferences,
        bio: formData.bio,
        faculty_id: formData.faculty_id,
        education_level: formData.education_level,
        course: formData.course
      };

      const response = await api.post('api/register/', registrationData);

      if (response.data.token) {
        setToken(response.data.token);
        setUserType(response.data.userType);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userType', response.data.userType);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        window.location.href = '/profile';
      } else {
        setError('Не удалось получить токен авторизации');
      }
    } catch (err) {
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'object') {
          const errorMessages = [];
          for (const key in err.response.data) {
            if (Array.isArray(err.response.data[key])) {
              errorMessages.push(`${key}: ${err.response.data[key].join(', ')}`);
            } else {
              errorMessages.push(`${key}: ${err.response.data[key]}`);
            }
          }
          setError(errorMessages.join('\n'));
        } else {
          setError(err.response.data);
        }
      } else {
        setError('Ошибка при регистрации');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="register-card">
            <h2 className="register-title">Регистрация таланта</h2>

            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off">
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
                <label className="form-label">Имя:</label>
                <input
                  type="text"
                  className="form-control"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Фамилия:</label>
                <input
                  type="text"
                  className="form-control"
                  name="last_name"
                  value={formData.last_name}
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
                <div className="skills-selection">
                    {availableSkills.map(skill => (
                        <button
                            key={skill.id}
                            type="button" // Важно, чтобы кнопка не отправляла форму
                            className={`skill-tile ${formData.skills.includes(skill.id) ? 'selected' : ''}`}
                            onClick={() => handleSkillSelect(skill.id)}
                        >
                            {skill.name}
                        </button>
                    ))}
                </div>
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
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

Register.propTypes = {
  setToken: PropTypes.func.isRequired,
  setUserType: PropTypes.func.isRequired
};

export default Register;