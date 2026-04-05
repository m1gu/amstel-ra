/**
 * Amstel WebAR Tracker
 * Lightweight analytics tracker for the WebAR experience.
 * Uses the same backend API as the Landing tracker.
 *
 * Mapeo de markers a estadios:
 *   targetIndex 0,4 → Estadio2022 (stadium_id=1)
 *   targetIndex 1,5 → Estadio2023 (stadium_id=2)
 *   targetIndex 2,6 → Estadio2024 (stadium_id=3)
 *   targetIndex 3,7 → Estadio2025 (stadium_id=4)
 */

const API_BASE = '/vasodelahistoria/api/api';

// Mapeo de targetImageIndex → stadium_id para la BD
const TARGET_TO_STADIUM = {
    0: 1, 4: 1, // Estadio2022
    1: 2, 5: 2, // Estadio2023
    2: 3, 6: 3, // Estadio2024
    3: 4, 7: 4, // Estadio2025
};

const STADIUM_NAMES = {
    1: 'Estadio2022',
    2: 'Estadio2023',
    3: 'Estadio2024',
    4: 'Estadio2025',
};

class WebarTracker {
    constructor() {
        this.sessionUuid = null;
        this.sessionStartTime = Date.now();
        this._pending = null;
        this._detectedTargets = new Set(); // Avoid double-counting same marker per session
    }

    /**
     * Start a WebAR tracking session
     */
    async startSession() {
        if (this._pending) return this._pending;

        // Reuse session from same page load
        const existing = sessionStorage.getItem('amstel_webar_tracker_uuid');
        if (existing) {
            this.sessionUuid = existing;
            return this.sessionUuid;
        }

        this._pending = this._doStart();
        return this._pending;
    }

    async _doStart() {
        try {
            const res = await fetch(`${API_BASE}/sessions/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'webar',
                    referrer: document.referrer || null
                })
            });

            if (!res.ok) throw new Error(`Session start failed: ${res.status}`);

            const data = await res.json();
            this.sessionUuid = data.session_uuid;
            this.sessionStartTime = Date.now();
            sessionStorage.setItem('amstel_webar_tracker_uuid', this.sessionUuid);
            return this.sessionUuid;
        } catch (err) {
            console.warn('[WebarTracker] Session start error:', err.message);
            this._pending = null;
            return null;
        }
    }

    /**
     * Track a generic event
     */
    async track(eventType, metadata = {}, stadiumId = null) {
        if (!this.sessionUuid) {
            await this.startSession();
        }

        if (!this.sessionUuid) return;

        try {
            const body = {
                session_uuid: this.sessionUuid,
                event_type: eventType,
                metadata
            };

            if (stadiumId) body.stadium_id = stadiumId;

            const payload = JSON.stringify(body);

            // Use sendBeacon for unload-type events
            if (eventType === 'ar_session_end' && navigator.sendBeacon) {
                navigator.sendBeacon(
                    `${API_BASE}/events`,
                    new Blob([payload], { type: 'application/json' })
                );
            } else {
                fetch(`${API_BASE}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true
                }).catch(() => {});
            }
        } catch (err) {
            console.warn('[WebarTracker] Track error:', err.message);
        }
    }

    /**
     * Track an AR load event (when MindAR starts)
     */
    trackARLoad() {
        this.track('ar_initiated', { time_to_load_ms: Date.now() - this.sessionStartTime });
    }

    /**
     * Track a marker detection
     * @param {number} targetIndex - The MindAR target image index (0-7)
     */
    trackTargetDetected(targetIndex) {
        const stadiumId = TARGET_TO_STADIUM[targetIndex];
        const stadiumName = STADIUM_NAMES[stadiumId] || `Marker ${targetIndex}`;

        // Track unique detections per session (first-seen)
        const key = `target_${targetIndex}`;
        const isFirstDetection = !this._detectedTargets.has(key);
        this._detectedTargets.add(key);

        this.track('target_detected', {
            target_index: targetIndex,
            stadium_name: stadiumName,
            is_first: isFirstDetection
        }, stadiumId);
    }

    /**
     * Track a marker lost event
     */
    trackTargetLost(targetIndex) {
        const stadiumId = TARGET_TO_STADIUM[targetIndex];
        this.track('marker_lost', {
            target_index: targetIndex
        }, stadiumId);
    }

    /**
     * Track a video play in AR
     */
    trackVideoPlay(targetIndex, videoUrl) {
        const stadiumId = TARGET_TO_STADIUM[targetIndex];
        this.track('video_started', {
            target_index: targetIndex,
            video_url: videoUrl || 'unknown'
        }, stadiumId);
    }

    /**
     * Track session end duration on page unload
     */
    setupUnloadTracking() {
        const handleUnload = () => {
            const durationSec = Math.round((Date.now() - this.sessionStartTime) / 1000);
            this.track('ar_session_end', { duration_seconds: durationSec });
        };
        window.addEventListener('beforeunload', handleUnload);
        window.addEventListener('pagehide', handleUnload);
    }

    /**
     * Destroy session
     */
    destroy() {
        this.sessionUuid = null;
        this._pending = null;
        this._detectedTargets.clear();
        sessionStorage.removeItem('amstel_webar_tracker_uuid');
    }
}

// Singleton
const webarTracker = new WebarTracker();
export { webarTracker, TARGET_TO_STADIUM, STADIUM_NAMES };
