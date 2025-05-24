import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import './NavBar.css'; // Предполагаем, что стили для навигации будут здесь

const NavBar = ({ token, userType, setToken, setUserType }) => {
    const location = useLocation(); // Используем useLocation здесь
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

    const showTalentNavButtons = token && userType !== 'organizer' && location.pathname !== '/dashboard';
    const showOrganizerNavButtons = token && userType === 'organizer';

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/dashboard">
                    <img src="/TS_Logo.png" alt="Talent System Logo" style={{ height: '48px' }} />
                </Link>
                <div className="navbar-nav">
                    {!token ? (
                        <>
                            <Link className="nav-link" to="/">Вход</Link>
                            <div className="nav-item dropdown">
                                <button 
                                    className={`nav-link dropdown-toggle ${isDropdownOpen ? 'show' : ''}`}
                                    onClick={toggleDropdown}
                                    style={{ background: 'none', border: 'none' }} // Убираем стандартные стили кнопки
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
                            {showOrganizerNavButtons && (
                                <>
                                    <Link className="nav-link" to="/organizer/dashboard">Панель управления</Link>
                                    <Link className="nav-link" to="/organizer/profile">Профиль</Link>
                                </>
                            )}
                            {token && userType !== 'organizer' && location.pathname !== '/dashboard' && (
                                <>
                                    <Link className="nav-link" to="/dashboard">
                                        <i className="fas fa-home"></i> Перейти на главную
                                    </Link>
                                    <button className="btn btn-outline-danger ms-2 btn-sm" onClick={() => {
                                        setToken('');
                                        setUserType('');
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('userType');
                                    }}>
                                        Выйти из аккаунта
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

NavBar.propTypes = {
    token: PropTypes.string,
    userType: PropTypes.string,
    setToken: PropTypes.func.isRequired,
    setUserType: PropTypes.func.isRequired
};

NavBar.defaultProps = {
    token: '',
    userType: ''
};

export default NavBar; 