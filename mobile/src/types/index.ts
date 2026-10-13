// ============================================================================
// BUS STOP — TYPESCRIPT TYPE DEFINITIONS (SHARED MODELS)
// Models mirroring Supabase PostgreSQL schema & Enterprise REST API v2
// ============================================================================

export type UserRole = 'passenger' | 'driver' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  name?: string; // alias for full_name
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  home_location?: string;
  dob?: string;
  gender?: string;
  license_number?: string;
  driverLicense?: string; // alias for license_number
  license_expiry?: string;
  verified?: boolean;
  created_at?: string;
}

export interface TransitStop {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  sequence?: number;
  landmark?: string;
  distance_meters?: number;
}

export interface TransitRoute {
  id: string;
  route_number: string;
  name: string;
  origin_name: string;
  destination_name: string;
  distance_km: number;
  totalDistanceKm?: number; // alias
  estimated_minutes: number;
  base_fare: number;
  is_active: boolean;
  stops?: TransitStop[];
  waypoints?: { lat: number; lng: number }[];
}

export interface FleetBus {
  id: string;
  bus_number: string;
  registration_number: string;
  registrationNumber?: string; // alias
  model?: string; // vehicle model
  route_id?: string;
  route_name?: string;
  route_number?: string;
  driver_id?: string;
  driver_name?: string;
  driver_phone?: string;
  capacity: number;
  available_seats: number;
  fare: number;
  type: string;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'DELAYED' | 'MAINTENANCE' | 'COMPLETED' | 'ACTIVE';
  current_stop?: string;
  next_stop?: string;
  eta_minutes?: number;
  speed?: number;
  location?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
    is_online?: boolean;
    updated_at?: string;
  };
  amenities?: string[];
  is_active: boolean;
}

export interface CabinSeat {
  seat_number: string;
  row: number;
  col: number; // 0, 1 = Left window/aisle; 2, 3 = Right aisle/window
  is_booked: boolean;
  is_reserved?: boolean;
  gender_pref?: 'ANY' | 'FEMALE';
  price: number;
  passenger_name?: string;
}

export interface TicketBooking {
  id: string;
  pnr: string;
  ticketNumber?: string; // alias for pnr
  user_id: string;
  passenger_name: string;
  passengerName?: string; // alias for passenger_name
  passenger_phone?: string;
  passengerPhone?: string; // alias
  bus_id: string;
  bus_number: string;
  route_name: string;
  route_number?: string;
  boarding_stop: string;
  destination_stop: string;
  seat_number: string;
  seats?: string[]; // alias
  fare_amount: number;
  totalFare?: number; // alias
  paymentMethod?: string;
  status: 'CONFIRMED' | 'BOARDED' | 'CANCELLED' | 'COMPLETED';
  departure_time: string;
  qr_code_data: string;
  created_at: string;
  createdAt?: string; // alias
}

export interface DriverShiftState {
  is_online?: boolean;
  dutyStatus?: 'ON_DUTY' | 'OFF_DUTY';
  active_trip_id?: string;
  assignedBusId?: string;
  assignedRouteId?: string;
  currentTripStatus?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  todayTrips?: number;
  passengersCarried?: number;
  earningsToday?: number;
  rating?: number | string;
  shiftStartTime?: string;
  bus?: FleetBus;
  route?: TransitRoute;
  current_stop_index?: number;
  passengers_boarded?: number;
  today_earnings?: number;
  completed_trips_count?: number;
}

export interface PreTripChecklist {
  brakes: boolean;
  tires: boolean;
  fluids: boolean;
  emergencyExits: boolean;
  pneumaticDoors: boolean;
  cleanliness: boolean;
}

export interface TransitIncident {
  id: string;
  type: string;
  message: string;
  route_id?: string;
  route_name?: string;
  reported_by?: string;
  timestamp: string;
}
