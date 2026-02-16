// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CMS from './pages/CMS';
import TournamentManager from './pages/TournamentManager';
import LocationManager from './pages/LocationManager';
import Sidebar from './components/Sidebar';

function App() {
  const [token, setToken] = useState(localStorage.getItem('amstel_token'));

  const handleLogout = () => {
    localStorage.removeItem('amstel_token');
    setToken(null);
  };

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar handleLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cms" element={<CMS />} />
            <Route path="/tournaments" element={<TournamentManager />} />
            <Route path="/locations" element={<LocationManager />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
