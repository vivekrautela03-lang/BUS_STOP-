const fs = require('fs');

const driverCockpitHtml = `
    <!-- =========================================================================
         5. DRIVER OPERATING CONSOLE SCREEN (ORIGINAL COCKPIT + ALL NEW SCREENS)
         Pixel-perfect original UI with light-blue/white styling + full 30 driver operations suite
         ========================================================================= -->
    <div id="driverDashboardScreen" class="driver-dashboard-screen hidden">
      
      <!-- TOP APPLICATION HEADER BAR -->
      <header class="driver-top-header">
        <div class="driver-header-left">
          <div class="driver-brand-logo" onclick="window.location.reload()" title="Bus Stop Transit Operations">
            <span class="logo-text-bus">BUS</span>
            <span class="logo-text-stop">STOP</span>
          </div>
          <div class="driver-weather-pill" title="Current Mountain Route Climate">
            <div class="weather-sun-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#f59e0b">
                <circle cx="12" cy="12" r="5"/>
                <g stroke="#f59e0b" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </g>
              </svg>
            </div>
            <div class="weather-meta">
              <span class="weather-city-label">Dehradun</span>
              <span class="weather-temp-cond">24°C <span class="weather-cond-tag">Sunny</span></span>
            </div>
          </div>
        </div>

        <!-- SEARCH BAR -->
        <div class="driver-header-center">
          <div class="driver-search-box">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="#94a3b8" stroke-width="2.2" fill="none">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" class="driver-search-input" id="driverDashSearchInput" placeholder="Search passenger name, halt, ticket PNR, or seat..." oninput="filterPassengerManifest(this.value)">
          </div>
        </div>

        <!-- RIGHT HEADER ACTIONS -->
        <div class="driver-header-right">
          
          <!-- Duty Toggle -->
          <button id="driverDutyToggle" class="driver-duty-toggle online" onclick="DriverApp.toggleDutyStatus()" title="Toggle Duty Status" style="display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;border:1.5px solid #e2e8f0;background:#ffffff;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s ease;">
            <span class="duty-dot" style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px rgba(16,185,129,0.5);"></span>
            <span class="duty-text" style="color:#0f172a;font-size:11.5px;">ON DUTY</span>
          </button>

          <!-- Cabin 40 Seats Shortcut -->
          <button type="button" onclick="DriverApp.openSeatConfigModal()" title="Inspect 40 Cabin Seats" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px solid #e2e8f0;background:#ffffff;font-size:12px;font-weight:700;color:#2563eb;cursor:pointer;transition:all 0.15s ease;">
            <span>💺</span>
            <span>40 Seats</span>
          </button>

          <!-- QR Scan Shortcut -->
          <button type="button" onclick="DriverApp.openQrScannerModal()" title="Open QR Ticket Scanner" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px solid #e2e8f0;background:#ffffff;font-size:12px;font-weight:700;color:#059669;cursor:pointer;transition:all 0.15s ease;">
            <span>📷</span>
            <span>QR Scan</span>
          </button>

          <!-- Live Clock -->
          <div class="driver-clock-block">
            <span class="driver-clock-date" id="driverDashClockDate">Wed, 7 Oct 2026</span>
            <strong class="driver-clock-time" id="driverDashClockTime">08:24 AM</strong>
          </div>

          <!-- Notification Bell -->
          <div class="driver-notif-btn-wrap">
            <button type="button" class="btn-driver-bell" onclick="toggleDriverNotifDropdown()" aria-label="Notifications">
              🔔<span class="notif-red-badge">2</span>
            </button>
            <div class="driver-notif-dropdown hidden" id="driverNotifDropdown">
              <div class="notif-dropdown-header">
                <strong>Dispatch Notifications</strong>
                <span class="notif-pill-new">2 New</span>
              </div>
              <div class="notif-dropdown-list">
                <div class="notif-item unread">
                  <span class="notif-dot-blue">●</span>
                  <div class="notif-item-body">
                    <strong>Route 108 Clearance</strong>
                    <p>Clear passage reported along Nepali Farm &amp; Raiwala bypass.</p>
                    <span class="notif-time">5 mins ago</span>
                  </div>
                </div>
                <div class="notif-item unread">
                  <span class="notif-dot-blue">●</span>
                  <div class="notif-item-body">
                    <strong>Manifest Sync Active</strong>
                    <p>3 new passengers booked seats 12A, 14B, 18C from Prem Nagar.</p>
                    <span class="notif-time">12 mins ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Driver Profile Pill -->
          <div class="driver-profile-pill-wrap">
            <div class="driver-profile-pill" onclick="toggleDriverProfileDropdown()">
              <div class="driver-avatar-ring">
                <img src="assets/onboarding/who_driver_thumb.jpg" id="driverProfileAvatarImg" alt="Captain" class="driver-avatar-thumb">
                <span class="driver-online-indicator"></span>
              </div>
              <div class="driver-user-text">
                <strong class="driver-user-name" id="driverDashUserNameDisplay">Shivansh Mourya</strong>
                <span class="driver-user-role-badge">Fleet Captain</span>
              </div>
            </div>
            <div class="driver-profile-dropdown hidden" id="driverProfileDropdown">
              <div class="profile-dropdown-header">
                <strong id="driverTopName">Shivansh Mourya</strong>
                <span style="font-size:11px;color:#64748b;">DL: DL-042023001894 • Active</span>
              </div>
              <div class="profile-dropdown-items">
                <button type="button" class="profile-menu-item" onclick="openDriverProfileModal()">
                  <span>👨‍✈️ Driver Credentials &amp; Bus</span>
                </button>
                <button type="button" class="profile-menu-item" onclick="openDriverSettingsModal()">
                  <span>⚙️ Console Preferences</span>
                </button>
                <button type="button" class="profile-menu-item" onclick="handleDriverSwitchRouteModal()">
                  <span>🔄 Switch Route Corridor</span>
                </button>
                <button type="button" class="profile-menu-item text-danger" onclick="logout()">
                  <span>🚪 End Shift &amp; Logout</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </header>

      <!-- SCROLLABLE MAIN DASHBOARD BODY -->
      <main class="driver-dashboard-scrollable-body">
        
        <!-- BANNER ROW: GREETING & 4 STAT CARDS -->
        <div class="driver-welcome-metrics-row">
          <div class="driver-greeting-column">
            <h1 class="driver-main-greeting" id="driverGreetingHeader">Good Morning, Shivansh 👋</h1>
            <p class="driver-greeting-subtitle">Corridor: Dehradun ISBT ➔ Rishikesh Express • Fleet Bus UK-07-DR-4567 (Tata Starbus Ultra 40-Seater)</p>
          </div>
          <div class="driver-stats-four-cards">
            <div class="driver-metric-card">
              <div class="metric-icon-square icon-blue">🚍</div>
              <div class="metric-content-col">
                <span class="metric-label">Completed Trips</span>
                <strong class="metric-value">142</strong>
                <span class="metric-sublabel text-green">+12 this week</span>
              </div>
            </div>
            <div class="driver-metric-card">
              <div class="metric-icon-square icon-green">👥</div>
              <div class="metric-content-col">
                <span class="metric-label">Passengers Handled</span>
                <strong class="metric-value" id="cardPassengersVal">18</strong>
                <span class="metric-sublabel">Manifest Sync</span>
              </div>
            </div>
            <div class="driver-metric-card">
              <div class="metric-icon-square icon-green">₹</div>
              <div class="metric-content-col">
                <span class="metric-label">Today's Earnings</span>
                <strong class="metric-value" id="cardEarningsVal">₹990</strong>
                <span class="metric-badge-good">Settled</span>
              </div>
            </div>
            <div class="driver-metric-card">
              <div class="metric-icon-square icon-blue">⭐</div>
              <div class="metric-content-col">
                <span class="metric-label">Safety Rating</span>
                <strong class="metric-value">5.0 ★</strong>
                <span class="metric-sublabel">Top 5% Mountain Fleet</span>
              </div>
            </div>
          </div>
        </div>

        <!-- MAIN TWO-COLUMN DASHBOARD GRID -->
        <div class="driver-dashboard-two-col-grid">
          
          <!-- LEFT COLUMN: LIVE MAP + SCHEDULE + RECENT ACTIVITY -->
          <div class="driver-dash-col-left">
            
            <!-- LIVE TRACKING MAP CARD -->
            <div class="driver-map-stage-card" id="driverMapStageCard">
              <div id="driverCockpitMap" class="driver-cockpit-map-viewport"></div>

              <!-- FLOATING LIVE PILL -->
              <div class="map-floating-pill-live">
                <span class="map-live-dot-pulse"></span>
                <span>LIVE SATELLITE GPS</span>
              </div>

              <!-- FLOATING CONTROLS STACK -->
              <div class="map-floating-controls-stack">
                <button type="button" class="map-control-action-btn" onclick="toggleDriverMapFullscreen()" title="Toggle Fullscreen">⛶</button>
                <button type="button" class="map-control-action-btn" onclick="driverCockpitZoomIn()" title="Zoom In">+</button>
                <button type="button" class="map-control-action-btn" onclick="driverCockpitZoomOut()" title="Zoom Out">−</button>
                <button type="button" class="map-control-action-btn" onclick="driverCockpitCenterBus()" title="Recenter Tata Starbus">🎯</button>
                <button type="button" class="map-control-action-btn" onclick="toggleDriverMapTileLayer()" title="Switch Topo / Street Layer">🏔️</button>
              </div>

              <!-- FLOATING ROUTE SUMMARY GLASS CARD -->
              <div class="map-floating-route-summary-glass">
                <div class="route-summary-title-line">
                  <strong class="route-glass-title" id="driverRouteGlassTitle">Dehradun (ISBT) ➔ Rishikesh Express</strong>
                </div>
                <div class="route-summary-meta-line">
                  <span>Route 108</span>
                  <span class="route-meta-pipe">|</span>
                  <span>45 km</span>
                  <span class="route-meta-pipe">|</span>
                  <span>Tata Starbus Ultra (UK-07-DR-4567)</span>
                </div>
                <!-- Stepper Progress Bar -->
                <div class="route-stepper-progress-box">
                  <div class="route-stepper-bar-track">
                    <div class="route-stepper-bar-fill" id="driverRouteTrackFill" style="width: 25%;"></div>
                  </div>
                  <div class="route-stepper-checkpoints">
                    <div class="checkpoint-dot completed"></div>
                    <div class="checkpoint-dot active"><span class="checkpoint-active-ring"></span></div>
                    <div class="checkpoint-dot pending"></div>
                    <div class="checkpoint-dot pending"></div>
                    <div class="checkpoint-dot pending"></div>
                  </div>
                </div>
                <div class="route-summary-bottom-stats">
                  <span>Active Halt: Prem Nagar</span>
                  <span class="dot-bullet">•</span>
                  <span>In 5 mins (Speed: 48 km/h)</span>
                </div>
              </div>
            </div>

            <!-- BOTTOM TWO CARDS ROW: SCHEDULE & RECENT ACTIVITY -->
            <div class="driver-bottom-two-cards-row">
              
              <!-- SCHEDULE TABLE CARD -->
              <div class="driver-panel-card">
                <div class="panel-card-header">
                  <div class="panel-title-group">
                    <div class="panel-icon-wrap icon-blue">🕒</div>
                    <h3 class="panel-card-title">Route Schedule &amp; Halts</h3>
                  </div>
                  <button type="button" class="btn-panel-view-all" onclick="handleDriverSwitchRouteModal()">View Corridor ➔</button>
                </div>
                <div class="schedule-table-rows" id="driverScheduleRowsContainer">
                  <!-- Rendered dynamically by renderDriverStopsProgressUI -->
                </div>
              </div>

              <!-- RECENT ACTIVITY LOG CARD -->
              <div class="driver-panel-card">
                <div class="panel-card-header">
                  <div class="panel-title-group">
                    <div class="panel-icon-wrap icon-blue">📋</div>
                    <h3 class="panel-card-title">Recent Activity Log</h3>
                  </div>
                  <span style="font-size:11px;color:#10b981;font-weight:700;">● Live Feed</span>
                </div>
                <div class="activity-timeline-rows" id="driverActivityRowsContainer">
                  <div class="activity-item-line">
                    <span class="activity-dot dot-green"></span>
                    <div class="activity-details">
                      <span class="activity-event-text">Driver console online &bull; GPS broadcasting active</span>
                    </div>
                    <span class="activity-time-stamp">Just now</span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          <!-- RIGHT COLUMN: TARGET HALT + UPCOMING + ACTIONS + QUICK MATRIX -->
          <div class="driver-dash-col-right">
            
            <!-- TARGET HALT / NEXT TRIP CARD -->
            <div class="driver-side-next-trip-card">
              <div class="next-trip-card-head">
                <div class="next-trip-head-left">
                  <div class="next-trip-icon-box">🎯</div>
                  <div>
                    <span class="next-trip-sub-heading">CURRENT TARGET HALT</span>
                    <div class="next-trip-bold-title" id="driverNextTripTargetStop">Prem Nagar</div>
                    <div class="next-trip-distance-eta" id="driverNextTripDistEta">2.4 km • Scheduled 08:30 AM</div>
                  </div>
                </div>
                <span class="next-trip-eta-badge" id="driverNextTripEtaPill">Next Halt</span>
              </div>
            </div>

            <!-- UPCOMING STOPS VERTICAL LIST CARD -->
            <div class="driver-side-upcoming-card">
              <div class="panel-card-header" style="margin-bottom:10px;">
                <div class="panel-title-group">
                  <div class="panel-icon-wrap icon-blue" style="width:28px;height:28px;font-size:13px;">🚏</div>
                  <h4 style="font-size:14px;font-weight:800;color:#0f172a;margin:0;">Upcoming Corridor Halts</h4>
                </div>
                <span style="font-size:11px;color:#64748b;font-weight:600;">5 Total</span>
              </div>
              <div class="upcoming-stops-vertical-list" id="driverUpcomingStopsContainer">
                <!-- Rendered dynamically by renderDriverStopsProgressUI -->
              </div>
            </div>

            <!-- PRIMARY ACTION: CONTINUE TRIP BUTTON -->
            <button type="button" class="btn-primary-continue-trip" id="btnContinueTripAction" onclick="handleContinueTripClick()">
              <div class="continue-action-left">
                <div class="continue-play-round-icon" id="continueTripIconWrap">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="#2563eb">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </div>
                <div class="continue-action-text-col">
                  <span class="continue-title-bold" id="continueTripTitleText">Continue Trip</span>
                  <span class="continue-subtitle-light" id="continueTripSubText">Start navigation &amp; live GPS tracking</span>
                </div>
              </div>
              <div class="continue-chevron-right">➔</div>
            </button>

            <!-- SECONDARY ACTIONS: END TRIP & SWITCH ROUTE -->
            <div class="driver-secondary-action-grid">
              <button type="button" class="btn-secondary-action-tile" onclick="handleDriverEndTripModal()">
                <div class="sec-tile-icon-box bg-red-soft">🏁</div>
                <div class="sec-tile-text-col">
                  <span class="sec-tile-title">End Trip</span>
                  <span class="sec-tile-sub">Complete journey</span>
                </div>
                <span class="sec-tile-chevron">➔</span>
              </button>
              <button type="button" class="btn-secondary-action-tile" onclick="handleDriverSwitchRouteModal()">
                <div class="sec-tile-icon-box bg-blue-soft">🔄</div>
                <div class="sec-tile-text-col">
                  <span class="sec-tile-title">Switch Route</span>
                  <span class="sec-tile-sub">Select corridor</span>
                </div>
                <span class="sec-tile-chevron">➔</span>
              </button>
            </div>

            <!-- 2x3 QUICK FEATURE MATRIX TILES (OLD + ALL NEW SCREENS INTEGRATED) -->
            <div class="driver-quick-features-matrix">
              
              <!-- 1. PASSENGER MANIFEST -->
              <div class="quick-matrix-tile" onclick="openDriverPassengersModal()">
                <div class="matrix-tile-icon-square icon-blue">👥</div>
                <strong class="matrix-tile-title">Passenger Manifest</strong>
                <span class="matrix-tile-sub">18 Bookings &bull; Verify</span>
              </div>

              <!-- 2. DRIVER EARNINGS -->
              <div class="quick-matrix-tile" onclick="openDriverEarningsModal()">
                <div class="matrix-tile-icon-square icon-green">💰</div>
                <strong class="matrix-tile-title">Driver Earnings</strong>
                <span class="matrix-tile-sub">₹990 fare settled</span>
              </div>

              <!-- 3. PRE-TRIP CHECKLIST (NEW SCREEN) -->
              <div class="quick-matrix-tile" onclick="DriverApp.openPreTripChecklist()">
                <div class="matrix-tile-icon-square icon-purple">⚡</div>
                <strong class="matrix-tile-title">Pre-Trip Checklist</strong>
                <span class="matrix-tile-sub">6-point safety check</span>
              </div>

              <!-- 4. CABIN 40 SEATS (NEW SCREEN) -->
              <div class="quick-matrix-tile" onclick="DriverApp.openSeatConfigModal()">
                <div class="matrix-tile-icon-square icon-orange">💺</div>
                <strong class="matrix-tile-title">Cabin 40 Seats</strong>
                <span class="matrix-tile-sub">Tata Starbus 2x2 grid</span>
              </div>

              <!-- 5. QR TICKET SCANNER (NEW SCREEN) -->
              <div class="quick-matrix-tile" onclick="DriverApp.openQrScannerModal()">
                <div class="matrix-tile-icon-square icon-slate">📷</div>
                <strong class="matrix-tile-title">QR Ticket Scanner</strong>
                <span class="matrix-tile-sub">Live camera &bull; PNR</span>
              </div>

              <!-- 6. REPORT INCIDENT -->
              <div class="quick-matrix-tile" onclick="openDriverIncidentModal()">
                <div class="matrix-tile-icon-square icon-yellow">⚠️</div>
                <strong class="matrix-tile-title">Report Incident</strong>
                <span class="matrix-tile-sub">Delay / roadblock alert</span>
              </div>

            </div>

          </div>

        </div>

      </main>

      <!-- =======================================================================
           MODALS SECTION (ORIGINAL COCKPIT + NEW OPERATIONAL SCREENS)
           ======================================================================= -->

      <!-- MODAL 1: PASSENGER MANIFEST & BOARDING VERIFICATION -->
      <div class="modal-backdrop hidden" id="driverPassengersModal" onclick="closeDriverPassengersModal(event)">
        <div class="driver-modal-card-box" onclick="event.stopPropagation()">
          <div class="driver-modal-head">
            <div class="modal-head-title-wrap">
              <span class="modal-pill-tag">Passenger Operations</span>
              <h3>Passenger Manifest &amp; Boarding Passes</h3>
              <p>Authoritative passenger bookings list for Bus UK-07-DR-4567</p>
            </div>
            <button type="button" class="btn-driver-modal-close" onclick="closeDriverPassengersModal()">✕</button>
          </div>
          <div class="driver-modal-body">
            
            <!-- Quick Boarding Verification & Scanner Bar -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px 14px;margin-bottom:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
              <input type="text" id="driverTicketVerifyInput" placeholder="Enter or scan ticket reference (PNR)..." style="flex:1;min-width:200px;padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;font-family:monospace;outline:none;">
              <button type="button" onclick="verifyTicketFromInput()" style="padding:8px 16px;border-radius:8px;background:#2563eb;color:#fff;border:none;font-weight:700;font-size:12px;cursor:pointer;">
                Verify &amp; Board ➔
              </button>
              <button type="button" onclick="DriverApp.openQrScannerModal()" style="padding:8px 14px;border-radius:8px;background:#059669;color:#fff;border:none;font-weight:700;font-size:12px;cursor:pointer;">
                📷 Open QR Scanner
              </button>
            </div>

            <div class="manifest-search-row">
              <input type="text" class="manifest-search-input" placeholder="Filter manifest by passenger, seat, or stop..." oninput="filterPassengerManifest(this.value)">
              <span class="manifest-count-pill" id="manifestModalCountBadge">18 Total Bookings</span>
            </div>

            <div class="manifest-table-wrap">
              <table class="manifest-table">
                <thead>
                  <tr>
                    <th>Seat</th>
                    <th>Passenger / PNR</th>
                    <th>Boarding</th>
                    <th>Destination</th>
                    <th>Status / Action</th>
                  </tr>
                </thead>
                <tbody id="driverManifestTableBody">
                  <!-- Loaded dynamically by loadDriverPassengerData() -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL 2: DRIVER EARNINGS & SETTLEMENT -->
      <div class="modal-backdrop hidden" id="driverEarningsModal" onclick="closeDriverEarningsModal(event)">
        <div class="driver-modal-card-box" onclick="event.stopPropagation()">
          <div class="driver-modal-head">
            <div class="modal-head-title-wrap">
              <span class="modal-pill-tag">Financial Settlement</span>
              <h3>Driver Earnings &amp; Shift Revenue</h3>
              <p>Live calculated passenger fares for Dehradun ➔ Rishikesh Corridor</p>
            </div>
            <button type="button" class="btn-driver-modal-close" onclick="closeDriverEarningsModal()">✕</button>
          </div>
          <div class="driver-modal-body">
            <div class="earnings-summary-cards">
              <div class="earn-sum-card bg-sum-blue">
                <span class="earn-sum-label">TOTAL FARE COLLECTED</span>
                <strong class="earn-sum-val">₹990</strong>
                <span class="earn-sum-trend">↑ 18 Booked Seats</span>
              </div>
              <div class="earn-sum-card bg-sum-green">
                <span class="earn-sum-label">DIGITAL UPI / CARDS (78%)</span>
                <strong class="earn-sum-val">₹772</strong>
                <span class="earn-sum-trend">Direct UTC Wallet</span>
              </div>
              <div class="earn-sum-card bg-sum-amber">
                <span class="earn-sum-label">CASH IN CABIN (22%)</span>
                <strong class="earn-sum-val">₹218</strong>
                <span class="earn-sum-trend">Reconciled at Terminal</span>
              </div>
            </div>

            <h4 class="earnings-section-title">Trip Breakdown Log</h4>
            <div class="earnings-breakdown-list" id="driverEarningsBreakdownList">
              <!-- Rendered dynamically by updateDriverEarningsUI() -->
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL 3: END TRIP CONFIRMATION -->
      <div class="modal-backdrop hidden" id="driverEndTripModal" onclick="closeDriverEndTripModal(event)">
        <div class="driver-modal-card-box" style="max-width:480px;text-align:center;" onclick="event.stopPropagation()">
          <div class="driver-modal-head" style="justify-content:center;position:relative;">
            <div class="modal-head-title-wrap">
              <div style="font-size:36px;margin-bottom:8px;">🏁</div>
              <h3>End Current Trip?</h3>
              <p>Confirm run termination and final passenger settlement</p>
            </div>
            <button type="button" class="btn-driver-modal-close" style="position:absolute;top:16px;right:16px;" onclick="closeDriverEndTripModal()">✕</button>
          </div>
          <div class="driver-modal-body">
            <p style="font-size:13.5px;color:#64748b;line-height:1.5;margin-bottom:20px;">
              Ending this trip will freeze passenger manifests, finalize GPS distance metrics (45 km logged), and notify Central Mountain Dispatch.
            </p>
            <div class="end-trip-modal-actions">
              <button type="button" class="btn-modal-cancel" onclick="closeDriverEndTripModal()">Resume Trip</button>
              <button type="button" class="btn-modal-confirm-end" onclick="confirmDriverEndTrip()">Confirm &amp; End Trip</button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL 4: SWITCH TRANSIT CORRIDOR -->
      <div class="modal-backdrop hidden" id="driverSwitchRouteModal" onclick="closeDriverSwitchRouteModal(event)">
        <div class="driver-modal-card-box" onclick="event.stopPropagation()">
          <div class="driver-modal-head">
            <div class="modal-head-title-wrap">
              <span class="modal-pill-tag">Fleet Routing</span>
              <h3>Switch Transit Corridor</h3>
              <p>Select assigned mountain transport route for your Tata Starbus</p>
            </div>
            <button type="button" class="btn-driver-modal-close" onclick="closeDriverSwitchRouteModal()">✕</button>
          </div>
          <div class="driver-modal-body">
            <div class="switch-routes-list" id="driverAvailableRoutesList">
              <!-- Populated dynamically by handleDriverSwitchRouteModal() -->
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL 5: REPORT INCIDENT OR DELAY -->
      <div class="modal-backdrop hidden" id="driverIncidentModal" onclick="closeDriverIncidentModal(event)">
        <div class="driver-modal-card-box" style="max-width:520px;" onclick="event.stopPropagation()">
          <div class="driver-modal-head">
            <div class="modal-head-title-wrap">
              <span class="modal-pill-tag" style="color:#d97706;background:#fef3c7;">Safety &amp; Delays</span>
              <h3>Broadcast Incident Advisory</h3>
              <p>Notify all passengers and Central Dispatch immediately</p>
            </div>
            <button type="button" class="btn-driver-modal-close" onclick="closeDriverIncidentModal()">✕</button>
          </div>
          <div class="driver-modal-body">
            <div style="margin-bottom:14px;">
              <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:6px;">Incident Category</label>
              <select id="driverIncidentType" style="width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;font-family:inherit;background:#fff;outline:none;">
                <option value="Traffic Congestion">Traffic Congestion / Heavy Jam</option>
                <option value="Landslide or Roadblock">Mountain Landslide / Road Construction</option>
                <option value="Vehicle Mechanical Check">Vehicle Inspection / Tire Pressure Check</option>
                <option value="Adverse Weather Fog">Heavy Mountain Rain / Fog (Reduced Speed)</option>
                <option value="Medical Assistance">Passenger Medical Assistance</option>
              </select>
            </div>
            <div style="margin-bottom:18px;">
              <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:6px;">Advisory Details for Passengers</label>
              <textarea id="driverIncidentMessage" rows="3" placeholder="Brief note: e.g. '15-min delay near Raiwala junction due to heavy traffic clearance.'" style="width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:13px;font-family:inherit;outline:none;resize:none;box-sizing:border-box;"></textarea>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;">
              <button type="button" class="btn-modal-cancel" onclick="closeDriverIncidentModal()">Cancel</button>
              <button type="button" class="btn-save-driver-settings" style="background:#ea580c;" onclick="submitDriverIncident()">Broadcast Advisory 📡</button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL 6: CONSOLE SETTINGS & PREFERENCES -->
      <div class="modal-backdrop hidden" id="driverSettingsModal" onclick="closeDriverSettingsModal(event)">
        <div class="driver-modal-card-box" style="max-width:540px;" onclick="event.stopPropagation()">
          <div class="driver-modal-head">
            <div class="modal-head-title-wrap">
              <span class="modal-pill-tag">Console Preferences</span>
              <h3>Driver Console Settings</h3>
              <p>Audio announcements, map telemetry, and automated workflows</p>
            </div>
            <button type="button" class="btn-driver-modal-close" onclick="closeDriverSettingsModal()">✕</button>
          </div>
          <div class="driver-modal-body">
            <div class="settings-toggle-row">
              <div>
                <strong style="display:block;font-size:13.5px;color:#0f172a;">Voice Stop Announcements (TTS)</strong>
                <span style="font-size:11.5px;color:#64748b;">Read upcoming stop names aloud upon arrival</span>
              </div>
              <input type="checkbox" id="prefAudioAnnouncements" checked style="width:18px;height:18px;cursor:pointer;">
            </div>
            <div class="settings-toggle-row">
              <div>
                <strong style="display:block;font-size:13.5px;color:#0f172a;">Auto-Open Manifest on Halt</strong>
                <span style="font-size:11.5px;color:#64748b;">Display passenger list when bus arrives at designated halt</span>
              </div>
              <input type="checkbox" id="prefAutoAccept" checked style="width:18px;height:18px;cursor:pointer;">
            </div>
            <div class="settings-toggle-row">
              <div>
                <strong style="display:block;font-size:13.5px;color:#0f172a;">Mountain Topographic Map Relief</strong>
                <span style="font-size:11.5px;color:#64748b;">Display elevation contours and hill shades on Leaflet map</span>
              </div>
              <input type="checkbox" id="prefTopoMap" checked style="width:18px;height:18px;cursor:pointer;">
            </div>
            <div style="margin-top:20px;text-align:right;">
              <button type="button" class="btn-save-driver-settings" onclick="closeDriverSettingsModal()">Save Preferences</button>
            </div>
          </div>
        </div>
      </div>

      <!-- =======================================================================
           NEW SCREENS: CHECKLIST, QR SCANNER, CABIN 40 SEATS, PROFILE MODALS
           ======================================================================= -->

      <!-- NEW SCREEN 1: PRE-TRIP SAFETY CHECKLIST MODAL -->
      <div class="modal-backdrop hidden" id="driverModal_preTrip" onclick="DriverApp.closeModal('driverModal_preTrip')">
        <div class="driver-modal-card-box" style="max-width:580px;" onclick="event.stopPropagation()">
          <div class="driver-modal-head">
            <div class="modal-head-title-wrap">
              <span class="modal-pill-tag" style="background:#fef3c7;color:#b45309;">Mandatory Pre-Trip Certification</span>
              <h3>6-Point Pre-Trip Safety Checklist</h3>
              <p>Vehicle: Tata Starbus Ultra UK-07-DR-4567 &bull; Uttarakhand Transport Authority</p>
            </div>
            <button type="button" class="btn-driver-modal-close" onclick="DriverApp.closeModal('driverModal_preTrip')">✕</button>
          </div>
          <div class="driver-modal-body">
            <div style="font-size:13px;color:#475569;margin-bottom:16px;">
              Please physically inspect each item below prior to beginning passenger embarkation.
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
              <label style="display:flex;align-items:flex-start;gap:12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;cursor:pointer;">
                <input type="checkbox" class="pre-trip-chk" onchange="DriverApp.validatePreTripChecklist()" style="width:18px;height:18px;margin-top:2px;">
                <div>
                  <strong style="display:block;font-size:13px;color:#0f172a;">1. Brakes &amp; Retarders</strong>
                  <span style="font-size:11.5px;color:#64748b;">Air brake pressure normal (&gt; 7 bar) and parking brake holds.</span>
                </div>
              </label>
              <label style="display:flex;align-items:flex-start;gap:12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;cursor:pointer;">
                <input type="checkbox" class="pre-trip-chk" onchange="DriverApp.validatePreTripChecklist()" style="width:18px;height:18px;margin-top:2px;">
                <div>
                  <strong style="display:block;font-size:13px;color:#0f172a;">2. Tires &amp; Tread Depth</strong>
                  <span style="font-size:11.5px;color:#64748b;">All 6 mountain road tires inspected; spare tire inflated and mounted.</span>
                </div>
              </label>
              <label style="display:flex;align-items:flex-start;gap:12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;cursor:pointer;">
                <input type="checkbox" class="pre-trip-chk" onchange="DriverApp.validatePreTripChecklist()" style="width:18px;height:18px;margin-top:2px;">
                <div>
                  <strong style="display:block;font-size:13px;color:#0f172a;">3. Fuel &amp; Engine Fluids</strong>
                  <span style="font-size:11.5px;color:#64748b;">Fuel tank &gt; 80%; coolant, DEF, and engine oil levels optimal.</span>
                </div>
              </label>
              <label style="display:flex;align-items:flex-start;gap:12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;cursor:pointer;">
                <input type="checkbox" class="pre-trip-chk" onchange="DriverApp.validatePreTripChecklist()" style="width:18px;height:18px;margin-top:2px;">
                <div>
                  <strong style="display:block;font-size:13px;color:#0f172a;">4. Emergency Exits &amp; First Aid Kit</strong>
                  <span style="font-size:11.5px;color:#64748b;">Roof hatch operable, safety hammers in place, first aid kit stocked.</span>
                </div>
              </label>
              <label style="display:flex;align-items:flex-start;gap:12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;cursor:pointer;">
                <input type="checkbox" class="pre-trip-chk" onchange="DriverApp.validatePreTripChecklist()" style="width:18px;height:18px;margin-top:2px;">
                <div>
                  <strong style="display:block;font-size:13px;color:#0f172a;">5. Pneumatic Passenger Doors</strong>
                  <span style="font-size:11.5px;color:#64748b;">Front and rear door interlocks open and close smoothly.</span>
                </div>
              </label>
              <label style="display:flex;align-items:flex-start;gap:12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;cursor:pointer;">
                <input type="checkbox" class="pre-trip-chk" onchange="DriverApp.validatePreTripChecklist()" style="width:18px;height:18px;margin-top:2px;">
                <div>
                  <strong style="display:block;font-size:13px;color:#0f172a;">6. Cabin Cleanliness &amp; Fire Extinguisher</strong>
                  <span style="font-size:11.5px;color:#64748b;">Aisles free of obstructions; 6 kg ABC dry powder extinguisher certified.</span>
                </div>
              </label>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:12px;">
              <button type="button" class="btn-modal-cancel" onclick="DriverApp.closeModal('driverModal_preTrip')">Cancel</button>
              <button type="button" class="btn-save-driver-settings" id="btnConfirmStartTrip" disabled onclick="DriverApp.confirmStartTrip()" style="background:#10b981;">
                ✓ Certify &amp; Start Scheduled Trip
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- NEW SCREEN 2: QR TICKET SCANNER MODAL -->
      <div class="modal-backdrop hidden" id="driverModal_qrScanner" onclick="DriverApp.closeModal('driverModal_qrScanner')">
        <div class="driver-modal-card-box" style="max-width:480px;text-align:center;" onclick="event.stopPropagation()">
          <div class="driver-modal-head">
            <div class="modal-head-title-wrap">
              <span class="modal-pill-tag" style="background:#dcfce7;color:#15803d;">Instant Pass Verification</span>
              <h3>QR Ticket Camera Scanner</h3>
              <p>Scan passenger digital QR code or enter PNR</p>
            </div>
            <button type="button" class="btn-driver-modal-close" onclick="DriverApp.closeModal('driverModal_qrScanner')">✕</button>
          </div>
          <div class="driver-modal-body">
            
            <!-- Camera Viewfinder Simulator -->
            <div style="width:100%;height:220px;background:#0f172a;border-radius:16px;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;margin-bottom:16px;border:2px solid #38bdf8;">
              <!-- Animated Laser Line -->
              <div style="position:absolute;left:10%;right:10%;height:2px;background:#38bdf8;box-shadow:0 0 12px #38bdf8;animation:laserScan 2s infinite ease-in-out;"></div>
              
              <!-- Reticle Corner Frames -->
              <div style="width:160px;height:160px;border:2px dashed rgba(255,255,255,0.4);border-radius:12px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:32px;">📷</span>
              </div>
              <span style="position:absolute;bottom:10px;font-size:11px;color:#94a3b8;font-weight:600;">Point camera at passenger boarding pass</span>
            </div>

            <!-- Manual PNR input fallback -->
            <div style="margin-bottom:16px;text-align:left;">
              <label style="display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:6px;">Manual PNR / Ticket Code</label>
              <div style="display:flex;gap:8px;">
                <input type="text" id="driverQrManualInput" placeholder="e.g. BST-288883" style="flex:1;padding:10px 14px;border:1px solid #cbd5e1;border-radius:8px;font-size:14px;font-family:monospace;font-weight:700;outline:none;">
                <button type="button" class="btn-save-driver-settings" onclick="DriverApp.verifyTicketCode(document.getElementById('driverQrManualInput').value)">
                  Verify ➔
                </button>
              </div>
            </div>

            <button type="button" class="btn-modal-cancel" style="width:100%;" onclick="DriverApp.closeModal('driverModal_qrScanner')">Close Scanner</button>
          </div>
        </div>
      </div>

      <!-- NEW SCREEN 3: 40-SEAT CABIN SEATING CONFIGURATION MODAL -->
      <div class="modal-backdrop hidden" id="driverModal_seatConfig" onclick="DriverApp.closeModal('driverModal_seatConfig')">
        <div class="driver-modal-card-box" style="max-width:620px;" onclick="event.stopPropagation()">
          <div class="driver-modal-head">
            <div class="modal-head-title-wrap">
              <span class="modal-pill-tag">Fleet Layout</span>
              <h3>Tata Starbus Ultra — 40-Seat Cabin Layout</h3>
              <p>Bus UK-07-DR-4567 &bull; 2x2 Seating Matrix with Real Passenger Allocation</p>
            </div>
            <button type="button" class="btn-driver-modal-close" onclick="DriverApp.closeModal('driverModal_seatConfig')">✕</button>
          </div>
          <div class="driver-modal-body">
            
            <!-- Legend Bar -->
            <div style="display:flex;gap:14px;align-items:center;justify-content:center;margin-bottom:16px;padding:8px;background:#f8fafc;border-radius:10px;font-size:12px;font-weight:700;">
              <span style="display:inline-flex;align-items:center;gap:6px;">
                <span style="width:12px;height:12px;border-radius:3px;background:#10b981;"></span>
                <span>Available (22)</span>
              </span>
              <span style="display:inline-flex;align-items:center;gap:6px;">
                <span style="width:12px;height:12px;border-radius:3px;background:#2563eb;"></span>
                <span>Booked / Occupied (18)</span>
              </span>
              <span style="display:inline-flex;align-items:center;gap:6px;">
                <span style="width:12px;height:12px;border-radius:3px;background:#f59e0b;"></span>
                <span>Special / Ladies</span>
              </span>
            </div>

            <!-- Front Driver Cockpit indicator -->
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 16px;background:#f1f5f9;border-radius:8px;margin-bottom:12px;font-size:12px;color:#475569;font-weight:700;">
              <span>🚪 Front Entry Door</span>
              <span>👨‍✈️ Driver Steering Wheel</span>
            </div>

            <!-- Scrollable Cabin Seat Layout Grid -->
            <div id="seatGridContainer" style="display:flex;flex-direction:column;gap:8px;max-height:360px;overflow-y:auto;padding:8px;">
              <!-- Populated dynamically by DriverApp.openSeatConfigModal() -->
            </div>

            <div style="margin-top:16px;text-align:right;">
              <button type="button" class="btn-save-driver-settings" onclick="DriverApp.closeModal('driverModal_seatConfig')">Done</button>
            </div>
          </div>
        </div>
      </div>

      <!-- NEW SCREEN 4: DRIVER CREDENTIALS & FLEET PROFILE MODAL -->
      <div class="modal-backdrop hidden" id="driverModal_profile" onclick="closeDriverProfileModal(event)">
        <div class="driver-modal-card-box" style="max-width:540px;" onclick="event.stopPropagation()">
          <div class="driver-modal-head">
            <div class="modal-head-title-wrap">
              <span class="modal-pill-tag">Captain Credentials</span>
              <h3>Driver &amp; Assigned Vehicle Profile</h3>
              <p>Uttarakhand State Road Transport Corporation Record</p>
            </div>
            <button type="button" class="btn-driver-modal-close" onclick="closeDriverProfileModal()">✕</button>
          </div>
          <div class="driver-modal-body">
            <div style="display:flex;align-items:center;gap:16px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;margin-bottom:16px;">
              <img src="assets/onboarding/who_driver_thumb.jpg" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid #2563eb;" alt="Driver">
              <div>
                <strong style="font-size:18px;color:#0f172a;" id="profileModalDriverName">Shivansh Mourya</strong>
                <div style="font-size:12px;color:#2563eb;font-weight:700;">Mountain Transit Authority &bull; Master Captain</div>
                <div style="font-size:11.5px;color:#64748b;margin-top:2px;">ID: UK-DRV-2026-8842 &bull; Active &bull; Verified</div>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <div style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;">
                <span style="font-size:11px;color:#64748b;display:block;">Commercial License</span>
                <strong style="font-size:13px;color:#0f172a;" id="profileModalDl">DL-042023001894</strong>
              </div>
              <div style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;">
                <span style="font-size:11px;color:#64748b;display:block;">License Expiry</span>
                <strong style="font-size:13px;color:#0f172a;">28 Oct 2030</strong>
              </div>
              <div style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;">
                <span style="font-size:11px;color:#64748b;display:block;">Assigned Fleet Bus</span>
                <strong style="font-size:13px;color:#2563eb;">UK-07-DR-4567</strong>
              </div>
              <div style="padding:10px 12px;border:1px solid #e2e8f0;border-radius:10px;">
                <span style="font-size:11px;color:#64748b;display:block;">Bus Model</span>
                <strong style="font-size:13px;color:#0f172a;">Tata Starbus Ultra 40S</strong>
              </div>
            </div>

            <div style="margin-top:20px;text-align:right;">
              <button type="button" class="btn-save-driver-settings" onclick="closeDriverProfileModal()">Close</button>
            </div>
          </div>
        </div>
      </div>

    </div>
`;

// Read index.html
const indexPath = 'd:/BUS STOP/index.html';
let content = fs.readFileSync(indexPath, 'utf8');

// Replace everything between lines containing id="driverAppContainer" and line 1544
const startIdx = content.indexOf('<div id="driverAppContainer"');
if (startIdx === -1) {
  console.error('Could not find driverAppContainer in index.html');
  process.exit(1);
}

// Find the closing of this container before Stop Details Modal
const endMarker = '<!-- =========================================================================\r\n         7. STOP DETAILS MODAL';
const altEndMarker = '<!-- =========================================================================\n         7. STOP DETAILS MODAL';
let endIdx = content.indexOf(endMarker);
if (endIdx === -1) endIdx = content.indexOf(altEndMarker);

if (endIdx === -1) {
  console.error('Could not find STOP DETAILS MODAL marker');
  process.exit(1);
}

// Replace
const newContent = content.substring(0, startIdx) + driverCockpitHtml.trim() + '\n\n    ' + content.substring(endIdx);
fs.writeFileSync(indexPath, newContent, 'utf8');
console.log('Successfully updated index.html with original driver cockpit and all integrated modals!');
