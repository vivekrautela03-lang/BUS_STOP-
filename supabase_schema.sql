-- ============================================================================
-- BUS STOP — ENTERPRISE POSTGIS TRANSPORTATION PLATFORM SCHEMA (Milestone 1)
-- Supabase PostgreSQL + PostGIS Geospatial Engine + Realtime Fleet Sync
-- Supports: Passenger, Driver, Admin with Atomic Concurrency & Row Level Security
-- ============================================================================

-- 1. Enable Core & Geospatial Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================================
-- 2. TABLE DEFINITIONS
-- ============================================================================

-- A. User Profiles (Extends auth.users with RBAC roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'passenger' CHECK (role IN ('passenger', 'driver', 'admin')),
  license_number TEXT,
  assigned_bus_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B. Bus Stops (Spatial point geometry with PostGIS)
CREATE TABLE IF NOT EXISTS public.bus_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  location geography(Point, 4326),
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backward compatibility alias view for legacy stops queries
CREATE OR REPLACE VIEW public.stops AS
  SELECT id, name, description, latitude, longitude, address, is_active, created_at, updated_at
  FROM public.bus_stops;

-- Trigger to maintain geography(Point, 4326) on insert/update of lat/lng
CREATE OR REPLACE FUNCTION public.sync_bus_stop_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_bus_stop_geom ON public.bus_stops;
CREATE TRIGGER trg_sync_bus_stop_geom
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.bus_stops
  FOR EACH ROW EXECUTE FUNCTION public.sync_bus_stop_geom();

-- C. Routes
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                      -- e.g. 'ISBT to Mussoorie Scenic Express'
  route_number TEXT NOT NULL UNIQUE,       -- e.g. '102', '105', '204'
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  polyline JSONB DEFAULT '[]'::jsonb,      -- Array of [lat, lng] coordinates
  total_distance_km NUMERIC(6,2) DEFAULT 0.0,
  estimated_duration_min INT DEFAULT 0,
  base_fare NUMERIC(8,2) DEFAULT 25.00,
  color_hex TEXT DEFAULT '#2563eb',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- D. Route Stops Sequence Junction
CREATE TABLE IF NOT EXISTS public.route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES public.bus_stops(id) ON DELETE CASCADE,
  sequence INT NOT NULL,                  -- 1, 2, 3...
  arrival_offset INT DEFAULT 0,           -- minutes from trip start
  departure_offset INT DEFAULT 0,
  fare_from_origin NUMERIC(8,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_route_stop_seq UNIQUE (route_id, sequence)
);

-- E. Buses / Fleet
CREATE TABLE IF NOT EXISTS public.buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number TEXT NOT NULL UNIQUE,        -- e.g. 'BUS 102', 'BUS 402'
  registration_number TEXT NOT NULL,      -- e.g. 'UK-07-PA-1020'
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  capacity INT DEFAULT 40,
  available_seats INT DEFAULT 40,
  status TEXT DEFAULT 'OFFLINE' CHECK (status IN ('OFFLINE', 'ONLINE', 'BOARDING', 'IN_TRANSIT', 'AT_STOP', 'COMPLETED', 'MAINTENANCE')),
  current_stop_id UUID REFERENCES public.bus_stops(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- F. Live Bus Location (Current Location Broadcast — 1 Row Per Bus)
CREATE TABLE IF NOT EXISTS public.bus_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL UNIQUE REFERENCES public.buses(id) ON DELETE CASCADE,
  location geography(Point, 4326),
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  heading INT DEFAULT 0,
  speed NUMERIC(5,1) DEFAULT 0.0,
  accuracy NUMERIC(5,1) DEFAULT 10.0,
  is_online BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.sync_bus_location_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_bus_location_geom ON public.bus_locations;
CREATE TRIGGER trg_sync_bus_location_geom
  BEFORE INSERT OR UPDATE OF latitude, longitude ON public.bus_locations
  FOR EACH ROW EXECUTE FUNCTION public.sync_bus_location_geom();

-- G. Bus Seats (Interactive 3D Interior Layout & Real-time State)
CREATE TABLE IF NOT EXISTS public.bus_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,              -- e.g. '01A', '01B', '02A', '02B'
  seat_type TEXT DEFAULT 'standard' CHECK (seat_type IN ('standard', 'window', 'aisle', 'sleeper', 'accessible')),
  row_number INT NOT NULL,                -- 1..10
  column_number INT NOT NULL,             -- 1..4 (1=Left Window, 2=Left Aisle, 3=Right Aisle, 4=Right Window)
  status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'HELD', 'BOOKED', 'OCCUPIED', 'BLOCKED')),
  booking_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_bus_seat UNIQUE (bus_id, seat_number)
);

