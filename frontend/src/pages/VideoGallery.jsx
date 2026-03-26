import React, { useEffect, useState } from 'react';
import { Play, Users } from 'lucide-react';
import api from '../services/api';

import lineasSuperior from '../assets/images/lineas-doradas-superior.png';
import titulo3 from '../assets/images/titulo3.png';
import thumbnailPartido from '../assets/images/thumbnail-partido.png';
import logosComposite from '../assets/images/logos.png';
import fondoRojo from '../assets/images/fondo-rojo.png';

import escudoFlamengo from '../assets/images/escudo-flamengo.png';
import escudoPalmeiras from '../assets/images/escudo-palmeiras.png';
import iconoEstadioBig from '../assets/images/icono-estadio-big.png';
import iconoEstadioSmall from '../assets/images/icono-estadio-small.png';

const pcCircleImg = `${import.meta.env.BASE_URL}assets/images/pc-golden-circle.png`;
const pcSideLineLeftImg = `${import.meta.env.BASE_URL}assets/images/pc-lineadorada-izquierda.png`;
const pcSideLineRightImg = `${import.meta.env.BASE_URL}assets/images/pc-lineadorada-derecha.png`;
const pcLogosImg = `${import.meta.env.BASE_URL}assets/images/pc-logos1.png`;

