// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import api from '../services/api';

const Login = ({ setToken }) => {
    const [email, setEmail] = useState('admin@amstel.ec');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.success) {
                localStorage.setItem('amstel_token', response.data.token);
                setToken(response.data.token);
            }
        } catch (err) {
            setError('Credenciales incorrectas. Intente de nuevo.');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'linear-gradient(135deg, #1A1A1A 0%, #000000 100%)'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>AMSTEL</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Panel Administrativo</p>
                </div>

                <form onSubmit={handleLogin}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@amstel.ec"
                        required
                    />

                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    {error && <p style={{ color: 'var(--error)', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>}

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        Entrar al Sistema
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
