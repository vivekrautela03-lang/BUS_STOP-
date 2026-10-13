const http = require('http');

function req(method, urlStr, data = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) {
      const bodyStr = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    const r = http.request(options, (res) => {
      let buf = '';
      res.on('data', chunk => buf += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(buf) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: buf });
        }
      });
    });
    r.on('error', reject);
    if (data) r.write(JSON.stringify(data));
    r.end();
  });
}

async function verifyRealTimeEngine() {
  console.log('=== REAL-TIME ENGINE VERIFICATION ===');

  // 1. Check clean initial fleet
  const fleet1 = await req('GET', 'http://localhost:3000/api/v2/buses');
  console.log('1. Initial fleet count (should be 0):', fleet1.body.count);

  // 2. Real driver goes online and broadcasts live GPS
  const driverGps = {
    busId: 'bus_vivek_live',
    busNumber: 'UK-07-PA-8842',
    registrationNumber: 'UK-07-PA-8842',
    driverName: 'Captain Vivek',
    driverPhone: '+91 9068850966',
    routeName: 'Dehradun ISBT ➔ Mussoorie Express',
    routeNumber: '102',
    latitude: 30.3244,
    longitude: 78.0416,
    speed: 42,
    heading: 35,
    currentStop: 'Clock Tower',
    nextStop: 'Rajpur Road',
    etaMinutes: 6
  };
  const broadcastRes = await req('POST', 'http://localhost:3000/api/v2/driver/location', driverGps);
  console.log('2. Real driver location broadcast success:', broadcastRes.body.success);

  // 3. Passenger sees live bus in real-time
  const fleet2 = await req('GET', 'http://localhost:3000/api/v2/buses');
  console.log('3. Live fleet count after driver went online:', fleet2.body.count);
  if (fleet2.body.buses && fleet2.body.buses.length > 0) {
    const liveBus = fleet2.body.buses[0];
    console.log(`   Found live bus: ${liveBus.bus_number} operated by ${liveBus.driver_name} at [${liveBus.location.latitude}, ${liveBus.location.longitude}]`);
  }

  // 4. Passenger books a real seat on this live bus
  const bookingPayload = {
    userId: '2e7c3865-4fda-42ed-b46d-141356e88003', // Real logged in user vivekrautela03@gmail.com
    busId: 'bus_vivek_live',
    seatNumber: '02A',
    passengerName: 'vivek rautela',
    passengerPhone: '+919068850966',
    fareAmount: 55.00,
    boardingStop: 'Clock Tower',
    destinationStop: 'Mussoorie Library Point'
  };
  const bookRes = await req('POST', 'http://localhost:3000/api/v2/bookings', bookingPayload);
  console.log('4. Real seat booking status:', bookRes.status, 'reference:', bookRes.body.booking?.booking_reference);

  // 5. Check real user bookings
  const userBookings = await req('GET', 'http://localhost:3000/api/v2/bookings/user/2e7c3865-4fda-42ed-b46d-141356e88003');
  console.log('5. User real bookings count:', userBookings.body.count);

  console.log('=== VERIFICATION COMPLETE ===');
}

verifyRealTimeEngine().catch(console.error);
