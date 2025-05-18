import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Login from './components/Login';
import Profile from './components/Profile';
import Recommendations from './components/Recommendations';

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token') || '');

    useEffect(() => {
        if (!token) {
            localStorage.removeItem('token');
        }
    }, [token]);

    const handleLogout = () => {
        setToken('');
        localStorage.removeItem('token');
    };

    return (
        <Router>
            <div>
                <nav className="navbar navbar-expand-lg navbar-light bg-light">
                    <div className="container-fluid">
                        <Link className="navbar-brand" to="/">Talent System</Link>
                        <div className="navbar-nav">
                            <Link className="nav-link" to="/">Вход</Link>
                            <Link className="nav-link" to="/profile">Профиль</Link>
                            <Link className="nav-link" to="/recommendations">Рекомендации</Link>
                            {token && (
                                <button className="btn btn-outline-danger ms-2" onClick={handleLogout}>
                                    Выйти
                                </button>
                            )}
                        </div>
                    </div>
                </nav>
                <Routes>
                    <Route path="/" element={<Login setToken={setToken} />} />
                    <Route
                        path="/profile"
                        element={token ? <Profile token={token} /> : <Login setToken={setToken} />}
                    />
                    <Route
                        path="/recommendations"
                        element={token ? <Recommendations token={token} /> : <Login setToken={setToken} />}
                    />
                </Routes>
            </div>
        </Router>
    );
};
export default App;