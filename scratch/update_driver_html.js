const fs = require('fs');

const driverAppHtml = `
    <!-- =========================================================================
         MODERN DRIVER OPERATING SUITE (30 PRODUCTION SCREENS & COHESIVE SYSTEM)
         ========================================================================= -->
    <div id="driverAppContainer" class="hidden">
      
      <!-- Top Application Header Bar -->
      <header class="driver-app-header">
        <div class="driver-header-brand">
          <div class="driver-brand-icon">🚏</div>
          <div>
            <div class="driver-brand-text">BUS STOP</div>
            <span class="driver-brand-sub">Driver Operations</span>
          </div>
        </div>
        <div class="driver-header-actions">
          <button id="driverDutyToggle" class="driver-duty-toggle">
            <span class="duty-dot"></span>
            <span class="duty-text">OFF DUTY</span>
          </button>
          <button class="driver-header-btn" onclick="DriverApp.openSeatConfigModal()" title="Cabin Seat Layout">
            <span>💺</span>
          </button>
        </div>
      </header>

      <!-- Main Scrollable Content Viewport -->
      <main class="driver-viewport">

        <!-- SCREEN 7: DRIVER HOME DASHBOARD -->
        <section id="driverView_home" class="driver-screen-view active">
          <div style="margin-bottom:14px;">
            <h2 id="driverDashGreeting" style="font-size:20px; font-weight:800; margin:0 0 4px; color:#fff;">Good day, Captain 👋</h2>
            <div style="font-size:12px; color:#94a3b8;">Assigned to Uttarakhand Mountain Transport Corridor</div>
          </div>

          <!-- Quick Metric Grid -->
          <div class="driver-stats-grid">
            <div class="driver-stat-card">
              <div class="driver-stat-val" id="dashStatTrips">142</div>
              <div class="driver-stat-lbl">Completed Trips</div>
            </div>
            <div class="driver-stat-card">
              <div class="driver-stat-val" id="dashStatPunctuality">98%</div>
              <div class="driver-stat-lbl">Punctuality</div>
            </div>
            <div class="driver-stat-card">
              <div class="driver-stat-val" id="dashStatSafety">5.0 ★</div>
              <div class="driver-stat-lbl">Safety Rating</div>
            </div>
            <div class="driver-stat-card">
              <div class="driver-stat-val" id="dashStatHours">6.5h</div>
              <div class="driver-stat-lbl">Duty Hours Today</div>
            </div>
          </div>

          <!-- Assigned Vehicle & Route Card -->
          <div class="driver-card">
            <div class="driver-card-header">
              <div class="driver-card-title">
                <span>🚍 Assigned Fleet Bus</span>
              </div>
              <span class="driver-pill-badge badge-green">Verified &amp; Inspected</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <div>
                <div id="dashVehicleReg" style="font-size:18px; font-weight:800; color:#38bdf8;">UK-07-DR-4567</div>
                <div style="font-size:12px; color:#94a3b8;">Tata Starbus Ultra 40-Seater</div>
              </div>
              <button class="driver-btn-secondary" style="width:auto; padding:6px 12px; font-size:11px;" onclick="DriverApp.openSeatConfigModal()">
                Inspect Seats
              </button>
            </div>
            <div style="font-size:12px; color:#cbd5e1; display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.08); padding-top:10px;">
              <span>Next Service: in 2,400 km</span>
              <span id="dashSeatAvailability" style="color:#34d399; font-weight:700;">22 of 40 seats open</span>
            </div>
          </div>

          <!-- Active Assignment / Upcoming Trip -->
          <div class="driver-card">
            <div class="driver-card-header">
              <div class="driver-card-title">
                <span>📍 Current Route Assignment</span>
              </div>
              <span class="driver-pill-badge badge-blue">Scheduled</span>
            </div>
            <div id="dashRouteName" style="font-size:15px; font-weight:800; color:#fff; margin-bottom:6px;">
              Dehradun ISBT ➔ Rishikesh (Triveni Ghat)
            </div>
            <div style="font-size:12px; color:#94a3b8; margin-bottom:14px;">
              Departure: 08:30 AM • 43.5 km • Estimated 75 mins
            </div>
            <div id="dashTripActionContainer">
              <button class="driver-btn-primary" onclick="DriverApp.openPreTripChecklist()">
                <span>⚡ Start Scheduled Trip</span>
              </button>
            </div>
          </div>
        </section>

        <!-- SCREEN 10 & 20: TRIPS TAB -->
        <section id="driverView_trips" class="driver-screen-view">
          <div style="margin-bottom:14px;">
            <h2 style="font-size:18px; font-weight:800; margin:0 0 4px; color:#fff;">Trip Operations &amp; History</h2>
            <div style="font-size:12px; color:#94a3b8;">Completed, scheduled, and active mountain corridor journeys</div>
          </div>
          <div id="tripsTabList"></div>
        </section>

        <!-- SCREEN 10 & 11: ROUTES TAB -->
        <section id="driverView_routes" class="driver-screen-view">
          <div style="margin-bottom:14px;">
            <h2 style="font-size:18px; font-weight:800; margin:0 0 4px; color:#fff;">Network Corridors &amp; Routes</h2>
            <div style="font-size:12px; color:#94a3b8;">Authoritative transport authority routes and stop sequences</div>
          </div>
          <div id="routesTabList"></div>
        </section>

        <!-- SCREEN 21: PROFILE & SUPPORT TAB -->
        <section id="driverView_profile" class="driver-screen-view">
          <div class="driver-card" style="text-align:center; padding:24px 16px;">
            <div style="width:72px; height:72px; border-radius:50%; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-size:32px; margin:0 auto 12px; border:3px solid #38bdf8;">
              👨‍✈️
            </div>
            <h3 id="profileDriverName" style="font-size:18px; font-weight:800; color:#fff; margin:0 0 4px;">Shivansh Mourya</h3>
            <div id="profileDriverBadge" style="font-size:12px; color:#38bdf8; font-weight:600; margin-bottom:8px;">Mountain Transit Authority • Fleet Captain</div>
            <div style="font-size:12px; color:#94a3b8;">Driver ID: UK-DRV-2026-8842</div>
          </div>

          <div class="driver-card">
            <div class="driver-card-title" style="margin-bottom:12px;">Personal &amp; License Credentials</div>
            <div style="font-size:13px; color:#cbd5e1; display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between;">
                <span style="color:#94a3b8;">Phone:</span>
                <span id="profileDriverPhone" style="font-weight:700;">+91 84392 38588</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:#94a3b8;">Commercial DL:</span>
                <span id="profileDriverLicense" style="font-weight:700;">DL-042023001894</span>
              </div>
              <div style="display:flex; justify-content:space-between;">
                <span style="color:#94a3b8;">Status:</span>
                <span class="driver-pill-badge badge-green">Verified &amp; Active</span>
              </div>
            </div>
          </div>

          <div class="driver-card">
            <div class="driver-card-title" style="margin-bottom:12px;">Account &amp; Session Actions</div>
            <button class="driver-btn-danger" onclick="handleLogout()">
              <span>Log Out of Driver Operations</span>
            </button>
          </div>
        </section>

      </main>

      <!-- Bottom Navigation Bar (Home, Trips, Routes, Profile) -->
      <nav class="driver-bottom-nav">
        <button class="driver-nav-item active" data-view="home">
          <span class="driver-nav-icon">🏠</span>
          <span class="driver-nav-label">Home</span>
        </button>
        <button class="driver-nav-item" data-view="trips">
          <span class="driver-nav-icon">🧭</span>
          <span class="driver-nav-label">Trips</span>
        </button>
        <button class="driver-nav-item" data-view="routes">
          <span class="driver-nav-icon">🗺️</span>
          <span class="driver-nav-label">Routes</span>
        </button>
        <button class="driver-nav-item" data-view="profile">
          <span class="driver-nav-icon">👤</span>
          <span class="driver-nav-label">Profile</span>
        </button>
      </nav>

      <!-- =======================================================================
           CONTEXTUAL OPERATIONAL MODALS
           ======================================================================= -->

      <!-- SCREEN 13: PRE-TRIP CHECKLIST MODAL -->
      <div id="driverModal_preTrip" class="driver-modal-backdrop hidden">
        <div class="driver-modal-sheet">
          <div class="driver-modal-header">
            <div class="driver-modal-title">📋 Pre-Trip Safety &amp; Dispatch Checklist</div>
            <button class="driver-close-btn" onclick="DriverApp.closeModal('driverModal_preTrip')">✕</button>
          </div>
          <div style="font-size:12px; color:#94a3b8; margin-bottom:14px;">
            Transport regulations require confirmation of vehicle status, route validity, and GPS tracking before departure.
          </div>
          <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
            <label style="display:flex; align-items:center; gap:10px; font-size:13px; color:#fff;">
              <input type="checkbox" class="pre-trip-chk" onchange="DriverApp.validatePreTripChecklist()">
              <span>Driver identity &amp; active commercial authorization confirmed</span>
            </label>
            <label style="display:flex; align-items:center; gap:10px; font-size:13px; color:#fff;">
              <input type="checkbox" class="pre-trip-chk" onchange="DriverApp.validatePreTripChecklist()">
              <span>Bus mechanics, brakes, emergency door, and lights inspected</span>
            </label>
            <label style="display:flex; align-items:center; gap:10px; font-size:13px; color:#fff;">
              <input type="checkbox" class="pre-trip-chk" onchange="DriverApp.validatePreTripChecklist()">
              <span>Route corridor &amp; intermediate stops acknowledged</span>
            </label>
            <label style="display:flex; align-items:center; gap:10px; font-size:13px; color:#fff;">
              <input type="checkbox" class="pre-trip-chk" onchange="DriverApp.validatePreTripChecklist()">
              <span>Device GPS tracking enabled for live passenger synchronization</span>
            </label>
          </div>
          <button id="btnConfirmStartTrip" class="driver-btn-primary" disabled onclick="DriverApp.confirmStartTrip()">
            <span>Confirm &amp; Start Live Trip</span>
          </button>
        </div>
      </div>

      <!-- SCREEN 14 & 15: LIVE TRIP COCKPIT MODAL -->
      <div id="driverModal_liveTrip" class="driver-modal-backdrop hidden">
        <div class="driver-modal-sheet" style="max-width:600px;">
          <div class="driver-modal-header">
            <div>
              <div class="driver-modal-title" id="liveTripRouteTitle">Dehradun ➔ Rishikesh</div>
              <span class="driver-pill-badge badge-green" style="margin-top:4px;">● LIVE BROADCASTING</span>
            </div>
            <button class="driver-close-btn" onclick="DriverApp.closeModal('driverModal_liveTrip')">✕</button>
          </div>

          <!-- Large Interactive Map -->
          <div id="driverTripMap" class="driver-map-viewport"></div>

          <!-- Current & Next Stop Controls -->
          <div class="driver-card" style="background:rgba(255,255,255,0.03);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div>
                <div style="font-size:11px; color:#94a3b8;">Current Stop</div>
                <div id="liveTripCurrentStop" style="font-size:16px; font-weight:800; color:#38bdf8;">ISBT Dehradun</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:11px; color:#94a3b8;">Next Stop</div>
                <div id="liveTripNextStop" style="font-size:14px; font-weight:700; color:#fff;">Prince Chowk</div>
              </div>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="driver-btn-primary" onclick="DriverApp.progressToNextStop()">
                <span>Arrived / Depart to Next Stop ➔</span>
              </button>
              <button class="driver-btn-secondary" style="width:auto;" onclick="DriverApp.openQrScannerModal()">
                <span>📷 Scan Ticket</span>
              </button>
            </div>
          </div>

          <!-- Passenger Manifest Section -->
          <div class="driver-card">
            <div class="driver-card-header">
              <div class="driver-card-title">Passenger Manifest</div>
              <span id="liveTripBoardedCount" class="driver-pill-badge badge-blue">0 Boarded</span>
            </div>
            <div id="manifestListContainer" class="manifest-list"></div>
          </div>

          <!-- Stop Timeline -->
          <div class="driver-card">
            <div class="driver-card-title" style="margin-bottom:8px;">Route Stops Sequence</div>
            <div id="liveTripTimeline" class="stops-timeline"></div>
          </div>

          <button class="driver-btn-danger" onclick="DriverApp.openEndTripSummary()">
            <span>End Active Trip &amp; Complete Run</span>
          </button>
        </div>
      </div>

      <!-- SCREEN 17: QR SCANNER & MANUAL PNR MODAL -->
      <div id="driverModal_qrScanner" class="driver-modal-backdrop hidden">
        <div class="driver-modal-sheet">
          <div class="driver-modal-header">
            <div class="driver-modal-title">📷 Ticket QR &amp; PNR Verification</div>
            <button class="driver-close-btn" onclick="DriverApp.closeModal('driverModal_qrScanner')">✕</button>
          </div>
          <div class="qr-scanner-frame">
            <div class="qr-target-guide"></div>
            <div style="color:#94a3b8; font-size:12px; z-index:1; text-align:center;">
              Center passenger QR code inside frame<br>or enter booking reference below
            </div>
          </div>
          <div class="driver-input-group">
            <label class="driver-input-label">Manual Ticket ID / PNR</label>
            <input type="text" id="manualPnrInput" class="driver-input-field" placeholder="e.g. BS-2026-9921" style="text-transform:uppercase;">
          </div>
          <button class="driver-btn-primary" onclick="DriverApp.verifyTicketCode(document.getElementById('manualPnrInput').value)">
            <span>Verify &amp; Board Passenger</span>
          </button>
        </div>
      </div>

      <!-- SCREEN 9: CABIN SEAT CONFIGURATION MODAL -->
      <div id="driverModal_seatConfig" class="driver-modal-backdrop hidden">
        <div class="driver-modal-sheet">
          <div class="driver-modal-header">
            <div class="driver-modal-title">💺 Cabin Seat Availability (40 Seats)</div>
            <button class="driver-close-btn" onclick="DriverApp.closeModal('driverModal_seatConfig')">✕</button>
          </div>
          <div style="font-size:12px; color:#94a3b8; margin-bottom:12px;">
            Real-time layout linked directly to passenger booking engine.
          </div>
          <div id="seatGridContainer" class="driver-seat-grid-container"></div>
          <button class="driver-btn-secondary" onclick="DriverApp.closeModal('driverModal_seatConfig')">Close Layout</button>
        </div>
      </div>

      <!-- SCREEN 11: ROUTE DETAILS MODAL -->
      <div id="driverModal_routeDetails" class="driver-modal-backdrop hidden">
        <div class="driver-modal-sheet">
          <div class="driver-modal-header">
            <div id="routeModalTitle" class="driver-modal-title">Route Corridor</div>
            <button class="driver-close-btn" onclick="DriverApp.closeModal('driverModal_routeDetails')">✕</button>
          </div>
          <div class="driver-stats-grid" style="margin-bottom:14px;">
            <div class="driver-stat-card">
              <div id="routeModalDist" class="driver-stat-val">43.5 km</div>
              <div class="driver-stat-lbl">Distance</div>
            </div>
            <div class="driver-stat-card">
              <div id="routeModalTime" class="driver-stat-val">75 min</div>
              <div class="driver-stat-lbl">Estimated Time</div>
            </div>
            <div class="driver-stat-card">
              <div id="routeModalFare" class="driver-stat-val">₹55</div>
              <div class="driver-stat-lbl">Base Fare</div>
            </div>
          </div>
          <div class="driver-card-title" style="margin-bottom:8px;">Scheduled Stops Sequence</div>
          <div id="routeModalStopsList"></div>
        </div>
      </div>

      <!-- SCREEN 19: END TRIP SUMMARY MODAL -->
      <div id="driverModal_endTrip" class="driver-modal-backdrop hidden">
        <div class="driver-modal-sheet">
          <div class="driver-modal-header">
            <div class="driver-modal-title">🏁 End Trip Confirmation</div>
            <button class="driver-close-btn" onclick="DriverApp.closeModal('driverModal_endTrip')">✕</button>
          </div>
          <div style="font-size:13px; color:#cbd5e1; margin-bottom:16px;">
            Please confirm trip completion. Passenger manifest, stop logs, and mileage will be finalized.
          </div>
          <div class="driver-stats-grid" style="margin-bottom:16px;">
            <div class="driver-stat-card">
              <div id="endTripTotalStops" class="driver-stat-val">8</div>
              <div class="driver-stat-lbl">Stops Completed</div>
            </div>
            <div class="driver-stat-card">
              <div id="endTripBoardedCount" class="driver-stat-val">18</div>
              <div class="driver-stat-lbl">Passengers Boarded</div>
            </div>
            <div class="driver-stat-card">
              <div id="endTripDuration" class="driver-stat-val">68 min</div>
              <div class="driver-stat-lbl">Runtime</div>
            </div>
            <div class="driver-stat-card">
              <div id="endTripDistance" class="driver-stat-val">43.5 km</div>
              <div class="driver-stat-lbl">Distance</div>
            </div>
          </div>
          <button class="driver-btn-primary" style="background:linear-gradient(135deg, #10b981, #059669); margin-bottom:8px;" onclick="DriverApp.confirmEndTrip()">
            <span>✓ Confirm &amp; Submit Trip Summary</span>
          </button>
          <button class="driver-btn-secondary" onclick="DriverApp.closeModal('driverModal_endTrip')">Resume Trip</button>
        </div>
      </div>

    </div>
`;

const html = fs.readFileSync('index.html', 'utf8');
const lines = html.split('\n');

// 0-indexed line 1170 is line 1171 (<section class="driver-dashboard-screen...)
// 0-indexed line 4604 is line 4605 (</div> ending applicationSuccessModal)
const before = lines.slice(0, 1170).join('\n');
const after = lines.slice(4605).join('\n');

let finalHtml = before + '\n' + driverAppHtml + '\n' + after;

if (!finalHtml.includes('driver_app.css')) {
  finalHtml = finalHtml.replace('</head>', '  <link rel="stylesheet" href="driver_app.css">\n</head>');
}
if (!finalHtml.includes('driverApp.js')) {
  finalHtml = finalHtml.replace('  <!-- Real Minimal Application Script -->', '  <!-- Modern Driver Application Controller -->\n  <script src="driverApp.js"></script>\n\n  <!-- Real Minimal Application Script -->');
}

fs.writeFileSync('index.html', finalHtml, 'utf8');
console.log('Successfully written new driver suite into index.html');
