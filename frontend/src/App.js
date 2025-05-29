import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import OrganizerRegister from './components/OrganizerRegister';
import Profile from './components/Profile';
import OrganizerProfile from './components/OrganizerProfile';
import OrganizerDashboard from './components/OrganizerDashboard';
import TalentDashboard from './components/TalentDashboard';
import EventForm from './components/EventForm';
import EventDetail from './components/EventDetail';
import Recommendations from './components/Recommendations';
import ApplicationsList from './components/ApplicationsList';
import TalentProfileView from './components/TalentProfileView';
import FacultyStats from './components/FacultyStats';
import UserActivity from './components/UserActivity';
import NavBar from './components/NavBar';
import api from './api';
import OrganizerProfileView from './components/OrganizerProfileView';

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [userType, setUserType] = useState(localStorage.getItem('userType') || '');

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUserType = localStorage.getItem('userType');
        
        if (storedToken !== token) {
            setToken(storedToken || '');
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
            api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
    }, [token, userType]);

    return (
        <Router>
            <div>
                <NavBar 
                    token={token} 
                    userType={userType} 
                    setToken={setToken} 
                    setUserType={setUserType} 
                />
                <Routes>
                    <Route path="/" element={!token ? <Login setToken={setToken} setUserType={setUserType} /> : (
                        userType === 'organizer' ? <OrganizerDashboard /> : <TalentDashboard />
                    )} />
                    <Route path="/register" element={<Register setToken={setToken} setUserType={setUserType} />} />
                    <Route path="/register/organizer" element={<OrganizerRegister setToken={setToken} setUserType={setUserType} />} />
                    <Route
                        path="/profile"
                        element={token && userType !== 'organizer' ? <Profile /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                    <Route
                        path="/recommendations"
                        element={token && userType !== 'organizer' ? <Recommendations /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                    <Route
                        path="/applications"
                        element={token && userType !== 'organizer' ? <ApplicationsList /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                    <Route
                        path="/dashboard"
                        element={token && userType !== 'organizer' ? <TalentDashboard /> : <Login setToken={setToken} setUserType={setUserType} />}
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
                    <Route
                        path="/organizer/:organizerId"
                        element={token ? <OrganizerProfileView /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                    <Route
                        path="/talents/:id"
                        element={token ? <TalentProfileView /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                    <Route
                        path="/faculty"
                        element={token && userType !== 'organizer' ? <FacultyStats /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                    <Route
                        path="/activity"
                        element={token && userType !== 'organizer' ? <UserActivity /> : <Login setToken={setToken} setUserType={setUserType} />}
                    />
                </Routes>
            </div>
        </Router>
    );
};
export default App;