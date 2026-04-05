// frontend/src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Trophy, LogOut } from 'lucide-react';

const Sidebar = ({ handleLogout }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-brand">AMSTEL</h2>
                <span className="sidebar-subtitle">Panel de Control</span>
            </div>

            <nav className="sidebar-nav">
                <NavLink
                    to="/admin"
                    end
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                    <BarChart3 size={20} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink
                    to="/admin/tournaments"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                    <Trophy size={20} />
                    <span>Videos</span>
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleLogout} className="sidebar-logout">
                    <LogOut size={18} />
                    <span>Cerrar Sesion</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
