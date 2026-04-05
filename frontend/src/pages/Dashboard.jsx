// frontend/src/pages/Dashboard.jsx
import '../dashboard.css';
import React, { useEffect, useState, useCallback } from 'react';
import {
    Users, UserCheck, Camera, Play, MousePointer2, Clock,
    TrendingUp, BarChart3, PieChart as PieIcon, MapPin,
    Monitor, Smartphone, Tablet, Calendar, RefreshCw, Video
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../services/api';

// ─── DATE PRESETS ───────────────────────────────
const getPresetDates = (preset) => {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    let from;

    switch (preset) {
        case 'today':
            from = to;
            break;
        case '7d':
            from = new Date(today - 7 * 86400000).toISOString().split('T')[0];
            break;
        case '30d':
            from = new Date(today - 30 * 86400000).toISOString().split('T')[0];
            break;
        case 'all':
            from = '2025-01-01';
            break;
        default:
            from = new Date(today - 30 * 86400000).toISOString().split('T')[0];
    }
    return { from, to };
};

// ─── COLORS ─────────────────────────────────────
const COLORS = {
    primary: '#E31E24',
    gold: '#C8A951',
    blue: '#4834d4',
    purple: '#6c5ce7',
    green: '#00b894',
    orange: '#f0932b',
    teal: '#00cec9',
    pink: '#fd79a8',
};

const DEVICE_COLORS = ['#4834d4', '#00b894', '#f0932b'];
const EVENT_COLORS = ['#E31E24', '#C8A951', '#4834d4', '#00b894', '#6c5ce7', '#f0932b', '#00cec9', '#fd79a8', '#636e72', '#d63031', '#0984e3', '#e17055', '#a29bfe'];

const EVENT_LABELS = {
    page_view: 'Page Views',
    age_gate_pass: 'Age Gate ✓',
    age_gate_fail: 'Age Gate ✗',
    ar_start: 'AR Iniciado',
    target_detected: 'Marker Detectado',
    target_lost: 'Marker Perdido',
    video_started: 'Video AR Iniciado',
    video_completed: 'Video AR Completo',
    cta_click: 'Click en CTA',
    tournament_video_play: 'Video Landing',
    store_search: 'Búsqueda Tienda',
    error: 'Error',
    animation_started: 'Animación Inicio',
    animation_completed: 'Animación Completa'
};

// ─── FORMAT HELPERS ─────────────────────────────
const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toLocaleString() ?? '0';
};

const formatDateShort = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
};

// ─── CUSTOM TOOLTIP ──────────────────────────────
const ChartTooltip = ({ active, payload, label, formatter }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="dash-tooltip">
            <p className="dash-tooltip-label">{formatter ? formatter(label) : label}</p>
            {payload.map((entry, i) => (
                <p key={i} style={{ color: entry.color, margin: '2px 0', fontSize: '0.82rem' }}>
                    {entry.name}: <strong>{entry.value}</strong>
                </p>
            ))}
        </div>
    );
};

// ─── SKELETON LOADER ─────────────────────────────
const Skeleton = ({ height = 200 }) => (
    <div className="dash-skeleton" style={{ height }} />
);

