// ============================================================================
// BUS STOP — MAP PROVIDER ABSTRACTION (Phase 1)
//
// App code talks to the `MapProvider` interface only. `MapLibreProvider` is the
// current implementation. To swap map engines later, implement the same methods
// and register it in `BusStopMap.createProvider` (see passengerMap.js).
//
// Interface:
//   init(): Promise<void>                    - create the map, resolves when style loaded
//   setBaseLayer('street' | 'satellite')
//   setUserLocation({ lat, lng, accuracy })  - draw/update the user's position
//   flyTo({ lat, lng, zoom })  / jumpTo(...)
//   zoomIn() / zoomOut() / resize()
//   getNativeMap()                           - escape hatch for later phases
//   destroy()
// ============================================================================
(function (global) {
  'use strict';

  // Neutral world-ish camera shown ONLY until the first real GPS fix arrives.
  // It is deliberately not a user location.
  const FALLBACK_VIEW = { lng: 78.9629, lat: 22.5, zoom: 3.6 };

  const STREET_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

  const OSM_RASTER_STYLE = {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
  };

  const SATELLITE_STYLE = {
    version: 8,
    sources: {
      esri: {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics'
      }
    },
    layers: [{ id: 'esri', type: 'raster', source: 'esri' }]
  };

  const ACCURACY_SOURCE = 'user-accuracy-src';
  const ACCURACY_FILL = 'user-accuracy-fill';
  const ACCURACY_LINE = 'user-accuracy-line';

  // Geodesic-ish circle polygon (meters) used to visualise GPS accuracy.
  function circlePolygon(lng, lat, radiusM, steps) {
    const n = steps || 64;
    const coords = [];
    const dLat = radiusM / 111320;
    const dLng = radiusM / (111320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * 2 * Math.PI;
      coords.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
    }
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [coords] }
    };
  }

  class MapLibreProvider {
    /**
     * @param {HTMLElement} container
     * @param {{ onError?: (err:Error)=>void }} [opts]
     */
    constructor(container, opts) {
      this.container = container;
      this.opts = opts || {};
      this.map = null;
      this.userMarker = null;
      this.userFix = null;
      this.baseLayer = 'street';
      this.usedFallbackStyle = false;
      this._resizeObserver = null;
    }

    init() {
      return new Promise((resolve, reject) => {
        if (!global.maplibregl) {
          reject(new Error('MapLibre GL JS failed to load (check your network connection).'));
          return;
        }

        let map;
        try {
          map = new global.maplibregl.Map({
            container: this.container,
            style: STREET_STYLE_URL,
            center: [FALLBACK_VIEW.lng, FALLBACK_VIEW.lat],
            zoom: FALLBACK_VIEW.zoom,
            attributionControl: false,
            pitchWithRotate: false,
            dragRotate: false,
            maxZoom: 19
          });
        } catch (err) {
          // Typically: WebGL not available.
          reject(err);
          return;
        }

        this.map = map;
        map.addControl(new global.maplibregl.AttributionControl({ compact: true }), 'bottom-left');
        map.touchZoomRotate.disableRotation();

        let settled = false;
        const settleOk = () => { if (!settled) { settled = true; resolve(); } };
        const settleErr = (e) => { if (!settled) { settled = true; reject(e); } };

        map.once('load', settleOk);

        map.on('error', (ev) => {
          const err = ev && ev.error ? ev.error : new Error('Map error');
          // If the vector style itself fails to load (before first 'load'), degrade to
          // plain OSM raster tiles. Later transient tile errors must not swap styles.
          const isStyleFailure = !settled && this.baseLayer === 'street' && !this.usedFallbackStyle;
          if (isStyleFailure) {
            this.usedFallbackStyle = true;
            console.warn('[Map] Vector style failed, falling back to OSM raster tiles.', err);
            try { map.setStyle(OSM_RASTER_STYLE); } catch (e) { settleErr(e); }
            return;
          }
          if (!settled) { settleErr(err); }
          else if (typeof this.opts.onError === 'function') { this.opts.onError(err); }
        });

        // Re-create our custom layers whenever the base style is swapped.
        map.on('style.load', () => this._ensureAccuracyLayers());

        // Keep canvas size in sync with the container (dashboard is toggled via display:none).
        if (typeof ResizeObserver !== 'undefined') {
          this._resizeObserver = new ResizeObserver(() => this.resize());
          this._resizeObserver.observe(this.container);
        }
      });
    }

    setBaseLayer(mode) {
      if (!this.map || mode === this.baseLayer) return;
      this.baseLayer = mode;
      if (mode === 'satellite') {
        this.map.setStyle(SATELLITE_STYLE);
      } else {
        this.map.setStyle(this.usedFallbackStyle ? OSM_RASTER_STYLE : STREET_STYLE_URL);
      }
    }

    // ---- User location -----------------------------------------------------
    _ensureAccuracyLayers() {
      const map = this.map;
      if (!map || !map.isStyleLoaded()) return;
      if (!map.getSource(ACCURACY_SOURCE)) {
        map.addSource(ACCURACY_SOURCE, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
      }
      if (!map.getLayer(ACCURACY_FILL)) {
        map.addLayer({
          id: ACCURACY_FILL,
          type: 'fill',
          source: ACCURACY_SOURCE,
          paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.12 }
        });
      }
      if (!map.getLayer(ACCURACY_LINE)) {
        map.addLayer({
          id: ACCURACY_LINE,
          type: 'line',
          source: ACCURACY_SOURCE,
          paint: { 'line-color': '#2563eb', 'line-opacity': 0.35, 'line-width': 1 }
        });
      }
      this._renderAccuracy();
    }

    _renderAccuracy() {
      const src = this.map && this.map.getSource(ACCURACY_SOURCE);
      if (!src) return;
      const f = this.userFix;
      const features = f && f.accuracy
        ? [circlePolygon(f.lng, f.lat, Math.min(f.accuracy, 5000))]
        : [];
      src.setData({ type: 'FeatureCollection', features });
    }

    setUserLocation(fix) {
      if (!this.map) return;
      this.userFix = fix;

      if (!this.userMarker) {
        const el = document.createElement('div');
        el.className = 'user-gps-pulse-icon bs-user-location-marker';
        el.setAttribute('aria-label', 'Your location');
        el.innerHTML =
          '<div class="user-gps-beacon-ring"></div><div class="user-gps-center-dot"></div>';
        this.userMarker = new global.maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([fix.lng, fix.lat])
          .addTo(this.map);
      } else {
        this.userMarker.setLngLat([fix.lng, fix.lat]);
      }
      this._renderAccuracy();
    }

    clearUserLocation() {
      this.userFix = null;
      if (this.userMarker) { this.userMarker.remove(); this.userMarker = null; }
      this._renderAccuracy();
    }

    // ---- Passenger Route Journey Markers (Pickup & Destination) ------------
    setPassengerJourneyMarkers(pickup, drop) {
      if (!this.map) return;
      this.clearPassengerJourneyMarkers();

      // 1. Pickup Marker (Where passenger boards on route)
      if (pickup && !isNaN(pickup.lat) && !isNaN(pickup.lng)) {
        const el = document.createElement('div');
        el.className = 'bs-journey-marker pickup';
        el.setAttribute('role', 'region');
        el.setAttribute('aria-label', `Pickup: ${pickup.label || 'Your Location'}`);
        el.innerHTML = `
          <div class="journey-marker-pulse"></div>
          <div class="journey-marker-pin pickup-pin">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffffff" stroke-width="2.5">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
              <circle cx="12" cy="10" r="3" fill="#ffffff"/>
            </svg>
          </div>
          <div class="journey-marker-badge pickup-badge">
            <span class="badge-title">📍 YOUR PICKUP</span>
            <strong class="badge-name">${pickup.label || 'Boarding Stop'}</strong>
          </div>
        `;

        this.pickupMarker = new global.maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([pickup.lng, pickup.lat])
          .addTo(this.map);
      }

      // 2. Dropoff Marker (Destination)
      if (drop && !isNaN(drop.lat) && !isNaN(drop.lng)) {
        const el = document.createElement('div');
        el.className = 'bs-journey-marker drop';
        el.setAttribute('role', 'region');
        el.setAttribute('aria-label', `Destination: ${drop.label || 'Final Stop'}`);
        el.innerHTML = `
          <div class="journey-marker-pin drop-pin">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ffffff" stroke-width="2.5">
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div class="journey-marker-badge drop-badge">
            <span class="badge-title">🏁 DESTINATION</span>
            <strong class="badge-name">${drop.label || 'Destination'}</strong>
          </div>
        `;

        this.dropMarker = new global.maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([drop.lng, drop.lat])
          .addTo(this.map);
      }
    }

    clearPassengerJourneyMarkers() {
      if (this.pickupMarker) {
        this.pickupMarker.remove();
        this.pickupMarker = null;
      }
      if (this.dropMarker) {
        this.dropMarker.remove();
        this.dropMarker = null;
      }
    }

    // ---- Route Polyline ----------------------------------------------------
    setRoutePolyline(coords, colorHex = '#2563eb') {
      const map = this.map;
      if (!map) return;
      this.currentRouteCoords = coords;
      this.currentRouteColor = colorHex;

      if (!map.isStyleLoaded()) {
        map.once('style.load', () => this.setRoutePolyline(coords, colorHex));
        return;
      }

      // GeoJSON format: coordinates are [lng, lat]
      const lngLatCoords = (coords || []).map(pt => {
        if (Array.isArray(pt)) {
          // Check if [lat, lng] or [lng, lat]
          return pt[0] < 45 && pt[1] > 60 ? [pt[1], pt[0]] : [pt[0], pt[1]];
        }
        return [pt.lng || pt.longitude, pt.lat || pt.latitude];
      });

      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: lngLatCoords
        }
      };

      const ROUTE_SRC = 'bs-route-src';
      const ROUTE_CASING = 'bs-route-casing';
      const ROUTE_LINE = 'bs-route-line';

      if (map.getSource(ROUTE_SRC)) {
        map.getSource(ROUTE_SRC).setData(geojson);
      } else {
        map.addSource(ROUTE_SRC, { type: 'geojson', data: geojson });
        map.addLayer({
          id: ROUTE_CASING,
          type: 'line',
          source: ROUTE_SRC,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#111827',
            'line-width': 7,
            'line-opacity': 0.7
          }
        });
        map.addLayer({
          id: ROUTE_LINE,
          type: 'line',
          source: ROUTE_SRC,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': colorHex,
            'line-width': 4.5,
            'line-opacity': 0.95
          }
        });
      }
    }

    clearRoutePolyline() {
      const map = this.map;
      if (!map) return;
      this.currentRouteCoords = null;
      try {
        if (map.getLayer('bs-route-line')) map.removeLayer('bs-route-line');
        if (map.getLayer('bs-route-casing')) map.removeLayer('bs-route-casing');
        if (map.getSource('bs-route-src')) map.removeSource('bs-route-src');
      } catch (e) {}
    }

    // ---- Bus Stops ---------------------------------------------------------
    setStops(stops, onClick) {
      this.clearStops();
      if (!this.map || !Array.isArray(stops)) return;

      this.stopMarkers = stops.map((stop, idx) => {
        const el = document.createElement('div');
        el.className = 'bs-stop-marker';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `Bus stop: ${stop.name}`);
        el.innerHTML = `
          <div class="stop-marker-pin">
            <span class="stop-marker-icon">🚏</span>
          </div>
          <span class="stop-marker-label">${stop.name}</span>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          if (typeof onClick === 'function') onClick(stop);
        });

        const marker = new global.maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([parseFloat(stop.longitude), parseFloat(stop.latitude)])
          .addTo(this.map);

        return marker;
      });
    }

    clearStops() {
      if (this.stopMarkers && Array.isArray(this.stopMarkers)) {
        this.stopMarkers.forEach(m => m.remove());
      }
      this.stopMarkers = [];
    }

    // ---- Active Fleet Buses ------------------------------------------------
    setBuses(buses, onClick) {
      if (!this.map || !Array.isArray(buses)) return;
      if (!this.busMarkers) this.busMarkers = new Map();

      // Normalize plate / vehicle ID for strict de-duplication
      const normKey = (b) => {
        const raw = b.bus_number || b.registration_number || b.id || '';
        return String(raw).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      };

      const uniqueBuses = new Map();
      buses.forEach(b => {
        const k = normKey(b);
        if (!k) return;
        const existing = uniqueBuses.get(k);
        if (!existing) {
          uniqueBuses.set(k, b);
        } else {
          const tNew = new Date(b.location?.updated_at || b.updated_at || 0).getTime();
          const tOld = new Date(existing.location?.updated_at || existing.updated_at || 0).getTime();
          if (tNew >= tOld) uniqueBuses.set(k, b);
        }
      });

      const currentKeys = new Set(uniqueBuses.keys());

      // Remove buses no longer present
      for (const [key, markerObj] of this.busMarkers.entries()) {
        if (!currentKeys.has(key)) {
          markerObj.marker.remove();
          this.busMarkers.delete(key);
        }
      }

      uniqueBuses.forEach((bus, key) => {
        const lat = parseFloat(bus.location?.latitude || bus.latitude);
        const lng = parseFloat(bus.location?.longitude || bus.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const heading = bus.location?.heading != null ? bus.location.heading : (bus.heading || 0);
        const speed = Math.round(bus.location?.speed != null ? bus.location.speed : (bus.speed || 0));
        const shortPlate = bus.bus_number || bus.registration_number || 'BUS';
        const routeLabel = bus.route_name || bus.name || 'Fleet Line';
        const nextStop = bus.next_stop || '';
        const tagText = bus.route_number || shortPlate.split('-').pop() || 'BUS';

        if (this.busMarkers.has(key)) {
          // Update position & rotation smoothly
          const obj = this.busMarkers.get(key);
          obj.marker.setLngLat([lng, lat]);
          const rotEl = obj.element.querySelector('.bus-puck-heading');
          if (rotEl) rotEl.style.transform = `rotate(${heading}deg)`;
          const speedEl = obj.element.querySelector('.bus-puck-card-speed');
          if (speedEl) speedEl.textContent = `${speed} km/h`;
          const subEl = obj.element.querySelector('.bus-puck-card-sub');
          if (subEl) subEl.textContent = routeLabel;
        } else {
          // Create sleek, compact vehicle puck marker
          const el = document.createElement('div');
          el.className = 'bs-bus-marker';
          el.setAttribute('role', 'button');
          el.setAttribute('tabindex', '0');
          el.setAttribute('aria-label', `Bus ${shortPlate}`);
          el.innerHTML = `
            <div class="bus-puck-pulse"></div>
            <div class="bus-puck-circle">
              <div class="bus-puck-heading" style="transform: rotate(${heading}deg);">
                <span class="bus-puck-arrow"></span>
              </div>
              <svg class="bus-puck-icon" viewBox="0 0 24 24">
                <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
              </svg>
            </div>
            <div class="bus-puck-tag">${tagText}</div>
            <div class="bus-puck-card">
              <div class="bus-puck-card-head">
                <span class="bus-puck-card-live"></span>
                <span class="bus-puck-card-plate">${shortPlate}</span>
                <span class="bus-puck-card-speed">${speed} km/h</span>
              </div>
              <div class="bus-puck-card-sub">${routeLabel}</div>
              ${nextStop ? `<div class="bus-puck-card-next">Next: <strong>${nextStop}</strong></div>` : ''}
              <div class="bus-puck-card-action">Tap to track live ➔</div>
            </div>
          `;

          const handleClick = (e) => {
            e.stopPropagation();
            if (typeof onClick === 'function') onClick(bus);
          };
          el.addEventListener('click', handleClick);
          el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick(e);
            }
          });

          const marker = new global.maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat([lng, lat])
            .addTo(this.map);

          this.busMarkers.set(key, { marker, element: el });
        }
      });
    }

    clearBuses() {
      if (this.busMarkers) {
        for (const obj of this.busMarkers.values()) {
          obj.marker.remove();
        }
        this.busMarkers.clear();
      }
    }

    focusBus(busId) {
      if (!this.busMarkers || !this.map) return;
      const normKey = (s) => String(s || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const k = normKey(busId);
      let busObj = this.busMarkers.get(busId) || this.busMarkers.get(k);
      if (!busObj) {
        for (const [key, obj] of this.busMarkers.entries()) {
          if (normKey(key) === k) { busObj = obj; break; }
        }
      }
      if (busObj) {
        const lngLat = busObj.marker.getLngLat();
        this.map.flyTo({
          center: [lngLat.lng, lngLat.lat],
          zoom: Math.max(this.map.getZoom(), 15),
          speed: 1.4,
          essential: true
        });
      }
    }

    fitBounds(coords) {
      if (!this.map || !coords || coords.length === 0) return;
      const bounds = new global.maplibregl.LngLatBounds();
      coords.forEach(pt => {
        if (Array.isArray(pt)) {
          const lng = pt[0] < 45 && pt[1] > 60 ? pt[1] : pt[0];
          const lat = pt[0] < 45 && pt[1] > 60 ? pt[0] : pt[1];
          bounds.extend([lng, lat]);
        } else if (pt.longitude && pt.latitude) {
          bounds.extend([parseFloat(pt.longitude), parseFloat(pt.latitude)]);
        } else if (pt.lng && pt.lat) {
          bounds.extend([parseFloat(pt.lng), parseFloat(pt.lat)]);
        }
      });
      this.map.fitBounds(bounds, { padding: 60, maxZoom: 16, duration: 1000 });
    }

    // ---- Camera -----------------------------------------------------------
    flyTo(view) {
      if (!this.map) return;
      this.map.flyTo({
        center: [view.lng, view.lat],
        zoom: view.zoom != null ? view.zoom : this.map.getZoom(),
        speed: 1.4,
        curve: 1.4,
        essential: true
      });
    }

    jumpTo(view) {
      if (!this.map) return;
      this.map.jumpTo({
        center: [view.lng, view.lat],
        zoom: view.zoom != null ? view.zoom : this.map.getZoom()
      });
    }

    getZoom() { return this.map ? this.map.getZoom() : null; }
    zoomIn() { if (this.map) this.map.zoomIn({ duration: 300 }); }
    zoomOut() { if (this.map) this.map.zoomOut({ duration: 300 }); }
    resize() { if (this.map) this.map.resize(); }
    getNativeMap() { return this.map; }

    destroy() {
      if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
      if (this.userMarker) { this.userMarker.remove(); this.userMarker = null; }
      this.clearStops();
      this.clearBuses();
      this.clearRoutePolyline();
      if (this.map) { this.map.remove(); this.map = null; }
    }
  }

  global.BusStopMapProviders = { MapLibreProvider };
})(window);
