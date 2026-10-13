# BUS STOP — Enterprise Mobile Transit Application (Android & iOS)

A native, production-grade mobile application for **BUS STOP**, built with **React Native**, **Expo (SDK 52)**, **TypeScript**, and **Supabase Authentication**, preserving the existing backend, schema, and web application.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **npm** v9+
- Existing backend server running (`node server.js` on port `3000`)
- Android Studio (for Android emulator / native build) or Xcode (macOS for iOS build)
- **Expo Go** mobile app installed on your physical smartphone from Google Play Store or Apple App Store

### 2. Start the Backend API Server
Ensure the existing backend server is running in the repository root:
```bash
# In the root repository directory (d:\BUS STOP)
node server.js
```
The server operates on `http://localhost:3000` exposing Enterprise Transit REST v2 endpoints.

### 3. Launch the Mobile Application
```bash
# Navigate to the mobile directory
cd mobile

# Start the Expo development server
npx expo start
```
From the interactive terminal:
- Press `a` to launch on a connected Android device / emulator.
- Press `i` to launch on an iOS simulator (macOS only).
- Press `w` to open the responsive web preview in Chrome / Edge.
- Scan the displayed QR code with your phone camera (iOS) or the **Expo Go** app (Android).

---

## 📱 Testing on a Physical Phone

1. Ensure your physical phone and computer are connected to the **same local Wi-Fi network**.
2. Determine your computer's local LAN IP address (e.g., run `ipconfig` on Windows, look for IPv4 Address such as `192.168.1.15`).
3. Set `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.15:3000` in `mobile/.env.local` or adjust via the in-app settings.
4. Run `npx expo start` in `mobile/`.
5. Open **Expo Go** on Android or your Camera app on iOS, scan the QR code.
6. The app bundles and launches immediately on your device with native gestures and hardware haptics.

---

## 🏗️ Architecture & Project Structure

```
d:/BUS STOP/mobile/
├── assets/
│   ├── icon.png                      # 1024x1024 master app icon
│   ├── adaptive-icon.png             # Android adaptive foreground (bus & route pin)
│   ├── adaptive-icon-background.png  # Android adaptive background (#142B45 deep navy)
│   ├── splash.png                    # 1284x2778 branded splash screen with tagline
│   ├── favicon.png                   # Web favicon (192x192)
│   ├── logo.svg                      # Vector SVG source icon
│   └── splash.svg                    # Vector SVG splash source
├── src/
│   ├── theme/                        # Design system tokens (colors, typography, shadows, spacing)
│   ├── types/                        # TypeScript shared models mirroring PostgreSQL schema
│   ├── services/
│   │   ├── api.ts                    # REST v2 enterprise client connecting to server.js
│   │   ├── supabase.ts               # Supabase authentication with AsyncStorage session persistence
│   │   └── storage.ts                # AsyncStorage secure offline token & user storage
│   ├── context/
│   │   └── AuthContext.tsx           # Session lifecycle, hydration, and role switching
│   ├── components/                   # Reusable atomic UI (Header, Card, Button, Badge, Input, etc.)
│   ├── navigation/
│   │   ├── RootNavigator.tsx         # Auth gate & dynamic role switcher
│   │   ├── PassengerTabs.tsx         # Explore, Radar Map, My Trips, Traveler Pass
│   │   ├── DriverTabs.tsx            # Cockpit, Manifest, QR Scan, Settlements, Captain Profile
│   │   └── AdminTabs.tsx             # Command Center, Captains Roster, Fleet Registry, Ledger
│   └── screens/
│       ├── auth/                     # SplashScreen, OnboardingScreen, LoginScreen, RegisterScreen
│       ├── passenger/                # HomeScreen, BusDetails, SeatSelection, TicketPass, LiveMap
│       ├── driver/                   # DriverDashboard, PreTripChecklist, ActiveTrip, QrScanner, CabinLayout, Manifest, IncidentReport, Earnings
│       └── admin/                    # AdminDashboard, AdminDrivers, AdminBuses, AdminBookings
├── app.json                          # Expo configuration (bundle ID, permissions, icons, splash)
├── package.json                      # Dependencies & test scripts
└── tsconfig.json                     # Strict TypeScript configuration
```

---

## 🎨 Design System & Color Tokens