// ─── MAIN COMPONENT ─────────────────────────────
const Dashboard = () => {
    const [activePreset, setActivePreset] = useState('30d');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [stats, setStats] = useState(null);
    const [sessionsChart, setSessionsChart] = useState([]);
    const [eventsBreakdown, setEventsBreakdown] = useState([]);
    const [deviceDist, setDeviceDist] = useState([]);
    const [topContent, setTopContent] = useState({ top_videos: [], stadium_detections: [], top_cities: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboardData = useCallback(async (from, to) => {
        setLoading(true);
        setError(null);
        const params = { date_from: from, date_to: to };

        try {
            const [statsRes, chartRes, eventsRes, deviceRes, contentRes] = await Promise.all([
                api.get('/admin/dashboard/stats', { params }),
                api.get('/admin/dashboard/sessions-chart', { params }),
                api.get('/admin/dashboard/events-breakdown', { params }),
                api.get('/admin/dashboard/device-distribution', { params }),
                api.get('/admin/dashboard/top-content', { params }),
            ]);

            setStats(statsRes.data);
            setSessionsChart(chartRes.data);
            setEventsBreakdown(eventsRes.data);
            setDeviceDist(deviceRes.data);
            setTopContent(contentRes.data);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError('Error al cargar los datos del dashboard');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        const { from, to } = getPresetDates('30d');
        setDateFrom(from);
        setDateTo(to);
        fetchDashboardData(from, to);
    }, [fetchDashboardData]);

    const handlePreset = (preset) => {
        setActivePreset(preset);
        const { from, to } = getPresetDates(preset);
        setDateFrom(from);
        setDateTo(to);
        fetchDashboardData(from, to);
    };

    const handleCustomDate = () => {
        if (dateFrom && dateTo) {
            setActivePreset('custom');
            fetchDashboardData(dateFrom, dateTo);
        }
    };

    // ─── KPI CONFIG ──────────────────────────────
    const kpiCards = stats ? [
        { label: 'Sesiones Totales', value: formatNumber(stats.total_sessions), icon: <Users size={22} />, color: COLORS.blue },
        { label: 'Usuarios Únicos', value: formatNumber(stats.unique_users), icon: <UserCheck size={22} />, color: COLORS.purple },
        { label: 'Detecciones AR', value: formatNumber(stats.total_ar_detections), icon: <Camera size={22} />, color: COLORS.primary },
        { label: 'Videos Reproducidos', value: formatNumber(stats.total_videos_played), icon: <Play size={22} />, color: COLORS.green },
        { label: 'Duración Landing', value: formatDuration(stats.avg_duration_web), icon: <Clock size={22} />, color: COLORS.orange },
        { label: 'Duración WebAR', value: formatDuration(stats.avg_duration_webar), icon: <Clock size={22} />, color: COLORS.teal },
    ] : [];

    // ─── DEVICE ICON HELPER ──────────────────────
    const deviceIcon = (type) => {
        switch (type) {
            case 'mobile': return <Smartphone size={14} />;
            case 'desktop': return <Monitor size={14} />;
            case 'tablet': return <Tablet size={14} />;
            default: return <Monitor size={14} />;
        }
    };

    return (
        <div className="dash-container">
            {/* ─── HEADER ─── */}
            <div className="dash-header">
                <div>
                    <h1>Dashboard de Métricas</h1>
                    <p>Amstel WebAR — Métricas de Landing y Realidad Aumentada</p>
                </div>
                <button className="dash-refresh-btn" onClick={() => fetchDashboardData(dateFrom, dateTo)} title="Refrescar">
                    <RefreshCw size={16} className={loading ? 'spin' : ''} />
                </button>
            </div>

            {/* ─── DATE FILTERS ─── */}
            <div className="dash-filters">
                <div className="dash-presets">
                    {[
                        { key: 'today', label: 'Hoy' },
                        { key: '7d', label: '7 días' },
                        { key: '30d', label: '30 días' },
                        { key: 'all', label: 'Todo' },
                    ].map(p => (
                        <button
                            key={p.key}
                            className={`dash-preset-btn ${activePreset === p.key ? 'active' : ''}`}
                            onClick={() => handlePreset(p.key)}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="dash-custom-date">
                    <Calendar size={14} />
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    <span>—</span>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    <button className="dash-apply-btn" onClick={handleCustomDate}>Aplicar</button>
                </div>
            </div>

            {error && <div className="dash-error">{error}</div>}

            {/* ─── KPI CARDS ─── */}
            <div className="dash-kpi-grid">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={90} />)
                ) : (
                    kpiCards.map((kpi, i) => (
                        <div key={i} className="dash-kpi-card">
                            <div className="dash-kpi-icon" style={{ background: `${kpi.color}12`, color: kpi.color }}>
                                {kpi.icon}
                            </div>
                            <div className="dash-kpi-info">
                                <span className="dash-kpi-label">{kpi.label}</span>
                                <span className="dash-kpi-value">{kpi.value}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ─── SESSIONS CHART ─── */}
            <div className="dash-section">
                <div className="dash-section-header">
                    <TrendingUp size={18} />
                    <h2>Sesiones por Día</h2>
                </div>
                <div className="card dash-chart-card">
                    {loading ? <Skeleton height={280} /> : sessionsChart.length === 0 ? (
                        <div className="dash-empty">No hay datos para este período</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={sessionsChart} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorWeb" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorWebar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatDateShort} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip content={<ChartTooltip formatter={formatDateShort} />} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.82rem' }} />
                                <Area type="monotone" dataKey="web" name="Landing Web" stroke={COLORS.blue} fill="url(#colorWeb)" strokeWidth={2} />
                                <Area type="monotone" dataKey="webar" name="WebAR" stroke={COLORS.primary} fill="url(#colorWebar)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ─── EVENTS + DEVICES ROW ─── */}
            <div className="dash-two-col">
                {/* Events Breakdown */}
                <div className="dash-section">
                    <div className="dash-section-header">
                        <BarChart3 size={18} />
                        <h2>Eventos por Tipo</h2>
                    </div>
                    <div className="card dash-chart-card">
                        {loading ? <Skeleton height={320} /> : eventsBreakdown.length === 0 ? (
                            <div className="dash-empty">No hay datos</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={Math.max(320, eventsBreakdown.length * 36)}>
                                <BarChart data={eventsBreakdown} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <YAxis
                                        dataKey="event_type"
                                        type="category"
                                        tick={{ fontSize: 10.5 }}
                                        width={120}
                                        tickFormatter={(v) => EVENT_LABELS[v] || v}
                                    />
                                    <Tooltip
                                        formatter={(val, name, props) => [val, EVENT_LABELS[props.payload.event_type] || props.payload.event_type]}
                                        contentStyle={{ fontSize: '0.82rem' }}
                                    />
                                    <Bar dataKey="count" name="Eventos" radius={[0, 4, 4, 0]}>
                                        {eventsBreakdown.map((_, i) => (
                                            <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Device Distribution */}
                <div className="dash-section">
                    <div className="dash-section-header">
                        <PieIcon size={18} />
                        <h2>Dispositivos</h2>
                    </div>
                    <div className="card dash-chart-card">
                        {loading ? <Skeleton height={320} /> : deviceDist.length === 0 ? (
                            <div className="dash-empty">No hay datos</div>
                        ) : (
                            <div>
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie
                                            data={deviceDist}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={90}
                                            paddingAngle={4}
                                            dataKey="count"
                                            nameKey="device_type"
                                        >
                                            {deviceDist.map((_, i) => (
                                                <Cell key={i} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ fontSize: '0.82rem' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="dash-device-legend">
                                    {deviceDist.map((d, i) => {
                                        const total = deviceDist.reduce((s, x) => s + x.count, 0);
                                        const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : 0;
                                        return (
                                            <div key={i} className="dash-device-item">
                                                <span className="dash-device-dot" style={{ background: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                                                {deviceIcon(d.device_type)}
                                                <span className="dash-device-label">{d.device_type}</span>
                                                <span className="dash-device-count">{d.count}</span>
                                                <span className="dash-device-pct">{pct}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── TOP CONTENT ROW ─── */}
            <div className="dash-two-col">
                {/* Top Videos */}
                <div className="dash-section">
                    <div className="dash-section-header">
                        <Video size={18} />
                        <h2>Top Videos</h2>
                    </div>
                    <div className="card dash-chart-card">
                        {loading ? <Skeleton height={200} /> :
                            topContent.top_videos?.length === 0 ? (
                                <div className="dash-empty">No hay datos de videos</div>
                            ) : (
                                <table className="dash-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Video</th>
                                            <th>Reproducciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topContent.top_videos?.map((v, i) => (
                                            <tr key={i}>
                                                <td className="dash-table-rank">{i + 1}</td>
                                                <td>{v.video_title}</td>
                                                <td className="dash-table-count">{v.play_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                    </div>
                </div>

                {/* Top Cities */}
                <div className="dash-section">
                    <div className="dash-section-header">
                        <MapPin size={18} />
                        <h2>Ciudades</h2>
                    </div>
                    <div className="card dash-chart-card">
                        {loading ? <Skeleton height={200} /> :
                            topContent.top_cities?.length === 0 ? (
                                <div className="dash-empty">No hay datos geográficos</div>
                            ) : (
                                <div className="dash-cities-list">
                                    {topContent.top_cities?.map((c, i) => {
                                        const max = topContent.top_cities[0]?.session_count || 1;
                                        const pct = (c.session_count / max) * 100;
                                        return (
                                            <div key={i} className="dash-city-row">
                                                <div className="dash-city-info">
                                                    <span className="dash-city-name">{c.city}</span>
                                                    <span className="dash-city-count">{c.session_count}</span>
                                                </div>
                                                <div className="dash-city-bar-bg">
                                                    <div className="dash-city-bar" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                    </div>
                </div>
            </div>

            {/* ─── AR DETECTIONS BY STADIUM ─── */}
            {topContent.stadium_detections?.length > 0 && (
                <div className="dash-section">
                    <div className="dash-section-header">
                        <Camera size={18} />
                        <h2>Escaneos WebAR por Marker</h2>
                    </div>
                    <div className="card dash-chart-card">
                        {loading ? <Skeleton height={220} /> : (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={topContent.stadium_detections} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="stadium_name" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ fontSize: '0.82rem' }} />
                                    <Bar dataKey="detection_count" name="Escaneos" radius={[6, 6, 0, 0]}>
                                        {topContent.stadium_detections.map((_, i) => (
                                            <Cell key={i} fill={[COLORS.primary, COLORS.gold, COLORS.blue, COLORS.green][i % 4]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
