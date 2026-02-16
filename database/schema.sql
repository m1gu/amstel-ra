-- ============================================
-- AMSTEL WebAR - Database Schema v2.0
-- ============================================

CREATE DATABASE IF NOT EXISTS amstel_webar 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE amstel_webar;

-- Limpieza preventiva (orden inverso a las dependencias)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS store_locations;
DROP TABLE IF EXISTS tournament_finals;
DROP TABLE IF EXISTS tournament_videos;
DROP TABLE IF EXISTS tournament_phases;
DROP TABLE IF EXISTS tournaments;
DROP TABLE IF EXISTS landing_videos; -- Antigua v1.1
DROP TABLE IF EXISTS cta_buttons;
DROP TABLE IF EXISTS ar_content;
DROP TABLE IF EXISTS stadiums;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- AUTENTICACIÓN (Solo Admin)
-- ============================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- ============================================
-- CONTENIDOS AR
-- ============================================

CREATE TABLE stadiums (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_image_url VARCHAR(500),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE ar_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stadium_id INT NOT NULL,
    content_type ENUM('video', 'animation') NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    mime_type VARCHAR(100),
    thumbnail_url VARCHAR(500),
    duration_seconds INT DEFAULT 0,
    is_current BOOLEAN DEFAULT TRUE,
    version INT DEFAULT 1,
    uploaded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stadium_id) REFERENCES stadiums(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_stadium_type (stadium_id, content_type),
    INDEX idx_current (is_current)
) ENGINE=InnoDB;

CREATE TABLE cta_buttons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    stadium_id INT NOT NULL,
    button_text VARCHAR(100) NOT NULL DEFAULT 'Ver más',
    button_url VARCHAR(500) NOT NULL,
    button_style ENUM('primary', 'secondary', 'outline') DEFAULT 'primary',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (stadium_id) REFERENCES stadiums(id) ON DELETE CASCADE,
    INDEX idx_stadium (stadium_id)
) ENGINE=InnoDB;

-- ============================================
-- TORNEOS Y VIDEOS [NUEVO v2.0]
-- ============================================

CREATE TABLE tournaments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    INDEX idx_year (year)
) ENGINE=InnoDB;

CREATE TABLE tournament_phases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    phase_type ENUM('knockout', 'group', 'final') DEFAULT 'knockout',
    has_sub_phases BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
    INDEX idx_tournament (tournament_id)
) ENGINE=InnoDB;

CREATE TABLE tournament_videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phase_id INT NOT NULL,
    sub_phase VARCHAR(50),             -- "ida", "vuelta", "fecha_1", etc.
    title VARCHAR(200) NOT NULL,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    video_type ENUM('highlights', 'goles', 'resumen', 'mogala') DEFAULT 'highlights',
    team_home VARCHAR(100),
    team_away VARCHAR(100),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (phase_id) REFERENCES tournament_phases(id) ON DELETE CASCADE,
    INDEX idx_phase (phase_id),
    INDEX idx_sub (sub_phase)
) ENGINE=InnoDB;

CREATE TABLE tournament_finals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tournament_id INT NOT NULL UNIQUE,
    team_home_name VARCHAR(100) NOT NULL,
    team_home_logo_url VARCHAR(500),
    team_away_name VARCHAR(100) NOT NULL,
    team_away_logo_url VARCHAR(500),
    score_home INT DEFAULT 0,
    score_away INT DEFAULT 0,
    stadium_name VARCHAR(200),
    match_date DATE,
    FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- LOCALES DE VENTA [NUEVO v2.0]
-- ============================================

CREATE TABLE store_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    store_name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    INDEX idx_city (city)
) ENGINE=InnoDB;

-- ============================================
-- ANALYTICS
-- ============================================

CREATE TABLE sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(36) NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address VARCHAR(45),
    device_type ENUM('mobile', 'tablet', 'desktop') DEFAULT 'mobile',
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(2) DEFAULT 'EC',
    city VARCHAR(100),
    referrer VARCHAR(500),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    duration_seconds INT DEFAULT 0,
    is_bounce BOOLEAN DEFAULT TRUE,
    INDEX idx_uuid (session_uuid),
    INDEX idx_date (started_at),
    INDEX idx_device (device_type)
) ENGINE=InnoDB;

CREATE TABLE events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    event_type ENUM(
        'page_view',
        'age_gate_pass',
        'age_gate_fail',
        'ar_start',
        'target_detected',
        'target_lost',
        'animation_started',
        'animation_completed',
        'video_started',
        'video_completed',
        'cta_click',
        'tournament_video_play',
        'store_search',
        'error'
    ) NOT NULL,
    stadium_id INT NULL,
    metadata JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (stadium_id) REFERENCES stadiums(id) ON DELETE SET NULL,
    INDEX idx_session (session_id),
    INDEX idx_type (event_type),
    INDEX idx_stadium (stadium_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB;

-- ============================================
-- DATOS INICIALES (SEEDS)
-- ============================================

INSERT INTO stadiums (slug, name, description, display_order) VALUES
('monumental', 'Estadio Monumental', 'El coloso de Guayaquil', 1),
('atahualpa', 'Estadio Atahualpa', 'El templo del fútbol quiteño', 2),
('capwell', 'Estadio Capwell', 'La caldera azul', 3),
('casa_blanca', 'Casa Blanca', 'Fortaleza de Quito', 4);

-- Torneos (2022-2026)
INSERT INTO tournaments (year, name, display_order) VALUES
(2022, 'CONMEBOL Libertadores 2022', 5),
(2023, 'CONMEBOL Libertadores 2023', 4),
(2024, 'CONMEBOL Libertadores 2024', 3),
(2025, 'CONMEBOL Libertadores 2025', 2),
(2026, 'CONMEBOL Libertadores 2026', 1);

-- Nota: El password debe ser hasheado en la implementación final
INSERT INTO users (email, password_hash, name) VALUES
('admin@amstel.ec', '$2y$10$CAMBIAR_EN_PRODUCCION', 'Administrador');
