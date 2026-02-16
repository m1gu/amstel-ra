// frontend/src/pages/Dashboard.jsx
import React from 'react';
import { Users, MousePointer2, Clock, Camera } from 'lucide-react';

const Dashboard = () => {
    const stats = [
        { label: 'Sesiones Totales', value: '1,284', icon: <Users />, color: '#4834d4' },
        { label: 'Detecciones AR', value: '856', icon: <Camera />, color: 'var(--primary)' },
        { label: 'Clics en CTA', value: '312', icon: <MousePointer2 />, color: '#6ab04c' },
        { label: 'Tiempo Promedio', value: '4m 12s', icon: <Clock />, color: '#f0932b' },
    ];

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem' }}>Dashboard de Métricas</h1>
                <p style={{ color: 'var(--text-muted)' }}>Bienvenido al panel de control de Amstel WebAR</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
            }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            background: `${stat.color}15`,
                            color: stat.color,
                            padding: '1rem',
                            borderRadius: '12px',
                            display: 'flex'
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card" style={{ height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <p style={{ color: 'var(--text-muted)' }}>[ Gráfico de Actividad Semanal - Recharts ]</p>
            </div>
        </div>
    );
};

export default Dashboard;
