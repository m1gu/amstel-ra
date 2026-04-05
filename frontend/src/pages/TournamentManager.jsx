import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import {
    ArrowLeft,
    ChevronRight,
    Edit2,
    Plus,
    Trash2,
    Video
} from 'lucide-react';

const emptyVideoForm = {
    phase_id: '',
    sub_phase: '',
    title: '',
    video_url: '',
    thumbnail_url: '',
    video_type: 'highlights',
    team_home: '',
    team_away: '',
    display_order: 0,
    is_active: 1
};

const TournamentManager = () => {
    const [view, setView] = useState('years'); // years | phases | videos
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedPhase, setSelectedPhase] = useState(null);

    const [tournaments, setTournaments] = useState([]);
    const [phases, setPhases] = useState([]);
    const [videos, setVideos] = useState([]);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    const [videoForm, setVideoForm] = useState(emptyVideoForm);

    useEffect(() => {
        if (view === 'years') fetchTournaments();
        if (view === 'phases' && selectedYear) fetchPhases(selectedYear.id);
        if (view === 'videos' && selectedPhase) fetchVideos(selectedPhase.slug);
    }, [view, selectedYear, selectedPhase]);

    const shouldHidePhase = (phaseName) => {
        const normalized = String(phaseName || '')
            .toUpperCase()
            .replace(/\s+/g, ' ')
            .trim();
        return normalized === 'FASE 1' || normalized === 'FASE 2' || normalized === 'FASE 3';
    };

    const visiblePhases = useMemo(() => phases.filter((phase) => !shouldHidePhase(phase.name)), [phases]);

    const phaseOptions = useMemo(() => {
        return visiblePhases.map((phase) => ({ value: String(phase.id), label: phase.name }));
    }, [visiblePhases]);

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const resp = await api.get('/tournaments');
            setTournaments(Array.isArray(resp.data) ? resp.data : []);
        } catch (err) {
            console.error(err);
            setTournaments([]);
        }
        setLoading(false);
    };

    const fetchPhases = async (tournamentId) => {
        setLoading(true);
        try {
            const resp = await api.get(`/tournaments/${tournamentId}/phases`);
            setPhases(Array.isArray(resp.data) ? resp.data : []);
        } catch (err) {
            console.error(err);
            setPhases([]);
        }
        setLoading(false);
    };

    const fetchVideos = async (phaseSlug) => {
        setLoading(true);
        try {
            const resp = await api.get(`/tournaments/phases/${phaseSlug}/videos`);
            setVideos(Array.isArray(resp.data) ? resp.data : []);
        } catch (err) {
            console.error(err);
            setVideos([]);
        }
        setLoading(false);
    };

    const openCreateVideo = () => {
        setEditingVideo(null);
        setVideoForm({
            ...emptyVideoForm,
            phase_id: selectedPhase ? String(selectedPhase.id) : '',
            is_active: 1
        });
        setIsFormOpen(true);
    };

    const openEditVideo = (video) => {
        setEditingVideo(video);
        setVideoForm({
            phase_id: String(video.phase_id ?? selectedPhase?.id ?? ''),
            sub_phase: video.sub_phase ?? '',
            title: video.title ?? '',
            video_url: video.video_url ?? '',
            thumbnail_url: video.thumbnail_url ?? '',
            video_type: video.video_type ?? 'highlights',
            team_home: video.team_home ?? '',
            team_away: video.team_away ?? '',
            display_order: Number(video.display_order ?? 0),
            is_active: Number(video.is_active ?? 1)
        });
        setIsFormOpen(true);
    };

    const closeVideoForm = () => {
        setIsFormOpen(false);
        setEditingVideo(null);
        setVideoForm(emptyVideoForm);
    };

    const handleVideoFieldChange = (field, value) => {
        setVideoForm((prev) => ({ ...prev, [field]: value }));
    };

    const buildVideoPayload = () => ({
        phase_id: Number(videoForm.phase_id),
        sub_phase: videoForm.sub_phase.trim() || null,
        title: videoForm.title.trim(),
        video_url: videoForm.video_url.trim(),
        thumbnail_url: videoForm.thumbnail_url.trim() || null,
        video_type: (videoForm.video_type || 'highlights').trim(),
        team_home: videoForm.team_home.trim() || null,
        team_away: videoForm.team_away.trim() || null,
        display_order: Number(videoForm.display_order || 0),
        is_active: Number(videoForm.is_active ? 1 : 0)
    });

    const handleSaveVideo = async (e) => {
        e.preventDefault();

        if (!videoForm.phase_id || !videoForm.title.trim() || !videoForm.video_url.trim()) {
            alert('Completa los campos obligatorios: fase, titulo y video URL.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = buildVideoPayload();

            if (editingVideo) {
                await api.put(`/admin/videos/${editingVideo.id}`, payload);
            } else {
                await api.post('/admin/videos', payload);
            }

            await fetchVideos(selectedPhase.slug);
            closeVideoForm();
        } catch (err) {
            console.error(err);
            alert('No se pudo guardar el video. Revisa los datos e intenta nuevamente.');
        }
        setSubmitting(false);
    };

    const handleDeleteVideo = async (video) => {
        const confirmDelete = window.confirm(`Deseas eliminar el video "${video.title}"?`);
        if (!confirmDelete) return;

        setSubmitting(true);
        try {
            await api.delete(`/admin/videos/${video.id}`);
            await fetchVideos(selectedPhase.slug);
        } catch (err) {
            console.error(err);
            alert('No se pudo eliminar el video.');
        }
        setSubmitting(false);
    };

    const renderYears = () => {
        if (loading) return <p>Cargando campeonatos...</p>;

        return (
            <div className="grid-container">
                {tournaments.map((tournament) => (
                    <div
                        key={tournament.id}
                        className="card interactive"
                        onClick={() => {
                            setSelectedYear(tournament);
                            setSelectedPhase(null);
                            setView('phases');
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{tournament.year}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{tournament.name}</p>
                            </div>
                            <ChevronRight color="var(--primary)" />
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderPhases = () => {
        return (
            <div>
                <div className="breadcrumb" onClick={() => setView('years')}>
                    <ArrowLeft size={16} /> Volver a Torneos
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <h1>Campeonato {selectedYear?.year}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Selecciona una fase para gestionar sus videos</p>
                </div>

                <div className="card" style={{ padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={thStyle}>Fase</th>
                                <th style={thStyle}>Tipo</th>
                                <th style={thStyle}>Videos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="3" style={{ padding: '1.2rem 1.5rem' }}>Cargando fases...</td>
                                </tr>
                            ) : visiblePhases.length === 0 ? (
                                <tr>
                                    <td colSpan="3" style={{ padding: '1.2rem 1.5rem' }}>No hay fases disponibles.</td>
                                </tr>
                            ) : visiblePhases.map((phase) => (
                                <tr key={phase.id} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td style={tdStyle}><strong>{phase.name}</strong></td>
                                    <td style={tdStyle}>{phase.phase_type}</td>
                                    <td style={tdStyle}>
                                        <button
                                            className="btn-secondary"
                                            onClick={() => {
                                                setSelectedPhase(phase);
                                                setView('videos');
                                            }}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                                        >
                                            <Video size={16} /> Gestionar videos
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderVideos = () => {
        return (
            <div>
                <div className="breadcrumb" onClick={() => setView('phases')}>
                    <ArrowLeft size={16} /> Volver a Fases - {selectedYear?.year}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1>Videos: {selectedPhase?.name}</h1>
                        <p style={{ color: 'var(--text-muted)' }}>CRUD completo de videos</p>
                    </div>
                    <button className="btn-primary" onClick={openCreateVideo}>
                        <Plus size={18} /> Anadir Video
                    </button>
                </div>

                {loading ? (
                    <p>Cargando videos...</p>
                ) : videos.length === 0 ? (
                    <div className="card">
                        <p style={{ margin: 0 }}>No hay videos en esta fase.</p>
                    </div>
                ) : (
                    <div style={videoGridStyle}>
                        {videos.map((video) => (
                            <div key={video.id} className="card video-card">
                                <img
                                    src={video.thumbnail_url || 'https://via.placeholder.com/320x180'}
                                    alt={video.title}
                                    style={videoThumbStyle}
                                />
                                <div style={{ padding: '1rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{video.title}</h4>
                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {video.video_type} | Orden: {video.display_order}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                        <span>{Number(video.is_active) === 1 ? 'Activo' : 'Inactivo'}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="icon-btn" onClick={() => openEditVideo(video)} title="Editar">
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                className="icon-btn"
                                                onClick={() => handleDeleteVideo(video)}
                                                title="Eliminar"
                                                style={{ color: 'red' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isFormOpen && (
                    <div style={modalOverlayStyle}>
                        <div className="card" style={modalBodyStyle}>
                            <h3 style={{ marginTop: 0 }}>{editingVideo ? 'Editar Video' : 'Nuevo Video'}</h3>

                            <form onSubmit={handleSaveVideo} style={{ display: 'grid', gap: '0.8rem' }}>
                                <label style={labelStyle}>Fase</label>
                                <select
                                    value={videoForm.phase_id}
                                    onChange={(e) => handleVideoFieldChange('phase_id', e.target.value)}
                                    required
                                    style={inputStyle}
                                >
                                    <option value="">Selecciona una fase</option>
                                    {phaseOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>

                                <label style={labelStyle}>Titulo</label>
                                <input
                                    value={videoForm.title}
                                    onChange={(e) => handleVideoFieldChange('title', e.target.value)}
                                    required
                                    style={inputStyle}
                                />

                                <label style={labelStyle}>Video URL</label>
                                <input
                                    value={videoForm.video_url}
                                    onChange={(e) => handleVideoFieldChange('video_url', e.target.value)}
                                    required
                                    style={inputStyle}
                                />

                                <label style={labelStyle}>Thumbnail URL</label>
                                <input
                                    value={videoForm.thumbnail_url}
                                    onChange={(e) => handleVideoFieldChange('thumbnail_url', e.target.value)}
                                    style={inputStyle}
                                />

                                <label style={labelStyle}>Sub fase</label>
                                <input
                                    value={videoForm.sub_phase}
                                    onChange={(e) => handleVideoFieldChange('sub_phase', e.target.value)}
                                    style={inputStyle}
                                />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                    <div>
                                        <label style={labelStyle}>Tipo de video</label>
                                        <input
                                            value={videoForm.video_type}
                                            onChange={(e) => handleVideoFieldChange('video_type', e.target.value)}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Orden</label>
                                        <input
                                            type="number"
                                            value={videoForm.display_order}
                                            onChange={(e) => handleVideoFieldChange('display_order', e.target.value)}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                                    <div>
                                        <label style={labelStyle}>Equipo local</label>
                                        <input
                                            value={videoForm.team_home}
                                            onChange={(e) => handleVideoFieldChange('team_home', e.target.value)}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Equipo visitante</label>
                                        <input
                                            value={videoForm.team_away}
                                            onChange={(e) => handleVideoFieldChange('team_away', e.target.value)}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={Number(videoForm.is_active) === 1}
                                        onChange={(e) => handleVideoFieldChange('is_active', e.target.checked ? 1 : 0)}
                                    />
                                    Activo
                                </label>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                                    <button type="button" className="btn-secondary" onClick={closeVideoForm} disabled={submitting}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={submitting}>
                                        {submitting ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="tournament-manager">
            {view === 'years' && renderYears()}
            {view === 'phases' && renderPhases()}
            {view === 'videos' && renderVideos()}
        </div>
    );
};

const thStyle = {
    padding: '1rem 1.5rem',
    fontWeight: '600',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    textAlign: 'left'
};

const tdStyle = {
    padding: '1.2rem 1.5rem',
    fontSize: '0.95rem'
};

const modalOverlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '1rem'
};

const modalBodyStyle = {
    width: '100%',
    maxWidth: '640px',
    maxHeight: '90vh',
    overflowY: 'auto'
};

const labelStyle = {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-muted)'
};

const inputStyle = {
    width: '100%',
    padding: '0.55rem 0.75rem',
    borderRadius: '0.5rem',
    border: '1px solid var(--border)',
    fontSize: '0.95rem'
};

const videoGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1rem'
};

const videoThumbStyle = {
    width: '100%',
    aspectRatio: '16 / 9',
    objectFit: 'cover',
    borderRadius: '8px',
    display: 'block'
};

export default TournamentManager;