- **Primary Blue:** `#2589E8` (Actions, buttons, active highlights)
- **Primary Light / Soft:** `#EAF5FF` (Pills, badges, card accents)
- **Deep Navy:** `#142B45` (Primary headings, driver cockpit HUD, branding)
- **Secondary Text:** `#65758B` (Subtitles, metadata, captions)
- **Borders & Dividers:** `#DCE7F1` (Subtle card borders, timeline tracks)
- **Live / Success Green:** `#10B981` (GPS live indicator, confirmed passes, safety cleared)
- **Alert / Danger Red:** `#EF4444` (Incident reporting, urgent road advisories, cancellations)
- **Touch Targets:** Minimum 48dp on all interactive elements.

---

## 🛡️ Role-Based Capabilities

### 1. Passenger Experience
- **Mountain Corridor Feed:** Real-time departures, weather telemetry, search by destination.
- **Bus Specifications:** Tata Starbus Ultra specs, route timeline, amenities, and dynamic fare.
- **Interactive 40-Seat Cabin Map:** 2x2 layout, rows 1-10, real-time double booking prevention.
- **Verifiable Boarding Pass:** PNR, barcode/QR code data, boarding stop, shareable pass pass.
- **My Trips History:** Active passes, past journeys, and cancellation refund policy.
- **Live Transit Radar:** Mountain waypoint progress, arrival ETA, and vehicle telemetry.

### 2. Captain Driver Cockpit
- **Operational Status:** On-duty / Off-duty toggle transmitting GPS availability.
- **6-Point Pre-Trip Safety Sign-Off:** Mandatory inspection of air brakes, tires, high-beam fog projectors, fire extinguishers, GPS radar, and engine coolant before departure.
- **Active Highway Trip HUD:** Live speedometer (speed limit 60 km/h), next halt ETA, and public address chime button.
- **QR Boarding Pass Scanner:** Camera viewfinder reticle + manual PNR input fallback for offline validation.
- **Cabin Occupancy Inspection:** Visual 40-seat inspection layout displaying occupied vs vacant seats.
- **Passenger Boarding Manifest:** Halt-by-halt verified traveler roster with direct contact options.
- **Highway Incident Reporting:** Broadcast landslides, road closures, traffic gridlock, or mechanical breakdowns directly to State Transit Control.
- **Settlement Ledger:** High-altitude km allowance, base shift pay, and zero-incident bonuses.

### 3. Fleet Administrator Command
- **Command Dashboard:** Active buses counter, verified captains roster, today's gross revenue, and active highway advisories.
- **Captain Verification Roster:** Heavy Vehicle Driving License (HMV) inspection and one-tap authorization/suspension.
- **Fleet Registry:** 40-seater mountain vehicle registry, capacity tracking, and permit validation.
- **Ledger Audit:** Real-time stream of confirmed passenger bookings, PNRs, and transaction amounts.

---

## 🧪 Testing & Verification

Run the automated test suite:
```bash
# In the mobile/ directory
npm test
```
**Test Coverage:**
- Passenger 40-seat 2x2 cabin structure verification.
- Prevention of double-booking and concurrent seat conflict rejection.
- PNR ticket format and QR payload integrity validation.
- 6-point pre-trip safety inspection 100% sign-off enforcement.
- Driver shift state transitions (`ON_DUTY` <-> `OFF_DUTY`).
- Highway incident categorization and severity validation.
- Multi-role determination rules.

Run TypeScript validation:
```bash
npx tsc --noEmit
```
*Current result: 0 errors.*

---

## 📦 Building Native Packages (Android APK & iOS IPA)

### Android Standalone Build (APK / AAB)
Generate local Android native files:
```bash
cd mobile
npx expo prebuild --platform android
```
Build a release APK locally using Gradle:
```bash
cd android
./gradlew assembleRelease
```
Or build in the cloud via EAS (Expo Application Services):
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

### iOS Standalone Build (IPA)
```bash
eas build --platform ios --profile preview
```
*(Requires an Apple Developer Account for provisioning profiles and certificates).*

---

## ⚠️ Notes on External Services
- **SMS OTP Gateway:** Supabase auth is pre-configured for email & password authentication. Real SMS OTP requires linking a paid Twilio or MessageBird provider in your Supabase Dashboard under *Authentication > Providers > Phone*.
- **Live GPS Tracking:** Native location telemetry hooks into `expo-location` and pings `/api/v2/driver/location`. On physical devices, foreground and background location permissions are requested in accordance with Android 14/15 and iOS 17/18 guidelines.