-- H. Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  seat_id UUID REFERENCES public.bus_seats(id) ON DELETE SET NULL,
  boarding_stop_id UUID REFERENCES public.bus_stops(id) ON DELETE SET NULL,
  destination_stop_id UUID REFERENCES public.bus_stops(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'EXPIRED')),
  booking_reference TEXT NOT NULL UNIQUE, -- e.g. 'BST-102-8492'
  fare_amount NUMERIC(8,2) NOT NULL DEFAULT 25.00,
  seat_number TEXT,
  passenger_name TEXT,
  passenger_phone TEXT,
  qr_code_token TEXT DEFAULT gen_random_uuid()::TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- I. Historical Location Trail (Separate table so live locations remain fast)
CREATE TABLE IF NOT EXISTS public.bus_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  heading INT DEFAULT 0,
  speed NUMERIC(5,1) DEFAULT 0.0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. POSTGIS SPATIAL & PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bus_stops_geom ON public.bus_stops USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_bus_locations_geom ON public.bus_locations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_route_stops_route_seq ON public.route_stops(route_id, sequence);
CREATE INDEX IF NOT EXISTS idx_buses_route ON public.buses(route_id);
CREATE INDEX IF NOT EXISTS idx_buses_driver ON public.buses(driver_id);
CREATE INDEX IF NOT EXISTS idx_bus_seats_bus_status ON public.bus_seats(bus_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_bus ON public.bookings(bus_id, status);

-- ============================================================================
-- 4. ATOMIC DATABASE CONCURRENCY: PREVENT DOUBLE-BOOKING
-- ============================================================================
CREATE OR REPLACE FUNCTION public.book_seat_atomic(
  p_user_id UUID,
  p_bus_id UUID,
  p_route_id UUID,
  p_seat_number TEXT,
  p_boarding_stop_id UUID,
  p_destination_stop_id UUID,
  p_fare_amount NUMERIC,
  p_passenger_name TEXT,
  p_passenger_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seat_record RECORD;
  v_booking_id UUID;
  v_ref TEXT;
BEGIN
  -- 1. Lock the seat row for update to guarantee single-winner atomic concurrency
  SELECT * INTO v_seat_record
  FROM public.bus_seats
  WHERE bus_id = p_bus_id AND seat_number = p_seat_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seat not found on this bus');
  END IF;

  IF v_seat_record.status != 'AVAILABLE' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Seat ' || p_seat_number || ' is already booked or held');
  END IF;

  -- 2. Generate Reference
  v_ref := 'BST-' || SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', ''), 1, 8);
  v_booking_id := gen_random_uuid();

  -- 3. Create Booking
  INSERT INTO public.bookings (
    id,
    user_id,
    bus_id,
    route_id,
    seat_id,
    boarding_stop_id,
    destination_stop_id,
    status,
    booking_reference,
    fare_amount,
    seat_number,
    passenger_name,
    passenger_phone,
    created_at,
    updated_at
  ) VALUES (
    v_booking_id,
    p_user_id,
    p_bus_id,
    p_route_id,
    v_seat_record.id,
    p_boarding_stop_id,
    p_destination_stop_id,
    'CONFIRMED',
    v_ref,
    p_fare_amount,
    p_seat_number,
    p_passenger_name,
    p_passenger_phone,
    NOW(),
    NOW()
  );

  -- 4. Mark Seat as BOOKED
  UPDATE public.bus_seats
  SET 
    status = 'BOOKED',
    booking_id = v_booking_id,
    updated_at = NOW()
  WHERE id = v_seat_record.id;

  -- 5. Decrement available seats on the bus
  UPDATE public.buses
  SET 
    available_seats = GREATEST(0, available_seats - 1),
    updated_at = NOW()
  WHERE id = p_bus_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'booking_reference', v_ref,
    'seat_number', p_seat_number
  );
END;
$$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_location_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can read, users can update own
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Public transport metadata: Anyone can view active stops, routes, route_stops
DROP POLICY IF EXISTS "Public view stops" ON public.bus_stops;
CREATE POLICY "Public view stops" ON public.bus_stops FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public view routes" ON public.routes;
CREATE POLICY "Public view routes" ON public.routes FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public view route_stops" ON public.route_stops;
CREATE POLICY "Public view route_stops" ON public.route_stops FOR SELECT USING (true);

-- Buses: Public can view, assigned drivers can update status
DROP POLICY IF EXISTS "Public view buses" ON public.buses;
CREATE POLICY "Public view buses" ON public.buses FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Drivers can update assigned bus" ON public.buses;
CREATE POLICY "Drivers can update assigned bus" ON public.buses FOR UPDATE
  USING (auth.uid() = driver_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

-- Bus Locations: Public can read live locations; assigned drivers can upsert
DROP POLICY IF EXISTS "Public view bus locations" ON public.bus_locations;
CREATE POLICY "Public view bus locations" ON public.bus_locations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Drivers update assigned bus location" ON public.bus_locations;
CREATE POLICY "Drivers update assigned bus location" ON public.bus_locations FOR ALL
  USING (
    bus_id IN (SELECT id FROM public.buses WHERE driver_id = auth.uid()) 
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
  );

-- Seats: Public can view, book via atomic RPC
DROP POLICY IF EXISTS "Public view seats" ON public.bus_seats;
CREATE POLICY "Public view seats" ON public.bus_seats FOR SELECT USING (true);

-- Bookings: Passenger can view own, create own
DROP POLICY IF EXISTS "Passengers view own bookings" ON public.bookings;
CREATE POLICY "Passengers view own bookings" ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('driver', 'admin')));

