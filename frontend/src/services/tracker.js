/**
 * Amstel Analytics Tracker SDK
 * Shared vanilla JS tracker for Landing (React) and WebAR
 * 
 * Usage:
 *   import tracker from '../services/tracker';
 *   tracker.startSession('web');
 *   tracker.track('page_view', { page: 'home' });
 */

const API_BASE = '/vasodelahistoria/api/api';

class AmstellTracker {
    constructor() {
        this.sessionUuid = null;
        this.sessionStartTime = Date.now();
        this._pending = null; // Promise for pending session start
    }

    /**
     * Start a new tracking session
     * @param {'web'|'webar'} source
     */
    async startSession(source = 'web') {
        // Avoid duplicate session starts
        if (this._pending) return this._pending;

        // Check if we already have a session for this page load
        const existingSession = sessionStorage.getItem('amstel_tracker_uuid');
        if (existingSession) {
            this.sessionUuid = existingSession;
            return this.sessionUuid;
        }

        this._pending = this._doStartSession(source);
        return this._pending;
    }

    async _doStartSession(source) {
        try {
            const res = await fetch(`${API_BASE}/sessions/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source,
                    referrer: document.referrer || null
                })
            });

            if (!res.ok) throw new Error(`Session start failed: ${res.status}`);

            const data = await res.json();
            this.sessionUuid = data.session_uuid;
            this.sessionStartTime = Date.now();
            sessionStorage.setItem('amstel_tracker_uuid', this.sessionUuid);
            return this.sessionUuid;
        } catch (err) {
            console.warn('[Tracker] Session start error:', err.message);
            this._pending = null;
            return null;
        }
    }

    /**
     * Track an event
     * @param {string} eventType - One of the ENUM event types
     * @param {object} metadata - Optional JSON metadata
     * @param {number|null} stadiumId - Optional stadium FK
     */
    async track(eventType, metadata = {}, stadiumId = null) {
        // Wait for session if not ready
        if (!this.sessionUuid) {
            await this.startSession('web');
        }

        if (!this.sessionUuid) {
            console.warn('[Tracker] Cannot track, no session');
            return;
        }

        try {
            const body = {
                session_uuid: this.sessionUuid,
                event_type: eventType,
                metadata
            };

            if (stadiumId) {
                body.stadium_id = stadiumId;
            }

            // Use sendBeacon for unload events, fetch for normal
            const payload = JSON.stringify(body);

            if (eventType === 'page_unload' && navigator.sendBeacon) {
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
                }).catch(() => {}); // Fire and forget
            }
        } catch (err) {
            console.warn('[Tracker] Track error:', err.message);
        }
    }

    /**
     * Get elapsed time in seconds since session start
     */
    getElapsedSeconds() {
        return Math.round((Date.now() - this.sessionStartTime) / 1000);
    }

    /**
     * Destroy session (for cleanup)
     */
    destroy() {
        this.sessionUuid = null;
        this._pending = null;
        sessionStorage.removeItem('amstel_tracker_uuid');
    }
}

// Singleton instance
const tracker = new AmstellTracker();
export default tracker;
