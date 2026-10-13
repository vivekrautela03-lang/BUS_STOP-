// ============================================================================
// BUS STOP — LOCATION SERVICE (Phase 1)
//
// Wraps the browser Geolocation API (the web counterpart of Android's Fused
// Location Provider). Responsibilities:
//   - permission / insecure-context / unsupported handling (never throws)
//   - one-shot fix + continuous watch
//   - normalised fix objects with timestamps
//   - ignores out-of-order or wildly inaccurate updates
//   - pause/resume (battery) and automatic retry when permission is granted
//
// It NEVER invents a location. If there is no fix, `getFix()` returns null.
// ============================================================================
(function (global) {
  'use strict';

  const Status = Object.freeze({
    IDLE: 'idle',
    REQUESTING: 'requesting',   // waiting for permission prompt / first fix
    READY: 'ready',             // have a usable fix
    DENIED: 'denied',           // user (or browser policy) denied permission
    UNAVAILABLE: 'unavailable', // device location services off / no position source
    TIMEOUT: 'timeout',         // no fix within timeout
    INSECURE: 'insecure',       // not https/localhost -> browser blocks geolocation
    UNSUPPORTED: 'unsupported'  // no Geolocation API
  });

  const FIRST_FIX_TIMEOUT_MS = 20000;
  const WATCH_OPTIONS = { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000 };
  const MAX_ACCEPTABLE_ACCURACY_M = 2000; // once we already have a better fix

  class LocationService {
    constructor() {
      this.status = Status.IDLE;
      this.fix = null;
      this.error = null;
      this._listeners = new Set();
      this._watchId = null;
      this._running = false;
      this._permissionStatus = null;
    }

    /** @param {(state:{status:string, fix:object|null, error:object|null})=>void} fn */
    subscribe(fn) {
      this._listeners.add(fn);
      fn(this.snapshot());
      return () => this._listeners.delete(fn);
    }

    snapshot() {
      return { status: this.status, fix: this.fix, error: this.error };
    }

    getFix() { return this.fix; }

    _emit(status, error) {
      this.status = status;
      this.error = error || null;
      const snap = this.snapshot();
      this._listeners.forEach((fn) => {
        try { fn(snap); } catch (e) { console.error('[Location] listener error', e); }
      });
    }

    _precheck() {
      if (!('geolocation' in navigator)) { this._emit(Status.UNSUPPORTED, { message: 'This browser does not support location.' }); return false; }
      if (global.isSecureContext === false) {
        this._emit(Status.INSECURE, { message: 'Location needs a secure (https) connection.' });
        return false;
      }
      return true;
    }

    _toFix(position) {
      const c = position.coords;
      return {
        lat: c.latitude,
        lng: c.longitude,
        accuracy: c.accuracy,
        heading: Number.isFinite(c.heading) ? c.heading : null,
        speed: Number.isFinite(c.speed) ? c.speed : null,
        timestamp: position.timestamp || Date.now()
      };
    }

    _acceptFix(next) {
      const prev = this.fix;
      if (!prev) return true;
      if (next.timestamp < prev.timestamp) return false; // out of order
      if (next.accuracy > MAX_ACCEPTABLE_ACCURACY_M && next.accuracy > prev.accuracy * 3) return false;
      return true;
    }

    _onPosition(position) {
      const fix = this._toFix(position);
      if (!this._acceptFix(fix)) return;
      this.fix = fix;
      this._emit(Status.READY, null);
    }

    _onError(err) {
      // If we already have a fix, a transient error shouldn't wipe the map state.
      if (this.fix && err.code !== 1) return;
      switch (err.code) {
        case 1: // PERMISSION_DENIED
          this._emit(Status.DENIED, { code: 1, message: 'Location permission was denied.' });
          this._stopWatch();
          break;
        case 2: // POSITION_UNAVAILABLE
          this._emit(Status.UNAVAILABLE, { code: 2, message: 'Your device could not determine its position. Turn on location services.' });
          break;
        case 3: // TIMEOUT
          this._emit(Status.TIMEOUT, { code: 3, message: 'Finding your location is taking too long.' });
          break;
        default:
          this._emit(Status.UNAVAILABLE, { code: err.code, message: err.message || 'Unknown location error.' });
      }
    }

    async _watchPermissionChanges() {
      if (this._permissionStatus || !navigator.permissions || !navigator.permissions.query) return;
      try {
        const ps = await navigator.permissions.query({ name: 'geolocation' });
        this._permissionStatus = ps;
        ps.onchange = () => {
          // User flipped the setting in browser UI -> retry automatically.
          if (ps.state === 'granted' && this._running) this.retry();
        };
      } catch (_) { /* Permissions API not available for geolocation: ignore */ }
    }

    /** Start (or resume) location. Safe to call repeatedly. */
    start() {
      this._running = true;
      if (!this._precheck()) return;
      this._watchPermissionChanges();
      if (this._watchId !== null) return;

      if (!this.fix) this._emit(Status.REQUESTING, null);

      // Fast first fix (may use cached/network position), then a high-accuracy watch.
      navigator.geolocation.getCurrentPosition(
        (p) => this._onPosition(p),
        (e) => this._onError(e),
        { enableHighAccuracy: false, maximumAge: 60000, timeout: FIRST_FIX_TIMEOUT_MS }
      );

      this._watchId = navigator.geolocation.watchPosition(
        (p) => this._onPosition(p),
        (e) => this._onError(e),
        WATCH_OPTIONS
      );
    }

    _stopWatch() {
      if (this._watchId !== null) {
        navigator.geolocation.clearWatch(this._watchId);
        this._watchId = null;
      }
    }

    /** Stop updates (battery). Keeps the last fix so the UI can still show it as stale. */
    stop() {
      this._running = false;
      this._stopWatch();
    }

    /** Explicit retry after an error (re-prompts if the browser allows it). */
    retry() {
      this._stopWatch();
      this.start();
    }
  }

  global.BusStopLocation = { LocationService, Status };
})(window);
