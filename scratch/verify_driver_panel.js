const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('DRIVER PANEL COMPREHENSIVE E2E VERIFICATION SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, name, details = '') {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total}: ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total}: ${name} - ${details}`);
    }
  }

  // Test 1: Driver Location GPS Broadcast
  const locRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v2/driver/location',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    busId: 'UK07-PA-8842',
    busNumber: 'UK07-PA-8842',
    driverName: 'Vivek Rautela',
    routeName: 'Dehradun (ISBT) ➔ Rishikesh',
    latitude: 30.2550,
    longitude: 78.0450,
    speed: 48,
    heading: 45,
    currentStop: 'Prem Nagar',
    nextStop: 'Doiwala',
    etaMinutes: 4
  });
  assert(locRes.status === 200 && locRes.data.success, 'Driver Location Broadcast (GPS)', JSON.stringify(locRes.data));

  // Test 2: Trip Status State Transition to IN_TRANSIT
  const tripRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v2/driver/trip-status',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    busId: 'UK07-PA-8842',
    status: 'IN_TRANSIT',
    currentStop: 'Prem Nagar',
    nextStop: 'Doiwala',
    etaMinutes: 4
  });
  assert(tripRes.status === 200 && tripRes.data.success, 'Driver Trip Status Transition (IN_TRANSIT)', JSON.stringify(tripRes.data));

  // Test 3: Driver Manifest Retrieval
  const manifestRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v2/driver/manifest?busId=UK07-PA-8842',
    method: 'GET'
  });
  assert(manifestRes.status === 200 && manifestRes.data.success && Array.isArray(manifestRes.data.manifest), 'Driver Passenger Manifest', `Count: ${manifestRes.data.count}`);

  // Test 4: Driver Report Incident / Advisory
  const incRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v2/driver/incident',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    busId: 'UK07-PA-8842',
    driverName: 'Vivek Rautela',
    incidentType: 'Traffic Congestion',
    message: 'Slow moving traffic near Doiwala flyover due to mountain road maintenance.',
    location: 'Doiwala Bypass'
  });
  assert(incRes.status === 200 && incRes.data.success && incRes.data.incident?.id, 'Driver Incident & Delay Reporting', JSON.stringify(incRes.data));

  // Test 5: Get Driver Incidents
  const getIncRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v2/driver/incident?busId=UK07-PA-8842',
    method: 'GET'
  });
  assert(getIncRes.status === 200 && getIncRes.data.success && getIncRes.data.incidents.length > 0, 'Driver Incidents Feed', `Found: ${getIncRes.data.count}`);

  // Test 6: Verify Bus Location in Live Fleet
  const busesRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v2/buses',
    method: 'GET'
  });
  const updatedBus = busesRes.data.buses?.find(b => b.bus_number === 'UK07-PA-8842');
  assert(updatedBus && updatedBus.location?.latitude === 30.2550, 'Bus Position Reflected in Live Passenger Fleet', `Lat: ${updatedBus?.location?.latitude}`);

  // Test 7: Complete Trip Status Transition to COMPLETED
  const endTripRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v2/driver/trip-status',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    busId: 'UK07-PA-8842',
    status: 'COMPLETED',
    currentStop: 'Rishikesh (Triveni Ghat)'
  });
  assert(endTripRes.status === 200 && endTripRes.data.success, 'Driver End Trip Transition (COMPLETED)', JSON.stringify(endTripRes.data));

  console.log(`\n==================================================`);
  console.log(`RESULT: ${passed}/${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
  console.log(`==================================================`);
  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
