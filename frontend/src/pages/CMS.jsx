// frontend/src/pages/CMS.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Edit2, Eye, Plus } from 'lucide-react';

const CMS = () => {
    const [stadiums, setStadiums] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStadiums();
    }, []);

    const fetchStadiums = async () => {
        try {
            const resp = await api.get('/stadiums');
            setStadiums(resp.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem' }}>Gestión de Estadios</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Administra los contenidos de Realidad Aumentada</p>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> Nuevo Estadio
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F9FAFB' }}>
                        <tr>
                            <th style={thStyle}>Nombre del Estadio</th>
                            <th style={thStyle}>Slug</th>
                            <th style={thStyle}>Estado</th>
                            <th style={thStyle}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center' }}>Cargando estadios...</td></tr>
                        ) : stadiums.map((s) => (
                            <tr key={s.id} style={{ borderTop: '1px solid var(--border)' }}>
                                <td style={tdStyle}><strong>{s.name}</strong></td>
                                <td style={tdStyle}><code>{s.slug}</code></td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        background: s.is_active ? '#E3F9E5' : '#FFEBEB',
                                        color: s.is_active ? '#1DB442' : '#E31E24'
                                    }}>
                                        {s.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                                        <button style={actionBtnStyle} title="Editar"><Edit2 size={16} /></button>
                                        <button style={actionBtnStyle} title="Ver AR"><Eye size={16} /></button>
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

const thStyle = { padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-muted)' };
const tdStyle = { padding: '1.2rem 1.5rem' };
const actionBtnStyle = { background: 'white', border: '1px solid var(--border)', padding: '0.5rem', color: 'var(--text-muted)' };

export default CMS;
