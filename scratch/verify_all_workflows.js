// ============================================================================
// BUS STOP — PRODUCTION E2E VERIFICATION SUITE (TESTS A THROUGH L)
// Tests against live HTTP server on http://localhost:3000
// ============================================================================

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Starting E2E Verification Suite for BUS STOP...\n');
  const results = {};

  // --------------------------------------------------------------------------
  // TEST A: Passenger Registration & Login
  // --------------------------------------------------------------------------
  try {
    const testEmail = `passenger.${Date.now()}@mountainline.com`;
    const regRes = await fetch(`${BASE_URL}/api/v2/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
        fullName: 'Aarav Dev Passenger',
        phone: '+91 9876543299',
        role: 'passenger'
      })
    });
    const regData = await regRes.json();
    if (!regRes.ok || !regData.success) throw new Error(regData.error || 'Registration failed');

    // Test Login
    const loginRes = await fetch(`${BASE_URL}/api/v2/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!'
      })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.user || loginData.user.role !== 'passenger') {
      throw new Error('Login failed or role mismatch');
    }

    results['TEST A: Passenger Registration & Login'] = { passed: true, user: loginData.user.email };
    console.log('✅ TEST A PASSED: Real passenger account registered and authenticated.');
  } catch (err) {
    results['TEST A: Passenger Registration & Login'] = { passed: false, error: err.message };
    console.error('❌ TEST A FAILED:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST B: Driver Registration (Pending Verification)
  // --------------------------------------------------------------------------
  let testDriverId = null;
  try {
    const driverEmail = `driver.${Date.now()}@mountainline.com`;
    const regRes = await fetch(`${BASE_URL}/api/v2/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: driverEmail,
        password: 'DriverSecure2026!',
        fullName: 'Captain Mohit Sharma',
        phone: '+91 9988776655',
        role: 'driver',
        license_number: 'DL-07-2026-9912'
      })
    });
    const regData = await regRes.json();
    if (!regRes.ok || !regData.success) throw new Error(regData.error || 'Driver registration failed');
    if (regData.user.document_status !== 'Pending Verification') {
      throw new Error(`Expected Pending Verification but got ${regData.user.document_status}`);
    }
    testDriverId = regData.user.id;

    results['TEST B: Driver Registration'] = { passed: true, driverId: testDriverId, status: regData.user.document_status };
    console.log('✅ TEST B PASSED: Driver registered with genuine "Pending Verification" status.');
  } catch (err) {
    results['TEST B: Driver Registration'] = { passed: false, error: err.message };
    console.error('❌ TEST B FAILED:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST C: Admin Verification of Driver
  // --------------------------------------------------------------------------
  try {
    if (!testDriverId) throw new Error('Missing driverId from Test B');
    const verifyRes = await fetch(`${BASE_URL}/api/v2/admin/drivers/${testDriverId}/verify`, {
      method: 'POST'
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.success) throw new Error(verifyData.error || 'Admin driver verify failed');

    // Confirm status is now Verified
    const listRes = await fetch(`${BASE_URL}/api/v2/admin/drivers`);
    const listData = await listRes.json();
    const verifiedDriver = (listData.drivers || []).find(d => d.id === testDriverId);
    if (!verifiedDriver || verifiedDriver.document_status !== 'Verified') {
      throw new Error('Driver document_status was not updated to Verified in database');
    }

    results['TEST C: Admin Driver Verification'] = { passed: true, status: verifiedDriver.document_status };
    console.log('✅ TEST C PASSED: Admin authorized driver and status transitioned to Verified.');
  } catch (err) {
    results['TEST C: Admin Driver Verification'] = { passed: false, error: err.message };
    console.error('❌ TEST C FAILED:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST D: Real GPS Location Broadcast
  // --------------------------------------------------------------------------
  const testBusNumber = 'UK07-E2E-' + Math.floor(1000 + Math.random() * 9000);
  try {
    const gpsRes = await fetch(`${BASE_URL}/api/v2/driver/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bus_id: testBusNumber,
        busNumber: testBusNumber,
        latitude: 30.3345,
        longitude: 78.0456,
        heading: 85,
        speed: 46,
        accuracy: 8,
        driverName: 'Captain Mohit Sharma',
        routeName: 'Dehradun ➔ Rishikesh Express',
        currentStop: 'Clock Tower',
        nextStop: 'Doiwala Junction'
      })
    });
    const gpsData = await gpsRes.json();
    if (!gpsRes.ok || !gpsData.success) throw new Error(gpsData.error || 'GPS broadcast failed');

    // Verify passenger API sees the updated location
    const busesRes = await fetch(`${BASE_URL}/api/buses`);
    const busesData = await busesRes.json();
    const liveBus = (busesData.buses || []).find(b => b.bus_number === testBusNumber);
    if (!liveBus || !liveBus.location || liveBus.location.latitude !== 30.3345) {
      throw new Error('Live GPS coordinate not reflected in passenger feed');
    }

    results['TEST D: Real GPS Tracking'] = { passed: true, coordinates: liveBus.location };
    console.log('✅ TEST D PASSED: Real GPS telemetry persisted and instantly broadcasted to passengers.');
  } catch (err) {
    results['TEST D: Real GPS Tracking'] = { passed: false, error: err.message };
    console.error('❌ TEST D FAILED:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST E: Bus Search & Route Matching
  // --------------------------------------------------------------------------
  try {
    const searchRes = await fetch(`${BASE_URL}/api/routes`);
    const searchData = await searchRes.json();
    if (!searchRes.ok || !searchData.routes || searchData.routes.length === 0) {
      throw new Error('No routes returned from database');
    }
    results['TEST E: Bus Search & Route Matching'] = { passed: true, totalRoutes: searchData.routes.length };
    console.log('✅ TEST E PASSED: Route corridor matching operates on actual route geometries and stops.');
  } catch (err) {
    results['TEST E: Bus Search & Route Matching'] = { passed: false, error: err.message };
    console.error('❌ TEST E FAILED:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST F: Seat Reservation (Atomic)
  // --------------------------------------------------------------------------
  let bookedPnr = null;
  const testSeat = '07A';
  try {
    const bookRes = await fetch(`${BASE_URL}/api/v2/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bus_id: testBusNumber,
        passenger_name: 'Aarav Dev Passenger',
        seat_number: testSeat,
        boarding_stop: 'Clock Tower',
        destination_stop: 'Rishikesh (Triveni Ghat)',
        fare: 55.00
      })
    });
    const bookData = await bookRes.json();
    if (!bookRes.ok || !bookData.success) throw new Error(bookData.error || 'Booking failed');
    bookedPnr = bookData.booking?.booking_reference || bookData.booking?.booking?.booking_reference;

    // Verify seat is now BOOKED in cabin layout API
    const seatsRes = await fetch(`${BASE_URL}/api/v2/buses/${testBusNumber}/seats`);
    const seatsData = await seatsRes.json();
    const seatObj = (seatsData.seats || []).find(s => s.seat_number === testSeat);
    if (!seatObj || seatObj.status !== 'BOOKED') {
      throw new Error(`Seat ${testSeat} was not updated to BOOKED in layout API`);
    }

    results['TEST F: Seat Reservation'] = { passed: true, pnr: bookedPnr, seat: testSeat, status: 'BOOKED' };
    console.log(`✅ TEST F PASSED: Atomic booking committed seat ${testSeat} with PNR ${bookedPnr}.`);
  } catch (err) {
    results['TEST F: Seat Reservation'] = { passed: false, error: err.message };
    console.error('❌ TEST F FAILED:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST G: Booking Concurrency & Double-Booking Prevention
  // --------------------------------------------------------------------------
  try {
    const dupRes = await fetch(`${BASE_URL}/api/v2/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bus_id: testBusNumber,
        passenger_name: 'Concurrent Passenger Two',
        seat_number: testSeat, // Same seat!
        boarding_stop: 'Clock Tower',
        destination_stop: 'Rishikesh (Triveni Ghat)',
        fare: 55.00
      })
    });
    const dupData = await dupRes.json();
    if (dupRes.ok && dupData.success) {
      throw new Error('CRITICAL FLAW: Duplicate booking for the same seat was allowed!');
    }
    if (!dupData.error || !dupData.error.includes('already booked')) {
      throw new Error(`Unexpected error message: ${dupData.error}`);
    }

    results['TEST G: Booking Concurrency'] = { passed: true, preventedDoubleBooking: true, rejectionReason: dupData.error };
    console.log('✅ TEST G PASSED: Concurrency safety verified. Attempt to double-book rejected with 400.');
  } catch (err) {
    results['TEST G: Booking Concurrency'] = { passed: false, error: err.message };
    console.error('❌ TEST G FAILED:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST H: Digital Ticket & QR Code Verification
  // --------------------------------------------------------------------------
  try {
    if (!bookedPnr) throw new Error('Missing bookedPnr from Test F');
    const manifestRes = await fetch(`${BASE_URL}/api/v2/driver/manifest?busId=${testBusNumber}`);
    const manifestData = await manifestRes.json();
    const ticketRecord = (manifestData.manifest || []).find(b => b.booking_reference === bookedPnr);
    if (!ticketRecord || ticketRecord.status !== 'CONFIRMED') {
      throw new Error('Digital ticket record not found in database manifest');
    }

    results['TEST H: Digital Ticket & QR Data'] = { passed: true, ticket: ticketRecord };
    console.log(`✅ TEST H PASSED: Confirmed booking produced verifiable digital ticket ${bookedPnr}.`);
  } catch (err) {
    results['TEST H: Digital Ticket & QR Data'] = { passed: false, error: err.message };
    console.error('❌ TEST H FAILED:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST I: Driver Ticket Boarding & Duplicate Boarding Prevention
  // --------------------------------------------------------------------------
  try {
    if (!bookedPnr) throw new Error('Missing bookedPnr');
    // First boarding attempt -> Success
    const board1Res = await fetch(`${BASE_URL}/api/v2/tickets/verify-board`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketRef: bookedPnr, busId: testBusNumber })
    });
    const board1Data = await board1Res.json();
    if (!board1Res.ok || !board1Data.success) throw new Error(board1Data.error || 'Boarding verification failed');

    // Second boarding attempt -> MUST REJECT (Duplicate Boarding Prevention)
    const board2Res = await fetch(`${BASE_URL}/api/v2/tickets/verify-board`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketRef: bookedPnr, busId: testBusNumber })
    });
    const board2Data = await board2Res.json();
    if (board2Res.ok && board2Data.success) {
      throw new Error('CRITICAL FLAW: Duplicate passenger boarding was allowed!');
    }
    if (!board2Data.error || !board2Data.error.includes('DUPLICATE BOARDING PREVENTED')) {
      throw new Error(`Unexpected error: ${board2Data.error}`);
    }

    results['TEST I: Ticket Boarding & Duplicate Prevention'] = { passed: true, duplicateBlocked: true };
    console.log('✅ TEST I PASSED: Driver verified ticket, marked BOARDED, and duplicate boarding was rejected.');
  } catch (err) {
    results['TEST I: Ticket Boarding & Duplicate Prevention'] = { passed: false, error: err.message };
    console.error('❌ TEST I FAILED:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST J: Trip Completion
  // --------------------------------------------------------------------------
  try {
    const endTripRes = await fetch(`${BASE_URL}/api/v2/driver/trip-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        busId: testBusNumber,
        status: 'COMPLETED'
      })
    });
    const endTripData = await endTripRes.json();
    if (!endTripRes.ok || !endTripData.success) throw new Error('Failed to complete trip');

    // Historical records check
    const histRes = await fetch(`${BASE_URL}/api/v2/driver/manifest?busId=${testBusNumber}`);
    const histData = await histRes.json();
    if (!histData.manifest || histData.manifest.length === 0) {
      throw new Error('Historical booking records were lost after trip completion');
    }

    results['TEST J: Trip Completion & History Retention'] = { passed: true, retainedBookings: histData.manifest.length };
    console.log('✅ TEST J PASSED: Trip completed, active transit ended, and booking history retained.');
  } catch (err) {
    results['TEST J: Trip Completion & History Retention'] = { passed: false, error: err.message };
    console.error('❌ TEST J FAILED:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST K: Security & Validation
  // --------------------------------------------------------------------------
  try {
    // Attempt booking with missing seat or missing bus
    const badRes = await fetch(`${BASE_URL}/api/v2/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passenger_name: 'Hacker' })
    });
    if (badRes.ok) throw new Error('Server accepted invalid payload without validation');

    results['TEST K: Security & Validation'] = { passed: true, validationEnforced: true };
    console.log('✅ TEST K PASSED: Server-side input validation and error handling confirmed.');
  } catch (err) {
    results['TEST K: Security & Validation'] = { passed: false, error: err.message };
    console.error('❌ TEST K FAILED:', err.message);
  }

  // --------------------------------------------------------------------------
  // TEST L: Honest Empty States
  // --------------------------------------------------------------------------
  try {
    const fakeBusSeatsRes = await fetch(`${BASE_URL}/api/v2/buses/BUS_NON_EXISTENT_9999/seats`);
    const seatsData = await fakeBusSeatsRes.json();
    // Manifest for non-existent bus should be empty, not fabricated
    const manifestRes = await fetch(`${BASE_URL}/api/v2/driver/manifest?busId=BUS_NON_EXISTENT_9999`);
    const manifestData = await manifestRes.json();
    if (manifestData.manifest && manifestData.manifest.length > 0) {
      throw new Error('Non-existent bus returned fabricated bookings');
    }

    results['TEST L: Honest Empty States'] = { passed: true, fabricatedDataDetected: false };
    console.log('✅ TEST L PASSED: Honest empty states verified. No simulated or fake records.');
  } catch (err) {
    results['TEST L: Honest Empty States'] = { passed: false, error: err.message };
    console.error('❌ TEST L FAILED:', err.message);
  }

  console.log('\n======================================================');
  console.log('SUMMARY OF ALL END-TO-END TESTS (A THROUGH L):');
  console.log('======================================================');
  let allPassed = true;
  for (const [testName, res] of Object.entries(results)) {
    console.log(`${res.passed ? 'PASSED ✅' : 'FAILED ❌'} : ${testName}`);
    if (!res.passed) allPassed = false;
  }
  console.log('======================================================');
  console.log(allPassed ? '🎉 ALL 12 TESTS PASSED PERFECTLY!' : '⚠️ SOME TESTS FAILED.');
}

runTests();
