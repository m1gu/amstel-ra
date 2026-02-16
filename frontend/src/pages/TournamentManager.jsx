// frontend/src/pages/TournamentManager.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    ChevronRight,
    Plus,
    Edit2,
    Trash2,
    Video,
    Trophy,
    ArrowLeft,
    Calendar,
    Layers
} from 'lucide-react';

const TournamentManager = () => {
    // Estados para la navegación
    const [view, setView] = useState('years'); // 'years', 'phases', 'videos', 'final'
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedPhase, setSelectedPhase] = useState(null);

    // Estados para los datos
    const [tournaments, setTournaments] = useState([]);
    const [phases, setPhases] = useState([]);
    const [videos, setVideos] = useState([]);
    const [finalData, setFinalData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (view === 'years') fetchTournaments();
        if (view === 'phases' && selectedYear) fetchPhases(selectedYear.year);
        if (view === 'videos' && selectedPhase) fetchVideos(selectedPhase.slug);
        if (view === 'final' && selectedYear) fetchFinalData(selectedYear.year);
    }, [view, selectedYear, selectedPhase]);

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const resp = await api.get('/tournaments');
            setTournaments(resp.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchPhases = async (year) => {
        setLoading(true);
        try {
            const resp = await api.get(`/tournaments/${year}/phases`);
            setPhases(resp.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchVideos = async (slug) => {
        setLoading(true);
        try {
            const resp = await api.get(`/tournaments/phases/${slug}/videos`);
            setVideos(resp.data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const fetchFinalData = async (year) => {
        setLoading(true);
        try {
            const resp = await api.get(`/tournaments/${year}/final`);
            setFinalData(resp.data);
        } catch (err) {
            console.error(err);
            setFinalData({ tournament_id: selectedYear.id, team_home_name: '', team_away_name: '' });
        }
        setLoading(false);
    };

    // --- RENDERERS ---

    const renderYears = () => (
        <div className="grid-container">
            {tournaments.map(t => (
                <div key={t.id} className="card interactive" onClick={() => { setSelectedYear(t); setView('phases'); }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{t.year}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.name}</p>
                        </div>
                        <ChevronRight color="var(--primary)" />
                    </div>
                </div>
            ))}
            <div className="card add-card">
                <Plus size={32} />
                <span>Nuevo Campeonato</span>
            </div>
        </div>
    );

    const renderPhases = () => (
        <div>
            <div className="breadcrumb" onClick={() => setView('years')}>
                <ArrowLeft size={16} /> Volver a Torneos
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1>Campeonato {selectedYear.year}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gestión de fases y final</p>
                </div>
                <button className="btn-secondary" onClick={() => setView('final')}>
                    <Trophy size={18} /> Datos de la Final
                </button>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f9fafb' }}>
                        <tr>
                            <th style={thStyle}>Fase</th>
                            <th style={thStyle}>Tipo</th>
                            <th style={thStyle}>Acceso</th>
                            <th style={thStyle}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {phases.map(p => (
                            <tr key={p.id} style={{ borderTop: '1px solid var(--border)' }}>
                                <td style={tdStyle}><strong>{p.name}</strong></td>
                                <td style={tdStyle}><span className="badge">{p.phase_type}</span></td>
                                <td style={tdStyle}>{p.is_unlocked ? '🔓 Abierto' : '🔒 Bloqueado'}</td>
                                <td style={tdStyle}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="icon-btn" onClick={() => { setSelectedPhase(p); setView('videos'); }}>
                                            <Video size={16} /> Videos
                                        </button>
                                        <button className="icon-btn"><Edit2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderVideos = () => (
        <div>
            <div className="breadcrumb" onClick={() => setView('phases')}>
                <ArrowLeft size={16} /> Volver a Fases - {selectedYear.year}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Videos: {selectedPhase.name}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Malla de contenidos multimedia</p>
                </div>
                <button className="btn-primary">
                    <Plus size={18} /> Añadir Video
                </button>
            </div>

            <div className="grid-container">
                {videos.map(v => (
                    <div key={v.id} className="card video-card">
                        <img src={v.thumbnail_url || 'https://via.placeholder.com/320x180'} alt={v.title} />
                        <div style={{ padding: '1rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0' }}>{v.title}</h4>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span>{v.video_type}</span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Edit2 size={14} style={{ cursor: 'pointer' }} />
                                    <Trash2 size={14} style={{ cursor: 'pointer', color: 'red' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading && view === 'years') return <p>Cargando campeonatos...</p>;

    return (
        <div className="tournament-manager">
            {view === 'years' && renderYears()}
            {view === 'phases' && renderPhases()}
            {view === 'videos' && renderVideos()}
            {view === 'final' && (
                <div>
                    <div className="breadcrumb" onClick={() => setView('phases')}>
                        <ArrowLeft size={16} /> Volver a Fases
                    </div>
                    <h1>Datos de la Final {selectedYear.year}</h1>
                    <div className="card" style={{ maxWidth: '600px', marginTop: '2rem' }}>
                        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label>Equipo Local</label>
                                <input type="text" value={finalData?.team_home_name} />
                            </div>
                            <div className="form-group">
                                <label>Equipo Visitante</label>
                                <input type="text" value={finalData?.team_away_name} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Goles Local</label>
                                    <input type="number" value={finalData?.score_home} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Goles Visitante</label>
                                    <input type="number" value={finalData?.score_away} />
                                </div>
                            </div>
                            <button type="button" className="btn-primary">Guardar Cambios</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const thStyle = { padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'left' };
const tdStyle = { padding: '1.2rem 1.5rem', fontSize: '0.95rem' };

export default TournamentManager;
