import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import OrganizerRegister from './components/OrganizerRegister';
import Profile from './components/Profile';
import OrganizerProfile from './components/OrganizerProfile';
import OrganizerDashboard from './components/OrganizerDashboard';
import EventForm from './components/EventForm';
import EventDetail from './components/EventDetail';
import Recommendations from './components/Recommendations';
import api from './api';

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [userType, setUserType] = useState(localStorage.getItem('userType') || '');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        // Проверяет токен и тип пользователя при загрузке и изменении
        const storedToken = localStorage.getItem('token');
        const storedUserType = localStorage.getItem('userType');
        
        if (storedToken !== token) {
            setToken(storedToken || '');
            // Устанавливаем токен в заголовки запросов
            if (storedToken) {
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            } else {
                delete api.defaults.headers.common['Authorization'];
            }
        }

        if (storedUserType !== userType) {
            setUserType(storedUserType || '');
        }
        
        if (!storedToken) {
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            setToken('');
            setUserType('');
            delete api.defaults.headers.common['Authorization'];
        } else {
            // При каждом обновлении страницы устанавливаем токен
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
    }, [token, userType]);

    const handleLogout = () => {
        setToken('');
        setUserType('');
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        delete api.defaults.headers.common['Authorization'];
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    // Закрывается dropdown при клике вне его
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown')) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    return (
        <Router>
            <div>
                <nav className="navbar navbar-expand-lg navbar-light bg-light">
                    <div className="container-fluid">
                        <Link className="navbar-brand" to="/">Talent System</Link>
                        <div className="navbar-nav">
                            {!token ? (
                                <>
                                    <Link className="nav-link" to="/">Вход</Link>
                                    <div className="nav-item dropdown">
                                        <button 
                                            className={`nav-link dropdown-toggle ${isDropdownOpen ? 'show' : ''}`}
                                            onClick={toggleDropdown}
                                            style={{ background: 'none', border: 'none' }}
                                        >
                                            Регистрация
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
                                </>
                            ) : (
                                <>
                                    {userType === 'organizer' ? (
                                        <>
                                            <Link className="nav-link" to="/organizer/dashboard">Панель управления</Link>
                                            <Link className="nav-link" to="/organizer/profile">Профиль</Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link className="nav-link" to="/profile">Профиль</Link>
                                            <Link className="nav-link" to="/recommendations">Рекомендации</Link>
                                        </>
                                    )}
                                    <button className="btn btn-outline-danger ms-2" onClick={handleLogout}>
                                        Выйти
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </nav>
                <Routes>
                    <Route path="/" element={!token ? <Login setToken={setToken} setUserType={setUserType} /> : (
                        userType === 'organizer' ? <OrganizerDashboard /> : <Recommendations />
                    )} />
                    <Route path="/register" element={<Register setToken={setToken} setUserType={setUserType} />} />
                    <Route path="/register/organizer" element={<OrganizerRegister />} />
                    <Route
                        path="/profile"
                        element={token && userType !== 'organizer' ? <Profile /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                    <Route
                        path="/recommendations"
                        element={token && userType !== 'organizer' ? <Recommendations /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                    <Route
                        path="/organizer/dashboard"
                        element={token && userType === 'organizer' ? <OrganizerDashboard /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                    <Route
                        path="/organizer/profile"
                        element={token && userType === 'organizer' ? <OrganizerProfile /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                    <Route
                        path="/organizer/events/create"
                        element={token && userType === 'organizer' ? <EventForm /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                    <Route
                        path="/organizer/events/:id/edit"
                        element={token && userType === 'organizer' ? <EventForm /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                    <Route
                        path="/events/:id"
                        element={token ? <EventDetail /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                </Routes>
            </div>
        </Router>
    );
};
export default App;