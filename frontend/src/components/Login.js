import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Login.css';

const Login = ({ setToken, setUserType }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      navigate(response.data.userType === 'organizer' ? '/organizer/dashboard' : '/recommendations');
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;