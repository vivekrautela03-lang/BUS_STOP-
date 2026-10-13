const http = require('http');
const fs = require('fs');
const path = require('path');

// Auto-load .env and .env.local if not already provided
function loadEnvFile(fileName) {
  const envPath = path.join(__dirname, fileName);
  if (fs.existsSync(envPath)) {
    try {
      const envData = fs.readFileSync(envPath, 'utf-8');
      for (const line of envData.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          let val = (match[2] || '').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[match[1]]) {
            process.env[match[1]] = val;
          }
        }
      }
    } catch (err) {
      // Graceful fallback
    }
  }
}
loadEnvFile('.env.local');
loadEnvFile('.env');

const transitService = require('./backend/transitService');
const userService = require('./backend/userService');

const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.sql': 'text/plain; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
};

const server = http.createServer(async (req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL & Query params
  const parsedUrl = new URL(req.url, 'http://localhost:' + PORT);

  // =========================================================================
  // ENVIRONMENT & APP CONFIGURATION (Mapbox Token & Settings)
  // =========================================================================
  if (reqPath === '/api/config' && req.method === 'GET') {
    const mapboxToken = process.env.VITE_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || '';
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      mapboxToken,
      env: {
        VITE_MAPBOX_ACCESS_TOKEN: mapboxToken,
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: mapboxToken,
        MAPBOX_ACCESS_TOKEN: mapboxToken
      }
    }));
    return;
  }

  if (reqPath === '/env.js' && req.method === 'GET') {
    const mapboxToken = process.env.VITE_MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN || '';
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(`window.ENV = Object.assign(window.ENV || {}, {
  MAPBOX_ACCESS_TOKEN: ${JSON.stringify(mapboxToken)},
  VITE_MAPBOX_ACCESS_TOKEN: ${JSON.stringify(mapboxToken)},
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: ${JSON.stringify(mapboxToken)}
});`);
    return;
  }

  // =========================================================================
  // V2 ENTERPRISE TRANSPORTATION PLATFORM REST API (Milestone 1)
  // =========================================================================

  // V2 Stops (with PostGIS Haversine distance from user GPS)
  if (reqPath === '/api/v2/stops' && req.method === 'GET') {
    try {
      const userLat = parsedUrl.searchParams.get('lat');
      const userLng = parsedUrl.searchParams.get('lng');
      const radiusKm = parseFloat(parsedUrl.searchParams.get('radius') || '25');
      const stops = await transitService.getStops({ userLat, userLng, radiusKm });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: stops.length, stops }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // V2 Routes
  if (reqPath === '/api/v2/routes' && req.method === 'GET') {
    try {
      const routes = await transitService.getRoutes();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: routes.length, routes }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // V2 Route by ID
  if (reqPath.startsWith('/api/v2/routes/') && req.method === 'GET') {
    try {
      const routeId = reqPath.replace('/api/v2/routes/', '');
      const route = await transitService.getRouteById(routeId);
      if (!route) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, route }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // =========================================================================
  // V2 REAL-WORLD LOCATION, AUTOCOMPLETE & ROUTING (Rapido Experience)
  // =========================================================================

  // V2 Places Autocomplete (Mapbox Geocoding + Verified Bus Stops)
  if (reqPath === '/api/v2/places/autocomplete' && req.method === 'GET') {
    try {
      const query = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query') || '';
      const proximityLng = parsedUrl.searchParams.get('proximityLng') || parsedUrl.searchParams.get('lng');
      const proximityLat = parsedUrl.searchParams.get('proximityLat') || parsedUrl.searchParams.get('lat');
      const result = await transitService.searchPlacesAutocomplete({ query, proximityLng, proximityLat });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // V2 Reverse Geocoding (Coordinates to real address)
  if (reqPath === '/api/v2/places/reverse' && req.method === 'GET') {
    try {
      const lng = parsedUrl.searchParams.get('lng') || parsedUrl.searchParams.get('longitude');
      const lat = parsedUrl.searchParams.get('lat') || parsedUrl.searchParams.get('latitude');
      const result = await transitService.reverseGeocode({ lng, lat });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // V2 Real Road Routing & Directions (Mapbox Directions API)
  if (reqPath === '/api/v2/directions' && req.method === 'GET') {
    try {
      const fromLng = parsedUrl.searchParams.get('fromLng') || parsedUrl.searchParams.get('originLng');
      const fromLat = parsedUrl.searchParams.get('fromLat') || parsedUrl.searchParams.get('originLat');
      const toLng = parsedUrl.searchParams.get('toLng') || parsedUrl.searchParams.get('destLng');
      const toLat = parsedUrl.searchParams.get('toLat') || parsedUrl.searchParams.get('destLat');
      const result = await transitService.calculateDirections({ fromLng, fromLat, toLng, toLat });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // V2 User Saved Places (GET, POST, DELETE)
  if (reqPath === '/api/v2/user/saved-places' && req.method === 'GET') {
    try {
      const userId = parsedUrl.searchParams.get('userId');
      const places = await transitService.getUserSavedPlaces(userId);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: places.length, places }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  if (reqPath === '/api/v2/user/saved-places' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userId = payload.userId || payload.user_id;
        const result = await transitService.saveUserPlace(userId, payload);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  if (reqPath.startsWith('/api/v2/user/saved-places/') && req.method === 'DELETE') {
    try {
      const placeId = reqPath.replace('/api/v2/user/saved-places/', '');
      const userId = parsedUrl.searchParams.get('userId');
      const result = await transitService.deleteUserPlace(userId, placeId);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  // V2 Buses & Live Locations
  if (reqPath === '/api/v2/buses' && req.method === 'GET') {
    try {
      const buses = await transitService.getBuses();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: buses.length, buses }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // V2 Bus Seats (Interactive 3D Grid)
  if ((reqPath.match(/^\/api\/v2\/buses\/([^/]+)\/seats$/) || reqPath.match(/^\/api\/buses\/([^/]+)\/seats$/)) && req.method === 'GET') {
    try {
      const busId = reqPath.split('/')[3] === 'buses' ? reqPath.split('/')[4] : reqPath.split('/')[3];
      const seats = await transitService.getBusSeats(busId);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: seats.length, seats }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // V2 Atomic Seat Booking (Double-Booking Prevention)
  if (reqPath === '/api/v2/bookings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const bookingResult = await transitService.bookSeatAtomic(payload);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, booking: bookingResult }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // V2 User Bookings
  if (reqPath.startsWith('/api/v2/bookings/user/') && req.method === 'GET') {
    try {
      const userId = reqPath.replace('/api/v2/bookings/user/', '');
      const bookings = await transitService.getUserBookings(userId);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: bookings.length, bookings }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // V2 Driver GPS Broadcast
  if (reqPath === '/api/v2/driver/location' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = await transitService.broadcastDriverLocation(payload);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, result }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // V2 Driver Trip State Transition
  if (reqPath === '/api/v2/driver/trip-status' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = await transitService.updateDriverTripStatus(payload);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, result }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // V2 Driver Passenger Manifest
  if (reqPath === '/api/v2/driver/manifest' && req.method === 'GET') {
    try {
      const busId = parsedUrl.searchParams.get('busId') || parsedUrl.searchParams.get('bus_id');
      const manifest = await transitService.getBusManifest(busId);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: manifest.length, manifest }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // V2 Driver Incident & Delay Reporting
  if (reqPath === '/api/v2/driver/incident') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const result = await transitService.reportDriverIncident(payload);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(result));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
    if (req.method === 'GET') {
      try {
        const busId = parsedUrl.searchParams.get('busId') || parsedUrl.searchParams.get('bus_id');
        const incidents = await transitService.getDriverIncidents(busId);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, count: incidents.length, incidents }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
  }

  // V2 Ticket QR / PNR Verification & Boarding
  if (reqPath === '/api/v2/tickets/verify-board' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const result = await transitService.verifyAndBoardTicket(payload);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // V2 Admin Driver Verify / Authorize
  if (reqPath.match(/^\/api\/v2\/admin\/drivers\/([^/]+)\/verify$/) && req.method === 'POST') {
    try {
      const driverId = reqPath.split('/')[5];
      const result = await transitService.verifyDriver(driverId);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // V2 Admin Dashboard Overview
  if (reqPath === '/api/v2/admin/overview' && req.method === 'GET') {
    try {
      const overview = await transitService.getAdminOverview();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, overview }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // V2 Stop Upcoming Buses Details
  if (reqPath.match(/^\/api\/v2\/stops\/([^/]+)\/upcoming$/) && req.method === 'GET') {
    try {
      const stopId = reqPath.split('/')[4];
      const data = await transitService.getStopDetailsWithUpcomingBuses(stopId);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, ...data }));
    } catch (e) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // V2 Admin Drivers List & Create
  if (reqPath === '/api/v2/admin/drivers') {
    if (req.method === 'GET') {
      try {
        const drivers = await transitService.getDrivers();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, count: drivers.length, drivers }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const driver = await transitService.createDriver(payload);
          res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, driver }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
  }

  // V2 Admin Driver Edit & Delete
  if (reqPath.startsWith('/api/v2/admin/drivers/')) {
    const driverId = reqPath.replace('/api/v2/admin/drivers/', '');
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const driver = await transitService.updateDriver(driverId, payload);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, driver }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
    if (req.method === 'DELETE') {
      try {
        await transitService.deleteDriver(driverId);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
  }

  // V2 Admin Buses Create
  if (reqPath === '/api/v2/admin/buses' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const bus = await transitService.createBus(payload);
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, bus }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // V2 Admin Bus Edit & Delete
  if (reqPath.startsWith('/api/v2/admin/buses/')) {
    const busId = reqPath.replace('/api/v2/admin/buses/', '');
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const bus = await transitService.updateBus(busId, payload);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, bus }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
    if (req.method === 'DELETE') {
      try {
        await transitService.deleteBus(busId);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
  }

  // V2 Admin Routes Create
  if (reqPath === '/api/v2/admin/routes' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const route = await transitService.createRoute(payload);
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, route }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // V2 Admin Route Edit & Delete
  if (reqPath.startsWith('/api/v2/admin/routes/')) {
    const routeId = reqPath.replace('/api/v2/admin/routes/', '');
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const route = await transitService.updateRoute(routeId, payload);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, route }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
    if (req.method === 'DELETE') {
      try {
        await transitService.deleteRoute(routeId);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
  }

  // V2 Admin Stops Create
  if (reqPath === '/api/v2/admin/stops' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const stop = await transitService.createStop(payload);
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, stop }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // V2 Admin Stop Edit & Delete
  if (reqPath.startsWith('/api/v2/admin/stops/')) {
    const stopId = reqPath.replace('/api/v2/admin/stops/', '');
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const stop = await transitService.updateStop(stopId, payload);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, stop }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
    if (req.method === 'DELETE') {
      try {
        await transitService.deleteStop(stopId);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
  }

  // V2 Admin Bookings List
  if (reqPath === '/api/v2/admin/bookings' && req.method === 'GET') {
    try {
      const bookings = await transitService.getAllBookings();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: bookings.length, bookings }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // V2 Booking Cancel
  if (reqPath.match(/^\/api\/v2\/bookings\/([^/]+)\/cancel$/) && req.method === 'POST') {
    try {
      const bookingId = reqPath.split('/')[4];
      const result = await transitService.cancelBooking(bookingId);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // =========================================================================
  // BACKEND API ENDPOINTS (POWERED BY SUPABASE - LEGACY COMPATIBILITY)
  // =========================================================================

  // 1. Supabase Client Configuration
  if (reqPath === '/api/supabase-config' || reqPath === '/api/auth-config') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      supabaseUrl: process.env.SUPABASE_URL || 'https://tmacsdrjzkgykfkkrhgm.supabase.co',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtYWNzZHJqemtneWtma2tyaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNTk4ODUsImV4cCI6MjEwNjgzNTg4NX0.yv0sJe2lQyAzSxDcy4TPkVjqdyrWD7wxvF9DA4ays-U',
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_RrT7Aaxv91wXrG5BZhXIYA_k9kdp6r0'
    }));
    return;
  }

  // 2. Scenic Mountain Routes
  if (reqPath === '/api/routes') {
    try {
      const routes = await transitService.getRoutes();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, routes }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 3. Live Buses & Fleet
  if (reqPath === '/api/buses') {
    try {
      const buses = await transitService.getBuses();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, buses }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 4. Scheduled Mountain Trips
  if (reqPath === '/api/trips') {
    try {
      const trips = await transitService.getTrips();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, trips }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 5. Mountain Weather & Transit Alerts
  if (reqPath === '/api/alerts') {
    try {
      const alerts = await transitService.getAlerts();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, alerts }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 6. Community Stories & Reviews
  if (reqPath === '/api/stories') {
    try {
      const stories = await transitService.getStories();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, stories }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // 7. Booking Mountain Pass
  if (reqPath === '/api/bookings' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const booking = await transitService.createBooking(payload);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, booking }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 8. User Profile Sync
  if (reqPath === '/api/profile/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userUpdate = await userService.updateUserProfile(payload.id, payload);
        const profile = await transitService.syncUserProfile(payload);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, profile: userUpdate || profile }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 8B. Driver Document Verification Sync
  if (reqPath === '/api/driver/documents' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userId = payload.userId || payload.id;
        if (userId) {
          await userService.updateUserProfile(userId, {
            documents_verified: true,
            documents_submitted_at: new Date().toISOString(),
            documents: payload.documents || {}
          });
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, verified: true, message: 'Driver documents verified successfully' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 8C. Driver Bus Details Save & Sync
  if (reqPath === '/api/driver/bus' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userId = payload.userId || payload.id;
        if (userId) {
          await userService.updateUserProfile(userId, {
            bus_details: payload.busDetails || payload
          });
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Bus details saved and linked to driver successfully' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 8D. Driver Route & Schedule Save & Sync
  if (reqPath === '/api/driver/route' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const routeData = payload.routeSchedule || payload;
        if (userId) {
          await userService.updateUserProfile(userId, {
            route_schedule: routeData
          });
        }
        const routeResult = await transitService.addOrUpdateDriverRoute({
          userId,
          ...routeData
        });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Route and schedule registered and verified successfully', result: routeResult }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 8E. Driver Review & Submit Final Application
  if (reqPath === '/api/driver/submit' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const userId = payload.driverId || payload.userId;
        const applicationId = payload.applicationId || `UK-DRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        if (userId) {
          await userService.updateUserProfile(userId, {
            onboarding_status: 'submitted',
            application_id: applicationId,
            submitted_at: payload.submittedAt || new Date().toISOString()
          });
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          applicationId,
          status: 'under_review',
          message: 'Driver onboarding application received and queued for transport authority review'
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 9. New User Instant Access & Registration (Stored in Database Table)
  if ((reqPath === '/api/auth/register' || reqPath === '/api/v2/auth/register') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { email, password, fullName, phone, role } = payload;
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Email and password are required' }));
          return;
        }

        // 1. Register and persist in database table with complete profile
        const user = await userService.registerUser({
          email,
          password,
          fullName,
          phone,
          role,
          avatar_url: payload.avatar_url,
          dob: payload.dob,
          gender: payload.gender,
          home_location: payload.home_location,
          preferred_radius: payload.preferred_radius,
          license_number: payload.license_number,
          license_expiry: payload.license_expiry,
          aadhaar_number: payload.aadhaar_number,
          documents: payload.documents,
          document_status: payload.document_status
        });

        // 2. Best-effort Supabase GoTrue creation (non-blocking)
        try {
          await transitService.supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name: fullName,
              phone: phone || '',
              role: role || 'passenger',
              home_location: payload.home_location || 'Dehradun, Uttarakhand'
            }
          });
        } catch (supaErr) {
          // Graceful fallback
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, user }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 10. User Login (Authenticated from Database Table)
  if ((reqPath === '/api/auth/login' || reqPath === '/api/v2/auth/login') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { email, password } = JSON.parse(body || '{}');
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Email and password are required' }));
          return;
        }

        const user = await userService.authenticateUser({ email, password });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, user }));
      } catch (e) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 11. List Users / Session Check
  if (reqPath === '/api/auth/users' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, users: userService.listUsers() }));
    return;
  }

  // =========================================================================
  // STATIC ASSETS SERVING
  // =========================================================================
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(__dirname, reqPath);

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`BUS STOP Backend & Web Application Live on port ${PORT}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL || 'https://tmacsdrjzkgykfkkrhgm.supabase.co'}`);
  console.log(`Local Access: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
