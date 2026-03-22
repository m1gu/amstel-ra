// frontend/src/pages/Landing.jsx
import React, { useEffect, useState } from 'react';
import VideoGallery from './VideoGallery';
import StoreLocator from './StoreLocator';
import GlobalFooter from '../components/GlobalFooter';

import lineasSuperior from '../assets/images/lineas-doradas-superior.png';
import lineasCentral from '../assets/images/lineas-doradas-central.png';
import titulo1 from '../assets/images/titulo1.png';
import titulo2 from '../assets/images/titulo2.png';
import logosComposite from '../assets/images/logos.png';

const ageHeaderImg = `${import.meta.env.BASE_URL}assets/images/header2.png`;
const homeHeaderImg = `${import.meta.env.BASE_URL}assets/images/header4.png`;

const Landing = () => {
    const [ageVerified, setAgeVerified] = useState(sessionStorage.getItem('amstel_age_gate') === 'true');
    const [showRejection, setShowRejection] = useState(false);
    const [view, setView] = useState('menu'); // 'menu', 'gallery', 'locator'
    const [birthDate, setBirthDate] = useState({ day: '', month: '', year: '' });

    useEffect(() => {
        document.body.classList.toggle('age-gate-active', !ageVerified);
        return () => {
            document.body.classList.remove('age-gate-active');
        };
    }, [ageVerified]);

    useEffect(() => {
        const isMenuView = ageVerified && view === 'menu';
        document.body.classList.toggle('home-menu-active', isMenuView);
        return () => {
            document.body.classList.remove('home-menu-active');
        };
    }, [ageVerified, view]);

    const handleAgeVerification = (e) => {
        e.preventDefault();
        const { day, month, year } = birthDate;
        if (!day || !month || !year) return;

        const birth = new Date(year, month - 1, day);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
            age--;
        }

        if (age >= 18) {
            sessionStorage.setItem('amstel_age_gate', 'true');
            setAgeVerified(true);
        } else {
            setShowRejection(true);
        }
    };

    if (!ageVerified) {
        return (
            <div className="brand-bg age-gate-screen">
                <img src={lineasSuperior} alt="" className="lineas-superior" />
                <img src={lineasCentral} alt="" className="lineas-central" />
                <img src={lineasSuperior} alt="" className="lineas-inferior" />

                <div className="age-gate-red-overlay"></div>

                <div className="landing-container age-gate-container">
                    <div className="age-gate-title-wrap">
                        <img
                            src={titulo1}
                            alt="Todas las emociones entran en juego"
                            className="age-gate-title-image"
                        />
                    </div>

                    <div className="age-gate-hero-wrap">
                        <img
                            src={ageHeaderImg}
                            alt="Latas Amstel"
                            className="hero-image-hands age-gate-hero"
                        />
                    </div>

                    <div className="age-gate-form-wrap">
                        <div className="age-gate-entry-group">
                            <p className="age-gate-caption">Ingresa tu fecha de nacimiento</p>

                            <form onSubmit={handleAgeVerification} className="age-gate-form">
                                <div className="age-gate-input-wrapper">
                                    <input
                                        className="age-gate-input"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={14}
                                        placeholder="DD/MM/YYYY"
                                        value={`${birthDate.day}${birthDate.day ? '/' : ''}${birthDate.month}${birthDate.month ? '/' : ''}${birthDate.year}`}
                                        onChange={e => {
                                            const clean = e.target.value.replace(/[^0-9]/g, '');
                                            if (clean.length <= 8) {
                                                setBirthDate({
                                                    day: clean.substring(0, 2),
                                                    month: clean.substring(2, 4),
                                                    year: clean.substring(4, 8)
                                                });
                                            }
                                        }}
                                    />
                                </div>
                                <button type="submit" className="btn-amstel-gold age-gate-submit">
                                    ENTRAR
                                </button>
                            </form>
                        </div>

                        <img
                            src={logosComposite}
                            alt="Conmebol Libertadores y Amstel"
                            className="age-gate-logos"
                        />
                    </div>

                    {showRejection && (
                        <div style={overlayStyle}>
                            <div className="age-rejection-modal">
                                <h3 className="age-rejection-title">¡LO SENTIMOS!</h3>
                                <p className="age-rejection-text">
                                    DEBES TENER <span className="age-rejection-highlight">+18</span> PARA PODER INGRESAR A LA PÁGINA.
                                </p>
                                <div className="age-rejection-actions">
                                    <button className="age-rejection-close" onClick={() => setShowRejection(false)}>CERRAR</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const renderMenu = () => (
        <div className="brand-bg home-menu-screen">
            <img src={lineasSuperior} alt="" className="lineas-superior" />
            <img src={lineasCentral} alt="" className="lineas-central" />

            <div className="home-menu-red-overlay"></div>

            <div className="landing-container home-menu-container">
                <div className="home-menu-title-wrap">
                    <img
                        src={titulo2}
                        alt="Interactúa y revive las emociones de la Conmebol Libertadores"
                        className="home-menu-title-image"
                    />
                </div>

                <div className="home-menu-hero-wrap">
                    <img
                        src={homeHeaderImg}
                        alt="Latas Amstel"
                        className="hero-image-hands home-menu-hero"
                    />
                </div>

                <div className="home-menu-actions">
                    <button className="btn-amstel-menu home-menu-btn home-menu-btn-primary" onClick={() => window.location.href = import.meta.env.BASE_URL + 'webar/'}>
                        Activa la Realidad Aumentada
                    </button>
                    <button className="btn-amstel-menu home-menu-btn" onClick={() => setView('gallery')}>
                        Revive los últimos 6 campeonatos
                    </button>
                    <button className="btn-amstel-menu home-menu-btn" onClick={() => setView('locator')}>
                        ¿Dónde consigo el vaso?
                    </button>
                </div>
            </div>

            <GlobalFooter className="home-footer" />
        </div>
    );

    return (
        <div className="landing-page" style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
            {view === 'menu' && renderMenu()}
            {view === 'gallery' && <VideoGallery onBack={() => setView('menu')} />}
            {view === 'locator' && <StoreLocator onBack={() => setView('menu')} />}
        </div>
    );
};

const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem'
};

export default Landing;
