-- ============================================
-- AMSTEL WebAR - Analytics Seed Data
-- Fase 1: Preparación de Base de Datos
-- ============================================
-- Ejecutar en MySQL Workbench contra la BD: novapubl_amstel
-- ============================================

-- Desactivar safe mode de Workbench
SET SQL_SAFE_UPDATES = 0;

-- ============================================
-- PASO 1: ALTER TABLE — Agregar columna source
-- (Si ya ejecutaste esto antes, comenta esta línea)
-- ============================================

-- ALTER TABLE sessions 
-- ADD COLUMN source ENUM('web', 'webar') DEFAULT 'web' AFTER referrer;

-- ============================================
-- PASO 2: LIMPIAR datos previos de analytics
-- (preserva datos de usuarios, torneos, etc.)
-- ============================================

DELETE FROM events;
DELETE FROM sessions;

-- ============================================
-- PASO 3: INSERTAR SESIONES (300 sesiones)
-- Distribución:
--   source:  65% web, 35% webar
--   device:  60% mobile, 25% desktop, 15% tablet
--   browser: Chrome 45%, Safari 30%, Firefox 15%, Samsung 10%
--   OS:      Android 40%, iOS 35%, Windows 20%, macOS 5%
--   cities:  Guayaquil 35%, Quito 30%, Cuenca 15%, Ambato 10%, Manta 10%
-- ============================================

-- Helper: We'll use a stored procedure to generate data efficiently
DELIMITER //

DROP PROCEDURE IF EXISTS seed_analytics//

