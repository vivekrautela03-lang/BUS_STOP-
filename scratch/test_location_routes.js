const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING COMPREHENSIVE LOCATION & ROUTE INTEGRATION TEST ---');
  let passed = 0;
  let total = 0;

  function assert(desc, condition) {
    total++;
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
    }
  }

  // 1. Test Autocomplete for "Pacific Mall"
  try {
    const res = await get('http://localhost:3000/api/v2/places/autocomplete?q=Pacific%20Mall');
    assert('Autocomplete API status is 200', res.status === 200);
    assert('Autocomplete returns results array', Array.isArray(res.data.results));
    assert('Autocomplete returns at least 1 result', res.data.results.length > 0);
    const first = res.data.results[0];
    assert('Autocomplete result has title, subtitle, lng, lat', first.title && typeof first.lng === 'number' && typeof first.lat === 'number');
    console.log(`      Found: "${first.title}" at [${first.lng}, ${first.lat}]`);
  } catch (err) {
    assert('Autocomplete Pacific Mall failed', false);
  }

  // 2. Test Autocomplete for verified transit stop "ISBT"
  try {
    const res = await get('http://localhost:3000/api/v2/places/autocomplete?q=ISBT');
    assert('Autocomplete ISBT returns verified bus stops', res.data.results.some(r => r.is_verified_stop || r.title.includes('ISBT')));
  } catch (err) {
    assert('Autocomplete ISBT failed', false);
  }

  // 3. Test Empty Autocomplete
  try {
    const res = await get('http://localhost:3000/api/v2/places/autocomplete?q=');
    assert('Empty query returns empty results without crashing', res.data.results.length === 0);
  } catch (err) {
    assert('Empty query failed', false);
  }

  // 4. Test Reverse Geocode
  try {
    const res = await get('http://localhost:3000/api/v2/places/reverse?lng=78.0081&lat=30.2882');
    assert('Reverse Geocode status is 200', res.status === 200);
    assert('Reverse Geocode returns place_name and title', Boolean(res.data.place_name || res.data.title));
    console.log(`      Reverse geocoded: "${res.data.place_name}"`);
  } catch (err) {
    assert('Reverse Geocode failed', false);
  }

  // 5. Test Directions Calculation (ISBT Dehradun [78.0081, 30.2882] to Pacific Mall [78.0775, 30.3621])
  try {
    const res = await get('http://localhost:3000/api/v2/directions?fromLng=78.0081&fromLat=30.2882&toLng=78.0775&toLat=30.3621');
    assert('Directions API status is 200', res.status === 200);
    assert('Directions API returns success true', res.data.success === true);
    assert('Directions calculates realistic distance (km)', typeof res.data.distanceKm === 'number' && res.data.distanceKm > 5 && res.data.distanceKm < 25);
    assert('Directions calculates travel duration', typeof res.data.durationMinutes === 'number' && res.data.durationMinutes > 0);
    assert('Directions returns polyline coordinates', Array.isArray(res.data.coordinates) && res.data.coordinates.length > 50);
    console.log(`      Route: ${res.data.distanceKm} km, ${res.data.durationFormatted}, ${res.data.coordinates.length} waypoints, transit available: ${res.data.is_transit_available}`);
  } catch (err) {
    assert('Directions failed', false);
  }

  // 6. Test Long-Distance Directions with Road Navigation vs Transit Disambiguation (Dehradun to Delhi)
  try {
    const res = await get('http://localhost:3000/api/v2/directions?fromLng=78.0322&fromLat=30.3165&toLng=77.2090&toLat=28.6139');
    assert('Dehradun-Delhi Directions succeeded', res.data.success === true);
    assert('Dehradun-Delhi distance is > 200 km', res.data.distanceKm > 200);
    console.log(`      Dehradun-Delhi: ${res.data.distanceKm} km, ${res.data.durationFormatted}`);
  } catch (err) {
    assert('Long-distance directions failed', false);
  }

  // 7. Test User Saved Places CRUD
  try {
    const testPlace = {
      userId: 'test-passenger-user',
      label: 'Office',
      place_name: 'Pacific Mall Business Center, Rajpur Road',
      latitude: 30.3621,
      longitude: 78.0775,
      category: 'work'
    };
    const postRes = await post('http://localhost:3000/api/v2/user/saved-places', testPlace);
    assert('Saved Place POST returns success', postRes.data.success === true);
    const getRes = await get('http://localhost:3000/api/v2/user/saved-places?userId=test-passenger-user');
    assert('Saved Places GET returns saved items', Array.isArray(getRes.data.places) && getRes.data.places.length > 0);
  } catch (err) {
    assert('User saved places failed', false);
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log(`========================================`);
}

runTests();
