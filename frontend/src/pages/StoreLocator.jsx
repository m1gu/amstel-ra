import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../services/api';

import lineasSuperior from '../assets/images/lineas-doradas-superior.png';
import fondoRojo from '../assets/images/fondo-rojo.png';
import logosComposite from '../assets/images/logos.png';
const pcSideLineLeftImg = `${import.meta.env.BASE_URL}assets/images/pc-lineadorada-izquierda.png`;
const pcSideLineRightImg = `${import.meta.env.BASE_URL}assets/images/pc-lineadorada-derecha.png`;
const pcLogosImg = `${import.meta.env.BASE_URL}assets/images/pc-logos1.png`;

const StoreLocator = ({ onBack }) => {
    const [cities, setCities] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCities();
    }, []);

    useEffect(() => {
        document.body.classList.add('locator-active');
        return () => {
            document.body.classList.remove('locator-active');
        };
    }, []);

    const fetchCities = async () => {
        try {
            const resp = await api.get('/locations/cities');
            setCities(resp.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (val.length > 1) {
            const filtered = cities.filter(c => c.toLowerCase().includes(val.toLowerCase()));
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const handleCitySelect = async (city) => {
        setSearchTerm(city);
        setSelectedCity(city);
        setSuggestions([]);
        setLoading(true);
        try {
            const resp = await api.get(`/locations?city=${city}`);
            setLocations(resp.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setSuggestions([]);
        setLocations([]);
        setSelectedCity('');
    };

    const showResultsFrame = searchTerm.trim().length > 0 || loading;

    return (
        <div className="brand-bg locator-screen">
            <div className="locator-red-overlay" />
            <img src={lineasSuperior} alt="" className="lineas-superior locator-lineas-superior" />
            <img src={pcSideLineLeftImg} alt="" className="locator-side-line locator-side-line-left" />
            <img src={pcSideLineRightImg} alt="" className="locator-side-line locator-side-line-right" />

            <div className="landing-container locator-container">
                <div className="locator-header">
                    <h2 className="locator-title">
                        Selecciona la ciudad
                        <br />
                        y consigue el vaso
                        <br />
                        conmemorativo
                    </h2>

                    <div className="locator-search-wrap">
                        <div className="locator-search-input-shell">
                            <Search size={20} className="locator-search-icon" />
                            <input
                                type="text"
                                placeholder="Busca tu ciudad..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="locator-search-input"
                            />
                            {searchTerm && (
                                <button onClick={clearSearch} className="locator-clear-btn" type="button">
                                    x
                                </button>
                            )}
                        </div>

                        {suggestions.length > 0 && (
                            <div className="locator-suggestions-list">
                                {suggestions.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => handleCitySelect(s)}
                                        className="locator-suggestion-item"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {selectedCity && !loading && (
                    <p className="locator-count">{locations.length} LOCALES DISPONIBLES</p>
                )}

                {showResultsFrame && (
                    <div className="locator-results-shell">
                        {loading ? (
                            <p className="locator-loading">Buscando locales...</p>
                        ) : (
                            <div className="locator-results-frame">
                                {locations.length > 0 ? (
                                    <div className="locator-cards-list">
                                        {locations.map((loc) => (
                                            <div key={loc.id} className="locator-card">
                                                <h3 className="locator-card-title">{loc.store_name}</h3>
                                                <p className="locator-card-text">{loc.address}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    selectedCity && <p className="locator-empty">No se encontraron locales en esta ciudad.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="locator-footer">
                <div className="locator-footer-top">
                    <button className="btn-volver-gallery locator-back-btn" onClick={onBack}>
                        VOLVER AL MENU
                    </button>
                    <img src={logosComposite} alt="Conmebol Libertadores y Amstel" className="locator-footer-logos" />
                </div>
                <div className="locator-footer-arches">
                    <img src={lineasSuperior} alt="" className="locator-footer-arches-img" />
                </div>
                <div className="locator-footer-legal">
                    © ADVERTENCIA: EL CONSUMO EXCESIVO DE ALCOHOL PUEDE PERJUDICAR SU SALUD. MINISTERIO DE SALUD PUBLICA DEL ECUADOR.
                </div>
            </div>
            <button className="btn-volver-gallery locator-back-btn-desktop" onClick={onBack}>
                VOLVER AL MENU
            </button>
            <img src={pcLogosImg} alt="Conmebol Libertadores y Amstel" className="locator-logos-desktop" />
            <div className="locator-legal-desktop">
                © ADVERTENCIA: EL CONSUMO EXCESIVO DE ALCOHOL PUEDE PERJUDICAR SU SALUD. MINISTERIO DE SALUD PUBLICA DEL ECUADOR.
            </div>

            <style>{`
                .locator-screen {
                    --locator-gap: clamp(10px, 1.8vh, 15px);
                    --locator-gold-line-w: 80vw;
                    --locator-gold-line-h: calc(var(--locator-gold-line-w) * 121 / 735);
                    --locator-title-target-w: 80vw;
                    position: fixed;
                    inset: 0;
                    width: 100vw;
                    max-width: 100vw;
                    height: 100dvh;
                    min-height: 100dvh;
                    overflow: hidden;
                }
                .locator-red-overlay {
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
                .locator-lineas-superior {
                    z-index: 12;
                    width: var(--locator-gold-line-w);
                    max-width: none;
                }
                .locator-side-line,
                .locator-back-btn-desktop,
                .locator-logos-desktop,
                .locator-legal-desktop {
                    display: none;
                }
                .locator-container {
                    width: min(100%, 400px);
                    max-width: 100%;
                    height: 100dvh;
                    min-height: 100dvh;
                    margin: 0 auto;
                    padding:
                        calc(env(safe-area-inset-top, 0px) + var(--locator-gold-line-h) + var(--locator-gap))
                        0.95rem
                        104px;
                    align-items: center;
                    justify-content: flex-start;
                    text-align: center;
                    z-index: 20;
                    overflow: hidden;
                }
                .locator-header {
                    width: 100%;
                    z-index: 25;
                    transform: none;
                }
                .locator-title {
                    font-family: 'Bebas Neue', sans-serif;
                    text-transform: uppercase;
                    color: #111;
                    font-weight: 400;
                    letter-spacing: 0.01em;
                    font-size: clamp(1.95rem, 6.4vw, 2.56rem);
                    line-height: 0.9;
                    width: var(--locator-title-target-w);
                    max-width: none;
                    margin-left: auto;
                    margin-right: auto;
                    margin-bottom: 0;
                }
                .locator-search-wrap {
                    position: relative;
                    width: min(100%, 289px);
                    margin: 0 auto;
                    transform: none;
                    margin-top: 30px;
                }
                .locator-search-input-shell {
                    position: relative;
                    display: flex;
                    align-items: center;
                    border-radius: 999px;
                    border: 2px solid var(--amstel-gold);
                    background: #fff;
                    overflow: hidden;
                    z-index: 30;
                }
                .locator-search-icon {
                    margin-left: 1rem;
                    color: #737373;
                    flex: 0 0 auto;
                }
                .locator-search-input {
                    border: none;
                    width: 100%;
                    background: transparent;
                    color: #111;
                    font-size: 1rem;
                    font-weight: 500;
                    padding: 0.52rem 0.75rem;
                    outline: none;
                }
                .locator-clear-btn {
                    background: none;
                    border: none;
                    color: #9a9a9a;
                    font-size: 1.25rem;
                    line-height: 1;
                    padding: 0 0.8rem 0.05rem;
                    cursor: pointer;
                }
                .locator-suggestions-list {
                    position: absolute;
                    top: calc(100% + 2px);
                    left: 0;
                    right: 0;
                    background: #fff;
                    border-radius: 0 0 14px 14px;
                    box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                    z-index: 40;
                    overflow: hidden;
                }
                .locator-suggestion-item {
                    width: 100%;
                    text-align: left;
                    border: none;
                    background: #fff;
                    color: #333;
                    font-weight: 600;
                    font-size: 1rem;
                    padding: 0.72rem 1.2rem;
                    border-top: 1px solid #ececec;
                    cursor: pointer;
                    transition: background 0.15s ease, color 0.15s ease;
                }
                .locator-suggestion-item:hover {
                    background: var(--amstel-red);
                    color: #fff;
                }
                .locator-results-shell {
                    width: min(100%, 340px);
                    margin: 15px auto 0;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    z-index: 20;
                    min-height: 0;
                }
                .locator-count {
                    font-family: 'Bebas Neue', sans-serif;
                    color: #111;
                    font-size: 1rem;
                    margin: 0.35rem auto 0.35rem;
                    line-height: 1;
                    text-align: center;
                }
                .locator-loading,
                .locator-empty {
                    color: #fff;
                    opacity: 0.9;
                    text-align: center;
                    margin-top: 1rem;
                }
                .locator-results-frame {
                    flex: 1;
                    min-height: 0;
                    border-radius: 14px;
                    padding: 0;
                    overflow-y: auto;
                    overflow-x: hidden;
                    background: rgba(255,255,255,0.96);
                }
                .locator-results-frame::-webkit-scrollbar {
                    width: 5px;
                }
                .locator-results-frame::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.5);
                    border-radius: 8px;
                }
                .locator-cards-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }
                .locator-card {
                    background: transparent;
                    border-radius: 0;
                    padding: 0.95rem 1rem;
                    text-align: left;
                    border-top: 1px solid rgba(0,0,0,0.08);
                }
                .locator-cards-list .locator-card:first-child {
                    border-top: none;
                }
                .locator-card-title {
                    font-family: 'Bebas Neue', sans-serif;
                    color: #242424;
                    font-size: 1.12rem;
                    letter-spacing: 0.02em;
                    margin: 0 0 0.25rem;
                }
                .locator-card-text {
                    margin: 0;
                    color: #616161;
                    font-size: 12px;
                    line-height: 1.35;
                    font-weight: 500;
                }
                .locator-footer {
                    position: fixed;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 70;
                    pointer-events: none;
                }
                .locator-footer > div {
                    pointer-events: auto;
                }
                .locator-footer-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 0.95rem 0;
                    transform: translateY(15px);
                    margin-bottom: -12px;
                }
                .locator-back-btn {
                    width: 98px;
                    min-height: 29px;
                    border-radius: 999px;
                    border: 2px solid var(--amstel-gold);
                    background: #fff;
                    color: var(--amstel-red);
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 0.81rem;
                    line-height: 1;
                    padding: 0.2rem 0.64rem;
                    box-shadow: 0 2px 0 rgba(0,0,0,0.14);
                    text-align: center;
                }
                .locator-footer-logos {
                    width: 122px;
                }
                .locator-footer-arches {
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    overflow: hidden;
                    margin-bottom: -2px;
                    position: relative;
                    z-index: 1;
                }
                .locator-footer-arches-img {
                    width: var(--locator-gold-line-w);
                    max-width: none;
                    transform: rotate(180deg);
                    display: block;
                }
                .locator-footer-legal {
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
                @media (min-width: 1024px) {
                    .locator-container {
                        width: 390px;
                        padding-left: 0.9rem;
                        padding-right: 0.9rem;
                    }
                }
                @media (min-width: 1200px) {
                    .locator-screen {
                        --locator-desktop-content-w: clamp(420px, 33vw, 560px);
                    }
                    .locator-red-overlay {
                        top: 50%;
                    }
                    .locator-lineas-superior {
                        display: none;
                    }
                    .locator-side-line {
                        display: block;
                        position: absolute;
                        top: 50%;
                        height: 80dvh;
                        width: auto;
                        transform: translateY(-50%);
                        z-index: 16;
                        pointer-events: none;
                    }
                    .locator-side-line-left {
                        left: 0;
                    }
                    .locator-side-line-right {
                        right: 0;
                    }
                    .locator-container {
                        width: 100%;
                        max-width: 100%;
                        height: 100dvh;
                        min-height: 100dvh;
                        margin: 0 auto;
                        padding: 0 2.2vw 90px;
                        overflow: hidden;
                        position: relative;
                    }
                    .locator-header {
                        position: absolute;
                        left: 50%;
                        top: clamp(34px, 5.5vh, 68px);
                        transform: translateX(-50%);
                        width: min(92vw, 1050px);
                        z-index: 40;
                    }
                    .locator-title {
                        width: min(92vw, 1050px);
                        font-size: clamp(2.2rem, 2.9vw, 4rem);
                        line-height: 0.95;
                    }
                    .locator-search-wrap {
                        width: var(--locator-desktop-content-w);
                        margin-top: 1.05rem;
                    }
                    .locator-search-input-shell {
                        border-width: 3px;
                    }
                    .locator-search-input {
                        font-size: 1.7rem;
                        padding: 0.68rem 0.8rem;
                        font-family: 'Bebas Neue', sans-serif;
                        text-transform: uppercase;
                    }
                    .locator-search-icon {
                        margin-left: 1.15rem;
                    }
                    .locator-suggestions-list {
                        z-index: 140;
                    }
                    .locator-suggestion-item {
                        font-size: 1.3rem;
                        padding: 0.6rem 1.2rem;
                        font-family: 'Bebas Neue', sans-serif;
                    }
                    .locator-count {
                        position: absolute;
                        left: 50%;
                        top: 45dvh;
                        transform: translateX(-50%);
                        width: var(--locator-desktop-content-w);
                        color: #111;
                        font-size: clamp(1.8rem, 2.1vw, 2.6rem);
                        z-index: 46;
                    }
                    .locator-results-shell {
                        position: absolute;
                        left: 50%;
                        top: 51dvh;
                        bottom: 78px;
                        transform: translateX(-50%);
                        width: var(--locator-desktop-content-w);
                        margin: 0;
                        display: flex;
                        flex-direction: column;
                        z-index: 38;
                        min-height: 0;
                    }
                    .locator-results-frame {
                        flex: 1;
                        min-height: 0;
                        padding: 0;
                        overflow-y: auto;
                    }
                    .locator-cards-list {
                        gap: 0;
                    }
                    .locator-card {
                        border-radius: 0;
                        border-top: none;
                        padding: 0.9rem 1rem 0.95rem;
                        background: transparent;
                        border-top: 1px solid rgba(0,0,0,0.08);
                    }
                    .locator-cards-list .locator-card:first-child {
                        border-top: none;
                    }
                    .locator-card-title {
                        font-size: 2rem;
                        margin-bottom: 0.1rem;
                    }
                    .locator-card-text {
                        font-size: 1.55rem;
                        line-height: 1.12;
                        font-family: 'Bebas Neue', sans-serif;
                        color: #606060;
                    }
                    .locator-footer {
                        display: none !important;
                    }
                    .locator-back-btn-desktop {
                        display: block;
                        position: fixed;
                        left: clamp(46px, 7vw, 96px);
                        bottom: clamp(14px, 2.4vh, 26px);
                        border-radius: 999px;
                        border: 3px solid var(--amstel-gold);
                        background: #fff;
                        color: var(--amstel-red);
                        font-family: 'Bebas Neue', sans-serif;
                        width: 164px;
                        min-height: 58px;
                        font-size: 2rem;
                        line-height: 1;
                        padding: 0.45rem 1rem;
                        box-shadow: 0 2px 0 rgba(0,0,0,0.14);
                        text-align: center;
                        cursor: pointer;
                        z-index: 132;
                    }
                    .locator-logos-desktop {
                        display: block;
                        position: absolute;
                        right: clamp(74px, 8.5vw, 164px);
                        top: 50dvh;
                        transform: translateY(-50%);
                        width: clamp(170px, 15.5vw, 250px);
                        height: auto;
                        object-fit: contain;
                        z-index: 35;
                        pointer-events: none;
                    }
                    .locator-legal-desktop {
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

export default StoreLocator;
