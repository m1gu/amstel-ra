// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CMS from './pages/CMS';
import TournamentManager from './pages/TournamentManager';
import LocationManager from './pages/LocationManager';
import Landing from './pages/Landing';
import Sidebar from './components/Sidebar';

// Componente para proteger rutas administrativas
const ProtectedRoute = ({ token, children }) => {
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Layout para el panel administrativo
const AdminLayout = ({ handleLogout, children }) => (
  <div className="app-layout">
    <Sidebar handleLogout={handleLogout} />
    <main className="main-content">
      {children}
    </main>
  </div>
);

function App() {
  const [token, setToken] = useState(localStorage.getItem('amstel_token'));

  const handleLogout = () => {
    localStorage.removeItem('amstel_token');
    setToken(null);
  };

  return (
    <BrowserRouter basename="/vasodelahistoria">
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login setToken={setToken} />} />

        {/* Rutas Administrativas Protegidas */}
        <Route path="/admin/*" element={
          <ProtectedRoute token={token}>
            <AdminLayout handleLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/cms" element={<CMS />} />
                <Route path="/tournaments" element={<TournamentManager />} />
                <Route path="/locations" element={<LocationManager />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
