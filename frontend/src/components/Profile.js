import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = ({ token }) => {
    const [profile, setProfile] = useState(null);
    const [skills, setSkills] = useState('');
    const [preferences, setPreferences] = useState('');
    const [bio, setBio] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/profiles/', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = response.data[0];
                setProfile(data);
                setSkills(data.skills || '');
                setPreferences(data.preferences || '');
                setBio(data.bio || '');
            } catch (err) {
                setError('Ошибка загрузки профиля');
            }
        };
        fetchProfile();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(
                'http://127.0.0.1:8000/api/profiles/',
                { skills, preferences, bio },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setError('');
            alert('Профиль обновлён');
        } catch (err) {
            setError('Ошибка обновления профиля');
        }
    };

    if (!profile) return <div className="text-center mt-5">Загрузка...</div>;

    return (
        <div className="container mt-5">
            <h2 className="text-center">Мой профиль</h2>
            <form onSubmit={handleSubmit} className="col-md-6 mx-auto">
                <div className="mb-3">
                    <label className="form-label">Навыки:</label>
                    <input
                        type="text"
                        className="form-control"
                        value={skills}
                        onChange={(e) => setSkills(e.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Предпочтения:</label>
                    <input
                        type="text"
                        className="form-control"
                        value={preferences}
                        onChange={(e) => setPreferences(e.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">О себе:</label>
                    <textarea
                        className="form-control"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-primary w-100">Сохранить</button>
            </form>
            {error && <p className="text-danger text-center mt-3">{error}</p>}
        </div>
    );
};

export default Profile;