CREATE PROCEDURE seed_analytics()
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE total_sessions INT DEFAULT 300;
    DECLARE v_uuid VARCHAR(36);
    DECLARE v_source ENUM('web', 'webar');
    DECLARE v_device ENUM('mobile', 'tablet', 'desktop');
    DECLARE v_browser VARCHAR(50);
    DECLARE v_os VARCHAR(50);
    DECLARE v_city VARCHAR(100);
    DECLARE v_ip VARCHAR(45);
    DECLARE v_started_at TIMESTAMP;
    DECLARE v_duration INT;
    DECLARE v_is_bounce BOOLEAN;
    DECLARE v_session_id BIGINT;
    DECLARE v_rand DOUBLE;
    DECLARE v_rand2 DOUBLE;
    DECLARE v_stadium_id INT;
    DECLARE v_days_ago INT;
    DECLARE v_hour INT;
    DECLARE v_events_count INT;
    DECLARE j INT;
    DECLARE v_event_type VARCHAR(50);

    -- Loop: crear sesiones
    WHILE i < total_sessions DO
        SET v_rand = RAND();
        SET v_rand2 = RAND();

        -- UUID
        SET v_uuid = CONCAT(
            HEX(FLOOR(RAND() * 4294967295)),
            '-', HEX(FLOOR(RAND() * 65535)),
            '-', HEX(FLOOR(RAND() * 65535)),
            '-', HEX(FLOOR(RAND() * 65535)),
            '-', HEX(FLOOR(RAND() * 4294967295)), HEX(FLOOR(RAND() * 65535))
        );

        -- Source: 65% web, 35% webar
        IF v_rand < 0.65 THEN SET v_source = 'web';
        ELSE SET v_source = 'webar';
        END IF;

        -- Device: 60% mobile, 25% desktop, 15% tablet
        SET v_rand = RAND();
        IF v_rand < 0.60 THEN SET v_device = 'mobile';
        ELSEIF v_rand < 0.85 THEN SET v_device = 'desktop';
        ELSE SET v_device = 'tablet';
        END IF;

        -- Browser
        SET v_rand = RAND();
        IF v_rand < 0.45 THEN SET v_browser = 'Chrome';
        ELSEIF v_rand < 0.75 THEN SET v_browser = 'Safari';
        ELSEIF v_rand < 0.90 THEN SET v_browser = 'Firefox';
        ELSE SET v_browser = 'Samsung Internet';
        END IF;

        -- OS
        SET v_rand = RAND();
        IF v_rand < 0.40 THEN SET v_os = 'Android';
        ELSEIF v_rand < 0.75 THEN SET v_os = 'iOS';
        ELSEIF v_rand < 0.95 THEN SET v_os = 'Windows';
        ELSE SET v_os = 'macOS';
        END IF;

        -- City
        SET v_rand = RAND();
        IF v_rand < 0.35 THEN SET v_city = 'Guayaquil';
        ELSEIF v_rand < 0.65 THEN SET v_city = 'Quito';
        ELSEIF v_rand < 0.80 THEN SET v_city = 'Cuenca';
        ELSEIF v_rand < 0.90 THEN SET v_city = 'Ambato';
        ELSE SET v_city = 'Manta';
        END IF;

        -- IP (random private)
        SET v_ip = CONCAT('190.', FLOOR(RAND() * 255), '.', FLOOR(RAND() * 255), '.', FLOOR(RAND() * 255));

        -- Date: random within last 30 days, with more recent days having more sessions
        SET v_days_ago = FLOOR(RAND() * RAND() * 30); -- Biased toward recent
        SET v_hour = FLOOR(RAND() * 18) + 6; -- 6am to midnight
        SET v_started_at = DATE_SUB(NOW(), INTERVAL v_days_ago DAY) 
                         + INTERVAL v_hour HOUR 
                         + INTERVAL FLOOR(RAND() * 60) MINUTE;

        -- Duration: 10-600 seconds, with bounce sessions being shorter
        SET v_is_bounce = IF(RAND() < 0.30, TRUE, FALSE);
        IF v_is_bounce THEN
            SET v_duration = FLOOR(RAND() * 15) + 3; -- 3-18 seconds
        ELSE
            SET v_duration = FLOOR(RAND() * 500) + 30; -- 30-530 seconds
        END IF;

        -- Insert session
        INSERT INTO sessions (session_uuid, user_agent, ip_address, device_type, browser, os, country, city, referrer, source, started_at, ended_at, duration_seconds, is_bounce)
        VALUES (
            v_uuid,
            CONCAT('Mozilla/5.0 (', v_os, '; ', v_device, ') ', v_browser),
            v_ip,
            v_device,
            v_browser,
            v_os,
            'EC',
            v_city,
            IF(RAND() < 0.3, 'https://www.google.com', IF(RAND() < 0.5, 'https://www.instagram.com', NULL)),
            v_source,
            v_started_at,
            DATE_ADD(v_started_at, INTERVAL v_duration SECOND),
            v_duration,
            v_is_bounce
        );

        SET v_session_id = LAST_INSERT_ID();

        -- ============================================
        -- GENERAR EVENTOS para esta sesión
        -- ============================================
        
        IF v_source = 'web' THEN
            -- WEB SESSION EVENTS --
            
            -- 1. page_view (siempre)
            INSERT INTO events (session_id, event_type, metadata, timestamp)
            VALUES (v_session_id, 'page_view', JSON_OBJECT('page_name', 'landing', 'source', 'web'), v_started_at);

            IF NOT v_is_bounce THEN
                -- 2. age_gate_pass (90% pasan)
                IF RAND() < 0.90 THEN
                    INSERT INTO events (session_id, event_type, metadata, timestamp)
                    VALUES (v_session_id, 'age_gate_pass', JSON_OBJECT('source', 'web'), DATE_ADD(v_started_at, INTERVAL 5 SECOND));
                ELSE
                    INSERT INTO events (session_id, event_type, metadata, timestamp)
                    VALUES (v_session_id, 'age_gate_fail', JSON_OBJECT('source', 'web'), DATE_ADD(v_started_at, INTERVAL 5 SECOND));
                END IF;

                -- 3. page_view menu
                INSERT INTO events (session_id, event_type, metadata, timestamp)
                VALUES (v_session_id, 'page_view', JSON_OBJECT('page_name', 'menu', 'source', 'web'), DATE_ADD(v_started_at, INTERVAL 8 SECOND));

                -- 4. Navegar a galería (70%)
                IF RAND() < 0.70 THEN
                    INSERT INTO events (session_id, event_type, metadata, timestamp)
                    VALUES (v_session_id, 'page_view', JSON_OBJECT('page_name', 'gallery', 'source', 'web'), DATE_ADD(v_started_at, INTERVAL 15 SECOND));

                    -- 5. tournament_video_play (60% de quienes ven galería)
                    IF RAND() < 0.60 THEN
                        INSERT INTO events (session_id, event_type, metadata, timestamp)
                        VALUES (v_session_id, 'tournament_video_play', 
                            JSON_OBJECT(
                                'video_title', ELT(FLOOR(RAND() * 5) + 1, 'Gol de la Final 2022', 'Highlights Octavos', 'Resumen Semis', 'Mejores Jugadas Cuartos', 'Final 2023 Completa'),
                                'tournament_year', ELT(FLOOR(RAND() * 5) + 1, '2022', '2023', '2024', '2025', '2026'),
                                'source', 'web'
                            ), 
                            DATE_ADD(v_started_at, INTERVAL 25 SECOND));

                        -- Segundo video (30%)
                        IF RAND() < 0.30 THEN
                            INSERT INTO events (session_id, event_type, metadata, timestamp)
                            VALUES (v_session_id, 'tournament_video_play',
                                JSON_OBJECT('video_title', 'Resumen Fase de Grupos', 'tournament_year', '2025', 'source', 'web'),
                                DATE_ADD(v_started_at, INTERVAL 90 SECOND));
                        END IF;
                    END IF;
                END IF;

                -- 6. Store Locator (25%)
                IF RAND() < 0.25 THEN
                    INSERT INTO events (session_id, event_type, metadata, timestamp)
                    VALUES (v_session_id, 'page_view', JSON_OBJECT('page_name', 'locator', 'source', 'web'), DATE_ADD(v_started_at, INTERVAL 40 SECOND));
                    
                    INSERT INTO events (session_id, event_type, metadata, timestamp)
                    VALUES (v_session_id, 'store_search', JSON_OBJECT('city', v_city, 'source', 'web'), DATE_ADD(v_started_at, INTERVAL 48 SECOND));
                END IF;

                -- 7. CTA click "Activa la RA" (15%)
                IF RAND() < 0.15 THEN
                    INSERT INTO events (session_id, event_type, metadata, timestamp)
                    VALUES (v_session_id, 'cta_click', JSON_OBJECT('cta_label', 'Activa la RA', 'source', 'web'), DATE_ADD(v_started_at, INTERVAL 55 SECOND));
                END IF;
            END IF;

        ELSE
            -- WEBAR SESSION EVENTS --
            
            -- 1. ar_start (siempre)
            INSERT INTO events (session_id, event_type, metadata, timestamp)
            VALUES (v_session_id, 'ar_start', JSON_OBJECT('source', 'webar'), v_started_at);

            IF NOT v_is_bounce THEN
                -- 2. target_detected (random stadium)
                SET v_stadium_id = FLOOR(RAND() * 4) + 1;

                INSERT INTO events (session_id, event_type, stadium_id, metadata, timestamp)
                VALUES (v_session_id, 'target_detected', v_stadium_id, 
                    JSON_OBJECT('target_index', v_stadium_id - 1, 'source', 'webar'),
                    DATE_ADD(v_started_at, INTERVAL 10 SECOND));

                -- 3. video_started (80% after detection)
                IF RAND() < 0.80 THEN
                    INSERT INTO events (session_id, event_type, stadium_id, metadata, timestamp)
                    VALUES (v_session_id, 'video_started', v_stadium_id,
                        JSON_OBJECT('video_url', 'videos/video-goles.mp4', 'source', 'webar'),
                        DATE_ADD(v_started_at, INTERVAL 14 SECOND));

                    -- video_completed (50% of started)
                    IF RAND() < 0.50 THEN
                        INSERT INTO events (session_id, event_type, stadium_id, metadata, timestamp)
                        VALUES (v_session_id, 'video_completed', v_stadium_id,
                            JSON_OBJECT('video_url', 'videos/video-goles.mp4', 'source', 'webar'),
                            DATE_ADD(v_started_at, INTERVAL 45 SECOND));
                    END IF;
                END IF;

                -- 4. target_lost (siempre después de detected)
                INSERT INTO events (session_id, event_type, stadium_id, metadata, timestamp)
                VALUES (v_session_id, 'target_lost', v_stadium_id,
                    JSON_OBJECT('target_index', v_stadium_id - 1, 'source', 'webar'),
                    DATE_ADD(v_started_at, INTERVAL v_duration - 5 SECOND));

                -- 5. Second detection (20% scan another marker)
                IF RAND() < 0.20 THEN
                    SET v_stadium_id = (v_stadium_id % 4) + 1; -- different stadium
                    INSERT INTO events (session_id, event_type, stadium_id, metadata, timestamp)
                    VALUES (v_session_id, 'target_detected', v_stadium_id,
                        JSON_OBJECT('target_index', v_stadium_id - 1, 'source', 'webar'),
                        DATE_ADD(v_started_at, INTERVAL v_duration - 20 SECOND));
                    
                    INSERT INTO events (session_id, event_type, stadium_id, metadata, timestamp)
                    VALUES (v_session_id, 'target_lost', v_stadium_id,
                        JSON_OBJECT('target_index', v_stadium_id - 1, 'source', 'webar'),
                        DATE_ADD(v_started_at, INTERVAL v_duration - 3 SECOND));
                END IF;

                -- 6. CTA click in AR (12%)
                IF RAND() < 0.12 THEN
                    INSERT INTO events (session_id, event_type, stadium_id, metadata, timestamp)
                    VALUES (v_session_id, 'cta_click', v_stadium_id,
                        JSON_OBJECT('url', 'https://www.amstel.com.ec', 'source', 'webar'),
                        DATE_ADD(v_started_at, INTERVAL 35 SECOND));
                END IF;

                -- 7. Error (3%)
                IF RAND() < 0.03 THEN
                    INSERT INTO events (session_id, event_type, metadata, timestamp)
                    VALUES (v_session_id, 'error',
                        JSON_OBJECT('error_message', 'Camera permission denied', 'source', 'webar'),
                        DATE_ADD(v_started_at, INTERVAL 2 SECOND));
                END IF;
            END IF;
        END IF;

        SET i = i + 1;
    END WHILE;
END//

DELIMITER ;

-- ============================================
-- PASO 4: EJECUTAR EL SEED
-- ============================================

CALL seed_analytics();

-- Limpiar procedimiento
DROP PROCEDURE IF EXISTS seed_analytics;

-- ============================================
-- PASO 5: VERIFICACIÓN RÁPIDA
-- ============================================

SELECT '=== RESUMEN DEL SEED ===' AS info;
SELECT COUNT(*) AS total_sessions FROM sessions;
SELECT source, COUNT(*) AS total FROM sessions GROUP BY source;
SELECT device_type, COUNT(*) AS total FROM sessions GROUP BY device_type;
SELECT COUNT(*) AS total_events FROM events;
SELECT event_type, COUNT(*) AS total FROM events GROUP BY event_type ORDER BY total DESC;
