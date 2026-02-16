// frontend/src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Settings, LogOut, Layout } from 'lucide-react';

const Sidebar = ({ handleLogout }) => {
    return (
        <div className="sidebar">
            <div style={{ marginBottom: '3rem', paddingLeft: '1rem' }}>
                <h2 style={{ color: 'var(--primary)', letterSpacing: '1px' }}>AMSTEL</h2>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>ECOSISTEMA AR</span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <NavLink
                    to="/"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    style={navStyle}
                >
                    <BarChart3 size={20} /> Dashboard
                </NavLink>

                <NavLink
                    to="/cms"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    style={navStyle}
                >
                    <Settings size={20} /> Contenido AR
                </NavLink>

                <NavLink
                    to="/tournaments"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    style={navStyle}
                >
                    <Layout size={20} /> Torneos y Videos
                </NavLink>

                <NavLink
                    to="/locations"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    style={navStyle}
                >
                    <Settings size={20} /> Puntos de Venta
                </NavLink>
            </nav>

            <div style={{ position: 'absolute', bottom: '2rem', width: 'calc(100% - 2rem)' }}>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'transparent',
                        color: 'white',
                        opacity: 0.7,
                        padding: '1rem'
                    }}
                >
                    <LogOut size={20} /> Salir
                </button>
            </div>
        </div>
    );
};

const navStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    color: 'white',
    textDecoration: 'none',
    borderRadius: 'var(--radius-md)',
    transition: 'all 0.2s',
    fontWeight: '500'
};

export default Sidebar;
