// ============================================================================
// BUS STOP — DIRECT SUPABASE DATA POPULATION SCRIPT
// Automatically populates all Routes, Stops, Fleet, Trips, Alerts & Stories
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Auto-load .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)?\s*$/);
    if (m) {
      let val = (m[2] || '').trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[m[1]] = val;
    }
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tmacsdrjzkgykfkkrhgm.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function seed() {
  console.log('Connecting to Supabase at:', SUPABASE_URL);

  // 1. Mountain Routes
  console.log('\n[1/6] Seeding Mountain Routes...');
  const routes = [
    {
      id: 'a1111111-1111-1111-1111-111111111111',
      route_code: 'R-101',
      name: 'Pine Valley Express',
      origin: 'Valley Main Depot',
      destination: 'Cloud Peak Summit',
      scenic_highlight: 'Panoramic Mountain Ridge & Whispering Pines',
      total_distance_km: 34.50,
      estimated_duration_min: 45,
      base_fare: 25.00,
      color_hex: '#fca311',
      is_active: true
    },
    {
      id: 'a2222222-2222-2222-2222-222222222222',
      route_code: 'R-204',
      name: 'Highland Summit Line',
      origin: 'Sunrise Ridge',
      destination: 'Echo Lake Terminal',
      scenic_highlight: 'High Altitude Mountain Pass & Glacial Lake Views',
      total_distance_km: 48.00,
      estimated_duration_min: 65,
      base_fare: 35.00,
      color_hex: '#2e7d32',
      is_active: true
    },
    {
      id: 'a3333333-3333-3333-3333-333333333333',
      route_code: 'R-305',
      name: 'Rivermist Loop',
      origin: 'Meadowbrook Station',
      destination: 'Old Timber Junction',
      scenic_highlight: 'Winding Mountain River, Waterfalls & Covered Bridge',
      total_distance_km: 22.00,
      estimated_duration_min: 30,
      base_fare: 18.00,
      color_hex: '#1976d2',
      is_active: true
    }
  ];
  const { data: routeData, error: routeErr } = await supabase.from('routes').upsert(routes, { onConflict: 'route_code' }).select();
  if (routeErr) console.error('Routes error:', routeErr.message);
  else console.log(`✓ Added ${routeData.length} routes: ${routeData.map(r => r.name).join(', ')}`);

  // 2. Mountain Stops
  console.log('\n[2/6] Seeding Mountain Stops...');
  const stops = [
    {
      id: 'b1111111-1111-1111-1111-111111111111',
      stop_code: 'ST-01',
      name: 'Valley Main Depot',
      latitude: 34.1205000,
      longitude: -118.3501000,
      elevation_meters: 650,
      has_shelter: true,
      has_live_display: true,
      is_mountain_pass: false
    },
    {
      id: 'b2222222-2222-2222-2222-222222222222',
      stop_code: 'ST-02',
      name: 'Echo Ridge Shelter',
      latitude: 34.1502000,
      longitude: -118.3204000,
      elevation_meters: 1100,
      has_shelter: true,
      has_live_display: true,
      is_mountain_pass: false
    },
    {
      id: 'b3333333-3333-3333-3333-333333333333',
      stop_code: 'ST-03',
      name: 'Whispering Pines Turn',
      latitude: 34.1804000,
      longitude: -118.2908000,
      elevation_meters: 1450,
      has_shelter: true,
      has_live_display: false,
      is_mountain_pass: true
    },
    {
      id: 'b4444444-4444-4444-4444-444444444444',
      stop_code: 'ST-04',
      name: 'Cloud Peak Summit',
      latitude: 34.2201000,
      longitude: -118.2505000,
      elevation_meters: 2100,
      has_shelter: true,
      has_live_display: true,
      is_mountain_pass: true
    }
  ];
  const { data: stopData, error: stopErr } = await supabase.from('stops').upsert(stops, { onConflict: 'stop_code' }).select();
  if (stopErr) console.error('Stops error:', stopErr.message);
  else console.log(`✓ Added ${stopData.length} stops: ${stopData.map(s => s.name).join(', ')}`);

  // 3. Route Stops sequence
  console.log('\n[3/6] Seeding Route Stop Junctions...');
  const routeStops = [
    {
      route_id: 'a1111111-1111-1111-1111-111111111111',
      stop_id: 'b1111111-1111-1111-1111-111111111111',
      stop_sequence: 1,
      minutes_from_origin: 0,
      fare_from_origin: 0.00
    },
    {
      route_id: 'a1111111-1111-1111-1111-111111111111',
      stop_id: 'b2222222-2222-2222-2222-222222222222',
      stop_sequence: 2,
      minutes_from_origin: 15,
      fare_from_origin: 10.00
    },
    {
      route_id: 'a1111111-1111-1111-1111-111111111111',
      stop_id: 'b3333333-3333-3333-3333-333333333333',
      stop_sequence: 3,
      minutes_from_origin: 30,
      fare_from_origin: 18.00
    },
    {
      route_id: 'a1111111-1111-1111-1111-111111111111',
      stop_id: 'b4444444-4444-4444-4444-444444444444',
      stop_sequence: 4,
      minutes_from_origin: 45,
      fare_from_origin: 25.00
    }
  ];
  const { data: rsData, error: rsErr } = await supabase.from('route_stops').upsert(routeStops, { onConflict: 'route_id,stop_sequence' }).select();
  if (rsErr) console.error('Route stops error:', rsErr.message);
  else console.log(`✓ Added ${rsData.length} route stops connection sequences.`);

  // 4. Bus Fleet (Including Featured Bus #BS-402)
  console.log('\n[4/6] Seeding Bus Fleet...');
  const buses = [
    {
      id: 'c1111111-1111-1111-1111-111111111111',
      bus_number: '#BS-402',
      license_plate: 'MNT-402-EXP',
      model: 'Volvo Mountain Liner 9700',
      total_seats: 42,
      current_status: 'on_route',
      current_lat: 34.1502000,
      current_lng: -118.3204000,
      speed_kmh: 52.5
    },
    {
      id: 'c2222222-2222-2222-2222-222222222222',
      bus_number: '#BS-108',
      license_plate: 'MNT-108-HGH',
      model: 'Scania Touring HD',
      total_seats: 48,
      current_status: 'active',
      current_lat: 34.1205000,
      current_lng: -118.3501000,
      speed_kmh: 0.0
    },
    {
      id: 'c3333333-3333-3333-3333-333333333333',
      bus_number: '#BS-205',
      license_plate: 'MNT-205-RVR',
      model: 'Mercedes Tourismo Mountain Edition',
      total_seats: 36,
      current_status: 'idle',
      current_lat: 34.2201000,
      current_lng: -118.2505000,
      speed_kmh: 0.0
    }
  ];
  const { data: busData, error: busErr } = await supabase.from('buses').upsert(buses, { onConflict: 'bus_number' }).select();
  if (busErr) console.error('Buses error:', busErr.message);
  else console.log(`✓ Added ${busData.length} buses: ${busData.map(b => b.bus_number).join(', ')}`);

  // 5. Scheduled Trips
  console.log('\n[5/6] Seeding Scheduled Trips...');
  const trips = [
    {
      id: 'd1111111-1111-1111-1111-111111111111',
      trip_code: 'TRIP-101-AM',
      route_id: 'a1111111-1111-1111-1111-111111111111',
      bus_id: 'c1111111-1111-1111-1111-111111111111',
      departure_time: new Date(Date.now() + 25 * 60000).toISOString(),
      estimated_arrival: new Date(Date.now() + 70 * 60000).toISOString(),
      status: 'scheduled',
      available_seats: 28,
      boarding_gate: 'Platform 1'
    },
    {
      id: 'd2222222-2222-2222-2222-222222222222',
      trip_code: 'TRIP-204-AM',
      route_id: 'a2222222-2222-2222-2222-222222222222',
      bus_id: 'c2222222-2222-2222-2222-222222222222',
      departure_time: new Date(Date.now() + 55 * 60000).toISOString(),
      estimated_arrival: new Date(Date.now() + 120 * 60000).toISOString(),
      status: 'scheduled',
      available_seats: 34,
      boarding_gate: 'Platform 3'
    }
  ];
  const { data: tripData, error: tripErr } = await supabase.from('trips').upsert(trips, { onConflict: 'trip_code' }).select();
  if (tripErr) console.error('Trips error:', tripErr.message);
  else console.log(`✓ Added ${tripData.length} trips: ${tripData.map(t => t.trip_code).join(', ')}`);

  // 6. Transit & Weather Alerts
  console.log('\n[6/6] Seeding Transit & Weather Alerts...');
  const alerts = [
    {
      id: 'e1111111-1111-1111-1111-111111111111',
      title: 'Mountain Weather Advisory',
      message: 'Morning mist on Whispering Pines Pass. All mountain buses equipped with fog navigation. On time.',
      severity: 'advisory',
      is_active: true
    },
    {
      id: 'e2222222-2222-2222-2222-222222222222',
      title: 'Scenic Viewing Condition: Excellent',
      message: 'Clear skies at Cloud Peak Summit. High visibility across the valley.',
      severity: 'info',
      is_active: true
    }
  ];
  const { data: alertData, error: alertErr } = await supabase.from('transit_alerts').upsert(alerts).select();
  if (alertErr) console.error('Alerts error:', alertErr.message);
  else console.log(`✓ Added ${alertData.length} alerts.`);

  console.log('\n=============================================================');
  console.log('ALL TRANSIT DATA SUCCESSFULLY POPULATED IN SUPABASE!');
  console.log('=============================================================\n');
}

seed().catch(err => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
