// ============================================================================
// BUS STOP — PASSENGER PANEL VERIFICATION TEST SUITE
// Tests all passenger workflows: Search, Route matching, Seat selection,
// Atomic Booking, PNR verification, Ticket Cancellation, and Live Bus Tracking sync.
// ============================================================================

const BASE_URL = 'http://localhost:3000';

async function verifyPassengerWorkflows() {
  console.log('🚍 Starting Comprehensive Passenger Panel Verification...\n');
  const results = {};

  // 1. STOPS & ROUTES DISCOVERY
  try {
    const [stopsRes, routesRes, busesRes] = await Promise.all([
      fetch(`${BASE_URL}/api/v2/stops`),
      fetch(`${BASE_URL}/api/v2/routes`),
      fetch(`${BASE_URL}/api/v2/buses`)
    ]);

    const stopsRaw = await stopsRes.json();
    const routesRaw = await routesRes.json();
    const busesRaw = await busesRes.json();

    const stops = Array.isArray(stopsRaw) ? stopsRaw : (stopsRaw.stops || []);
    const routes = Array.isArray(routesRaw) ? routesRaw : (routesRaw.routes || []);
    const buses = Array.isArray(busesRaw) ? busesRaw : (busesRaw.buses || []);

    if (!Array.isArray(stops) || stops.length === 0) throw new Error('No stops returned');
    if (!Array.isArray(routes) || routes.length === 0) throw new Error('No routes returned');
    if (!Array.isArray(buses) || buses.length === 0) throw new Error('No buses returned');

    results['1. Stops & Routes Discovery'] = {
      passed: true,
      stopCount: stops.length,
      routeCount: routes.length,
      busCount: buses.length
    };
    console.log(`✅ 1. Stops & Routes Discovery: Found ${stops.length} stops, ${routes.length} routes, ${buses.length} buses.`);
  } catch (e) {
    results['1. Stops & Routes Discovery'] = { passed: false, error: e.message };
    console.error('❌ 1. Discovery failed:', e.message);
  }

  // 2. CORRIDOR SEARCH & BUS MATCHING
  let selectedBus = null;
  try {
    const busesRes = await fetch(`${BASE_URL}/api/v2/buses`);
    const busesRaw = await busesRes.json();
    const buses = Array.isArray(busesRaw) ? busesRaw : (busesRaw.buses || []);

    selectedBus = buses[0];
    if (!selectedBus) throw new Error('No bus available to test');

    // Test distance & ETA computation to passenger pickup point
    const passengerPickupCoords = [77.9620, 30.3398]; // Prem Nagar Depot
    const bLat = parseFloat(selectedBus.location?.latitude || selectedBus.latitude);
    const bLng = parseFloat(selectedBus.location?.longitude || selectedBus.longitude);

    const R = 6371;
    const dLat = (passengerPickupCoords[1] - bLat) * Math.PI / 180;
    const dLon = (passengerPickupCoords[0] - bLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(bLat * Math.PI / 180) * Math.cos(passengerPickupCoords[1] * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const speed = selectedBus.location?.speed || selectedBus.speed || 40;
    const etaMin = Math.max(1, Math.round((distKm / speed) * 60));

    results['2. Corridor Search & Live ETA'] = {
      passed: true,
      busId: selectedBus.id,
      distanceKm: distKm.toFixed(2),
      etaMin
    };
    console.log(`✅ 2. Corridor Search & Live ETA: Bus ${selectedBus.bus_number} is ${distKm.toFixed(2)} km away, ETA ~${etaMin} min.`);
  } catch (e) {
    results['2. Corridor Search & Live ETA'] = { passed: false, error: e.message };
    console.error('❌ 2. Route matching failed:', e.message);
  }

  // 3. CABIN SEATS RETRIEVAL
  let availableSeatNumber = null;
  try {
    const seatsRes = await fetch(`${BASE_URL}/api/v2/buses/${selectedBus.id}/seats`);
    if (!seatsRes.ok) throw new Error(`HTTP ${seatsRes.status}`);
    const seatsRaw = await seatsRes.json();
    const seats = Array.isArray(seatsRaw) ? seatsRaw : (seatsRaw.seats || []);

    if (!Array.isArray(seats) || seats.length === 0) throw new Error('Seats array empty');

    const availableSeats = seats.filter(s => s.status !== 'BOOKED' && s.status !== 'OCCUPIED');
    if (availableSeats.length === 0) throw new Error('No available seats found');

    availableSeatNumber = availableSeats[0].seat_number;
    results['3. Cabin Seats Grid'] = {
      passed: true,
      totalSeats: seats.length,
      availableCount: availableSeats.length,
      firstAvailable: availableSeatNumber
    };
    console.log(`✅ 3. Cabin Seats Grid: Loaded ${seats.length} seats (${availableSeats.length} available, test seat: ${availableSeatNumber}).`);
  } catch (e) {
    results['3. Cabin Seats Grid'] = { passed: false, error: e.message };
    console.error('❌ 3. Cabin seats failed:', e.message);
  }

  // 4. ATOMIC TICKET BOOKING & PNR GENERATION
  let createdBooking = null;
  const testPassengerId = `test_passenger_${Date.now()}`;
  try {
    const bookRes = await fetch(`${BASE_URL}/api/v2/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bus_id: selectedBus.id,
        passenger_id: testPassengerId,
        passenger_name: 'Test Passenger Vivek',
        seat_number: availableSeatNumber,
        boarding_stop: 'Prem Nagar Depot',
        destination_stop: 'Rajpur Road',
        fare: selectedBus.fare || 55
      })
    });

    const bookData = await bookRes.json();
    if (!bookRes.ok || !bookData.success) throw new Error(bookData.error || 'Booking failed');

    createdBooking = bookData.booking?.booking || bookData.booking;
    if (!createdBooking.booking_reference) throw new Error('PNR missing in booking response');

    results['4. Atomic Ticket Booking'] = {
      passed: true,
      bookingId: createdBooking.id,
      pnr: createdBooking.booking_reference,
      seat: createdBooking.seat_number
    };
    console.log(`✅ 4. Atomic Ticket Booking: Successfully booked seat ${availableSeatNumber}! PNR: ${createdBooking.booking_reference}`);
  } catch (e) {
    results['4. Atomic Ticket Booking'] = { passed: false, error: e.message };
    console.error('❌ 4. Booking failed:', e.message);
  }

  // 5. DOUBLE-BOOKING PREVENTION CHECK
  try {
    const dupRes = await fetch(`${BASE_URL}/api/v2/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bus_id: selectedBus.id,
        passenger_id: 'another_user',
        passenger_name: 'Conflict User',
        seat_number: availableSeatNumber, // SAME SEAT
        boarding_stop: 'Prem Nagar Depot',
        destination_stop: 'Rajpur Road',
        fare: 55
      })
    });

    const dupData = await dupRes.json();
    if (dupRes.ok && dupData.success) {
      throw new Error('Collision error: Double booking was allowed on same seat!');
    }

    results['5. Double-Booking Prevention'] = { passed: true, preventedCollision: true };
    console.log(`✅ 5. Double-Booking Prevention: Successfully rejected conflicting reservation on ${availableSeatNumber}.`);
  } catch (e) {
    results['5. Double-Booking Prevention'] = { passed: false, error: e.message };
    console.error('❌ 5. Collision check failed:', e.message);
  }

  // 6. USER BOOKINGS MANIFEST RETRIEVAL
  try {
    const myBookingsRes = await fetch(`${BASE_URL}/api/v2/bookings/user/${testPassengerId}`);
    if (!myBookingsRes.ok) throw new Error(`HTTP ${myBookingsRes.status}`);
    const myData = await myBookingsRes.json();

    if (!myData.bookings || myData.bookings.length === 0) throw new Error('User booking not listed in manifest');

    results['6. User Bookings Manifest'] = { passed: true, count: myData.bookings.length };
    console.log(`✅ 6. User Bookings Manifest: Retrieved ${myData.bookings.length} active ticket(s) for passenger.`);
  } catch (e) {
    results['6. User Bookings Manifest'] = { passed: false, error: e.message };
    console.error('❌ 6. User bookings failed:', e.message);
  }

  // 7. REAL-TIME DRIVER BROADCAST & PASSENGER TELEMETRY SYNC
  try {
    const liveLat = 30.3450;
    const liveLng = 77.9750;
    const liveSpeed = 52.4;

    // Driver broadcasts new location
    const broadcastRes = await fetch(`${BASE_URL}/api/v2/driver/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        busId: selectedBus.id,
        latitude: liveLat,
        longitude: liveLng,
        speed: liveSpeed,
        heading: 95
      })
    });

    if (!broadcastRes.ok) throw new Error('Driver location broadcast failed');

    // Passenger polls /api/v2/buses
    const pollRes = await fetch(`${BASE_URL}/api/v2/buses`);
    const pollBusesRaw = await pollRes.json();
    const pollBuses = Array.isArray(pollBusesRaw) ? pollBusesRaw : (pollBusesRaw.buses || []);
    const updatedBus = pollBuses.find(b => b.id === selectedBus.id);

    if (!updatedBus) throw new Error('Updated bus not found in fleet list');

    const receivedLat = parseFloat(updatedBus.location?.latitude || updatedBus.latitude);
    const receivedLng = parseFloat(updatedBus.location?.longitude || updatedBus.longitude);
    const receivedSpeed = Math.round(updatedBus.location?.speed || updatedBus.speed);

    if (Math.abs(receivedLat - liveLat) > 0.001 || Math.abs(receivedLng - liveLng) > 0.001) {
      throw new Error(`Coordinates mismatch: sent [${liveLat}, ${liveLng}], received [${receivedLat}, ${receivedLng}]`);
    }

    results['7. Passenger Live Telemetry Sync'] = {
      passed: true,
      syncedLat: receivedLat,
      syncedLng: receivedLng,
      syncedSpeed: receivedSpeed
    };
    console.log(`✅ 7. Passenger Live Telemetry Sync: Passenger map received driver GPS [${receivedLat}, ${receivedLng}] @ ${receivedSpeed} km/h.`);
  } catch (e) {
    results['7. Passenger Live Telemetry Sync'] = { passed: false, error: e.message };
    console.error('❌ 7. Live sync failed:', e.message);
  }

  // 8. UPCOMING BUSES AT STOP
  try {
    const stopsRes = await fetch(`${BASE_URL}/api/v2/stops`);
    const stopsRaw = await stopsRes.json();
    const stops = Array.isArray(stopsRaw) ? stopsRaw : (stopsRaw.stops || []);
    const firstStopId = stops[0]?.id || 'stop-101';

    const upRes = await fetch(`${BASE_URL}/api/v2/stops/${firstStopId}/upcoming`);
    if (!upRes.ok) throw new Error(`HTTP ${upRes.status}`);
    const upBuses = await upRes.json();

    results['8. Stop Upcoming Buses'] = { passed: true, stopId: firstStopId, upcomingCount: Array.isArray(upBuses) ? upBuses.length : 0 };
    console.log(`✅ 8. Stop Upcoming Buses: Query for stop ${firstStopId} returned upcoming bus schedule.`);
  } catch (e) {
    results['8. Stop Upcoming Buses'] = { passed: false, error: e.message };
    console.error('❌ 8. Stop upcoming buses failed:', e.message);
  }

  // 9. TICKET CANCELLATION & SEAT RELEASE
  try {
    if (createdBooking && createdBooking.id) {
      const cancelRes = await fetch(`${BASE_URL}/api/v2/bookings/${createdBooking.id}/cancel`, {
        method: 'POST'
      });
      const cancelData = await cancelRes.json();

      if (!cancelRes.ok || !cancelData.success) {
        throw new Error(cancelData.error || 'Cancel failed');
      }

      // Verify seat is released back to available
      const seatsAfterRes = await fetch(`${BASE_URL}/api/v2/buses/${selectedBus.id}/seats`);
      const seatsAfterRaw = await seatsAfterRes.json();
      const seatsAfter = Array.isArray(seatsAfterRaw) ? seatsAfterRaw : (seatsAfterRaw.seats || []);
      const releasedSeat = seatsAfter.find(s => s.seat_number === availableSeatNumber);

      if (releasedSeat && (releasedSeat.status === 'BOOKED' || releasedSeat.status === 'OCCUPIED')) {
        throw new Error('Seat was not released after ticket cancellation');
      }

      results['9. Ticket Cancellation & Seat Release'] = { passed: true, releasedSeat: availableSeatNumber };
      console.log(`✅ 9. Ticket Cancellation & Seat Release: Cancelled PNR ${createdBooking.booking_reference}, seat ${availableSeatNumber} released.`);
    }
  } catch (e) {
    results['9. Ticket Cancellation & Seat Release'] = { passed: false, error: e.message };
    console.error('❌ 9. Cancellation failed:', e.message);
  }

  console.log('\n==================================================');
  console.log('🏁 PASSENGER PANEL VERIFICATION SUMMARY:');
  const allPassed = Object.values(results).every(r => r.passed);
  console.log(allPassed ? '🎉 ALL 9 PASSENGER WORKFLOWS PASSED 100%!' : '⚠️ SOME WORKFLOWS FAILED');
  console.log(JSON.stringify(results, null, 2));
  console.log('==================================================\n');
}

verifyPassengerWorkflows();