const VideoGallery = ({ onBack }) => {
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState(null);
    const [phases, setPhases] = useState([]);
    const [expandedPhase, setExpandedPhase] = useState(null);
    const [videos, setVideos] = useState([]);
    const [finalData, setFinalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState(null);

    useEffect(() => {
        if (selectedVideo) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedVideo]);

    useEffect(() => {
        document.body.classList.toggle('gallery-active', !selectedVideo);
        return () => {
            document.body.classList.remove('gallery-active');
        };
    }, [selectedVideo]);

    useEffect(() => {
        fetchYears();
    }, []);

    const fetchYears = async () => {
        try {
            const resp = await api.get('/tournaments/years');
            const data = resp.data;
            setYears(data);
            if (data.length > 0) {
                const defaultYear = data.find(y => y.year === 2025) || data[0];
                handleYearSelect(defaultYear);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleYearSelect = async (year) => {
        setSelectedYear(year);
        setLoading(true);
        setExpandedPhase(null);
        setSelectedVideo(null);
        try {
            const phasesResp = await api.get(`/tournaments/${year.id}/phases`);
            setPhases(phasesResp.data);

            const finalResp = await api.get(`/tournaments/${year.id}/final`);
            setFinalData(finalResp.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const togglePhase = async (phase) => {
        if (expandedPhase?.id === phase.id) {
            setExpandedPhase(null);
            return;
        }
        setExpandedPhase(phase);
        if (!phase.is_unlocked) return;

        try {
            const resp = await api.get(`/tournaments/phases/${phase.slug}/videos`);
            setVideos(resp.data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="brand-bg gallery-screen">
            <div className="gallery-red-overlay" />
            <img src={lineasSuperior} alt="" className="lineas-superior gallery-lineas-superior" />
            <img src={pcSideLineLeftImg} alt="" className="gallery-side-line gallery-side-line-left" />
            <img src={pcSideLineRightImg} alt="" className="gallery-side-line gallery-side-line-right" />

            <div className="landing-container gallery-container">
                <div className="gallery-header">
                    <img
                        src={titulo3}
                        alt="Selecciona el año y revive las emociones del campeonato"
                        className="gallery-title-image"
                    />
                    <h2 className="gallery-title-text-desktop">
                        SELECCIONA EL AÑO Y REVIVE LAS EMOCIONES DEL CAMPEONATO
                    </h2>
                </div>

                <div className="gallery-years-wrap">
                    <div className="gallery-years-row">
                        {years.map(y => (
                            <button
                                key={y.id}
                                onClick={() => handleYearSelect(y)}
                                className={`year-btn ${selectedYear?.id === y.id ? 'active' : ''}`}
                            >
                                {y.year}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="gallery-loading">Cargando datos...</div>
                ) : (
                    <div className="gallery-content">
                        {finalData && (
                            <div
                                className="final-video-preview gallery-final-preview"
                                onClick={() => setSelectedVideo({
                                    id: 'final',
                                    title: `FINAL ${selectedYear?.year}`,
                                    video_url: import.meta.env.BASE_URL + 'assets/videos/test-video.mp4',
                                    thumbnail_url: thumbnailPartido,
                                    sub_phase: 'GRAN FINAL'
                                })}
                            >
                                <div className="thumb-container gallery-thumb-container">
                                    <img src={thumbnailPartido} alt="Final Highlights" />
                                    <div className="play-overlay gallery-play-overlay">
                                        <div className="gallery-play-btn">
                                            <Play size={28} fill="white" color="white" />
                                        </div>
                                    </div>

                                    <div className="video-mock-controls">
                                        <div className="controls-left">
                                            <Play size={14} fill="white" />
                                            <div style={{ marginLeft: '10px' }}><Users size={14} /></div>
                                        </div>
                                        <div className="controls-right">
                                            <div style={{ transform: 'rotate(45deg)' }}><Play size={14} /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="gallery-phases">
                            {phases.map(phase => (
                                <div key={phase.id}>
                                    <button
                                        className={`phase-accordion-gallery ${expandedPhase?.id === phase.id ? 'expanded' : ''}`}
                                        onClick={() => togglePhase(phase)}
                                        style={{ opacity: phase.is_unlocked ? 1 : 0.5 }}
                                    >
                                        <span>{phase.name}</span>
                                    </button>

                                    {expandedPhase?.id === phase.id && phase.is_unlocked && (
                                        <div className="video-grid gallery-video-grid">
                                            {videos.length > 0 ? videos.map(v => (
                                                <div key={v.id} className="video-item" onClick={() => setSelectedVideo(v)}>
                                                    <div className="thumb-container">
                                                        <img src={v.thumbnail_url || '/assets/images/thumbnail-generic.jpg'} alt={v.title} />
                                                        <div className="play-overlay">
                                                            <Play size={24} fill="white" />
                                                        </div>
                                                    </div>
                                                    <div style={{ padding: '0.5rem' }}>
                                                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{v.title}</p>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--amstel-gold)' }}>{v.video_type}</span>
                                                    </div>
                                                </div>
                                            )) : <p className="gallery-empty">No hay videos cargados aun.</p>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {!selectedVideo && (
                <>
                    <div className="gallery-footer">
                        <div className="gallery-footer-top">
                            <button className="btn-volver-gallery" onClick={onBack}>
                                VOLVER AL MENU
                            </button>
                            <img src={logosComposite} alt="Conmebol Libertadores y Amstel" className="gallery-footer-logos" />
                        </div>
                        <div className="gallery-footer-arches">
                            <img src={lineasSuperior} alt="" className="gallery-footer-arches-img" />
                        </div>
                        <div className="gallery-footer-legal">
                            © ADVERTENCIA: EL CONSUMO EXCESIVO DE ALCOHOL PUEDE PERJUDICAR SU SALUD. MINISTERIO DE SALUD PUBLICA DEL ECUADOR.
                        </div>
                    </div>
                    <button className="btn-volver-gallery gallery-desktop-back-btn" onClick={onBack}>
                        VOLVER AL MENU
                    </button>
                    <img src={pcLogosImg} alt="Conmebol Libertadores y Amstel" className="gallery-logos-desktop-main" />
                    <div className="gallery-legal-desktop-main">
                        © ADVERTENCIA: EL CONSUMO EXCESIVO DE ALCOHOL PUEDE PERJUDICAR SU SALUD. MINISTERIO DE SALUD PUBLICA DEL ECUADOR.
                    </div>
                </>
            )}

            {selectedVideo && (
                <div className="brand-bg gallery-player-screen">
                    <div className="gallery-red-overlay" />
                    <img src={lineasSuperior} alt="" className="lineas-superior gallery-lineas-superior" />
                    <img src={pcCircleImg} alt="" className="gallery-lineas-central-desktop" />
                    <img src={pcSideLineLeftImg} alt="" className="gallery-side-line gallery-side-line-left" />
                    <img src={pcSideLineRightImg} alt="" className="gallery-side-line gallery-side-line-right" />

                    <div className="landing-container gallery-player-container">
                        <div className="gallery-header">
                            <img
                                src={titulo3}
                                alt="Selecciona el año y revive las emociones del campeonato"
                                className="gallery-title-image gallery-title-image-player"
                            />
                            <h2 className="gallery-player-title-text">
                                SELECCIONA EL AÑO Y REVIVE LAS EMOCIONES DEL CAMPEONATO
                            </h2>
                        </div>

                        <div className="gallery-years-wrap">
                            <div className="gallery-years-row">
                                {years.map(y => (
                                    <button
                                        key={y.id}
                                        onClick={() => handleYearSelect(y)}
                                        className={`year-btn ${selectedYear?.id === y.id ? 'active' : ''}`}
                                    >
                                        {y.year}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="gallery-player-main">
                            <div className="gallery-player-video-wrap">
                                <div className="thumb-container" style={{ borderRadius: '15px', overflow: 'hidden', border: '2px solid var(--amstel-gold)' }}>
                                    {selectedVideo.video_url.includes('.mp4') ? (
                                        <video
                                            width="100%"
                                            height="200"
                                            src={selectedVideo.video_url}
                                            controls
                                            autoPlay
                                            style={{ outline: 'none', background: '#000' }}
                                        />
                                    ) : (
                                        <iframe
                                            width="100%"
                                            height="200"
                                            src={`https://www.youtube.com/embed/${selectedVideo.video_url.includes('v=') ? selectedVideo.video_url.split('v=')[1] : 'dQw4w9WgXcQ'}`}
                                            title={selectedVideo.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    )}
                                </div>
                            </div>

                            {selectedVideo?.id === 'final' && finalData && (
                                <div className="gallery-scoreboard">
                                    <h3 className="gallery-scoreboard-title">FINAL {selectedYear?.year}</h3>

                                    <div className="gallery-scoreboard-row">
                                        <div className="gallery-team">
                                            <img src={escudoPalmeiras} alt="" className="gallery-team-shield" />
                                            <p className="gallery-team-name">{finalData.team_home_name}</p>
                                        </div>

                                        <div className="gallery-score">{finalData.score_home}</div>

                                        <div className="gallery-stadium-center">
                                            <img src={iconoEstadioBig} alt="Stadium" className="gallery-stadium-center-icon" />
                                        </div>

                                        <div className="gallery-score">{finalData.score_away}</div>

                                        <div className="gallery-team">
                                            <img src={escudoFlamengo} alt="" className="gallery-team-shield" />
                                            <p className="gallery-team-name">{finalData.team_away_name}</p>
                                        </div>
                                    </div>

                                    <div className="gallery-stadium-line">
                                        <img src={iconoEstadioSmall} alt="" className="gallery-stadium-small" />
                                        <span className="gallery-stadium-text">{finalData.stadium_name}</span>
                                    </div>
                                </div>
                            )}

                            {selectedVideo?.id !== 'final' && (
                                <div className="gallery-player-related">
                                    <div className="gallery-related-rail">
                                        {videos.filter(vid => vid.id !== selectedVideo.id).map(v => (
                                            <div key={v.id} className="video-item gallery-related-card" onClick={() => setSelectedVideo(v)}>
                                                <div className="thumb-container">
                                                    <img src={v.thumb_url || v.thumbnail_url || '/assets/images/thumbnail-generic.jpg'} alt={v.title} />
                                                    <div className="play-overlay">
                                                        <Play size={20} fill="white" />
                                                    </div>
                                                </div>
                                                <div style={{ padding: '0.4rem' }}>
                                                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'white', textTransform: 'uppercase' }}>{v.title}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="gallery-player-footer">
                        <div className="gallery-player-footer-top">
                            <button className="btn-volver-gallery" onClick={onBack}>
                                VOLVER AL MENU
                            </button>
                            <img src={logosComposite} alt="Conmebol Libertadores y Amstel" className="gallery-footer-logos gallery-footer-logos-player" />
                            <button className="btn-volver-gallery" onClick={() => setSelectedVideo(null)}>
                                ATRAS
                            </button>
                        </div>
                        <div className="gallery-footer-arches">
                            <img src={lineasSuperior} alt="" className="gallery-footer-arches-img" />
                        </div>
                        <div className="gallery-footer-legal">
                            © ADVERTENCIA: EL CONSUMO EXCESIVO DE ALCOHOL PUEDE PERJUDICAR SU SALUD. MINISTERIO DE SALUD PUBLICA DEL ECUADOR.
                        </div>
                    </div>
                    <img src={pcLogosImg} alt="Conmebol Libertadores y Amstel" className="gallery-player-logos-desktop" />
                    <div className="gallery-player-legal-desktop">
                        © ADVERTENCIA: EL CONSUMO EXCESIVO DE ALCOHOL PUEDE PERJUDICAR SU SALUD. MINISTERIO DE SALUD PUBLICA DEL ECUADOR.
                    </div>
                </div>
            )}

            <style>{`
                .gallery-screen {
                    --gallery-gap: clamp(10px, 1.8vh, 15px);
                    --gallery-gold-line-w: 80vw;
                    --gallery-gold-line-h: calc(var(--gallery-gold-line-w) * 121 / 735);
                    --gallery-title-target-w: 80vw;
                    position: fixed;
                    inset: 0;
                    width: 100vw;
                    max-width: 100vw;
                    height: 100dvh;
                    min-height: 100dvh;
                    overflow: hidden;
                }
                .gallery-player-screen {
                    position: fixed;
                    inset: 0;
                    width: 100vw;
                    max-width: 100vw;
                    height: 100dvh;
                    min-height: 100dvh;
                    overflow: hidden;
                    z-index: 120;
                }
                .gallery-lineas-central-desktop,
                .gallery-side-line,
                .gallery-player-title-text,
                .gallery-player-logos-desktop,
                .gallery-player-legal-desktop,
                .gallery-title-text-desktop,
                .gallery-desktop-back-btn,
                .gallery-logos-desktop-main,
                .gallery-legal-desktop-main {
                    display: none;
                }
                .gallery-red-overlay {
                    position: absolute;
                    top: 40%;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 1;
                    background-image: url('${fondoRojo}');
                    background-size: cover;
                    background-position: center;
                }
                .gallery-lineas-superior {
                    z-index: 12;
                    width: var(--gallery-gold-line-w);
                    max-width: none;
                }
                .gallery-container {
                    width: min(100%, 400px);
                    max-width: 100%;
                    height: 100dvh;
                    min-height: 100dvh;
                    margin: 0 auto;
                    padding:
                        calc(env(safe-area-inset-top, 0px) + var(--gallery-gold-line-h) + var(--gallery-gap))
                        0.95rem
                        100px;
                    align-items: center;
                    justify-content: flex-start;
                    text-align: center;
                    z-index: 20;
                    overflow: hidden;
                }
                .gallery-player-container {
                    width: min(100%, 400px);
                    max-width: 100%;
                    height: 100dvh;
                    min-height: 100dvh;
                    margin: 0 auto;
                    padding: calc(2.1rem + 15px) 0.95rem 104px;
                    align-items: center;
                    justify-content: flex-start;
                    text-align: center;
                    z-index: 20;
                    overflow: hidden;
                }
                .gallery-header {
                    width: 100%;
                    margin-bottom: 0.65rem;
                }
                .gallery-title-image {
                    width: min(var(--gallery-title-target-w), 280px);
                    transform: none;
                }
                .gallery-title-image-player {
                    transform: translateY(clamp(10px, 1.8vh, 15px));
                }
                .gallery-years-wrap {
                    width: 100%;
                    border-top: none;
                    border-bottom: none;
                    padding: 0.55rem 0;
                    margin-bottom: 0.8rem;
                }
                .gallery-years-row {
                    display: flex;
                    gap: 0.45rem;
                    overflow-x: auto;
                    justify-content: center;
                    padding: 0 0.15rem;
                }
                .gallery-years-row::-webkit-scrollbar {
                    display: none;
                }
                .gallery-loading {
                    color: #fff;
                    text-align: center;
                    margin-top: 2rem;
                    z-index: 20;
                }
                .gallery-content {
                    width: 100%;
                    flex: 1;
                    overflow-y: auto;
                    padding: 0 0.2rem 0.25rem;
                }
                .gallery-player-main {
                    width: 100%;
                    flex: 1;
                    overflow: hidden;
                    padding: 0 0.2rem;
                }
                .gallery-player-video-wrap {
                    width: min(100%, 340px);
                    margin: 0 auto 0.9rem;
                    position: relative;
                    z-index: 20;
                }
                .gallery-scoreboard {
                    color: #fff;
                    text-align: center;
                    margin-top: 0.2rem;
                }
                .gallery-scoreboard-title {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.26rem;
                    letter-spacing: 0.03em;
                    margin: 0 0 0.9rem;
                }
                .gallery-scoreboard-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 0.45rem;
                }
                .gallery-team {
                    flex: 1;
                    text-align: center;
                }
                .gallery-team-shield {
                    height: 43px;
                    margin-bottom: 0.25rem;
                }
                .gallery-team-name {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 0.72rem;
                    text-transform: uppercase;
                    line-height: 1;
                }
                .gallery-score {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.8rem;
                    font-weight: 700;
                    line-height: 1;
                }
                .gallery-stadium-center {
                    flex: 0 0 51px;
                }
                .gallery-stadium-center-icon {
                    width: 100%;
                    display: block;
                }
                .gallery-stadium-line {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.4rem;
                    margin-top: 0.76rem;
                }
                .gallery-stadium-small {
                    height: 10px;
                }
                .gallery-stadium-text {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 0.68rem;
                    letter-spacing: 0.03em;
                    text-transform: uppercase;
                }
                .gallery-player-related {
                    padding-top: 0.25rem;
                    overflow-x: auto;
                    overflow-y: hidden;
                    max-height: none;
                    -webkit-overflow-scrolling: touch;
                }
                .gallery-player-related::-webkit-scrollbar {
                    height: 0;
                }
                .gallery-related-rail {
                    display: flex;
                    gap: 0.5rem;
                    width: max-content;
                    min-width: 100%;
                    padding: 0 0.15rem 0.25rem;
                }
                .gallery-related-card {
                    flex: 0 0 43%;
                    max-width: 145px;
                    min-width: 132px;
                    scroll-snap-align: start;
                }
                .gallery-content::-webkit-scrollbar {
                    width: 0;
                    height: 0;
                }
                .gallery-final-preview {
                    position: relative;
                    width: min(100%, 340px);
                    margin: 0 auto 1rem;
                    cursor: pointer;
                    z-index: 20;
                }
                .gallery-thumb-container {
                    border-radius: 16px;
                    overflow: hidden;
                    border: 2px solid #111;
                }
                .gallery-thumb-container img {
                    width: 100%;
                    display: block;
                }
                .gallery-play-overlay {
                    opacity: 1;
                    background: rgba(0,0,0,0.18);
                }
                .gallery-play-btn {
                    background: rgba(255,255,255,0.22);
                    padding: 0.9rem;
                    border-radius: 999px;
                    display: flex;
                }
                .gallery-phases {
                    max-width: 240px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    z-index: 20;
                }
                .year-btn {
                    background: white;
                    border: 2px solid var(--amstel-gold);
                    color: #111;
                    padding: 0.25rem 0.8rem;
                    border-radius: 999px;
                    font-weight: 400;
                    font-size: 0.95rem;
                    font-family: 'Bebas Neue', sans-serif;
                    min-width: 58px;
                    line-height: 1;
                    transition: all 0.2s;
                    cursor: pointer;
                    white-space: nowrap;
                }
                .year-btn.active {
                    background: var(--amstel-red);
                    color: #fff;
                    border-color: var(--amstel-gold);
                }
                .phase-accordion-gallery {
                    width: 100%;
                    background: transparent;
                    border: none;
                    color: #fff;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    text-transform: uppercase;
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 10px;
                    letter-spacing: 0.02em;
                    transition: all 0.2s;
                    min-height: 10px;
                    cursor: pointer;
                }
                .phase-accordion-gallery.expanded {
                    color: #fff;
                    text-shadow: 0 0 10px rgba(255,255,255,0.1);
                }
                .gallery-video-grid {
                    padding: 0.8rem 0;
                }
                .gallery-empty {
                    color: #fff;
                    text-align: center;
                    padding: 0.8rem;
                    opacity: 0.75;
                }
                .btn-volver-gallery {
                    background: #fff;
                    color: var(--amstel-red);
                    border: 2px solid var(--amstel-gold);
                    padding: 0.2rem 0.64rem;
                    border-radius: 999px;
                    font-family: 'Bebas Neue', sans-serif;
                    font-weight: 400;
                    font-size: 0.81rem;
                    line-height: 1;
                    box-shadow: 0 2px 0 rgba(0,0,0,0.14);
                    cursor: pointer;
                    min-height: 29px;
                    width: 98px;
                    text-align: center;
                }
                .gallery-footer {
                    position: fixed;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 70;
                    pointer-events: none;
                }
                .gallery-player-footer {
                    position: fixed;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 130;
                    pointer-events: none;
                }
                .gallery-player-footer > div {
                    pointer-events: auto;
                }
                .gallery-player-footer-top {
                    display: grid;
                    grid-template-columns: auto 1fr auto;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0 0.9rem 0;
                    transform: translateY(15px);
                    margin-bottom: -12px;
                }
                .gallery-player-footer-top .gallery-footer-logos {
                    justify-self: center;
                }
                .gallery-footer > div {
                    pointer-events: auto;
                }
                .gallery-footer-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 0.95rem 0;
                    transform: translateY(15px);
                    margin-bottom: -12px;
                }
                .gallery-footer-logos {
                    width: 127px;
                }
                .gallery-footer-logos-player {
                    width: 125px;
                    transform: translateY(-15px);
                }
                .gallery-footer-arches {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    overflow: hidden;
                    margin-bottom: -2px;
                    position: relative;
                    z-index: 1;
                }
                .gallery-footer-arches-img {
                    width: 80vw;
                    max-width: none;
                    transform: rotate(180deg);
                    display: block;
                }
                .gallery-footer-legal {
                    background: #fff;
                    color: var(--amstel-red);
                    font-size: 5px;
                    line-height: 1;
                    white-space: nowrap;
                    overflow: hidden;
                    text-align: center;
                    font-family: 'Inter', sans-serif;
                    font-weight: 700;
                    padding: 2px 6px;
                    position: relative;
                    z-index: 2;
                }
                .video-mock-controls {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 0.55rem 0.7rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: linear-gradient(to top, rgba(0,0,0,0.62), transparent);
                    color: #fff;
                }
                .controls-left { display: flex; align-items: center; }
                .video-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }
                .video-item {
                    background: rgba(255,255,255,0.04);
                    border-radius: 8px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .video-item:hover { transform: scale(1.02); }
                .thumb-container {
                    position: relative;
                    aspect-ratio: 16/9;
                    background: #111;
                }
                .thumb-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .play-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0.85;
                }
                @media (min-height: 860px) and (min-width: 390px) {
                    .gallery-phases {
                        max-width: 270px;
                        gap: 13px;
                        margin-top: 0.35rem;
                    }
                    .phase-accordion-gallery {
                        font-size: clamp(11px, 1.65vh, 14px);
                        min-height: 14px;
                        letter-spacing: 0.03em;
                    }
                }
                @media (max-width: 390px) and (max-height: 740px) {
                    .gallery-player-related {
                        margin-top: 0.35rem;
                        margin-bottom: 0.5rem;
                        padding-top: 0.1rem;
                    }
                    .gallery-related-rail {
                        gap: 0.4rem;
                        padding: 0 0.1rem 0.15rem;
                    }
                    .gallery-related-card {
                        flex: 0 0 39%;
                        min-width: 108px;
                        max-width: 120px;
                    }
                    .gallery-related-card p {
                        font-size: 0.68rem !important;
                    }
                }
                @media (min-width: 1024px) {
                    .gallery-container {
                        width: 390px;
                        padding-left: 0.9rem;
                        padding-right: 0.9rem;
                    }
                    .gallery-player-container {
                        width: 390px;
                        padding-left: 0.9rem;
                        padding-right: 0.9rem;
                    }
                }
                @media (min-width: 1200px) {
                    .gallery-screen {
                        --gallery-desktop-content-w: clamp(360px, 31vw, 460px);
                    }
                    .gallery-screen .gallery-red-overlay {
                        top: 50%;
                        background: transparent;
                    }
                    .gallery-screen .gallery-lineas-superior,
                    .gallery-screen .gallery-lineas-central-desktop {
                        display: none;
                    }
                    .gallery-screen .gallery-side-line {
                        display: block;
                    }
                    .gallery-screen .gallery-container {
                        width: 100%;
                        max-width: 100%;
                        height: 100dvh;
                        min-height: 100dvh;
                        margin: 0 auto;
                        padding: clamp(26px, 4.4vh, 52px) 2.2vw 110px;
                        overflow: hidden;
                    }
                    .gallery-screen .gallery-header {
                        margin-bottom: 0;
                    }
                    .gallery-screen .gallery-title-image {
                        display: none;
                    }
                    .gallery-title-text-desktop {
                        display: block;
                        margin: 0;
                        font-family: 'Bebas Neue', sans-serif;
                        font-weight: 400;
                        letter-spacing: 0.01em;
                        text-transform: uppercase;
                        color: #111;
                        line-height: 0.95;
                        font-size: clamp(2.15rem, 2.7vw, 3.5rem);
                    }
                    .gallery-screen .gallery-years-wrap {
                        padding: 0;
                        margin-top: 30px;
                        margin-bottom: 20px;
                    }
                    .gallery-screen .gallery-years-row {
                        width: 35vw;
                        max-width: 35vw;
                        margin: 0 auto;
                        justify-content: space-between;
                        gap: 0.55rem;
                    }
                    .gallery-screen .year-btn {
                        min-width: 0;
                        flex: 1 1 0;
                        font-size: clamp(1.2rem, 1.1vw, 1.5rem);
                        padding: 0.38rem 0.5rem;
                        border-width: 3px;
                    }
                    .gallery-screen .gallery-content {
                        width: var(--gallery-desktop-content-w);
                        margin: 0 auto;
                        overflow: visible;
                        padding: 0;
                    }
                    .gallery-screen .gallery-final-preview {
                        position: relative;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 50vw;
                        max-width: 50vw;
                        margin: 0 0 20px 0;
                    }
                    .gallery-screen .gallery-final-preview .gallery-thumb-container {
                        width: 100%;
                        margin: 0 auto;
                    }
                    .gallery-screen .gallery-phases {
                        width: var(--gallery-desktop-content-w);
                        max-width: var(--gallery-desktop-content-w);
                        margin: 0 auto;
                        gap: 9px;
                        max-height: calc(100dvh - 520px);
                        overflow-y: auto;
                    }
                    .gallery-screen .phase-accordion-gallery {
                        font-size: clamp(12px, 0.95vw, 16px);
                        min-height: 16px;
                    }
                    .gallery-screen .gallery-footer {
                        display: none !important;
                    }
                    .gallery-desktop-back-btn {
                        display: block;
                        position: fixed;
                        left: clamp(46px, 7vw, 96px);
                        bottom: clamp(14px, 2.4vh, 26px);
                        width: 150px;
                        min-width: 150px;
                        max-width: 150px;
                        height: 40px;
                        min-height: 40px;
                        max-height: 40px;
                        font-size: 22px;
                        white-space: nowrap;
                        line-height: 1;
                        border-width: 3px;
                        padding: 0 0.7rem;
                        z-index: 132;
                    }
                    .gallery-logos-desktop-main {
                        display: block;
                        position: absolute;
                        right: clamp(74px, 8.5vw, 164px);
                        top: calc(50dvh - 20px);
                        transform: translateY(-50%);
                        width: clamp(170px, 15.5vw, 250px);
                        height: auto;
                        object-fit: contain;
                        z-index: 35;
                        pointer-events: none;
                    }
                    .gallery-legal-desktop-main {
                        display: block;
                        position: absolute;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: #fff;
                        color: var(--amstel-red);
                        font-size: 7px;
                        line-height: 1;
                        white-space: nowrap;
                        overflow: hidden;
                        text-align: center;
                        font-family: 'Inter', sans-serif;
                        font-weight: 700;
                        padding: 3px 8px;
                        z-index: 140;
                    }
                    .gallery-player-screen .gallery-red-overlay {
                        top: 50%;
                        background: transparent;
                    }
                    .gallery-player-screen .gallery-lineas-superior {
                        display: none;
                    }
                    .gallery-player-screen .gallery-lineas-central-desktop {
                        display: none;
                    }
                    .gallery-player-container {
                        --gallery-player-content-w: clamp(360px, 31vw, 460px);
                        --gallery-player-video-h: calc(var(--gallery-player-content-w) * 9 / 16);
                    }
                    .gallery-lineas-central-desktop {
                        display: block;
                        position: absolute;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        width: clamp(430px, 35vw, 620px);
                        z-index: 13;
                        pointer-events: none;
                    }
                    .gallery-side-line {
                        display: block;
                        position: absolute;
                        top: 50%;
                        height: 80dvh;
                        width: auto;
                        transform: translateY(-50%);
                        z-index: 16;
                        pointer-events: none;
                    }
                    .gallery-side-line-left {
                        left: -25px;
                    }
                    .gallery-side-line-right {
                        right: -25px;
                    }
                    .gallery-player-container {
                        width: 100%;
                        max-width: 100%;
                        height: 100dvh;
                        min-height: 100dvh;
                        margin: 0 auto;
                        padding: clamp(26px, 4.4vh, 52px) 2.2vw 120px;
                        overflow: hidden;
                    }
                    .gallery-player-container .gallery-header {
                        margin-bottom: 0;
                    }
                    .gallery-title-image-player {
                        display: none;
                    }
                    .gallery-player-title-text {
                        display: block;
                        margin: 0;
                        font-family: 'Bebas Neue', sans-serif;
                        font-weight: 400;
                        letter-spacing: 0.01em;
                        text-transform: uppercase;
                        color: #111;
                        line-height: 0.95;
                        font-size: clamp(2.15rem, 2.7vw, 3.5rem);
                    }
                    .gallery-player-container .gallery-years-wrap {
                        padding: 0;
                        margin-top: 30px;
                        margin-bottom: 20px;
                    }
                    .gallery-player-container .gallery-years-row {
                        width: 35vw;
                        max-width: 35vw;
                        margin: 0 auto;
                        justify-content: space-between;
                        gap: 0.55rem;
                    }
                    .gallery-player-container .year-btn {
                        min-width: 0;
                        flex: 1 1 0;
                        font-size: clamp(1.2rem, 1.1vw, 1.5rem);
                        padding: 0.38rem 0.5rem;
                        border-width: 3px;
                    }
                    .gallery-player-main {
                        width: min(100%, 860px);
                        margin: 0 auto;
                        padding: 0;
                        overflow: visible;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .gallery-player-video-wrap {
                        width: var(--gallery-player-content-w);
                        margin: 0;
                        position: fixed;
                        left: 50%;
                        top: 50dvh;
                        transform: translate(-50%, -50%);
                        z-index: 34;
                    }
                    .gallery-player-main:has(.gallery-scoreboard) .gallery-player-video-wrap {
                        position: relative;
                        top: auto;
                        left: auto;
                        transform: none;
                        width: 50vw;
                        max-width: 50vw;
                        margin: 0 0 20px 0;
                    }
                    .gallery-player-video-wrap video,
                    .gallery-player-video-wrap iframe {
                        width: 100% !important;
                        height: auto !important;
                        aspect-ratio: 16 / 9;
                        display: block;
                    }
                    .gallery-scoreboard {
                        margin-top: 0;
                        position: fixed;
                        left: 50%;
                        top: calc(50dvh + clamp(122px, 11.2vw, 150px));
                        transform: translateX(-50%);
                        width: min(100%, 860px);
                    }
                    .gallery-player-main:has(.gallery-scoreboard) .gallery-scoreboard {
                        position: relative;
                        left: auto;
                        top: auto;
                        transform: none;
                        width: 50vw;
                        max-width: 50vw;
                        margin: 0 auto;
                    }
                    .gallery-player-main:has(.gallery-player-related) .gallery-player-video-wrap {
                        position: relative;
                        top: auto;
                        left: auto;
                        transform: none;
                        width: 50vw;
                        max-width: 50vw;
                        margin: 0 0 20px 0;
                        z-index: 34;
                    }
                    .gallery-player-main:has(.gallery-player-related) .gallery-player-related {
                        position: relative;
                        left: auto;
                        top: auto;
                        transform: none;
                        width: 50vw;
                        max-width: 50vw;
                        margin: 0 auto;
                        max-height: min(33dvh, 320px);
                        overflow-x: hidden;
                        overflow-y: auto;
                        z-index: 34;
                        padding-right: 0.2rem;
                    }
                    .gallery-player-main:has(.gallery-player-related) .gallery-related-rail {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 0.9rem;
                        width: 100%;
                        min-width: 0;
                        padding: 0;
                    }
                    .gallery-player-main:has(.gallery-player-related) .gallery-related-card {
                        flex: initial;
                        min-width: 0;
                        max-width: none;
                    }
                    .gallery-player-main:has(.gallery-player-related) .gallery-related-card:hover {
                        transform: none;
                    }
                    .gallery-scoreboard-title {
                        font-size: clamp(1.5rem, 1.9vw, 2.1rem);
                        margin: 0 0 0.45rem;
                    }
                    .gallery-scoreboard-row {
                        gap: clamp(10px, 1.1vw, 18px);
                        justify-content: center;
                    }
                    .gallery-scoreboard-row .gallery-team {
                        flex: 0 0 auto;
                        min-width: 150px;
                        display: flex;
                        align-items: center;
                        justify-content: flex-start;
                        gap: 0.5rem;
                    }
                    .gallery-scoreboard-row .gallery-team:last-child {
                        justify-content: flex-end;
                        flex-direction: row-reverse;
                    }
                    .gallery-team-shield {
                        height: 46px;
                        margin-bottom: 0;
                    }
                    .gallery-team-name {
                        font-size: 1.2rem;
                        line-height: 1;
                    }
                    .gallery-score {
                        font-size: 2rem;
                    }
                    .gallery-stadium-center {
                        flex: 0 0 56px;
                    }
                    .gallery-stadium-line {
                        display: none;
                    }
                    .gallery-player-footer {
                        position: fixed;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 130;
                        pointer-events: auto;
                    }
                    .gallery-player-footer-top {
                        position: fixed;
                        left: 0;
                        right: 0;
                        bottom: clamp(14px, 2.4vh, 26px);
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0 clamp(46px, 7vw, 96px);
                        transform: none;
                        margin: 0;
                        z-index: 132;
                    }
                    .gallery-player-footer-top .btn-volver-gallery {
                        width: 150px;
                        min-width: 150px;
                        max-width: 150px;
                        height: 40px;
                        min-height: 40px;
                        max-height: 40px;
                        font-size: 22px;
                        white-space: nowrap;
                        line-height: 1;
                        border-width: 3px;
                        padding: 0 0.7rem;
                    }
                    .gallery-player-footer-top .gallery-footer-logos,
                    .gallery-player-footer .gallery-footer-arches,
                    .gallery-player-footer .gallery-footer-legal {
                        display: none;
                    }
                    .gallery-player-logos-desktop {
                        display: block;
                        position: absolute;
                        right: clamp(74px, 8.5vw, 164px);
                        top: calc(50dvh - 20px);
                        transform: translateY(-50%);
                        width: clamp(170px, 15.5vw, 250px);
                        height: auto;
                        object-fit: contain;
                        z-index: 18;
                        pointer-events: none;
                    }
                    .gallery-player-legal-desktop {
                        display: block;
                        position: absolute;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: #fff;
                        color: var(--amstel-red);
                        font-size: 7px;
                        line-height: 1;
                        white-space: nowrap;
                        overflow: hidden;
                        text-align: center;
                        font-family: 'Inter', sans-serif;
                        font-weight: 700;
                        padding: 3px 8px;
                        z-index: 140;
                    }
                }
            `}</style>
        </div>
    );
};

export default VideoGallery;
