import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import './NavBar.css';

const NavBar = ({ token, userType, setToken, setUserType }) => {
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

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
    const isLoginPage = location.pathname === '/';
    const isOrganizerRegisterPage = location.pathname === '/register/organizer';
    const isTalentRegisterPage = location.pathname === '/register';

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/dashboard">
                    <img src="/TS_Logo.png" alt="Talent System Logo" style={{ height: '48px' }} />
                </Link>
                <div className="navbar-nav">
                    {!token ? (
                        isLoginPage || isOrganizerRegisterPage || isTalentRegisterPage ? null : (
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
                        )
                    ) : (
                        <>
                            {showOrganizerNavButtons && (
                                <>
                                    <Link className="nav-link" to="/organizer/dashboard"><i className="fas fa-tasks"></i> Панель управления</Link>
                                    <Link className="nav-link" to="/organizer/profile"><i className="fas fa-user"></i> Профиль</Link>
                                    <button className="btn btn-outline-danger ms-2 btn-sm" onClick={() => {
                                        setToken('');
                                        setUserType('');
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('userType');
                                    }}>
                                        <i className="fas fa-sign-out-alt"></i> Выйти из аккаунта
                                    </button>
                                </>
                            )}
                            {token && userType !== 'organizer' && location.pathname !== '/dashboard' && location.pathname !== '/' && (
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