DROP POLICY IF EXISTS "Passengers insert own bookings" ON public.bookings;
CREATE POLICY "Passengers insert own bookings" ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. REALTIME BROADCASTING
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.buses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_seats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- ============================================================================
-- 7. SEED DATA (Dehradun - Mussoorie - Bilaspur Scenic Transit Network)
-- ============================================================================

-- 1. Bus Stops
INSERT INTO public.bus_stops (id, name, description, latitude, longitude, address, is_active)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'ISBT Dehradun', 'Central Inter-State Bus Terminal, Dehradun', 30.2885000, 78.0081000, 'Haridwar Bypass Road, Majra, Dehradun', true),
  ('b1000000-0000-0000-0000-000000000002', 'Clock Tower', 'Iconic central city stop (Ghanta Ghar)', 30.3244000, 78.0416000, 'Paltan Bazaar, Rajpur Road Junction, Dehradun', true),
  ('b1000000-0000-0000-0000-000000000003', 'Rajpur Road', 'Scenic foothill corridor & shopping avenue', 30.3456000, 78.0620000, 'Rajpur Road, Jakhan, Dehradun', true),
  ('b1000000-0000-0000-0000-000000000004', 'Pacific Mall Halt', 'North city transit interchange', 30.3621000, 78.0775000, 'Rajpur Road, Near Pacific Mall, Dehradun', true),
  ('b1000000-0000-0000-0000-000000000005', 'Malsi Deer Park', 'Hill forest entrance & nature stop', 30.3842000, 78.0931000, 'Mussoorie Diversion, Dehradun', true),
  ('b1000000-0000-0000-0000-000000000006', 'Mussoorie Library Point', 'Queen of the Hills terminal & Mall Road', 30.4598000, 78.0644000, 'The Mall, Library Chowk, Mussoorie', true),
  ('b1000000-0000-0000-0000-000000000007', 'Prem Nagar Depot', 'West valley university & defense depot', 30.3340000, 77.9620000, 'Chakrata Road, Prem Nagar, Dehradun', true),
  ('b1000000-0000-0000-0000-000000000008', 'Maruti Vihar Terminal', 'Valley residential & express terminal', 30.3150000, 77.9950000, 'Maruti Vihar, Bilaspur Corridor', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Routes
INSERT INTO public.routes (id, name, route_number, origin, destination, total_distance_km, estimated_duration_min, base_fare, color_hex, is_active, polyline)
VALUES
  (
    'a1000000-0000-0000-0000-000000000001',
    'ISBT to Mussoorie Scenic Express',
    '102',
    'ISBT Dehradun',
    'Mussoorie Library Point',
    35.20,
    75,
    65.00,
    '#2563eb',
    true,
    '[[30.2885, 78.0081], [30.3244, 78.0416], [30.3456, 78.0620], [30.3621, 78.0775], [30.3842, 78.0931], [30.4598, 78.0644]]'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Prem Nagar to Maruti Vihar Valley Line',
    '204',
    'Prem Nagar Depot',
    'Maruti Vihar Terminal',
    18.50,
    45,
    35.00,
    '#10b981',
    true,
    '[[30.3340, 77.9620], [30.3244, 78.0416], [30.3150, 77.9950]]'::jsonb
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'City Heritage Loop',
    '105',
    'ISBT Dehradun',
    'Pacific Mall Halt',
    12.40,
    30,
    25.00,
    '#f59e0b',
    true,
    '[[30.2885, 78.0081], [30.3244, 78.0416], [30.3456, 78.0620], [30.3621, 78.0775]]'::jsonb
  )
ON CONFLICT (route_number) DO NOTHING;

-- 3. Route Stops Sequences
INSERT INTO public.route_stops (route_id, stop_id, sequence, arrival_offset, departure_offset, fare_from_origin)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 1, 0, 0, 0.00),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 2, 15, 18, 15.00),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 3, 28, 30, 25.00),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 4, 40, 42, 35.00),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', 5, 52, 54, 45.00),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', 6, 75, 75, 65.00)
ON CONFLICT (route_id, sequence) DO NOTHING;

