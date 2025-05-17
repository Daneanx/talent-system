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

const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
  
    useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
        axios.get('http://localhost:8000/api/profiles/', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => setIsAuthenticated(true))
        .catch(() => {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        });
      }
    }, []);
  
    return isAuthenticated;
  };
  
  function App() {
    const isAuthenticated = useAuth();
  
    return (
      <div>
        {isAuthenticated ? <button onClick={() => localStorage.removeItem('token')}>Выйти</button> : <button onClick={login}>Войти</button>}
        {/* Остальной контент */}
      </div>
    );
  }

export default App;