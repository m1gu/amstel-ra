// frontend/src/pages/LocationManager.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    MapPin,
    Upload,
    Filter
} from 'lucide-react';

const LocationManager = () => {
    const [locations, setLocations] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCities();
    }, []);

    useEffect(() => {
        if (selectedCity) {
            fetchLocations(selectedCity);
        } else {
            setLocations([]);
            setLoading(false);
        }
    }, [selectedCity]);

    const fetchCities = async () => {
        try {
            const resp = await api.get('/locations/cities');
            setCities(resp.data);
            if (resp.data.length > 0) setSelectedCity(resp.data[0]);
        } catch (err) { console.error(err); }
    };

    const fetchLocations = async (city) => {
        setLoading(true);
        try {
            const resp = await api.get(`/locations?city=${city}`);
            setLocations(resp.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Puntos de Venta</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gestiona los lugares donde conseguir el vaso</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Upload size={18} /> Importar Datos (CSV)
                    </button>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Nuevo Local
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Filter size={20} color="var(--primary)" />
                    <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        style={{
                            padding: '0.6rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border)',
                            flex: 1
                        }}
                    >
                        <option value="">Selecciona una ciudad...</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div style={{ position: 'relative', flex: 2 }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o dirección..."
                            style={{
                                padding: '0.6rem 1rem 0.6rem 3rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)',
                                width: '100%'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr>
                            <th style={thStyle}>Local / Cadena</th>
                            <th style={thStyle}>Dirección</th>
                            <th style={thStyle}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center' }}>Cargando locales...</td></tr>
                        ) : locations.length === 0 ? (
                            <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center' }}>No hay locales registrados en esta ciudad.</td></tr>
                        ) : locations.map(loc => (
                            <tr key={loc.id} style={{ borderTop: '1px solid var(--border)' }}>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                        <div style={{ background: '#FEE2E2', padding: '0.5rem', borderRadius: '50%' }}>
                                            <MapPin size={16} color="#E31E24" />
                                        </div>
                                        <strong>{loc.store_name}</strong>
                                    </div>
                                </td>
                                <td style={tdStyle}>{loc.address}</td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="icon-btn"><Edit2 size={14} /></button>
                                        <button className="icon-btn" style={{ color: 'red' }}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const thStyle = { padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'left' };
const tdStyle = { padding: '1.2rem 1.5rem', fontSize: '0.95rem' };

export default LocationManager;
