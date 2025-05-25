import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import PropTypes from 'prop-types';
import './Login.css';

const Login = ({ setToken, setUserType }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
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

    try {
      const response = await api.post('api/login/', {
        username: formData.username,
        password: formData.password
      });

      setToken(response.data.access);
      setUserType(response.data.userType);
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('userType', response.data.userType);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;

      // Если пользователь - организатор, получаем и сохраняем его ID
      if (response.data.userType === 'organizer') {
        try {
          const profileResponse = await api.get('api/organizer/profiles/');
          // Предполагаем, что ответ api/organizer/profiles/ содержит массив профилей, берем первый
          if (profileResponse.data && Array.isArray(profileResponse.data.results) && profileResponse.data.results.length > 0) {
            const organizerId = profileResponse.data.results[0].id;
            localStorage.setItem('organizerId', organizerId);
          } else if (profileResponse.data && profileResponse.data.id) { // Если ответ - одиночный объект
             const organizerId = profileResponse.data.id;
             localStorage.setItem('organizerId', organizerId);
          }
        } catch (profileErr) {
          console.error('Ошибка при получении профиля организатора после входа:', profileErr);
          // Не блокируем вход, но выводим ошибку
          setError('Не удалось загрузить ID организатора. Некоторые функции могут быть недоступны.');
        }
      }

      navigate(response.data.userType === 'organizer' ? '/organizer/dashboard' : '/dashboard');
    } catch (err) {
      console.error('Ошибка входа:', err);
      setError(err.response?.data?.error || 'Ошибка при входе');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="login-card">
            <h2 className="login-title">Вход</h2>

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

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>

            <div className="login-footer">
              <p className="text-center mt-3">Еще нет аккаунта? 
                <div className="dropdown d-inline-block">
                  <button 
                    className={`dropdown-toggle-link ${isDropdownOpen ? 'show' : ''}`}
                    onClick={toggleDropdown}
                    style={{ background: 'none', border: 'none', padding: '2%', textDecoration: 'underline', color: '#e05748', cursor: 'pointer' }}
                  >
                    Зарегистрироваться
                  </button>
                  <ul className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`} style={{
                    display: isDropdownOpen ? 'block' : 'none'
                  }}>
                    <li>
                      <Link 
                        className="dropdown-item"
                        to="/register"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Регистрация таланта
                      </Link>
                    </li>
                    <li>
                      <Link 
                        className="dropdown-item"
                        to="/register/organizer"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Регистрация организатора
                      </Link>
                    </li>
                  </ul>
                </div>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Login.propTypes = {
  setToken: PropTypes.func.isRequired,
  setUserType: PropTypes.func.isRequired
};

export default Login;