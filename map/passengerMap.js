// ============================================================================
// BUS STOP — PASSENGER MAP CONTROLLER (Phase 1)
//
// Glue between: MapProvider (rendering) + LocationService (GPS) + DOM overlays.
// Phase 1 scope: full-screen map, real user location, My Location, zoom,
// loading + permission-denied states, lifecycle (pause/resume).
//
// Camera rule (Phase 7 groundwork): the camera is only moved automatically on the
// FIRST fix of a session. After that it moves only when the user asks (My Location).
// ============================================================================
(function (global) {
  'use strict';

  const { LocationService, Status } = global.BusStopLocation;
  const { MapLibreProvider } = global.BusStopMapProviders;

  const USER_ZOOM = 15.5;
  const MAP_INIT_TIMEOUT_MS = 20000;

  // Single place to swap the map engine later.
  function createProvider(container, opts) {
    return new MapLibreProvider(container, opts);
  }

  const $ = (id) => document.getElementById(id);
  const notify = (msg) => { if (typeof global.showNotice === 'function') global.showNotice(msg); };

  const BusStopMap = {
    provider: null,
    location: new LocationService(),
    containerId: null,
    mapReady: false,
    mapFailed: false,
    hasCenteredOnUser: false,
    active: false,
    _initPromise: null,
    _unsubscribe: null,
    _wired: false,

    // ---- Public API ----------------------------------------------------------
    /** Create the map (once) and start location. Safe to call every time the screen is shown. */
    mount(containerId) {
      this.containerId = containerId;
      const container = $(containerId);
      if (!container) return;

      this.active = true;
      this._wireGlobalListeners();

      if (!this.provider || this.mapFailed) {
        this._createMap(container);
      } else {
        this.provider.resize();
      }

      if (!this._unsubscribe) {
        this._unsubscribe = this.location.subscribe((state) => this._onLocationState(state));
      }
      this.location.start();
    },

    /** Called when the map screen is hidden: stop GPS to save battery. */
    pause() {
      this.active = false;
      this.location.stop();
    },

    recenterOnUser() {
      const fix = this.location.getFix();
      if (fix && this.mapReady) {
        this.provider.flyTo({ lat: fix.lat, lng: fix.lng, zoom: Math.max(this.provider.getZoom() || 0, USER_ZOOM) });
        return;
      }
      // No fix yet: this is an explicit request, so (re)try and surface state.
      this.active = true;
      this.location.retry();
      notify('Finding your location… 📍');
    },

    zoomIn() { if (this.mapReady) this.provider.zoomIn(); },
    zoomOut() { if (this.mapReady) this.provider.zoomOut(); },

    setBaseLayer(mode) { if (this.mapReady) this.provider.setBaseLayer(mode); },

    setRoutePolyline(coords, color) {
      this._pendingRoute = { coords, color };
      if (this.mapReady && this.provider) this.provider.setRoutePolyline(coords, color);
      else if (this.provider) {
        this.provider.getNativeMap()?.once('load', () => this.provider.setRoutePolyline(coords, color));
      }
    },

    clearRoutePolyline() {
      this._pendingRoute = null;
      if (this.provider) this.provider.clearRoutePolyline();
    },

    setStops(stops, onClick) {
      this._pendingStops = stops;
      this._pendingStopsOnClick = onClick;
      if (this.mapReady && this.provider) this.provider.setStops(stops, onClick);
      else if (this.provider) {
        this.provider.getNativeMap()?.once('load', () => this.provider.setStops(stops, onClick));
      }
    },

    clearStops() {
      this._pendingStops = null;
      if (this.provider) this.provider.clearStops();
    },

    setBuses(buses, onClick) {
      this._pendingBuses = buses;
      this._pendingBusesOnClick = onClick;
      if (this.mapReady && this.provider) this.provider.setBuses(buses, onClick);
      else if (this.provider) {
        this.provider.getNativeMap()?.once('load', () => this.provider.setBuses(buses, onClick));
      }
    },

    clearBuses() {
      this._pendingBuses = null;
      if (this.provider) this.provider.clearBuses();
    },

    focusBus(busId) {
      if (this.mapReady && this.provider) this.provider.focusBus(busId);
    },

    setPassengerJourneyMarkers(pickup, drop) {
      if (this.mapReady && this.provider) this.provider.setPassengerJourneyMarkers(pickup, drop);
      else if (this.provider) {
        this.provider.getNativeMap()?.once('load', () => this.provider.setPassengerJourneyMarkers(pickup, drop));
      }
    },

    clearPassengerJourneyMarkers() {
      if (this.provider) this.provider.clearPassengerJourneyMarkers();
    },

    fitBounds(coords) {
      if (this.mapReady && this.provider) this.provider.fitBounds(coords);
    },

    // ---- Internals -----------------------------------------------------------
    _createMap(container) {
      this.mapReady = false;
      this.mapFailed = false;
      this._setLoading(true, 'Loading map…');
      this._hideBanner();

      if (this.provider) { try { this.provider.destroy(); } catch (_) {} this.provider = null; }

      let provider;
      try {
        provider = createProvider(container, {
          onError: (err) => console.warn('[Map] runtime error', err)
        });
      } catch (err) {
        this._failMap(err);
        return;
      }
      this.provider = provider;

      const timeout = new Promise((_, rej) =>
        setTimeout(() => rej(new Error('Map took too long to load.')), MAP_INIT_TIMEOUT_MS));

      this._initPromise = Promise.race([provider.init(), timeout])
        .then(() => {
          if (this.provider !== provider) return;
          this.mapReady = true;
          provider.resize();
          if (this._pendingRoute) {
            provider.setRoutePolyline(this._pendingRoute.coords, this._pendingRoute.color);
          }
          if (this._pendingStops) {
            provider.setStops(this._pendingStops, this._pendingStopsOnClick);
          }
          if (this._pendingBuses) {
            provider.setBuses(this._pendingBuses, this._pendingBusesOnClick);
          }
          // Apply a fix that arrived while the map was loading.
          this._onLocationState(this.location.snapshot());
        })
        .catch((err) => {
          if (this.provider !== provider) return;
          this._failMap(err);
        });
    },

    _failMap(err) {
      console.error('[Map] failed to initialise', err);
      this.mapFailed = true;
      this._setLoading(false);
      this._showBanner({
        title: 'Map could not load',
        message: (err && err.message) || 'Please check your connection and try again.',
        actionLabel: 'Retry',
        action: () => { const c = $(this.containerId); if (c) this._createMap(c); }
      });
    },

    _onLocationState(state) {
      this._updateLocateButton(state.status);

      switch (state.status) {
        case Status.READY: {
          this._hideBanner();
          if (!this.mapReady) return; // applied once map is ready
          this.provider.setUserLocation(state.fix);
          if (!this.hasCenteredOnUser) {
            this.hasCenteredOnUser = true;
            this.provider.flyTo({ lat: state.fix.lat, lng: state.fix.lng, zoom: USER_ZOOM });
          }
          this._setLoading(false);
          break;
        }
        case Status.REQUESTING:
          if (this.mapReady && !this.location.getFix()) this._setLoading(true, 'Finding your location…');
          break;
        case Status.DENIED:
          this._setLoading(false);
          this._showBanner({
            title: 'Location access is off',
            message: 'Allow location for this site (lock icon in the address bar), then tap Try again. You can still pan and zoom the map.',
            actionLabel: 'Try again',
            action: () => this.location.retry()
          });
          break;
        case Status.UNAVAILABLE:
          this._setLoading(false);
          this._showBanner({
            title: 'Can’t get your position',
            message: state.error && state.error.message ? state.error.message : 'Turn on location services and try again.',
            actionLabel: 'Try again',
            action: () => this.location.retry()
          });
          break;
        case Status.TIMEOUT:
          this._setLoading(false);
          this._showBanner({
            title: 'Still looking for GPS',
            message: 'We couldn’t get a location fix in time. Move to an open area or check that location is on.',
            actionLabel: 'Try again',
            action: () => this.location.retry()
          });
          break;
        case Status.INSECURE:
        case Status.UNSUPPORTED:
          this._setLoading(false);
          this._showBanner({
            title: 'Location unavailable',
            message: state.error ? state.error.message : 'This browser cannot provide your location.',
            actionLabel: null
          });
          break;
        default:
          break;
      }
    },

    // ---- DOM helpers ---------------------------------------------------------
    _setLoading(visible, text) {
      const el = $('mapLoadingOverlay');
      if (!el) return;
      el.classList.toggle('hidden', !visible);
      const label = $('mapLoadingText');
      if (label && text) label.textContent = text;
    },

    _showBanner({ title, message, actionLabel, action }) {
      const banner = $('mapLocationBanner');
      if (!banner) return;
      $('mapBannerTitle').textContent = title;
      $('mapBannerMessage').textContent = message;
      const btn = $('mapBannerAction');
      if (btn) {
        btn.classList.toggle('hidden', !actionLabel);
        btn.textContent = actionLabel || '';
        btn.onclick = action ? () => action() : null;
      }
      banner.classList.remove('hidden');
    },

    _hideBanner() {
      const banner = $('mapLocationBanner');
      if (banner) banner.classList.add('hidden');
    },

    _updateLocateButton(status) {
      const btn = $('btnMyLocation');
      if (!btn) return;
      btn.classList.toggle('is-locating', status === Status.REQUESTING);
      btn.classList.toggle('is-located', status === Status.READY);
      btn.classList.toggle('is-error', status === Status.DENIED || status === Status.UNAVAILABLE || status === Status.TIMEOUT);
    },

    _wireGlobalListeners() {
      if (this._wired) return;
      this._wired = true;
      // Save battery when the tab is hidden; resume when it returns (only if the map screen is active).
      document.addEventListener('visibilitychange', () => {
        if (!this.active) return;
        if (document.hidden) this.location.stop();
        else this.location.start();
      });
    }
  };

  global.BusStopMap = BusStopMap;
})(window);