-- 4. Buses
INSERT INTO public.buses (id, bus_number, registration_number, route_id, capacity, available_seats, status, is_active)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'BUS 102', 'UK-07-PA-1020', 'a1000000-0000-0000-0000-000000000001', 40, 22, 'IN_TRANSIT', true),
  ('c1000000-0000-0000-0000-000000000002', 'BUS 105', 'UK-07-PA-1050', 'a1000000-0000-0000-0000-000000000003', 40, 31, 'ONLINE', true),
  ('c1000000-0000-0000-0000-000000000003', 'BUS 204', 'UK-07-PA-2040', 'a1000000-0000-0000-0000-000000000002', 40, 18, 'ONLINE', true),
  ('c1000000-0000-0000-0000-000000000004', 'BUS 402', 'UK-07-PA-4020', 'a1000000-0000-0000-0000-000000000001', 40, 36, 'OFFLINE', true)
ON CONFLICT (bus_number) DO NOTHING;

-- 5. Live Locations
INSERT INTO public.bus_locations (bus_id, latitude, longitude, heading, speed, accuracy, is_online)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 30.3340000, 78.0520000, 42, 48.5, 5.0, true),
  ('c1000000-0000-0000-0000-000000000002', 30.2980000, 78.0180000, 12, 34.0, 6.0, true),
  ('c1000000-0000-0000-0000-000000000003', 30.3200000, 77.9800000, 88, 52.0, 4.5, true)
ON CONFLICT (bus_id) DO UPDATE
SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, heading = EXCLUDED.heading, speed = EXCLUDED.speed;

-- 6. Generate 40 Seats for Bus 102 (Rows 1..10, 4 seats per row)
DO $$
DECLARE
  r INT;
  c INT;
  s_num TEXT;
  s_type TEXT;
  c_char TEXT;
BEGIN
  FOR r IN 1..10 LOOP
    FOR c IN 1..4 LOOP
      IF c = 1 THEN c_char := 'A'; s_type := 'window';
      ELSIF c = 2 THEN c_char := 'B'; s_type := 'aisle';
      ELSIF c = 3 THEN c_char := 'C'; s_type := 'aisle';
      ELSE c_char := 'D'; s_type := 'window';
      END IF;

      s_num := LPAD(r::TEXT, 2, '0') || c_char;

      INSERT INTO public.bus_seats (bus_id, seat_number, seat_type, row_number, column_number, status)
      VALUES (
        'c1000000-0000-0000-0000-000000000001',
        s_num,
        s_type,
        r,
        c,
        CASE WHEN (r = 1 AND c IN (1, 2)) OR (r = 3 AND c = 4) OR (r = 5 AND c IN (3, 4)) THEN 'BOOKED' ELSE 'AVAILABLE' END
      )
      ON CONFLICT (bus_id, seat_number) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

-- ============================================================================
-- 7. USER SAVED PLACES (Home, Work, Favorites with Real Coordinates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_saved_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- e.g. 'Home', 'Work', 'College', 'Gym'
  place_name TEXT NOT NULL,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  category TEXT DEFAULT 'favorite' CHECK (category IN ('home', 'work', 'favorite', 'recent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_places_user ON public.user_saved_places(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_saved_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved places"
  ON public.user_saved_places FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved places"
  ON public.user_saved_places FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved places"
  ON public.user_saved_places FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved places"
  ON public.user_saved_places FOR DELETE
  USING (auth.uid() = user_id);

