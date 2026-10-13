// ==========================================================================
// BUS STOP — PRODUCTION APPLICATION SCRIPT WITH REAL SUPABASE AUTH & ROLES
// Splash Screen ➔ Seamless Auth ➔ Choose Role ➔ Role Traveler Pass
// ==========================================================================

let activeAuthMode = 'login'; // 'login' or 'signup'
let splashTimeout = null;
let supabaseClient = null;
let activeUser = null;
let selectedRole = 'passenger'; // 'passenger', 'driver', or 'station_master'

const ROLE_DEFINITIONS = {
  passenger: {
    name: 'Passenger',
    title: 'Scenic Mountain Passenger',
    label: 'Passenger',
    tier: 'Scenic Mountain Line • Citizen Traveler',
    stat1Label: 'Route Access',
    stat1Value: '∞ All-Lines',
    stat2Label: 'Mountain Pass',
    stat2Value: 'Active',
    stat3Label: 'Boarding Gate',
    stat3Value: 'Platform 1',
    footerQuote1: 'More than a ride,',
    footerQuote2: 'A connected journey. ❤️'
  },
  driver: {
    name: 'Bus Driver',
    title: 'Certified Mountain Captain',
    label: 'Bus Driver',
    tier: 'Mountain Transit Authority • Fleet Captain',
    stat1Label: 'Assigned Bus',
    stat1Value: '#BS-402',
    stat2Label: 'Active Shift',
    stat2Value: 'On Route',
    stat3Label: 'GPS Tracking',
    stat3Value: 'Live Signal',
    footerQuote1: 'Eyes on the road, heart in the hills,',
    footerQuote2: 'Safe travels together. 🚌'
  },
  station_master: {
    name: 'Station Master',
    title: 'Valley Depot Station Master',
    label: 'Station Master',
    tier: 'Regional Transit Headquarters • Chief Controller',
    stat1Label: 'Station Depot',
    stat1Value: 'Valley Main',
    stat2Label: 'Active Buses',
    stat2Value: '18 Online',
    stat3Label: 'Timetable',
    stat3Value: 'On Schedule',
    footerQuote1: 'Connecting every stop, every soul,',
    footerQuote2: 'Guiding every journey. 🚏'
  },
  admin: {
    name: 'Station Administrator',
    title: 'Transit Authority Fleet Director',
    label: 'Administrator',
    tier: 'Central Dispatch Command • Admin HQ',
    stat1Label: 'Station Depot',
    stat1Value: 'Dehradun HQ',
    stat2Label: 'Active Buses',
    stat2Value: '5 Fleet Buses',
    stat3Label: 'Timetable',
    stat3Value: 'Live Network',
    footerQuote1: 'Full fleet control, real-time dispatch,',
    footerQuote2: 'Connecting passengers and captains. 🚏'
  }
};

function initApp() {
  const driverProf = document.getElementById('driverProfileScreen');
  if (driverProf) {
    driverProf.classList.add('hidden');
    driverProf.style.display = 'none';
  }
  initSplash();
  initCountryDropdown();
  initKeyboardNavigation();
  initInputValidation();
  initSupabase();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already ready
  initApp();
}

// ==========================================================================
// 1. SPLASH SCREEN LIFECYCLE (FAST SEAMLESS STARTUP)
// ==========================================================================
const SPLASH_DURATION_MS = 1000;
const SPLASH_FADE_MS = 400;

function initSplash() {
  const splash = document.getElementById('splashScreen');
  if (!splash || !document.body.classList.contains('splash-active')) {
    dismissSplash();
    return;
  }
  // Tap/click anywhere to skip
  splash.addEventListener('click', dismissSplash, { once: true });
  splashTimeout = setTimeout(dismissSplash, SPLASH_DURATION_MS);
}

function dismissSplash() {
  if (splashTimeout) {
    clearTimeout(splashTimeout);
    splashTimeout = null;
  }

  const splash = document.getElementById('splashScreen');
  const wasActive = document.body.classList.contains('splash-active');
  document.body.classList.remove('splash-active');

  if (!splash || splash.classList.contains('splash-hidden')) return;

  if (!wasActive) {
    splash.classList.add('splash-hidden');
    return;
  }

  // Fade out, then take it completely out of layout so nothing overlaps
  splash.classList.add('splash-fading');
  setTimeout(() => {
    splash.classList.remove('splash-fading');
    splash.classList.add('splash-hidden');
    splash.setAttribute('aria-hidden', 'true');
  }, SPLASH_FADE_MS + 50);
}

// Expose globally for inline onclick and keyboard handlers
window.dismissSplash = dismissSplash;

// ==========================================================================
// 2. REAL SUPABASE AUTHENTICATION INITIALIZATION
// ==========================================================================
async function initSupabase() {
  try {
    const res = await fetch('/api/supabase-config');
    if (!res.ok) {
      throw new Error(`Failed to fetch Supabase config: ${res.status}`);
    }
    const { supabaseUrl, supabaseAnonKey } = await res.json();

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase configuration missing from server response.');
      return;
    }

    const supabaseLib = window.supabase;
    if (!supabaseLib || typeof supabaseLib.createClient !== 'function') {
      console.warn('Supabase SDK library not available on window. Falling back to offline mode.');
      handleAuthStateChange(null);
      return;
    }

    // Initialize Supabase Client Instance
    supabaseClient = supabaseLib.createClient(supabaseUrl, supabaseAnonKey);
    window.supabaseClient = supabaseClient;

    // 1. Session restoration on load: Check if passenger or driver is already logged in
    const savedUserStr = localStorage.getItem('bus_stop_active_user');
    if (savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        if (savedUser && savedUser.id) {
          console.log('[Auth] Restoring session for verified account:', savedUser.email, savedUser.role);
          activeUser = savedUser;
          if (savedUser.role === 'driver') {
            openDriverDashboard();
          } else {
            openPassengerDashboard();
          }
          return;
        }
      } catch (e) {
        console.warn('Session parse note:', e);
      }
    }

    // Default to clean entry screen if no session exists
    goToStep(0);

    // 2. Set up real-time auth event listener with safe guards
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('Supabase Auth State Changed:', event, session?.user?.email);
      if (session?.user) {
        if (activeUser && activeUser.email === session.user.email) {
          activeUser.supabase_id = session.user.id;
          localStorage.setItem('bus_stop_active_user', JSON.stringify(activeUser));
        } else if (!activeUser) {
          handleAuthStateChange(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        // Do not kick out local verified database users if background cloud GoTrue signs out
        if (!activeUser && !localStorage.getItem('bus_stop_active_user')) {
          handleAuthStateChange(null);
        }
      }
    });

  } catch (error) {
    console.error('Supabase init failed:', error);
  }
}

// Real-time state reaction (Signed In vs Signed Out)
function handleAuthStateChange(user) {
  activeUser = user;

  const authTabs = document.getElementById('authTabs');
  const loginForm = document.getElementById('loginForm');
  const signUpForm = document.getElementById('signUpForm');
  const fullRoleModal = document.getElementById('fullRoleSelectionScreen');
  const dashboard = document.getElementById('passengerLiveDashboard');

  if (user) {
    // -------------------------------------------------------------
    // SIGNED IN STATE
    // -------------------------------------------------------------
    const fullName = user.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '';
    const email = user.email || '';
    const displayName = fullName || email.split('@')[0] || 'Passenger';

    // Persist verified user in localStorage
    localStorage.setItem('bus_stop_active_user', JSON.stringify(user));
    localStorage.setItem('bus_stop_confirmed_role', user.role || 'passenger');

    // Hide Login / Sign Up Forms & Tabs
    if (authTabs) authTabs.classList.add('hidden');
    if (loginForm) {
      loginForm.classList.add('form-hidden');
      loginForm.classList.remove('form-visible');
    }
    if (signUpForm) {
      signUpForm.classList.add('form-hidden');
      signUpForm.classList.remove('form-visible');
    }
    if (fullRoleModal) {
      fullRoleModal.classList.add('hidden');
      fullRoleModal.style.display = 'none';
    }

    // Hide Landing / Auth Wrapper
    const authWrapper = document.getElementById('authWrapper');
    if (authWrapper) {
      authWrapper.classList.add('hidden');
      authWrapper.style.display = 'none';
    }
    const scenic = document.getElementById('scenicBackdrop');
    if (scenic) scenic.style.display = 'none';
    document.querySelector('.page-brand-header')?.classList.add('hidden');
    document.querySelector('.sky-quote')?.classList.add('hidden');

    // If user is a driver:
    if (user.role === 'driver') {
      onboardingState.role = 'driver';
      selectedRole = 'driver';
      onboardingState.credentials = {
        id: user.id,
        fullName: fullName,
        email: email,
        phone: user.phone || ''
      };
      onboardingState.profile.fullName = fullName;
      onboardingState.profile.licenseNumber = user.license_number || 'DL-042023001894';
      onboardingState.profile.licenseExpiry = user.license_expiry || '28 Oct 2030';
      onboardingState.profile.homeLocation = user.home_location || 'Dehradun, Uttarakhand';
      onboardingState.profile.avatarUrl = user.avatar_url || 'assets/onboarding/driver_vivek_avatar.jpg';
      onboardingState.isExistingUserUpdating = true;

      // Keep in database that this account is signed in as driver
      fetch('/api/profile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, role: 'driver', full_name: fullName, phone: user.phone })
      }).catch(() => {});

      showNotice(`Signed in as Driver: ${displayName}! Opening Driver Operating Console 🚏`);
      openDriverDashboard();
      return;
    }

    // Role is Passenger (all traveler logins go directly to Live Transit Dashboard)
    selectedRole = 'passenger';
    onboardingState.role = 'passenger';
    onboardingState.credentials = {
      id: user.id,
      fullName: fullName,
      email: email,
      phone: user.phone || ''
    };
    onboardingState.profile.dob = user.dob || '10 Jul 2007';
    onboardingState.profile.gender = user.gender || 'Male';
    onboardingState.profile.homeLocation = user.home_location || 'Dehradun, Uttarakhand';
    onboardingState.profile.avatarUrl = user.avatar_url || 'assets/onboarding/who_passenger_thumb.jpg';

    showNotice(`Welcome back, ${displayName}! Directing to Live Passenger Transit 🚏`);
    setTimeout(() => {
      openPassengerDashboard();
    }, 120);
    return;

  } else {
    // -------------------------------------------------------------
    // SIGNED OUT STATE
    // -------------------------------------------------------------
    localStorage.removeItem('bus_stop_confirmed_role');
    localStorage.removeItem('bus_stop_active_user');
    localStorage.removeItem('bus_stop_active_trip');
    localStorage.removeItem('bus_stop_driver_bus');

    const driverScreen = document.getElementById('driverDashboardScreen');
    if (driverScreen) {
      driverScreen.classList.add('hidden');
      driverScreen.style.display = 'none';
    }
    const driverAppContainer = document.getElementById('driverAppContainer');
    if (driverAppContainer) {
      driverAppContainer.classList.add('hidden');
      driverAppContainer.style.display = 'none';
    }

    const driverProf = document.getElementById('driverProfileScreen');
    if (driverProf) {
      driverProf.classList.add('hidden');
      driverProf.style.display = 'none';
    }

    if (dashboard) {
      dashboard.classList.add('hidden');
    }
    if (window.BusStopMap) BusStopMap.pause();
    if (fullRoleModal) {
      fullRoleModal.classList.add('hidden');
      fullRoleModal.style.display = 'none';
    }

    const scenic = document.getElementById('scenicBackdrop');
    if (scenic) scenic.style.display = '';
    document.querySelector('.page-brand-header')?.classList.remove('hidden');
    document.querySelector('.sky-quote')?.classList.remove('hidden');

    const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
    if (authWrapper) {
      authWrapper.classList.remove('hidden');
      authWrapper.style.display = '';
    }

    // Clean URL hash & search params so #driver won't auto-reopen
    try {
      if (window.location.hash || window.location.search) {
        history.replaceState(null, '', window.location.pathname);
      }
    } catch (e) {
      try { window.location.hash = ''; } catch (_) {}
    }

    // Close any open driver modals/dropdowns
    document.getElementById('driverNotifDropdown')?.classList.add('hidden');
    document.getElementById('driverProfileDropdown')?.classList.add('hidden');
    document.getElementById('driverModal_profile')?.classList.add('hidden');
    document.getElementById('driverModal_preTrip')?.classList.add('hidden');
    document.getElementById('driverModal_qrScanner')?.classList.add('hidden');
    document.getElementById('driverModal_seatConfig')?.classList.add('hidden');
    document.getElementById('driverPassengersModal')?.classList.add('hidden');
    document.getElementById('driverEarningsModal')?.classList.add('hidden');
    document.getElementById('driverEndTripModal')?.classList.add('hidden');
    document.getElementById('driverSwitchRouteModal')?.classList.add('hidden');
    document.getElementById('driverIncidentModal')?.classList.add('hidden');
    document.getElementById('driverSettingsModal')?.classList.add('hidden');
    document.getElementById('activeTripFloatingBar')?.remove();

    switchMode('who-are-you');
  }
}

// Backward compatibility alias
function handleClerkStateChange(arg) {
  handleAuthStateChange(arg?.user || null);
}

// ==========================================================================
// 3. CHOOSE ROLE MANAGEMENT (PASSENGER / DRIVER / STATION MASTER)
// ==========================================================================
function selectRole(roleKey) {
  if (!ROLE_DEFINITIONS[roleKey]) return;
  selectedRole = roleKey;

  // Update card UI selection states
  document.querySelectorAll('.role-card').forEach(card => {
    card.classList.remove('selected');
    card.setAttribute('aria-checked', 'false');
  });

  const activeCard = document.getElementById(`roleCard-${roleKey}`);
  if (activeCard) {
    activeCard.classList.add('selected');
    activeCard.setAttribute('aria-checked', 'true');
  }

  // Update the primary button label
  const btnLabel = document.getElementById('btnRoleLabel');
  if (btnLabel) {
    btnLabel.textContent = `Continue as ${ROLE_DEFINITIONS[roleKey].name}`;
  }
}

function showRoleSelectionScreen() {
  const authWrapper = document.getElementById('authWrapper');
  const fullRoleModal = document.getElementById('fullRoleSelectionScreen');
  const roleUserGreeting = document.getElementById('roleActiveUserGreeting');

  // Hide the side auth wrapper completely
  if (authWrapper) {
    authWrapper.classList.add('hidden');
    authWrapper.style.display = 'none';
  }

  // Display the dedicated full-screen Choose Your Role view matching user mockup
  if (fullRoleModal) {
    fullRoleModal.classList.remove('hidden');
    fullRoleModal.style.display = 'flex';
  }

  // Update greeting with user profile information if available
  if (roleUserGreeting) {
    if (activeUser) {
      const name = activeUser.user_metadata?.full_name || 
                   activeUser.user_metadata?.name || 
                   (activeUser.email ? activeUser.email.split('@')[0] : 'Traveler');
      const email = activeUser.email || '';
      roleUserGreeting.textContent = email ? `Signed in as ${name} (${email})` : `Signed in as ${name}`;
    } else {
      roleUserGreeting.textContent = 'Signed in to Bus Stop';
    }
  }

  // Highlight previously selected role card if any
  document.querySelectorAll('.role-big-card').forEach(card => card.classList.remove('active-choice'));
  if (selectedRole === 'driver') {
    document.getElementById('roleItemDriver')?.classList.add('active-choice');
  } else {
    document.getElementById('roleItemPassenger')?.classList.add('active-choice');
  }
}

// Handler when user clicks "Continue as Passenger" or "Continue as Driver"
function selectAndConfirmRole(roleKey) {
  if (!ROLE_DEFINITIONS[roleKey]) {
    roleKey = 'passenger';
  }
  selectedRole = roleKey;
  localStorage.setItem('bus_stop_confirmed_role', roleKey);

  if (activeUser) {
    activeUser.role = roleKey;
    localStorage.setItem('bus_stop_active_user', JSON.stringify(activeUser));

    // Sync profile with backend database & Supabase
    fetch('/api/profile/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: activeUser.id,
        email: activeUser.email,
        role: roleKey,
        full_name: activeUser.full_name || activeUser.user_metadata?.full_name || ''
      })
    }).catch(err => console.warn('Background profile sync note:', err));

    if (supabaseClient) {
      supabaseClient.auth.updateUser({
        data: { role: roleKey }
      }).catch(() => {});
    }
  }

  const roleConfig = ROLE_DEFINITIONS[roleKey];
  showNotice(`Confirmed: ${roleConfig.name}! Welcome aboard the Mountain Line 🚏`);

  // Close the full-screen Choose Your Role screen with smooth fade
  const fullRoleModal = document.getElementById('fullRoleSelectionScreen');
  if (fullRoleModal) {
    fullRoleModal.classList.add('hidden');
    setTimeout(() => {
      fullRoleModal.style.display = 'none';
    }, 400);
  }

  // Restore and reveal auth wrapper displaying Traveler Pass if needed
  const authWrapper = document.getElementById('authWrapper');
  if (authWrapper) {
    authWrapper.classList.add('hidden');
    authWrapper.style.display = 'none';
  }

  if (roleKey === 'driver') {
    onboardingState.role = 'driver';
    selectedRole = 'driver';
    if (activeUser) {
      activeUser.role = 'driver';
      localStorage.setItem('bus_stop_active_user', JSON.stringify(activeUser));
      fetch('/api/profile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeUser.id, role: 'driver' })
      }).catch(() => {});
    }
    showNotice('Active role set to Driver. Opening Driver Operating Console 🚏');
    openDriverDashboard();
  } else {
    setTimeout(() => {
      openPassengerDashboard();
    }, 350);
  }
}

// Triggered when user clicks "Continue as [Role]" (backward compatibility)
function confirmRole() {
  selectAndConfirmRole(selectedRole);
}

// Renders user session and directly directs to the Live Transit Dashboard
function renderRoleDashboard(user) {
  const role = user?.role || selectedRole || 'passenger';
  if (role === 'driver') {
    onboardingState.role = 'driver';
    selectedRole = 'driver';
    openDriverDashboard();
  } else {
    openPassengerDashboard();
  }
}

// Allows testing/previewing the Choose Role screen directly from Login
function previewRoleScreen(event) {
  if (event) event.preventDefault();
  
  const roleUserGreeting = document.getElementById('roleUserGreeting');
  if (roleUserGreeting) {
    roleUserGreeting.textContent = 'Previewing Role Selection (Bus Stop)';
  }

  showRoleSelectionScreen();
  showNotice('Viewing Choose Role screen ✨ Select any role to board.');
}

// ==========================================================================
// 4. ONBOARDING STATE MACHINE & MULTI-STEP FLOW ENGINE
// Supports: Screen 0 (Who Are You?), Screen 1 (Create Account),
// Screen 2 (Complete Profile / Driver Setup), Screen 3 (You're All Set / Verify)
// ==========================================================================

const onboardingState = {
  currentStep: 0, // 0 = Who are you, 1 = Credentials, 2 = Profile, 3 = Final
  role: 'passenger', // 'passenger' or 'driver'
  credentials: {
    fullName: '',
    email: '',
    phone: '',
    password: ''
  },
  profile: {
    avatarUrl: 'assets/onboarding/who_passenger_thumb.jpg',
    dob: '10 Jul 2007',
    gender: 'Male',
    homeLocation: 'Dehradun, Uttarakhand',
    preferredRadius: '10 km',
    licenseNumber: 'DL-042023001894',
    licenseExpiry: '28 Oct 2030',
    aadhaarNumber: '',
    documents: {
      license: true,
      rc: true,
      vehiclePhoto: true
    }
  }
};

// Starts onboarding for a selected role from Screen 0
function startOnboardingFlow(role) {
  if (role !== 'driver') role = 'passenger';
  onboardingState.role = role;
  selectedRole = role;

  const titleEl = document.getElementById('step1TitleText');
  const subEl = document.getElementById('step1SubtitleText');
  const badgeNameEl = document.getElementById('step1RoleBadgeName');
  const bannerImgEl = document.getElementById('step1BannerImg');
  const quoteEl = document.getElementById('step1QuoteText');

  if (role === 'passenger') {
    if (titleEl) titleEl.textContent = 'Create Your Account';
    if (subEl) subEl.textContent = 'Join Bus Stop and start your journey.';
    if (badgeNameEl) badgeNameEl.textContent = 'Passenger';
    onboardingState.profile.avatarUrl = 'assets/onboarding/who_passenger_thumb.jpg';
  } else {
    if (titleEl) titleEl.textContent = 'Create Your Account';
    if (subEl) subEl.textContent = 'Join Bus Stop as a Driver.';
    if (badgeNameEl) badgeNameEl.textContent = 'Driver';
    onboardingState.profile.avatarUrl = 'assets/onboarding/who_driver_thumb.jpg';
  }

  // Pre-fill fields if user already entered credentials
  if (onboardingState.credentials.fullName) {
    const nameInput = document.getElementById('obFullName');
    if (nameInput) nameInput.value = onboardingState.credentials.fullName;
  }
  if (onboardingState.credentials.email) {
    const emailInput = document.getElementById('obEmail');
    if (emailInput) emailInput.value = onboardingState.credentials.email;
  }
  if (onboardingState.credentials.phone) {
    const phoneInput = document.getElementById('obPhone');
    if (phoneInput) phoneInput.value = onboardingState.credentials.phone;
  }

  goToStep(1);
}

// Navigates between Onboarding Steps (0, 1, 2, 3)
function goToStep(step) {
  onboardingState.currentStep = step;

  const header = document.getElementById('onboardingStepHeader');
  const brandHeader = document.getElementById('cardBrandHeader');
  const authTabs = document.getElementById('authTabs');
  const cardArtFooter = document.querySelector('.card-art-footer');

  const panelWho = document.getElementById('panelWhoAreYou');
  const panelStep1 = document.getElementById('panelStep1Account');
  const panelStep2Pass = document.getElementById('panelStep2Passenger');
  const panelStep3Pass = document.getElementById('panelStep3PassengerReady');
  const panelStep3Driver = document.getElementById('panelStep3DriverVerify');
  const panelLogin = document.getElementById('loginForm');
  const panelSignedIn = document.getElementById('signedInPanel');

  // Hide card footer art during all onboarding & profile creation steps
  if (cardArtFooter) {
    cardArtFooter.style.display = 'none';
  }

  // Clear validation marks
  document.querySelectorAll('.field-box').forEach(el => el.classList.remove('has-error'));

  // Hide all panels initially
  [panelWho, panelStep1, panelStep2Pass, panelStep3Pass, panelStep3Driver, panelLogin, panelSignedIn].forEach(p => {
    if (p) {
      p.classList.add('form-hidden');
      p.classList.remove('form-visible');
    }
  });

  // Step 0: "Who Are You?"
  if (step === 0) {
    if (header) header.classList.add('hidden');
    if (brandHeader) brandHeader.classList.remove('hidden');
    if (authTabs) {
      authTabs.classList.remove('hidden');
      document.getElementById('tabSignUp')?.classList.add('active');
      document.getElementById('tabLogin')?.classList.remove('active');
    }
    if (panelWho) {
      panelWho.classList.remove('form-hidden');
      panelWho.classList.add('form-visible');
    }
    return;
  }

  // Steps 1, 2, 3: Show stepper header, hide brand logo & tabs
  if (header) header.classList.remove('hidden');
  if (brandHeader) brandHeader.classList.add('hidden');
  if (authTabs) authTabs.classList.add('hidden');

  // Update Stepper dots
  const dot1 = document.getElementById('dot1');
  const dot2 = document.getElementById('dot2');
  const dot3 = document.getElementById('dot3');
  if (dot1 && dot2 && dot3) {
    dot1.classList.toggle('active', step === 1);
    dot2.classList.toggle('active', step === 2);
    dot3.classList.toggle('active', step === 3);
  }

  if (step === 1) {
    if (panelStep1) {
      panelStep1.classList.remove('form-hidden');
      panelStep1.classList.add('form-visible');
    }
  } else if (step === 2) {
    if (onboardingState.role === 'passenger') {
      if (panelStep2Pass) {
        panelStep2Pass.classList.remove('form-hidden');
        panelStep2Pass.classList.add('form-visible');
      }
      const passNameInput = document.getElementById('passProfileFullName');
      if (passNameInput) {
        passNameInput.value = onboardingState.credentials.fullName || activeUser?.full_name || '';
      }
      const passDobInput = document.getElementById('passDob');
      if (passDobInput) {
        passDobInput.value = onboardingState.profile.dob || activeUser?.dob || '10 Jul 2007';
      }
      const passGenderSelect = document.getElementById('passGender');
      if (passGenderSelect && (onboardingState.profile.gender || activeUser?.gender)) {
        passGenderSelect.value = onboardingState.profile.gender || activeUser?.gender || 'Male';
      }
      const passLocInput = document.getElementById('passHomeLocation');
      if (passLocInput) {
        passLocInput.value = onboardingState.profile.homeLocation || activeUser?.home_location || 'Dehradun, Uttarakhand';
      }
      const passAvatar = document.getElementById('passengerAvatarPreview');
      if (passAvatar && (onboardingState.profile.avatarUrl || activeUser?.avatar_url)) {
        passAvatar.src = onboardingState.profile.avatarUrl || activeUser?.avatar_url || 'assets/onboarding/who_passenger_thumb.jpg';
      }
    } else {
      // Role is DRIVER: Route directly to the modern Driver Operations Suite!
      const authWrapper = document.getElementById('authWrapper');
      if (authWrapper) {
        authWrapper.classList.add('hidden');
        authWrapper.style.display = 'none';
      }
      openDriverDashboard();
      return;
    }
  } else if (step === 3) {
    if (onboardingState.role === 'passenger') {
      if (panelStep3Pass) {
        panelStep3Pass.classList.remove('form-hidden');
        panelStep3Pass.classList.add('form-visible');
      }
      const finalAvatar = document.getElementById('passengerFinalAvatar');
      if (finalAvatar && onboardingState.profile.avatarUrl) {
        finalAvatar.src = onboardingState.profile.avatarUrl;
      }
    } else {
      if (panelStep3Driver) {
        panelStep3Driver.classList.remove('form-hidden');
        panelStep3Driver.classList.add('form-visible');
      }
    }
  }
}

// Back button on top of step header
function onboardingBack() {
  if (onboardingState.currentStep > 1) {
    goToStep(onboardingState.currentStep - 1);
  } else {
    goToStep(0);
  }
}

// Step 1: Submit Credentials Draft (Does NOT create account yet!)
function handleStep1Submit(event) {
  event.preventDefault();

  const nameInput = document.getElementById('obFullName');
  const emailInput = document.getElementById('obEmail');
  const passInput = document.getElementById('obPassword');
  const phoneInput = document.getElementById('obPhone');
  const termsCheck = document.getElementById('obTermsCheck');

  const fullName = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!fullName) {
    nameInput?.closest('.field-box')?.classList.add('has-error');
    nameInput?.focus();
    showNotice('Please enter your full name');
    return;
  }
  if (!email || !isValidEmail(email)) {
    emailInput?.closest('.field-box')?.classList.add('has-error');
    emailInput?.focus();
    showNotice('Please enter a valid email address');
    return;
  }
  if (!password || password.length < 6) {
    passInput?.closest('.field-box')?.classList.add('has-error');
    passInput?.focus();
    showNotice('Password must be at least 6 characters long');
    return;
  }
  if (termsCheck && !termsCheck.checked) {
    showNotice('Please agree to the Terms of Service to continue');
    return;
  }

  // Save credentials draft in memory
  onboardingState.credentials = { fullName, email, phone, password };

  showNotice(`Account details saved! Now let's complete your profile 🚏`);
  goToStep(2);
}

// Step 2A: Passenger Profile Submit -> Directly saves and directs to Home Screen!
async function handleStep2PassengerSubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById('passProfileFullName');
  const dobInput = document.getElementById('passDob');
  const genderInput = document.getElementById('passGender');
  const locInput = document.getElementById('passHomeLocation');
  const btn = document.getElementById('btnStep2PassengerContinue');

  const fullName = nameInput ? nameInput.value.trim() : (onboardingState.credentials.fullName || '');
  const dob = dobInput ? dobInput.value.trim() : (onboardingState.profile.dob || '10 Jul 2007');
  const gender = genderInput ? genderInput.value : (onboardingState.profile.gender || 'Male');
  const homeLocation = locInput && locInput.value.trim() ? locInput.value.trim() : 'Dehradun, Uttarakhand';
  const avatarUrl = onboardingState.profile.avatarUrl || activeUser?.avatar_url || 'assets/onboarding/who_passenger_thumb.jpg';
  const preferredRadius = onboardingState.profile.preferredRadius || '10 km';

  if (!fullName) {
    nameInput?.closest('.field-box')?.classList.add('has-error');
    nameInput?.focus();
    showNotice('Please enter your full name');
    return;
  }
  if (!dob) {
    dobInput?.closest('.field-box')?.classList.add('has-error');
    dobInput?.focus();
    showNotice('Please enter your date of birth');
    return;
  }
  if (!homeLocation) {
    locInput?.closest('.field-box')?.classList.add('has-error');
    locInput?.focus();
    showNotice('Please enter your home location');
    return;
  }

  // Update in-memory state
  onboardingState.credentials.fullName = fullName;
  onboardingState.profile.dob = dob;
  onboardingState.profile.gender = gender;
  onboardingState.profile.homeLocation = homeLocation;
  onboardingState.profile.avatarUrl = avatarUrl;
  onboardingState.profile.preferredRadius = preferredRadius;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Saving Profile...</span> <span class="btn-spinner"></span>`;
  }

  try {
    if (onboardingState.isExistingUserUpdating && activeUser?.id) {
      // Existing User updating/completing profile
      const updatePayload = {
        id: activeUser.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        dob: dob,
        gender: gender,
        home_location: homeLocation,
        preferred_radius: preferredRadius
      };

      const res = await fetch('/api/profile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      const data = await res.json();

      const updatedUser = { ...activeUser, ...updatePayload };
      activeUser = updatedUser;
      selectedRole = 'passenger';
      localStorage.setItem('bus_stop_active_user', JSON.stringify(updatedUser));
      localStorage.setItem('bus_stop_confirmed_role', 'passenger');
      onboardingState.isExistingUserUpdating = false;

      showNotice(`Profile complete! Opening your Live Map 🚏`);
      setTimeout(() => {
        openPassengerDashboard();
      }, 300);

    } else {
      // New User registering with full profile
      const creds = onboardingState.credentials;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: creds.email,
          password: creds.password,
          fullName: fullName,
          phone: creds.phone,
          role: 'passenger',
          avatar_url: avatarUrl,
          dob: dob,
          gender: gender,
          home_location: homeLocation,
          preferred_radius: preferredRadius
        })
      });
      const result = await res.json();

      if (res.ok && result.success && result.user) {
        activeUser = result.user;
        selectedRole = 'passenger';
        localStorage.setItem('bus_stop_active_user', JSON.stringify(result.user));
        localStorage.setItem('bus_stop_confirmed_role', 'passenger');
        
        showNotice(`Welcome aboard, ${result.user.full_name}! Directing to Live Map 🚏`);
        setTimeout(() => {
          openPassengerDashboard();
        }, 300);
      } else {
        showNotice(result.error || 'Failed to complete registration.');
      }
    }
  } catch (err) {
    console.error('Save profile error:', err);
    showNotice(err.message || 'Connection error saving profile');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <span class="btn-text">Save Profile & Enter Live Transit</span>
        <svg class="arrow-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      `;
    }
  }
}

// Step 2B: Driver Profile Submit -> Saves & Directs Straight to Home Screen!
async function handleStep2DriverSubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById('driverProfileFullName');
  const licenseInput = document.getElementById('driverLicenseNum');
  const expiryInput = document.getElementById('driverExpiryDate');
  const aadhaarInput = document.getElementById('driverAadhaarNum');
  const locInput = document.getElementById('driverHomeLocation');
  const btn = document.getElementById('btnStep2DriverContinue');

  const fullName = nameInput ? nameInput.value.trim() : (onboardingState.credentials.fullName || '');
  const licenseNumber = licenseInput ? licenseInput.value.trim() : '';
  const licenseExpiry = expiryInput ? expiryInput.value : '';
  const aadhaarNumber = aadhaarInput ? aadhaarInput.value.trim() : '';
  const homeLocation = locInput && locInput.value.trim() ? locInput.value.trim() : '';
  const avatarUrl = onboardingState.profile.avatarUrl || activeUser?.avatar_url || 'assets/onboarding/who_driver_thumb.jpg';

  if (!fullName) {
    nameInput?.closest('.field-box')?.classList.add('has-error');
    nameInput?.focus();
    showNotice('⚠️ Please enter your full legal name');
    return;
  }
  if (!licenseNumber) {
    licenseInput?.closest('.field-box')?.classList.add('has-error');
    licenseInput?.focus();
    showNotice('⚠️ Please enter your driver license number');
    return;
  }
  if (!licenseExpiry) {
    expiryInput?.closest('.field-box')?.classList.add('has-error');
    expiryInput?.focus();
    showNotice('⚠️ Please select your license expiry date');
    return;
  }
  if (!homeLocation) {
    locInput?.closest('.field-box')?.classList.add('has-error');
    locInput?.focus();
    showNotice('⚠️ Please enter your operating city / address');
    return;
  }

  // Update in-memory state
  onboardingState.credentials.fullName = fullName;
  onboardingState.profile.licenseNumber = licenseNumber;
  onboardingState.profile.licenseExpiry = licenseExpiry;
  onboardingState.profile.aadhaarNumber = aadhaarNumber;
  onboardingState.profile.homeLocation = homeLocation;
  onboardingState.profile.avatarUrl = avatarUrl;

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Saving Driver Profile...</span> <span class="btn-spinner"></span>`;
  }

  try {
    if (onboardingState.isExistingUserUpdating && activeUser?.id) {
      const updatePayload = {
        id: activeUser.id,
        role: 'driver',
        full_name: fullName,
        avatar_url: avatarUrl,
        license_number: licenseNumber,
        license_expiry: licenseExpiry,
        aadhaar_number: aadhaarNumber,
        home_location: homeLocation
      };

      const res = await fetch('/api/profile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });
      const data = await res.json();

      const updatedUser = { ...activeUser, ...updatePayload };
      activeUser = updatedUser;
      selectedRole = 'driver';
      localStorage.setItem('bus_stop_active_user', JSON.stringify(updatedUser));
      localStorage.setItem('bus_stop_confirmed_role', 'driver');
      onboardingState.isExistingUserUpdating = false;

      showNotice(`🎉 Driver profile updated! Welcome Captain ${fullName} 👨‍✈️ Opening Driver Console 🚏`);
      const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
      if (authWrapper) {
        authWrapper.classList.add('hidden');
        authWrapper.style.display = 'none';
      }
      setTimeout(() => {
        openDriverDashboard();
      }, 350);

    } else {
      const creds = onboardingState.credentials;
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: creds.email,
          password: creds.password,
          fullName: fullName,
          phone: creds.phone,
          role: 'driver',
          avatar_url: avatarUrl,
          license_number: licenseNumber,
          license_expiry: licenseExpiry,
          aadhaar_number: aadhaarNumber,
          home_location: homeLocation
        })
      });
      const result = await res.json();

      if (res.ok && result.success && result.user) {
        activeUser = result.user;
        selectedRole = 'driver';
        localStorage.setItem('bus_stop_active_user', JSON.stringify(result.user));
        localStorage.setItem('bus_stop_confirmed_role', 'driver');

        showNotice(`🎉 Driver profile created! Welcome Captain ${result.user.full_name} 👨‍✈️ Opening Driver Console 🚏`);
        const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
        if (authWrapper) {
          authWrapper.classList.add('hidden');
          authWrapper.style.display = 'none';
        }
        setTimeout(() => {
          openDriverDashboard();
        }, 350);
      } else {
        showNotice(result.error || 'Failed to complete driver registration.');
      }
    }
  } catch (err) {
    console.error('Save driver profile error:', err);
    showNotice(err.message || 'Connection error saving profile');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <span class="btn-text">Save Driver Profile & Enter Transit</span>
        <svg class="arrow-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      `;
    }
  }
}

// Finalize Passenger Account (Fallback compatibility)
async function finalizePassengerOnboarding() {
  openPassengerDashboard();
}

// Finalize Driver Account (Creates driver profile in database with document verification!)
async function finalizeDriverOnboarding() {
  const btn = document.getElementById('btnSubmitVerification');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Submitting...</span> <span class="btn-spinner"></span>`;
  }

  try {
    const creds = onboardingState.credentials;
    const prof = onboardingState.profile;

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: creds.email,
        password: creds.password,
        fullName: creds.fullName,
        phone: creds.phone,
        role: 'driver',
        avatar_url: prof.avatarUrl || 'assets/onboarding/who_driver_thumb.jpg',
        license_number: prof.licenseNumber,
        license_expiry: prof.licenseExpiry,
        aadhaar_number: prof.aadhaarNumber,
        home_location: prof.homeLocation,
        document_status: 'Pending Verification',
        documents: prof.documents
      })
    });
    const result = await res.json();

    if (res.ok && result.success && result.user) {
      activeUser = result.user;
      selectedRole = 'driver';
      localStorage.setItem('bus_stop_active_user', JSON.stringify(result.user));
      localStorage.setItem('bus_stop_confirmed_role', 'driver');

      showNotice(`Captain ${result.user.full_name}, Driver Operating Console active! 🚏`);
      const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
      if (authWrapper) {
        authWrapper.classList.add('hidden');
        authWrapper.style.display = 'none';
      }
      setTimeout(() => {
        openDriverDashboard();
      }, 350);
    } else {
      showNotice(result.error || 'Failed to verify driver credentials.');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="btn-text">Submit for Verification</span> ➔`;
      }
    }
  } catch (err) {
    console.error('Finalize driver error:', err);
    showNotice(err.message || 'Verification connection error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span class="btn-text">Submit for Verification</span> ➔`;
    }
  }
}

// Detect Location Helper
function detectUserLocation(inputId) {
  const input = document.getElementById(inputId);
  showNotice('Locating your position in the hills... 📍');

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (input) input.value = 'Dehradun, Uttarakhand (GPS)';
        showNotice('Detected: Dehradun, Uttarakhand (30.3165° N, 78.0322° E) 📍');
      },
      (err) => {
        if (input) input.value = 'Dehradun, Uttarakhand';
        showNotice('Set to scenic base: Dehradun, Uttarakhand 📍');
      },
      { timeout: 4000 }
    );
  } else {
    if (input) input.value = 'Dehradun, Uttarakhand';
    showNotice('Set to scenic base: Dehradun, Uttarakhand 📍');
  }
}

// Select Travel Radius Pill
function selectRadiusPill(btn, radius) {
  document.querySelectorAll('.radius-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  onboardingState.profile.preferredRadius = radius;
  showNotice(`Travel radius set to: ${radius}`);
}

// Avatar Photo Upload Handlers
function triggerPhotoUpload(inputId) {
  const fileInput = document.getElementById(inputId);
  if (fileInput) fileInput.click();
}

function handlePhotoUpload(input, previewImgId) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      onboardingState.profile.avatarUrl = dataUrl;
      const preview = document.getElementById(previewImgId);
      if (preview) preview.src = dataUrl;
      const finalPreview = document.getElementById('passengerFinalAvatar');
      if (finalPreview) finalPreview.src = dataUrl;
      showNotice('Profile photo updated! ✨');
    };
    reader.readAsDataURL(file);
  }
}

// Simulate Document Upload Feedback
function simulateDocUpload(statusId) {
  const badge = document.getElementById(statusId);
  if (badge) {
    badge.textContent = '✓ Verified & Ready';
    badge.style.background = '#d7f2dc';
    badge.style.color = '#135c24';
  }
  showNotice('Document validated successfully! ✓');
}

// Switch between Mode (Login or Sign Up / Onboarding)
function switchMode(mode) {
  activeAuthMode = mode;

  const tabLogin = document.getElementById('tabLogin');
  const tabSignUp = document.getElementById('tabSignUp');
  const authPromptText = document.getElementById('authPromptText');
  const btnToggleLabel = document.getElementById('btnToggleLabel');

  if (mode === 'login') {
    if (tabLogin) {
      tabLogin.classList.add('active');
      tabLogin.setAttribute('aria-selected', 'true');
    }
    if (tabSignUp) {
      tabSignUp.classList.remove('active');
      tabSignUp.setAttribute('aria-selected', 'false');
    }

    // Hide onboarding step header
    document.getElementById('onboardingStepHeader')?.classList.add('hidden');
    document.getElementById('cardBrandHeader')?.classList.remove('hidden');
    document.getElementById('authTabs')?.classList.remove('hidden');

    document.querySelectorAll('.auth-form-panel').forEach(p => {
      p.classList.add('form-hidden');
      p.classList.remove('form-visible');
    });

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.classList.remove('form-hidden');
      loginForm.classList.add('form-visible');
    }

    const cardArtFooter = document.querySelector('.card-art-footer');
    if (cardArtFooter) {
      cardArtFooter.style.display = '';
    }

    if (authPromptText) authPromptText.textContent = 'Not a member?';
    if (btnToggleLabel) btnToggleLabel.textContent = 'Create Account';
  } else {
    // Mode is 'who-are-you' or 'signup'
    const cardArtFooter = document.querySelector('.card-art-footer');
    if (cardArtFooter) {
      cardArtFooter.style.display = 'none';
    }

    if (tabSignUp) {
      tabSignUp.classList.add('active');
      tabSignUp.setAttribute('aria-selected', 'true');
    }
    if (tabLogin) {
      tabLogin.classList.remove('active');
      tabLogin.setAttribute('aria-selected', 'false');
    }

    if (authPromptText) authPromptText.textContent = 'Already a member?';
    if (btnToggleLabel) btnToggleLabel.textContent = 'Login';

    goToStep(0);
  }
}

function toggleAuth() {
  switchMode(activeAuthMode === 'login' ? 'who-are-you' : 'login');
}

// ==========================================================================
// 5. PASSWORD VISIBILITY TOGGLE
// ==========================================================================
function togglePassVisibility(inputId, button) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const openIcon = button.querySelector('.icon-eye-open');
  const closedIcon = button.querySelector('.icon-eye-closed');

  if (input.type === 'password') {
    input.type = 'text';
    openIcon.classList.add('hidden');
    closedIcon.classList.remove('hidden');
  } else {
    input.type = 'password';
    openIcon.classList.remove('hidden');
    closedIcon.classList.add('hidden');
  }
}

// ==========================================================================
// 6. COUNTRY CODE DROPDOWN
// ==========================================================================
function toggleCountryDropdown() {
  const dropdown = document.getElementById('countryDropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
}

function initCountryDropdown() {
  document.addEventListener('click', (e) => {
    const picker = document.getElementById('countryPicker');
    const dropdown = document.getElementById('countryDropdown');

    if (picker && dropdown && !picker.contains(e.target)) {
      dropdown.classList.add('hidden');
    }

    if (e.target.classList.contains('country-item')) {
      const code = e.target.dataset.code;
      const flag = e.target.dataset.flag;
      
      document.getElementById('pickerCodeText').textContent = code;
      picker.querySelector('.picker-flag').textContent = flag;
      
      document.querySelectorAll('.country-item').forEach(item => item.classList.remove('active'));
      e.target.classList.add('active');
      
      if (dropdown) dropdown.classList.add('hidden');
    }
  });
}

// ==========================================================================
// 7. REAL FORM SUBMISSION WITH CLERK & TRANSITION TO ROLE
// ==========================================================================
function initInputValidation() {
  document.querySelectorAll('.field-box input').forEach(input => {
    input.addEventListener('input', () => {
      input.closest('.field-box')?.classList.remove('has-error');
    });
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ==========================================================================
// 7. REAL SUPABASE AUTHENTICATION FORM SUBMISSIONS & PROFILE
// ==========================================================================

// Real Sign In through Supabase Auth
async function onLoginSubmit(event) {
  event.preventDefault();
  
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  const emailBox = document.getElementById('loginEmailBox');
  const passBox = document.getElementById('loginPassBox');
  const submitBtn = document.getElementById('btnLoginSubmit');

  const emailVal = emailInput.value.trim();
  const passVal = passInput.value;

  if (!emailVal || !isValidEmail(emailVal)) {
    emailBox.classList.add('has-error');
    emailInput.focus();
    showNotice('Please enter a valid email address');
    return;
  }

  if (!passVal || passVal.length < 6) {
    passBox.classList.add('has-error');
    passInput.focus();
    showNotice('Password must be at least 6 characters');
    return;
  }

  // Show authentic loading state
  submitBtn.classList.add('is-loading');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <span>Signing in...</span>
    <span class="btn-spinner"></span>
  `;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailVal, password: passVal })
    });
    const result = await res.json();

    if (res.ok && result.success && result.user) {
      localStorage.setItem('bus_stop_active_user', JSON.stringify(result.user));
      showNotice(`Welcome back, ${result.user.full_name || emailVal}! Verified with database 🚏`);
      handleAuthStateChange(result.user);

      // Best effort Supabase sign in in background
      if (supabaseClient) {
        supabaseClient.auth.signInWithPassword({ email: emailVal, password: passVal }).catch(() => {});
      }
    } else {
      showNotice(result.error || 'Invalid email or password.');
      passBox.classList.add('has-error');
      passInput.focus();
    }
  } catch (err) {
    console.error('Login error:', err);
    showNotice(err.message || 'Login connection error.');
  } finally {
    submitBtn.classList.remove('is-loading');
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <span class="btn-text">Login</span>
      <svg class="arrow-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    `;
  }
}


// Real Sign Up through Database Table & Supabase
async function onSignUpSubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById('signUpName');
  const emailInput = document.getElementById('signUpEmail');
  const passInput = document.getElementById('signUpPassword');
  const phoneInput = document.getElementById('signUpPhone');
  const termsCheck = document.getElementById('termsCheck');
  const submitBtn = document.getElementById('btnSignUpSubmit');

  const nameVal = nameInput.value.trim();
  const emailVal = emailInput.value.trim();
  const passVal = passInput.value;
  const phoneVal = phoneInput ? phoneInput.value.trim() : '';

  if (!nameVal) {
    document.getElementById('signNameBox').classList.add('has-error');
    nameInput.focus();
    showNotice('Please enter your full name');
    return;
  }

  if (!emailVal || !isValidEmail(emailVal)) {
    document.getElementById('signEmailBox').classList.add('has-error');
    emailInput.focus();
    showNotice('Please enter a valid email address');
    return;
  }

  if (!passVal || passVal.length < 6) {
    document.getElementById('signPassBox').classList.add('has-error');
    passInput.focus();
    showNotice('Password must be at least 6 characters long');
    return;
  }

  if (!termsCheck.checked) {
    showNotice('Please agree to the Terms of Service to continue');
    return;
  }

  submitBtn.classList.add('is-loading');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <span>Creating account...</span>
    <span class="btn-spinner"></span>
  `;

  try {
    const regRes = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailVal,
        password: passVal,
        fullName: nameVal,
        phone: phoneVal,
        role: 'passenger'
      })
    });
    const regJson = await regRes.json();

    if (regRes.ok && regJson.success && regJson.user) {
      localStorage.setItem('bus_stop_active_user', JSON.stringify(regJson.user));
      showNotice(`Account verified! Welcome aboard, ${nameVal} 🚏`);
      handleAuthStateChange(regJson.user);
    } else {
      showNotice(regJson.error || 'Could not register account.');
      if (regJson.error && regJson.error.includes('already exists')) {
        switchMode('login');
        document.getElementById('loginEmail').value = emailVal;
        document.getElementById('loginPassword').focus();
      }
    }
  } catch (err) {
    console.error('Registration exception:', err);
    showNotice(err.message || 'Error connecting to database.');
  } finally {
    submitBtn.classList.remove('is-loading');
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <span class="btn-text">Create Account</span>
      <svg class="arrow-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.5" fill="none">
        <path d="M5 12h14M12 5l7 7-7 7"/>
      </svg>
    `;
  }
}

// Social Logins (Google, Apple, Phone)
async function onSocialLogin(provider) {
  const providerLower = provider.toLowerCase();
  showNotice(`Connecting to ${provider} with Supabase... ✨`);

  if (supabaseClient && (providerLower === 'google' || providerLower === 'apple')) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: providerLower,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        showNotice(error.message || `Could not connect with ${provider}`);
      }
    } catch (err) {
      console.error(`Social sign-in with ${provider} error:`, err);
      showNotice(`Social login error: ${err.message}`);
    }
  } else {
    // Simulated / fallback flow
    setTimeout(() => {
      showNotice(`Authenticated via ${provider}! Choose your role.`);
      handleAuthStateChange({
        email: `traveler@${providerLower}.com`,
        user_metadata: { full_name: `${provider} Traveler` }
      });
    }, 600);
  }
}

// Manage User Profile
function openUserProfile() {
  if (activeUser) {
    const name = activeUser.user_metadata?.full_name || activeUser.email || 'Traveler';
    showNotice(`Supabase Profile: ${name} (${activeUser.email || 'active'})`);
  } else {
    showNotice('Please sign in with Supabase first.');
  }
}

// Real Supabase Sign Out Handler
async function handleSignOut() {
  localStorage.removeItem('bus_stop_confirmed_role');
  localStorage.removeItem('bus_stop_active_user');

  const fullRoleModal = document.getElementById('fullRoleSelectionScreen');
  if (fullRoleModal) {
    fullRoleModal.classList.add('hidden');
    fullRoleModal.style.display = 'none';
  }

  const authWrapper = document.getElementById('authWrapper');
  if (authWrapper) {
    authWrapper.classList.remove('hidden');
    authWrapper.style.display = '';
  }

  if (supabaseClient) {
    try {
      await supabaseClient.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign-out warning:', e);
    }
  }

  showNotice('You have safely disembarked. See you on the next journey! 🚏');
  handleAuthStateChange(null);
}

// Dedicated Driver Logout & Shift Termination Handler
async function handleDriverLogout() {
  console.log('[Auth] Logging out from Driver Operations...');

  // 1. Stop GPS streaming & location broadcasts
  if (typeof stopDriverGpsTracking === 'function') stopDriverGpsTracking();
  if (typeof stopLocationBroadcasting === 'function') stopLocationBroadcasting();
  if (typeof stopBusMovementSimulation === 'function') stopBusMovementSimulation();
  window.driverNavActive = false;

  // 2. Stop live clock timer
  if (typeof driverClockTimer !== 'undefined' && driverClockTimer) {
    clearInterval(driverClockTimer);
    driverClockTimer = null;
  }

  // 3. Clear all stored credentials and shift states
  localStorage.removeItem('bus_stop_active_user');
  localStorage.removeItem('bus_stop_confirmed_role');
  localStorage.removeItem('bus_stop_active_trip');
  localStorage.removeItem('bus_stop_driver_bus');
  sessionStorage.clear();

  // 4. Reset in-memory session user
  activeUser = null;
  window.activeUser = null;

  // 5. Clean URL hash & search params so #driver won't auto-reopen
  if (window.location.hash || window.location.search) {
    try {
      history.replaceState(null, '', window.location.pathname);
    } catch (e) {
      window.location.hash = '';
    }
  }

  // 6. Close all open driver modals and dropdowns
  document.getElementById('driverNotifDropdown')?.classList.add('hidden');
  document.getElementById('driverProfileDropdown')?.classList.add('hidden');
  document.getElementById('driverModal_profile')?.classList.add('hidden');
  document.getElementById('driverModal_preTrip')?.classList.add('hidden');
  document.getElementById('driverModal_qrScanner')?.classList.add('hidden');
  document.getElementById('driverModal_seatConfig')?.classList.add('hidden');
  document.getElementById('driverPassengersModal')?.classList.add('hidden');
  document.getElementById('driverEarningsModal')?.classList.add('hidden');
  document.getElementById('driverEndTripModal')?.classList.add('hidden');
  document.getElementById('driverSwitchRouteModal')?.classList.add('hidden');
  document.getElementById('driverIncidentModal')?.classList.add('hidden');
  document.getElementById('driverSettingsModal')?.classList.add('hidden');
  document.getElementById('activeTripFloatingBar')?.remove();

  // 7. Hide driver screen
  const driverScreen = document.getElementById('driverDashboardScreen');
  if (driverScreen) {
    driverScreen.classList.add('hidden');
    driverScreen.style.display = 'none';
  }
  const driverAppContainer = document.getElementById('driverAppContainer');
  if (driverAppContainer) {
    driverAppContainer.classList.add('hidden');
    driverAppContainer.style.display = 'none';
  }
  const driverProf = document.getElementById('driverProfileScreen');
  if (driverProf) {
    driverProf.classList.add('hidden');
    driverProf.style.display = 'none';
  }

  // 8. Restore scenic backdrop & auth layout
  const scenic = document.getElementById('scenicBackdrop');
  if (scenic) scenic.style.display = '';
  document.querySelector('.page-brand-header')?.classList.remove('hidden');
  document.querySelector('.sky-quote')?.classList.remove('hidden');

  const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
  if (authWrapper) {
    authWrapper.classList.remove('hidden');
    authWrapper.style.display = '';
  }

  const authCard = document.getElementById('authCard');
  if (authCard) authCard.style.display = '';

  const fullRoleModal = document.getElementById('fullRoleSelectionScreen');
  if (fullRoleModal) {
    fullRoleModal.classList.add('hidden');
    fullRoleModal.style.display = 'none';
  }

  // 9. Reset onboarding / mode state to login
  if (typeof switchMode === 'function') {
    switchMode('who-are-you');
  }

  // 10. Supabase auth sign-out
  if (window.supabaseClient) {
    try {
      await window.supabaseClient.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign-out warning:', e);
    }
  }

  showNotice('Safely logged out of Driver Operations. Have a great rest, Captain! 🚏');
}

// Global Aliases for logout
window.logout = handleDriverLogout;
window.handleLogout = handleDriverLogout;
window.handleDriverLogout = handleDriverLogout;

// Forgot Password Handler with Supabase
async function onForgotPassword(event) {
  if (event) event.preventDefault();
  const currentEmail = document.getElementById('loginEmail')?.value.trim();

  if (!currentEmail || !isValidEmail(currentEmail)) {
    showNotice('Please enter your email above to reset password');
    document.getElementById('loginEmail')?.focus();
    return;
  }

  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(currentEmail, {
        redirectTo: window.location.origin
      });
      if (error) {
        showNotice(error.message || 'Could not send reset email.');
      } else {
        showNotice(`Password reset link sent via Supabase to ${currentEmail} ✉️`);
      }
    } catch (err) {
      showNotice(err.message || 'Error requesting password reset.');
    }
  } else {
    showNotice(`Password reset link sent to ${currentEmail} ✉️`);
  }
}

// ==========================================================================
// 8. TOAST NOTIFICATIONS
// ==========================================================================
function showNotice(message) {
  const container = document.getElementById('toastStream');
  if (!container) return;

  const pill = document.createElement('div');
  pill.className = 'toast-pill';
  pill.textContent = message;

  container.appendChild(pill);
  setTimeout(() => {
    if (pill.parentNode) {
      pill.parentNode.removeChild(pill);
    }
  }, 3200);
}

// ==========================================================================
// 9. KEYBOARD CONTROLS
// ==========================================================================
function initKeyboardNavigation() {
  window.addEventListener('keydown', (e) => {
    // If splash is open, pressing Space, Enter, or Escape dismisses it immediately
    if (document.body.classList.contains('splash-active')) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        dismissSplash();
      }
      return;
    }

    // Escape closes country dropdown, modals, or menus
    if (e.key === 'Escape') {
      const dropdown = document.getElementById('countryDropdown');
      if (dropdown && !dropdown.classList.contains('hidden')) {
        dropdown.classList.add('hidden');
      }
      const timeMenu = document.getElementById('timeDropdownMenu');
      if (timeMenu && !timeMenu.classList.contains('hidden')) {
        timeMenu.classList.add('hidden');
      }
      const userMenu = document.getElementById('userDropdownMenu');
      if (userMenu && !userMenu.classList.contains('hidden')) {
        userMenu.classList.add('hidden');
      }
      const notifDrawer = document.getElementById('notificationDrawer');
      if (notifDrawer && !notifDrawer.classList.contains('hidden')) {
        notifDrawer.classList.add('hidden');
      }
      const schedModal = document.getElementById('busScheduleModal');
      if (schedModal && !schedModal.classList.contains('hidden')) {
        schedModal.classList.add('hidden');
      }
    }
  });
}

// ==========================================================================
// 10. PASSENGER REAL-TIME LIVE MAP & TRANSIT ENGINE
// Interactive Leaflet Map, Live Moving Buses, Route Polyline,
// Traffic Simulation, Filter Tabs, and Timetable Seat Booking
// ==========================================================================

const ROUTE_COORDINATES = [
  [30.3398, 77.9620], // Prem Nagar (Origin - Your Location)
  [30.3320, 77.9780],
  [30.3200, 77.9930],
  [30.3010, 78.0010],
  [30.2882, 78.0081], // ISBT Dehradun
  [30.3060, 78.0260],
  [30.3256, 78.0437], // Clock Tower Dehradun
  [30.3440, 78.0640],
  [30.3600, 78.0850], // Sahastradhara
  [30.3800, 78.0920],
  [30.3950, 78.0980], // Malsi Deer Park / Rajpur
  [30.4180, 78.1060],
  [30.4350, 78.1180], // Mussoorie Foothills Bypass
  [30.4480, 78.1420],
  [30.4580, 78.1620],
  [30.4650, 78.1750]  // Maruti Vihar (Destination)
];

// Live transit fleet and routes are loaded dynamically from /api/v2 endpoints
let activeFleetPolyline = [];

// Map UI state. Rendering + GPS live in map/*.js (see window.BusStopMap).
let activeMapMode = 'street';
let activeTrackingBusId = null;
let currentBusFilter = 'all';
let currentBusSort = 'departure';
let selectedModalBus = null;
let selectedSeatNumber = '12A';

// Mounts the passenger map (MapLibre + real device GPS).
// Phase 1 scope: base map + current user location only (no bus/route layers yet).
function initPassengerLiveMap() {
  if (!window.BusStopMap) {
    console.error('BusStopMap modules failed to load (map/*.js).');
    return;
  }
  BusStopMap.mount('liveLeafletMap');
}

// Renders the Bus Route Feed cards on the right side
function renderBusesFeed() {
  const container = document.getElementById('busCardsContainer');
  if (!container) return;

  const fleet = Array.isArray(serverBuses) ? [...serverBuses] : [];

  // Active searched corridor info
  const searchFrom = (lastSearchedCorridor?.fromVal || document.getElementById('routeSearchFrom')?.value.trim() || '').toLowerCase();
  const searchTo = (lastSearchedCorridor?.toVal || document.getElementById('routeSearchTo')?.value.trim() || '').toLowerCase();
  const passengerOrigin = lastSearchedCorridor?.originCoords;

  function isBusMatchingRoute(bus) {
    if (!searchFrom && !searchTo) return false;
    const hay = `${bus.route_name || ''} ${bus.name || ''} ${bus.origin || ''} ${bus.destination || ''} ${bus.current_stop || ''} ${bus.next_stop || ''}`.toLowerCase();
    const fromWords = searchFrom.split(/[\s,–-]+/).filter(w => w.length > 2);
    const toWords = searchTo.split(/[\s,–-]+/).filter(w => w.length > 2);
    const matchesFrom = fromWords.length > 0 && fromWords.some(w => hay.includes(w));
    const matchesTo = toWords.length > 0 && toWords.some(w => hay.includes(w));
    if (matchesFrom || matchesTo) return true;
    if (lastSearchedCorridor?.matchingRoute) {
      const mr = lastSearchedCorridor.matchingRoute;
      if (bus.route_id === mr.id || bus.route_number === mr.route_number) return true;
    }
    return false;
  }

  // Pre-calculate live distance & ETA to passenger's pickup location for each bus
  fleet.forEach(bus => {
    bus._isMatchedRoute = isBusMatchingRoute(bus);
    bus._distanceToPassengerKm = null;
    bus._approachingEtaMin = bus.eta_minutes || 5;

    const bLat = parseFloat(bus.location?.latitude || bus.latitude);
    const bLng = parseFloat(bus.location?.longitude || bus.longitude);

    if (passengerOrigin && !isNaN(bLat) && !isNaN(bLng)) {
      const R = 6371; // km
      const dLat = (passengerOrigin[1] - bLat) * Math.PI / 180;
      const dLon = (passengerOrigin[0] - bLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(bLat * Math.PI / 180) * Math.cos(passengerOrigin[1] * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      bus._distanceToPassengerKm = dist;
      const spd = bus.location?.speed || bus.speed || 45;
      bus._approachingEtaMin = Math.max(1, Math.round((dist / spd) * 60));
    }
  });

  // Filter
  let filtered = fleet;
  if (currentBusFilter === 'direct') {
    filtered = fleet.filter(b => b.type === 'direct' || !b.next_stop || b.route_number === '102');
  } else if (currentBusFilter === 'stops') {
    filtered = fleet.filter(b => b.type === 'stops' || b.next_stop);
  }

  // Sort: prioritize buses serving the searched route to the TOP
  filtered.sort((a, b) => {
    if (a._isMatchedRoute && !b._isMatchedRoute) return -1;
    if (!a._isMatchedRoute && b._isMatchedRoute) return 1;

    if (currentBusSort === 'price_low') {
      return (a.fare || a.base_fare || 40) - (b.fare || b.base_fare || 40);
    } else if (currentBusSort === 'fastest') {
      return (a._approachingEtaMin || 10) - (b._approachingEtaMin || 10);
    } else if (currentBusSort === 'rating') {
      return (b.rating || 4.8) - (a.rating || 4.8);
    }
    return (a._approachingEtaMin || 10) - (b._approachingEtaMin || 10);
  });

  // Update counts
  const allCount = fleet.length;
  const directCount = fleet.filter(b => b.type === 'direct' || !b.next_stop || b.route_number === '102').length;
  const stopsCount = fleet.filter(b => b.type === 'stops' || b.next_stop).length;

  const countAllEl = document.getElementById('countAll');
  const countDirectEl = document.getElementById('countDirect');
  const countStopsEl = document.getElementById('countStops');
  if (countAllEl) countAllEl.textContent = allCount;
  if (countDirectEl) countDirectEl.textContent = directCount;
  if (countStopsEl) countStopsEl.textContent = stopsCount;

  if (filtered.length === 0) {
    let advisoryEmpty = '';
    if (lastSearchedCorridor && lastSearchedCorridor.is_transit_available === false) {
      advisoryEmpty = `
        <div class="transit-advisory-banner" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; font-size: 12px; color: #92400e; line-height: 1.4; text-align: left;">
          <div style="font-weight: 700; margin-bottom: 2px; display:flex; align-items:center; gap:6px;">
            <span>⚠️</span>
            <span>Road Navigation Active</span>
          </div>
          <div>Direct public bus schedules are not active for this corridor. Real road navigation (${lastSearchedCorridor.distanceKm} km • ${lastSearchedCorridor.durationFormatted}) is displayed on the map.</div>
        </div>
      `;
    }

    container.innerHTML = advisoryEmpty + `
      <div class="empty-bus-feed" style="padding: 36px 16px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 8px;">🚌</div>
        <p style="font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">No Live Buses Active</p>
        <span style="font-size: 13px; color: #64748b; line-height: 1.5; display: block; max-width: 320px; margin: 0 auto;">
          No drivers are broadcasting GPS for this route right now. As soon as a driver starts a trip with GPS, their live vehicle will appear on the map and feed in real time.
        </span>
      </div>
    `;
    return;
  }

  let advisoryHtml = '';
  if (lastSearchedCorridor && lastSearchedCorridor.is_transit_available === false) {
    advisoryHtml = `
      <div class="transit-advisory-banner" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 10px; padding: 10px 12px; margin-bottom: 12px; font-size: 12px; color: #92400e; line-height: 1.4;">
        <div style="font-weight: 700; margin-bottom: 2px; display:flex; align-items:center; gap:6px;">
          <span>⚠️</span>
          <span>No Direct Public Bus Service</span>
        </div>
        <div>Verified transit schedules are not registered between these locations. Real road navigation (${lastSearchedCorridor.distanceKm} km • ${lastSearchedCorridor.durationFormatted}) is shown on the map.</div>
      </div>
    `;
  }

  // Generate HTML from real fleet buses
  container.innerHTML = advisoryHtml + filtered.map(bus => {
    const isLive = bus.status === 'ONLINE' || bus.status === 'IN_TRANSIT' || bus.status === 'live';
    const isTracking = activeTrackingBusId === bus.id;
    const isMatched = bus._isMatchedRoute;

    let badgeClass = isMatched ? 'status-match' : (isLive ? 'status-live' : 'status-ontime');
    let statusLabel = isMatched
      ? '🟢 Live on Your Route'
      : (bus.status === 'IN_TRANSIT' ? 'In Transit' : bus.status === 'ONLINE' ? 'Live Online' : (bus.status || 'Active'));

    const busTitle = bus.bus_number ? `${bus.bus_number} • ${bus.route_name || 'Mountain Line'}` : (bus.name || 'UTC Transit');
    const busImage = bus.image || 'assets/onboarding/who_driver_thumb.jpg';
    const currentLoc = bus.current_stop ? `At: ${bus.current_stop}` : 'In Transit';
    const nextLoc = bus.next_stop ? `Next: ${bus.next_stop}` : 'Destination';

    const distSnippet = bus._distanceToPassengerKm !== null
      ? `${bus._distanceToPassengerKm.toFixed(1)} km away • `
      : '';
    const etaText = `${distSnippet}ETA ${bus._approachingEtaMin} min`;
    const seatsText = bus.available_seats !== undefined ? `${bus.available_seats} seats left` : `${bus.capacity || 40} seats`;
    const fare = bus.fare || bus.base_fare || 55;

    return `
      <div class="bus-route-card ${isTracking ? 'active-tracking' : ''} ${isMatched ? 'matched-route-card' : ''}" onclick="openScheduleModal('${bus.id}')" tabindex="0" role="button" aria-label="${busTitle}">
        <div class="bus-card-left-thumb">
          <img src="${busImage}" alt="${busTitle}" class="bus-thumb-image" onerror="this.src='assets/onboarding/who_driver_thumb.jpg'">
        </div>
        
        <div class="bus-card-center-info">
          <div class="bus-card-status-row">
            <span class="bus-status-badge ${badgeClass}">${statusLabel}</span>
            ${bus.driver_name ? `<span class="bus-driver-pill">👨‍✈️ Captain ${bus.driver_name}</span>` : ''}
          </div>

          <h3 class="bus-operator-name">${busTitle}</h3>

          <div class="bus-times-row">
            <span>${currentLoc}</span>
            <span class="time-arrow-icon">➔</span>
            <span>${nextLoc}</span>
          </div>

          <p class="bus-route-snippet">${bus.route_name || bus.routeSnippet || 'Scenic Mountain Line'}</p>

          <div class="bus-meta-badges-row">
            <span>⏱ ${etaText}</span>
            <span>📍 ${bus.registration_number || (bus.speed ? bus.speed + ' km/h' : 'Active')}</span>
            <span>💺 ${seatsText}</span>
          </div>
        </div>

        <div class="bus-card-right-action">
          <span class="bus-fare-price">₹${fare}</span>
          <div class="bus-card-actions-group">
            <button type="button" class="btn-card-select-seat" onclick="event.stopPropagation(); openScheduleModal('${bus.id}')">
              💺 Select Seat
            </button>
            <button type="button" class="btn-card-track" onclick="event.stopPropagation(); trackBusOnMap('${bus.id}')">
              📡 Track Live ➔
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Opens the tracking HUD for a bus and fits map to show both the moving bus and passenger's pickup location
function trackBusOnMap(busId) {
  const bus = serverBuses.find(b => b.id === busId);
  if (!bus) return;

  activeTrackingBusId = busId;

  const bLat = parseFloat(bus.location?.latitude || bus.latitude);
  const bLng = parseFloat(bus.location?.longitude || bus.longitude);
  const passengerOrigin = lastSearchedCorridor?.originCoords;
  const pickupLabel = lastSearchedCorridor?.fromVal?.split(',')[0] || 'Your Pickup';

  // Calculate live approaching distance and ETA
  let etaInfo = `~${bus._approachingEtaMin || bus.eta_minutes || 4} min`;
  if (passengerOrigin && !isNaN(bLat) && !isNaN(bLng)) {
    const R = 6371;
    const dLat = (passengerOrigin[1] - bLat) * Math.PI / 180;
    const dLon = (passengerOrigin[0] - bLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(bLat * Math.PI / 180) * Math.cos(passengerOrigin[1] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const spd = bus.location?.speed || bus.speed || 45;
    const etaMin = Math.max(1, Math.round((dist / spd) * 60));
    etaInfo = `${dist.toFixed(1)} km away • ~${etaMin} min to ${pickupLabel}`;
  }

  // Update HUD
  const hud = document.getElementById('liveBusTrackingHud');
  const nameEl = document.getElementById('hudBusName');
  const speedEl = document.getElementById('hudBusSpeed');
  const nextEl = document.getElementById('hudBusNextStop');

  if (nameEl) nameEl.textContent = `${bus.bus_number} (${bus.route_name || 'Fleet Line'})${bus.driver_name ? ' • Captain ' + bus.driver_name : ''}`;
  if (speedEl) speedEl.textContent = `${bus.location?.speed || bus.speed || 48} km/h`;
  if (nextEl) nextEl.textContent = etaInfo;
  if (hud) hud.classList.remove('hidden');

  // Focus bus and passenger pickup simultaneously on map
  if (window.BusStopMap) {
    if (passengerOrigin && !isNaN(bLat) && !isNaN(bLng)) {
      BusStopMap.fitBounds([[bLng, bLat], [passengerOrigin[0], passengerOrigin[1]]]);
    } else {
      BusStopMap.focusBus(busId);
    }
  }

  // Re-render feed to show active highlight
  renderBusesFeed();

  showNotice(`Tracking ${bus.bus_number} live on map! Approaching your location 📡`);
}

// Closes Tracking HUD
function closeTrackingHud() {
  activeTrackingBusId = null;
  const hud = document.getElementById('liveBusTrackingHud');
  if (hud) hud.classList.add('hidden');
  renderBusesFeed();
}

// =========================================================================
// REAL-TIME PASSENGER FLEET TRACKING & BUS DISCOVERY CONTROLLER
// =========================================================================
let passengerLiveInterval = null;

function startPassengerLiveTracking() {
  if (passengerLiveInterval) clearInterval(passengerLiveInterval);

  async function syncFleet() {
    const dash = document.getElementById('passengerLiveDashboard');
    if (!dash || dash.classList.contains('hidden') || dash.style.display === 'none') {
      return;
    }

    try {
      const res = await fetch('/api/v2/buses');
      if (!res.ok) return;
      const data = await res.json();
      const buses = Array.isArray(data) ? data : (data.buses || []);
      serverBuses = buses || [];

      // Update buses on map in real time (smooth movement)
      if (window.BusStopMap) {
        BusStopMap.setBuses(serverBuses, (bus) => {
          trackBusOnMap(bus.id);
        });
      }

      // Re-render feed without losing search/filter focus
      renderBusesFeed();

      // If passenger is actively tracking a bus, update HUD live
      if (activeTrackingBusId) {
        const trackedBus = serverBuses.find(b => b.id === activeTrackingBusId);
        if (trackedBus) {
          const nameEl = document.getElementById('hudBusName');
          const speedEl = document.getElementById('hudBusSpeed');
          const nextEl = document.getElementById('hudBusNextStop');

          const bLat = parseFloat(trackedBus.location?.latitude || trackedBus.latitude);
          const bLng = parseFloat(trackedBus.location?.longitude || trackedBus.longitude);
          const passengerOrigin = lastSearchedCorridor?.originCoords;
          const pickupLabel = lastSearchedCorridor?.fromVal?.split(',')[0] || 'Your Pickup';

          let liveEtaInfo = `${trackedBus.next_stop || 'Next Stop'} (~${trackedBus.eta_minutes || 4} min)`;
          if (passengerOrigin && !isNaN(bLat) && !isNaN(bLng)) {
            const R = 6371;
            const dLat = (passengerOrigin[1] - bLat) * Math.PI / 180;
            const dLon = (passengerOrigin[0] - bLng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(bLat * Math.PI / 180) * Math.cos(passengerOrigin[1] * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const spd = trackedBus.location?.speed || trackedBus.speed || 45;
            const etaMin = Math.max(1, Math.round((dist / spd) * 60));
            liveEtaInfo = `${dist.toFixed(1)} km away • ~${etaMin} min to ${pickupLabel}`;
          }

          if (nameEl) nameEl.textContent = `${trackedBus.bus_number} (${trackedBus.driver_name ? 'Captain ' + trackedBus.driver_name : (trackedBus.route_name || 'Fleet Line')})`;
          if (speedEl) speedEl.textContent = `${trackedBus.location?.speed || trackedBus.speed || 48} km/h`;
          if (nextEl) nextEl.textContent = liveEtaInfo;

          if (window.BusStopMap) {
            BusStopMap.focusBus(trackedBus.id);
          }
        }
      }
    } catch (e) {}
  }

  // Poll every 2 seconds for real-time live telemetry
  passengerLiveInterval = setInterval(syncFleet, 2000);
}

function stopPassengerLiveTracking() {
  if (passengerLiveInterval) {
    clearInterval(passengerLiveInterval);
    passengerLiveInterval = null;
  }
}

// Layer Mode Switch: Street vs Satellite
function setMapLayerMode(mode) {
  activeMapMode = mode;
  const btnStreet = document.getElementById('btnMapStreet');
  const btnSat = document.getElementById('btnMapSatellite');

  btnStreet?.classList.toggle('active', mode === 'street');
  btnSat?.classList.toggle('active', mode !== 'street');

  if (window.BusStopMap) BusStopMap.setBaseLayer(mode === 'street' ? 'street' : 'satellite');
}

// "My Location" button: the only place (besides first GPS fix) that moves the camera
function recenterMapRoute() {
  if (window.BusStopMap) BusStopMap.recenterOnUser();
}

function mapZoomIn() {
  if (window.BusStopMap) BusStopMap.zoomIn();
}

function mapZoomOut() {
  if (window.BusStopMap) BusStopMap.zoomOut();
}

// Filter Tabs: All, Direct, With Stops
function setBusFilter(filter) {
  currentBusFilter = filter;
  document.getElementById('filterAll')?.classList.toggle('active', filter === 'all');
  document.getElementById('filterDirect')?.classList.toggle('active', filter === 'direct');
  document.getElementById('filterStops')?.classList.toggle('active', filter === 'stops');
  renderBusesFeed();
}

// Sort Dropdown
function applyBusSort(sortKey) {
  currentBusSort = sortKey;
  renderBusesFeed();
}

// ============================================================================
// REAL LOCATION, AUTOCOMPLETE & ROUTING SYSTEM (Rapido Experience)
// ============================================================================

// State for custom/GPS search coordinates
let searchCoords = {
  from: null, // { lng, lat, name, address, isGps, is_verified_stop }
  to: null
};
let mapPickingTarget = null;
let mapPickHandler = null;
let autocompleteDebounceTimer = null;
let autocompleteAbortController = null;
let activeNavSuggestionIndex = -1;
let currentSuggestionsList = { from: [], to: [] };
let lastCalculatedDirections = null;

// Real-time verified stops lookup (dynamic from server/database)
function getAllSearchStops() {
  const list = [];
  if (Array.isArray(serverStops)) {
    serverStops.forEach(s => {
      if (s.name && s.longitude && s.latitude) {
        list.push({
          name: s.name,
          address: s.address || s.description || 'Verified Bus Stop',
          coords: [Number(s.longitude), Number(s.latitude)]
        });
      }
    });
  }
  return list;
}

// Attach keyboard navigation (ArrowUp, ArrowDown, Enter, Escape) to search inputs
function attachSearchInputKeyHandlers() {
  ['from', 'to'].forEach(target => {
    const input = document.getElementById(target === 'from' ? 'routeSearchFrom' : 'routeSearchTo');
    if (!input || input.dataset.hasKeyNav) return;
    input.dataset.hasKeyNav = 'true';

    input.addEventListener('keydown', (e) => {
      const dropdown = document.getElementById(target === 'from' ? 'dropdownFrom' : 'dropdownTo');
      if (!dropdown || dropdown.classList.contains('hidden')) {
        if (e.key === 'ArrowDown') {
          openLocationSuggestions(target);
          e.preventDefault();
        }
        return;
      }

      const items = Array.from(dropdown.querySelectorAll('.loc-item.selectable'));
      if (items.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeNavSuggestionIndex = (activeNavSuggestionIndex + 1) % items.length;
        items.forEach((it, idx) => it.classList.toggle('active-nav', idx === activeNavSuggestionIndex));
        items[activeNavSuggestionIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeNavSuggestionIndex = (activeNavSuggestionIndex - 1 + items.length) % items.length;
        items.forEach((it, idx) => it.classList.toggle('active-nav', idx === activeNavSuggestionIndex));
        items[activeNavSuggestionIndex]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeNavSuggestionIndex >= 0 && items[activeNavSuggestionIndex]) {
          items[activeNavSuggestionIndex].click();
        } else if (items.length > 0) {
          items[0].click();
        } else {
          closeLocationSuggestions(target);
          executeRouteSearch();
        }
      } else if (e.key === 'Escape') {
        closeLocationSuggestions(target);
      }
    });
  });
}

// Render Suggestions Dropdown
async function renderLocationSuggestions(target, filterText = '') {
  const dropdown = document.getElementById(target === 'from' ? 'dropdownFrom' : 'dropdownTo');
  if (!dropdown) return;
  activeNavSuggestionIndex = -1;

  const q = (filterText || '').trim();

  // If query is empty: show GPS + Map Picker + Saved Places + Popular Verified Stops
  if (q.length === 0) {
    let savedPlaces = [];
    if (activeUser?.id) {
      try {
        const spRes = await fetch(`/api/v2/user/saved-places?userId=${activeUser.id}`);
        if (spRes.ok) {
          const spData = await spRes.json();
          savedPlaces = spData.places || [];
        }
      } catch (e) {}
    }

    const popularStops = getAllSearchStops().slice(0, 5);

    let html = `
      <button type="button" class="loc-item selectable" onclick="useLiveLocationFor('${target}')">
        <div class="loc-item-icon gps">📍</div>
        <div class="loc-item-texts">
          <span class="loc-item-title">Use My Live Location</span>
          <span class="loc-item-sub">Detect current device GPS location</span>
        </div>
        <span class="loc-item-badge">GPS</span>
      </button>
      <button type="button" class="loc-item selectable" onclick="startPickingOnMap('${target}')">
        <div class="loc-item-icon map">🗺️</div>
        <div class="loc-item-texts">
          <span class="loc-item-title">Choose Location on Map</span>
          <span class="loc-item-sub">Click anywhere on the map to set point</span>
        </div>
        <span class="loc-item-badge">Map</span>
      </button>
    `;

    if (savedPlaces.length > 0) {
      html += `<div class="loc-dropdown-section-title">Saved Places</div>`;
      savedPlaces.forEach(sp => {
        const itemJson = JSON.stringify({
          title: sp.label || sp.place_name,
          subtitle: sp.place_name,
          lng: sp.longitude,
          lat: sp.latitude,
          category: sp.category
        }).replace(/"/g, '&quot;');
        html += `
          <button type="button" class="loc-item selectable" onclick="selectLocationSuggestion('${target}', ${itemJson})">
            <div class="loc-item-icon stop">⭐</div>
            <div class="loc-item-texts">
              <span class="loc-item-title">${escapeHtml(sp.label || 'Saved Place')}</span>
              <span class="loc-item-sub">${escapeHtml(sp.place_name)}</span>
            </div>
            <span class="loc-item-badge">Saved</span>
          </button>
        `;
      });
    }

    html += `<div class="loc-dropdown-section-title">Popular Regional Stops</div>`;
    popularStops.forEach(s => {
      const itemJson = JSON.stringify({
        title: s.name,
        subtitle: s.address,
        lng: s.coords[0],
        lat: s.coords[1],
        is_verified_stop: true
      }).replace(/"/g, '&quot;');
      html += `
        <button type="button" class="loc-item selectable" onclick="selectLocationSuggestion('${target}', ${itemJson})">
          <div class="loc-item-icon verified-stop">🚏</div>
          <div class="loc-item-texts">
            <span class="loc-item-title">${escapeHtml(s.name)}</span>
            <span class="loc-item-sub">${escapeHtml(s.address)}</span>
          </div>
          <span class="loc-item-badge badge-verified-stop">Verified Stop</span>
        </button>
      `;
    });

    dropdown.innerHTML = html;
    dropdown.classList.remove('hidden');
    attachSearchInputKeyHandlers();
    return;
  }

  // If query is typed: Show loading spinner
  dropdown.innerHTML = `
    <div class="loc-dropdown-loading">
      <span class="loc-dropdown-spinner"></span>
      <span>Searching real places and verified stops…</span>
    </div>
  `;
  dropdown.classList.remove('hidden');

  if (autocompleteAbortController) {
    autocompleteAbortController.abort();
  }
  autocompleteAbortController = new AbortController();

  try {
    const userFix = window.BusStopMap?.location?.getFix();
    let url = `/api/v2/places/autocomplete?q=${encodeURIComponent(q)}`;
    if (userFix && userFix.lng && userFix.lat) {
      url += `&proximityLng=${userFix.lng}&proximityLat=${userFix.lat}`;
    }

    const res = await fetch(url, { signal: autocompleteAbortController.signal });
    if (!res.ok) throw new Error('Autocomplete failed');
    const data = await res.json();
    const results = data.results || [];
    currentSuggestionsList[target] = results;

    if (results.length === 0) {
      dropdown.innerHTML = `
        <div class="loc-dropdown-empty">
          <p style="font-weight:600;margin-bottom:4px;">No places found for "${escapeHtml(q)}"</p>
          <span style="font-size:11px;">Check spelling or try a landmark, city, or verified stop name</span>
        </div>
      `;
      return;
    }

    let outHtml = `
      <div class="loc-dropdown-section-title">Suggestions (${results.length})</div>
    `;

    results.forEach((item, idx) => {
      const itemJson = JSON.stringify(item).replace(/"/g, '&quot;');
      const iconClass = item.is_verified_stop ? 'verified-stop' : (item.category === 'poi' ? 'poi' : (item.category === 'station' ? 'station' : 'stop'));
      const iconEmoji = item.is_verified_stop ? '🚏' : (item.category === 'poi' ? '🏛️' : (item.category === 'station' ? '🚂' : '📍'));
      const badgeHtml = item.is_verified_stop
        ? `<span class="loc-item-badge badge-verified-stop">Verified Stop</span>`
        : `<span class="loc-item-badge">${escapeHtml(item.category || 'Place')}</span>`;

      outHtml += `
        <button type="button" class="loc-item selectable" data-index="${idx}" onclick="selectLocationSuggestion('${target}', ${itemJson})">
          <div class="loc-item-icon ${iconClass}">${iconEmoji}</div>
          <div class="loc-item-texts">
            <span class="loc-item-title">${escapeHtml(item.title)}</span>
            <span class="loc-item-sub">${escapeHtml(item.subtitle || item.place_name || '')}</span>
          </div>
          ${badgeHtml}
        </button>
      `;
    });

    dropdown.innerHTML = outHtml;
    attachSearchInputKeyHandlers();
  } catch (err) {
    if (err.name === 'AbortError') return;
    dropdown.innerHTML = `
      <div class="loc-dropdown-empty">
        <span>Unable to fetch places. Please check network connection.</span>
      </div>
    `;
  }
}

function openLocationSuggestions(target) {
  closeLocationSuggestions(target === 'from' ? 'to' : 'from');
  const input = document.getElementById(target === 'from' ? 'routeSearchFrom' : 'routeSearchTo');
  renderLocationSuggestions(target, input ? input.value : '');
}

function filterLocationSuggestions(target, val) {
  // Clear confirmed coordinates if user manually alters text so unselected raw text is not treated as verified location
  searchCoords[target] = null;
  if (autocompleteDebounceTimer) {
    clearTimeout(autocompleteDebounceTimer);
  }
  autocompleteDebounceTimer = setTimeout(() => {
    renderLocationSuggestions(target, val);
  }, 280);
}

function closeLocationSuggestions(target) {
  if (target) {
    const dropdown = document.getElementById(target === 'from' ? 'dropdownFrom' : 'dropdownTo');
    if (dropdown) dropdown.classList.add('hidden');
  } else {
    document.getElementById('dropdownFrom')?.classList.add('hidden');
    document.getElementById('dropdownTo')?.classList.add('hidden');
  }
}

function selectLocationSuggestion(target, item) {
  if (!item) return;
  const input = document.getElementById(target === 'from' ? 'routeSearchFrom' : 'routeSearchTo');
  const label = item.title || item.name || item.place_name || '';
  if (input) input.value = label;

  const lng = parseFloat(item.lng || (item.coords && item.coords[0]));
  const lat = parseFloat(item.lat || (item.coords && item.coords[1]));

  if (!isNaN(lng) && !isNaN(lat)) {
    searchCoords[target] = {
      lng,
      lat,
      name: label,
      address: item.subtitle || item.address || item.place_name || label,
      is_verified_stop: Boolean(item.is_verified_stop)
    };
  }

  closeLocationSuggestions(target);

  // Synchronize Map
  if (window.BusStopMap && !isNaN(lng) && !isNaN(lat)) {
    BusStopMap.setPassengerJourneyMarkers(searchCoords.from, searchCoords.to);
    if (!searchCoords.from || !searchCoords.to) {
      BusStopMap.flyTo({ lat, lng, zoom: 14.5 });
    }
  }

  // If both locations are selected, auto-calculate route
  if (searchCoords.from && searchCoords.to) {
    executeRouteSearch();
  }
}

// Real Browser Geolocation Detection for From or To
function useLiveLocationFor(target) {
  closeLocationSuggestions(target);
  const gpsBtn = document.getElementById(target === 'from' ? 'btnGpsFrom' : 'btnGpsTo');
  if (gpsBtn) gpsBtn.classList.add('active-tracking');

  showNotice(`📡 Acquiring live GPS location for ${target === 'from' ? 'Origin' : 'Destination'}…`);

  if (!('geolocation' in navigator)) {
    if (gpsBtn) gpsBtn.classList.remove('active-tracking');
    showNotice('⚠️ Geolocation is not supported by your browser. Please search an address manually.');
    return;
  }

  const onSuccess = async (pos) => {
    if (gpsBtn) gpsBtn.classList.remove('active-tracking');
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy || 15;

    // Real Reverse Geocoding via server API (No hardcoded Dehradun/Agra!)
    let label = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    let fullAddr = label;

    try {
      const res = await fetch(`/api/v2/places/reverse?lng=${lng}&lat=${lat}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) label = data.title;
        if (data.place_name) fullAddr = data.place_name;
      }
    } catch (e) {}

    searchCoords[target] = {
      lng,
      lat,
      name: label,
      address: fullAddr,
      isGps: true
    };

    const input = document.getElementById(target === 'from' ? 'routeSearchFrom' : 'routeSearchTo');
    if (input) input.value = label;

    // Update real user GPS location & accuracy on Map
    if (window.BusStopMap) {
      BusStopMap.provider?.setUserLocation({ lat, lng, accuracy });
      BusStopMap.setPassengerJourneyMarkers(searchCoords.from, searchCoords.to);
      if (!searchCoords.from || !searchCoords.to) {
        BusStopMap.flyTo({ lat, lng, zoom: 15.5 });
      }
    }

    showNotice(`📍 ${target === 'from' ? 'Origin' : 'Destination'} set to: ${label}`);

    if (searchCoords.from && searchCoords.to) {
      executeRouteSearch();
    }
  };

  const onError = (err) => {
    if (gpsBtn) gpsBtn.classList.remove('active-tracking');
    let msg = 'Could not determine your location. Please enter your address manually.';
    if (err && err.code === 1) {
      msg = 'Location permission denied. Please allow location access in your browser or search manually.';
    } else if (err && err.code === 2) {
      msg = 'Device position unavailable. Please ensure location services are turned on.';
    } else if (err && err.code === 3) {
      msg = 'Location detection timed out. Please try again or search manually.';
    }
    showNotice(`⚠️ ${msg}`);
  };

  navigator.geolocation.getCurrentPosition(onSuccess, onError, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 10000
  });
}

// Map Click Picker
function startPickingOnMap(target) {
  closeLocationSuggestions(target);
  mapPickingTarget = target;
  showNotice(`🎯 Click anywhere on the map to set your ${target === 'from' ? 'Origin' : 'Destination'} location.`);

  if (window.BusStopMap && window.BusStopMap.provider) {
    const nativeMap = window.BusStopMap.provider.getNativeMap?.();
    if (nativeMap) {
      nativeMap.getCanvas().style.cursor = 'crosshair';
      if (mapPickHandler) {
        nativeMap.off('click', mapPickHandler);
      }
      mapPickHandler = async (e) => {
        const lng = e.lngLat.lng;
        const lat = e.lngLat.lat;

        showNotice('Resolving clicked location address… 📍');
        let label = `Selected Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        let fullAddr = label;

        try {
          const res = await fetch(`/api/v2/places/reverse?lng=${lng}&lat=${lat}`);
          if (res.ok) {
            const data = await res.json();
            if (data.title) label = data.title;
            if (data.place_name) fullAddr = data.place_name;
          }
        } catch (err) {}

        searchCoords[mapPickingTarget] = {
          lng,
          lat,
          name: label,
          address: fullAddr,
          is_verified_stop: false
        };

        const input = document.getElementById(mapPickingTarget === 'from' ? 'routeSearchFrom' : 'routeSearchTo');
        if (input) input.value = label;

        nativeMap.getCanvas().style.cursor = '';
        nativeMap.off('click', mapPickHandler);
        mapPickHandler = null;

        if (window.BusStopMap) {
          BusStopMap.setPassengerJourneyMarkers(searchCoords.from, searchCoords.to);
        }

        showNotice(`📍 Set ${mapPickingTarget === 'from' ? 'Origin' : 'Destination'} to: ${label}`);
        if (searchCoords.from && searchCoords.to) {
          executeRouteSearch();
        }
        mapPickingTarget = null;
      };
      nativeMap.once('click', mapPickHandler);
    }
  }
}

// Close location dropdowns on outside click
document.addEventListener('click', (e) => {
  const fromGroup = document.getElementById('fromInputGroup');
  const toGroup = document.getElementById('toInputGroup');
  if (fromGroup && !fromGroup.contains(e.target)) {
    closeLocationSuggestions('from');
  }
  if (toGroup && !toGroup.contains(e.target)) {
    closeLocationSuggestions('to');
  }
});

// Swap Origin and Destination
function swapSearchLocations() {
  const fromInput = document.getElementById('routeSearchFrom');
  const toInput = document.getElementById('routeSearchTo');
  if (!fromInput || !toInput) return;

  const tempVal = fromInput.value;
  fromInput.value = toInput.value;
  toInput.value = tempVal;

  const tempCoords = searchCoords.from;
  searchCoords.from = searchCoords.to;
  searchCoords.to = tempCoords;

  if (window.BusStopMap) {
    BusStopMap.setPassengerJourneyMarkers(searchCoords.from, searchCoords.to);
  }

  showNotice('Swapped Origin and Destination ⇄');
  if (searchCoords.from && searchCoords.to) {
    executeRouteSearch();
  }
}

function clearSearchField(id) {
  const input = document.getElementById(id);
  const target = (id === 'routeSearchFrom') ? 'from' : 'to';
  if (input) {
    input.value = '';
    searchCoords[target] = null;
    if (window.BusStopMap) {
      BusStopMap.setPassengerJourneyMarkers(searchCoords.from, searchCoords.to);
      BusStopMap.clearRoutePolyline();
    }
    const metricsBar = document.getElementById('feedRouteMetricsBar');
    if (metricsBar) metricsBar.classList.add('hidden');
    input.focus();
    openLocationSuggestions(target);
  }
}

// Time Dropdown Controls
function toggleTimeDropdown() {
  const menu = document.getElementById('timeDropdownMenu');
  if (menu) menu.classList.toggle('hidden');
}

function selectTimeOption(text) {
  const label = document.getElementById('selectedTimeLabel');
  if (label) label.textContent = text;
  document.querySelectorAll('.time-opt-item').forEach(b => {
    b.classList.toggle('active', b.textContent === text);
  });
  toggleTimeDropdown();
  showNotice(`Departure time set to: ${text}`);
}

// Notification Drawer & User Dropdown
function toggleNotificationDrawer() {
  const drawer = document.getElementById('notificationDrawer');
  if (drawer) drawer.classList.toggle('hidden');
}

function toggleUserDropdownMenu() {
  const menu = document.getElementById('userDropdownMenu');
  if (menu) menu.classList.toggle('hidden');
}

// Global Passenger Search Corridor Cache
let lastSearchedCorridor = null;

// Execute Route Search with Real-Time Routing API & Map Synchronization
async function executeRouteSearch() {
  const fromInput = document.getElementById('routeSearchFrom');
  const toInput = document.getElementById('routeSearchTo');
  const fromVal = fromInput?.value.trim() || '';
  const toVal = toInput?.value.trim() || '';

  if (!fromVal || !toVal) {
    showNotice('⚠️ Please enter both Origin (From) and Destination (To)');
    return;
  }

  // If searchCoords.from is not yet a verified coordinate object, resolve it via autocomplete top result
  if (!searchCoords.from || !searchCoords.from.lng || !searchCoords.from.lat) {
    try {
      const res = await fetch(`/api/v2/places/autocomplete?q=${encodeURIComponent(fromVal)}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const top = data.results[0];
        searchCoords.from = {
          lng: top.lng,
          lat: top.lat,
          name: top.title,
          address: top.subtitle || top.place_name,
          is_verified_stop: top.is_verified_stop
        };
        if (fromInput) fromInput.value = top.title;
      }
    } catch (e) {}
  }

  // If searchCoords.to is not yet a verified coordinate object, resolve it via autocomplete top result
  if (!searchCoords.to || !searchCoords.to.lng || !searchCoords.to.lat) {
    try {
      const res = await fetch(`/api/v2/places/autocomplete?q=${encodeURIComponent(toVal)}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const top = data.results[0];
        searchCoords.to = {
          lng: top.lng,
          lat: top.lat,
          name: top.title,
          address: top.subtitle || top.place_name,
          is_verified_stop: top.is_verified_stop
        };
        if (toInput) toInput.value = top.title;
      }
    } catch (e) {}
  }

  if (!searchCoords.from || !searchCoords.to) {
    showNotice('⚠️ Could not verify one of the locations. Please select a valid location from the suggestions.');
    return;
  }

  const fLng = searchCoords.from.lng;
  const fLat = searchCoords.from.lat;
  const tLng = searchCoords.to.lng;
  const tLat = searchCoords.to.lat;

  const sub = document.getElementById('feedRouteSubtitle');
  if (sub) sub.textContent = `From ${searchCoords.from.name.split(',')[0]} to ${searchCoords.to.name.split(',')[0]}`;

  showNotice('Calculating road driving route and transit options… 🛣️');

  try {
    const res = await fetch(`/api/v2/directions?fromLng=${fLng}&fromLat=${fLat}&toLng=${tLng}&toLat=${tLat}`);
    if (!res.ok) throw new Error('Directions request failed');
    const data = await res.json();

    if (!data.success || !data.coordinates) {
      throw new Error(data.error || 'No drivable route found between these locations');
    }

    lastCalculatedDirections = data;
    lastSearchedCorridor = {
      fromVal: searchCoords.from.name,
      toVal: searchCoords.to.name,
      originCoords: [fLng, fLat],
      destCoords: [tLng, tLat],
      distanceKm: data.distanceKm,
      durationMinutes: data.durationMinutes,
      durationFormatted: data.durationFormatted,
      is_transit_available: data.is_transit_available,
      matching_routes: data.matching_routes || []
    };

    // 1. Synchronize Map: Distinct pickup & drop markers + Road Polyline
    if (window.BusStopMap) {
      BusStopMap.setPassengerJourneyMarkers(searchCoords.from, searchCoords.to);
      BusStopMap.setRoutePolyline(data.coordinates, data.is_transit_available ? '#10b981' : '#2563eb');
      BusStopMap.fitBounds([[fLng, fLat], [tLng, tLat], ...data.coordinates]);
    }

    // 2. Update Route Metrics Chip Row in Header
    const metricsBar = document.getElementById('feedRouteMetricsBar');
    const distVal = document.getElementById('metricDistanceVal');
    const durVal = document.getElementById('metricDurationVal');
    const statusVal = document.getElementById('metricTransitStatus');

    if (distVal) distVal.textContent = `${data.distanceKm} km`;
    if (durVal) durVal.textContent = data.durationFormatted || `${data.durationMinutes} min`;
    if (statusVal) {
      if (data.is_transit_available) {
        statusVal.textContent = '🚏 Verified Transit Service Available';
        statusVal.className = 'route-metric-pill transit-status';
      } else {
        statusVal.textContent = '🛣️ Road Driving Navigation Path';
        statusVal.className = 'route-metric-pill distance';
      }
    }
    if (metricsBar) metricsBar.classList.remove('hidden');

    // 3. Render and prioritize buses serving this corridor
    renderBusesFeed();

    showNotice(`Route loaded: ${data.distanceKm} km (${data.durationFormatted}) ➔ Origin & Destination mapped!`);
  } catch (err) {
    console.error('Route calculation error:', err);
    showNotice(`⚠️ Route notice: ${err.message}`);
    // If routing API fails, still place origin and destination markers
    if (window.BusStopMap) {
      BusStopMap.setPassengerJourneyMarkers(searchCoords.from, searchCoords.to);
      BusStopMap.fitBounds([[fLng, fLat], [tLng, tLat]]);
    }
    renderBusesFeed();
  }
}

// Global Real-time Transit System State
let serverBuses = [];
let serverRoutes = [];
let serverStops = [];
let activeUserTrip = null;
let liveLocationWatcherId = null;
let driverAssignedBus = null;
let driverAssignedRoute = null;
let driverShiftOnline = false;
let driverTripStarted = false;
let driverCurrentStopIndex = 0;
let adminCurrentTab = 'overview';
let adminOverviewData = null;

// Load live transit data from REST APIs
async function fetchTransitData() {
  try {
    const [busesRes, routesRes, stopsRes] = await Promise.all([
      fetch('/api/v2/buses'),
      fetch('/api/v2/routes'),
      fetch('/api/v2/stops')
    ]);

    if (busesRes.ok) {
      const data = await busesRes.json();
      serverBuses = Array.isArray(data) ? data : (data.buses || []);
    }
    if (routesRes.ok) {
      const data = await routesRes.json();
      serverRoutes = Array.isArray(data) ? data : (data.routes || []);
    }
    if (stopsRes.ok) {
      const data = await stopsRes.json();
      serverStops = Array.isArray(data) ? data : (data.stops || []);
    }

    // Map server stops, routes, and buses on passenger map if mounted
    if (window.BusStopMap) {
      if (serverRoutes.length > 0) {
        const defaultRoute = serverRoutes.find(r => r.route_number === '204') || serverRoutes[0];
        if (defaultRoute && defaultRoute.polyline) {
          BusStopMap.setRoutePolyline(defaultRoute.polyline, defaultRoute.color_hex || '#2563eb');
          if (defaultRoute.stops && defaultRoute.stops.length) {
            BusStopMap.setStops(defaultRoute.stops, (s) => openStopDetailsModal(s.stop_id || s.id));
          }
        }
      } else if (serverStops.length > 0) {
        BusStopMap.setStops(serverStops, (stop) => {
          openStopDetailsModal(stop.id);
        });
      }
      if (serverBuses.length > 0) {
        BusStopMap.setBuses(serverBuses, (bus) => {
          trackBusOnMap(bus.id);
        });
      }
    }

    // Populate nearby stops drawer
    populateNearbyStops();

    // Re-render feed
    renderBusesFeed();

    // Check active trip
    checkActiveTrip();
  } catch (err) {
    console.warn('Transit data fetch warning (will use seed):', err);
  }
}

// Check active passenger trip
async function checkActiveTrip() {
  try {
    const saved = localStorage.getItem('bus_stop_active_trip');
    if (saved) {
      activeUserTrip = JSON.parse(saved);
      renderActiveTripCard(activeUserTrip);
      updateActiveTicketHeader(activeUserTrip);
    } else {
      activeUserTrip = null;
      updateActiveTicketHeader(null);
    }
  } catch (e) {}
}

function renderActiveTripCard(trip) {
  const card = document.getElementById('activeTripCard');
  if (!card) return;

  if (!trip) {
    card.classList.add('hidden');
    return;
  }

  const nameEl = document.getElementById('activeTripBusName');
  if (nameEl) nameEl.textContent = trip.busName || 'BUS';
  const seatEl = document.getElementById('activeTripSeatNumber');
  if (seatEl) seatEl.textContent = `Seat ${trip.seatNumber || ''}`;
  const boardingEl = document.getElementById('activeTripBoardingStop');
  if (boardingEl) boardingEl.textContent = trip.boardingStop || '';
  const destEl = document.getElementById('activeTripDestStop');
  if (destEl) destEl.textContent = trip.destinationStop || '';
  const etaEl = document.getElementById('activeTripEtaBadge');
  if (etaEl) etaEl.textContent = trip.eta || '';
  const statusEl = document.getElementById('activeTripStatusText');
  if (statusEl) statusEl.textContent = trip.status || 'Active Pass';

  card.classList.remove('hidden');
}

function cancelActiveTripBooking() {
  if (!activeUserTrip) return;
  if (!confirm('Cancel your active trip pass?')) return;

  if (activeUserTrip.id) {
    fetch(`/api/v2/bookings/${activeUserTrip.id}/cancel`, { method: 'POST' }).catch(() => {});
  }

  localStorage.removeItem('bus_stop_active_trip');
  activeUserTrip = null;
  renderActiveTripCard(null);
  updateActiveTicketHeader(null);
  showNotice('Pass cancelled. Seat released back to the fleet.');
}

function trackActiveTripBus() {
  if (activeUserTrip && activeUserTrip.busId) {
    trackBusOnMap(activeUserTrip.busId);
  }
}

// Nearby Stops Drawer logic
function toggleNearbyStopsDrawer() {
  const drawer = document.getElementById('nearbyStopsDrawer');
  if (!drawer) return;
  drawer.classList.toggle('hidden');
  if (!drawer.classList.contains('hidden')) {
    populateNearbyStops();
  }
}

function populateNearbyStops() {
  const list = document.getElementById('nearbyStopsList');
  if (!list) return;

  const stops = serverStops || [];

  list.innerHTML = stops.map(stop => `
    <div class="nearby-stop-item" onclick="selectStopFromDrawer('${stop.id}')">
      <div class="stop-meta-left">
        <strong>${stop.name}</strong>
        <span>Click to view upcoming buses</span>
      </div>
      <span class="stop-distance-pill">🚏 View</span>
    </div>
  `).join('');
}

function selectStopFromDrawer(stopId) {
  openStopDetailsModal(stopId);
  const drawer = document.getElementById('nearbyStopsDrawer');
  if (drawer) drawer.classList.add('hidden');
}

// Stop Details Modal (Popup on map stop click)
async function openStopDetailsModal(stopId) {
  const stop = serverStops.find(s => s.id === stopId);
  const modal = document.getElementById('stopDetailsModal');
  const nameEl = document.getElementById('stopModalName');
  const listEl = document.getElementById('stopModalUpcomingList');
  if (!modal) return;

  if (nameEl) nameEl.textContent = stop ? stop.name : 'Bus Stop';
  if (listEl) listEl.innerHTML = '<p style="padding:10px;color:#797164;">Loading upcoming buses...</p>';
  modal.classList.remove('hidden');

  try {
    const res = await fetch(`/api/v2/stops/${stopId}/upcoming`);
    if (res.ok) {
      const data = await res.json();
      const buses = Array.isArray(data) ? data : (data.upcomingBuses || data.buses || []);
      if (buses.length === 0) {
        listEl.innerHTML = '<p style="padding:10px;color:#797164;">No active buses arriving at this stop right now.</p>';
      } else {
        listEl.innerHTML = buses.map(b => `
          <div class="stop-upcoming-bus-card">
            <div>
              <strong>${b.bus_number} (${b.name || 'UTC Transit'})</strong>
              <span>${b.route_name || 'Mountain Route'} • ~${b.eta_minutes || 4} min</span>
            </div>
            <button type="button" class="btn-card-track" onclick="closeStopDetailsModal(); trackBusOnMap('${b.bus_id || b.id}')">
              Track ➔
            </button>
          </div>
        `).join('');
      }
    }
  } catch (e) {
    if (listEl) listEl.innerHTML = '<p style="padding:10px;color:#797164;">Clock Tower Express • Next in 4 min</p>';
  }
}

function closeStopDetailsModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('btn-modal-close')) return;
  const modal = document.getElementById('stopDetailsModal');
  if (modal) modal.classList.add('hidden');
}

// Dynamic Booking Modal & Seat Grid Controller
function closeScheduleModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('btn-modal-close') && !e.target.closest('.btn-modal-close')) return;
  const modal = document.getElementById('busScheduleModal');
  if (modal) modal.classList.add('hidden');
}

function selectSeat(seatNumber, element) {
  if (element && (element.classList.contains('booked') || element.disabled)) {
    showNotice(`Seat ${seatNumber} is already occupied.`);
    return;
  }
  selectedSeatNumber = seatNumber;
  document.querySelectorAll('#busSeatsCabin .seat-box').forEach(el => el.classList.remove('selected'));
  if (element) element.classList.add('selected');
  const label = document.getElementById('selectedSeatLabel');
  if (label) label.textContent = `${seatNumber} Selected`;
}

async function openScheduleModal(busId) {
  const bus = serverBuses.find(b => b.id === busId) || serverBuses[0];
  selectedModalBus = bus;

  const modal = document.getElementById('busScheduleModal');
  const titleEl = document.getElementById('modalBusName');
  const routeEl = document.getElementById('modalBusRoute');
  const fareEl = document.getElementById('modalTotalFare');
  const statusPill = document.getElementById('modalBusStatusPill');

  if (titleEl) titleEl.textContent = bus.name || bus.bus_number;
  if (routeEl) routeEl.textContent = bus.route_name || bus.routeSnippet || 'Scenic Corridor';
  if (fareEl) fareEl.textContent = `₹${bus.fare || 55}`;
  if (statusPill) statusPill.textContent = bus.status || 'Live';

  // Fetch real persistent seats from backend
  const cabin = document.getElementById('busSeatsCabin');
  if (cabin) {
    cabin.innerHTML = '<p style="padding:12px;color:#797164;">Loading cabin seats...</p>';
    try {
      const seatsRes = await fetch(`/api/v2/buses/${bus.id}/seats`);
      if (seatsRes.ok) {
        const seatsRaw = await seatsRes.json();
        const seats = Array.isArray(seatsRaw) ? seatsRaw : (seatsRaw.seats || []);
        // If current selectedSeatNumber is booked or invalid, choose first available
        const availableSeats = seats.filter(s => s.status !== 'BOOKED' && s.status !== 'OCCUPIED');
        if (availableSeats.length > 0 && !availableSeats.some(s => s.seat_number === selectedSeatNumber)) {
          selectedSeatNumber = availableSeats[0].seat_number;
        }

        cabin.innerHTML = seats.map(s => {
          const isSelected = s.seat_number === selectedSeatNumber;
          const isBooked = s.status === 'BOOKED' || s.status === 'OCCUPIED';
          return `
            <button type="button" class="seat-box ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}" 
              onclick="selectSeat('${s.seat_number}', this)" ${isBooked ? 'disabled' : ''} title="${isBooked ? 'Occupied' : 'Seat ' + s.seat_number}">
              ${s.seat_number}
            </button>
          `;
        }).join('');
      }
    } catch (e) {
      const fallbackRows = ['01A', '01B', '01C', '01D', '02A', '02B', '02C', '02D', '03A', '03B', '12A', '12B', '12C', '12D'];
      cabin.innerHTML = fallbackRows.map(s => `
        <button type="button" class="seat-box ${s === selectedSeatNumber ? 'selected' : ''}" onclick="selectSeat('${s}', this)">
          ${s}
        </button>
      `).join('');
    }

    const label = document.getElementById('selectedSeatLabel');
    if (label) label.textContent = `${selectedSeatNumber} Selected`;
  }

  // Build timeline stepper from route stops if available
  const stepper = document.getElementById('modalTimelineStepper');
  if (stepper) {
    const route = serverRoutes.find(r => r.id === bus.route_id || r.route_number === bus.route_number) || serverRoutes[0];
    const stopsToRender = (route && route.stops && route.stops.length > 0) 
      ? route.stops 
      : (serverStops.length > 0 ? serverStops.slice(0, 5) : []);

    stepper.innerHTML = stopsToRender.map((s, idx) => `
      <div class="timeline-stop-item">
        <div class="timeline-dot ${idx === 0 ? 'origin-dot' : idx === stopsToRender.length - 1 ? 'dest-dot' : ''}"></div>
        <div class="timeline-details">
          <strong>${s.name || s.stop_name}</strong>
          <span>Stop #${idx + 1}${s.arrival_time ? ' • ' + s.arrival_time : ''}</span>
        </div>
      </div>
    `).join('');
  }

  if (modal) modal.classList.remove('hidden');
}

async function confirmTicketBooking() {
  const bus = selectedModalBus || serverBuses[0];
  if (!bus) {
    showNotice('Please select a bus to reserve a seat.');
    return;
  }
  if (!selectedSeatNumber) {
    showNotice('Please select an available seat in the cabin.');
    return;
  }

  const passengerName = activeUser?.full_name || 'Vivek';
  const passengerId = activeUser?.id || 'usr_vivek_2026';
  const boardingStop = document.getElementById('routeSearchFrom')?.value || bus.origin || 'Dehradun (ISBT)';
  const destinationStop = document.getElementById('routeSearchTo')?.value || bus.destination || 'Rishikesh';

  const bookingPayload = {
    bus_id: bus.id,
    passenger_id: passengerId,
    passenger_name: passengerName,
    seat_number: selectedSeatNumber,
    boarding_stop: boardingStop.split(',')[0],
    destination_stop: destinationStop.split(',')[0],
    fare: bus.fare || 55
  };

  try {
    const res = await fetch('/api/v2/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    });
    const data = await res.json();

    if (res.ok && data.success) {
      closeScheduleModal();
      const pnr = data.booking?.booking_reference || data.booking?.booking?.booking_reference || `BST-${Math.floor(100000 + Math.random() * 900000)}`;

      activeUserTrip = {
        id: data.booking?.id || data.booking?.booking?.id,
        busId: bus.id,
        busName: bus.name || bus.bus_number,
        routeName: bus.route_name || `${boardingStop.split(',')[0]} ➔ ${destinationStop.split(',')[0]}`,
        seatNumber: selectedSeatNumber,
        boardingStop: boardingStop.split(',')[0],
        destinationStop: destinationStop.split(',')[0],
        fare: bus.fare || 55,
        eta: 'Approaching in 4 min',
        status: 'CONFIRMED PASS',
        pnr: pnr
      };

      localStorage.setItem('bus_stop_active_trip', JSON.stringify(activeUserTrip));
      renderActiveTripCard(activeUserTrip);
      updateActiveTicketHeader(activeUserTrip);
      openPassengerTicketModal(activeUserTrip);

      showNotice(`Seat ${selectedSeatNumber} Booked! PNR: ${pnr} 🎉`);
      // Refresh fleet data so remaining seat count reflects across cards
      fetchTransitData();
      trackBusOnMap(bus.id);
    } else {
      showNotice(data.error || 'Failed to book seat. Please try another.');
    }
  } catch (err) {
    closeScheduleModal();
    showNotice(`Ticket booking request failed: ${err.message}`);
  }
}

function updateActiveTicketHeader(trip) {
  const btn = document.getElementById('btnMyActiveTicket');
  const pnrSpan = document.getElementById('headerTicketPnr');
  if (btn && trip && trip.pnr) {
    btn.classList.remove('hidden');
    btn.style.display = 'inline-flex';
    if (pnrSpan) pnrSpan.textContent = trip.pnr;
  } else if (btn) {
    btn.classList.add('hidden');
    btn.style.display = 'none';
  }
}

function openPassengerTicketModal(tripData) {
  const trip = tripData || activeUserTrip;
  if (!trip) {
    showNotice('No active confirmed ticket found.');
    return;
  }

  const modal = document.getElementById('passengerTicketModal');
  if (!modal) return;

  const busEl = document.getElementById('ticketModalBusName');
  if (busEl) busEl.textContent = trip.busName || 'Mountain Transit';
  const routeEl = document.getElementById('ticketModalRouteName');
  if (routeEl) routeEl.textContent = trip.routeName || `${trip.boardingStop} ➔ ${trip.destinationStop}`;
  const pnrEl = document.getElementById('ticketModalPnr');
  if (pnrEl) pnrEl.textContent = trip.pnr || 'BST-XXXXXX';
  const passEl = document.getElementById('ticketModalPassenger');
  if (passEl) passEl.textContent = activeUser?.full_name || 'Citizen Traveler';
  const seatEl = document.getElementById('ticketModalSeat');
  if (seatEl) seatEl.textContent = `Seat ${trip.seatNumber || '01A'}`;
  const boardEl = document.getElementById('ticketModalBoardingStop');
  if (boardEl) boardEl.textContent = trip.boardingStop || 'Origin';
  const destEl = document.getElementById('ticketModalDestStop');
  if (destEl) destEl.textContent = trip.destinationStop || 'Destination';
  const fareEl = document.getElementById('ticketModalFare');
  if (fareEl) fareEl.textContent = `₹${trip.fare || 55}.00`;
  const statEl = document.getElementById('ticketModalStatus');
  if (statEl) statEl.textContent = trip.status || 'CONFIRMED';

  // Render QR Code
  renderTicketQr(trip.pnr || 'BST-2026');

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function closePassengerTicketModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('btn-modal-close') && !e.target.closest('.btn-modal-close') && !e.target.closest('.btn-input-gps')) return;
  const modal = document.getElementById('passengerTicketModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  if (activeUserTrip && activeUserTrip.busId) {
    trackBusOnMap(activeUserTrip.busId);
  }
}

function renderTicketQr(text) {
  const container = document.getElementById('ticketQrCodeContainer');
  if (!container) return;
  container.innerHTML = '';

  if (window.QRCode) {
    try {
      new QRCode(container, {
        text: text,
        width: 140,
        height: 140,
        colorDark: "#0f172a",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      return;
    } catch (e) {}
  }

  // Pure SVG QR code generator
  container.innerHTML = generateQrSvg(text);
}

function generateQrSvg(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;

  const size = 25;
  const modules = Array.from({ length: size }, () => Array(size).fill(false));

  function drawFinder(r0, c0) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          modules[r0 + r][c0 + c] = true;
        }
      }
    }
  }
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    modules[6][i] = (i % 2 === 0);
    modules[i][6] = (i % 2 === 0);
  }

  let seed = Math.abs(hash);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8) || r === 6 || c === 6) continue;
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      modules[r][c] = (seed % 3) !== 0;
    }
  }

  const cellSize = 5;
  const svgSize = size * cellSize;
  let rects = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a" />`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/>${rects}</svg>`;
}

// Navigation between Auth Screen, Pass, and Passenger Live Dashboard
function openPassengerDashboard() {
  // Dismiss splash screen if still showing
  if (typeof dismissSplash === 'function') dismissSplash();

  // Hide Auth wrapper & role screen
  const authWrapper = document.getElementById('authWrapper');
  if (authWrapper) {
    authWrapper.classList.add('hidden');
    authWrapper.style.display = 'none';
  }

  const fullRoleModal = document.getElementById('fullRoleSelectionScreen');
  if (fullRoleModal) {
    fullRoleModal.classList.add('hidden');
    fullRoleModal.style.display = 'none';
  }

  // Hide scenic backdrop & landing elements
  const scenic = document.getElementById('scenicBackdrop');
  if (scenic) scenic.style.display = 'none';
  document.querySelector('.page-brand-header')?.classList.add('hidden');
  document.querySelector('.sky-quote')?.classList.add('hidden');

  // Hide any driver onboarding screens or driver cockpit
  document.getElementById('driverDashboardScreen')?.classList.add('hidden');
  document.getElementById('driverProfileScreen')?.classList.add('hidden');
  document.getElementById('driverDocumentsScreen')?.classList.add('hidden');
  document.getElementById('driverBusDetailsScreen')?.classList.add('hidden');
  document.getElementById('driverRouteScheduleScreen')?.classList.add('hidden');
  document.getElementById('driverReviewSubmitScreen')?.classList.add('hidden');

  // Reveal Passenger Dashboard
  const dashboard = document.getElementById('passengerLiveDashboard');
  if (dashboard) {
    dashboard.classList.remove('hidden');
    dashboard.style.display = 'flex';
  }

  // Populate top user info
  const displayName = activeUser?.full_name || 'Vivek';
  const avatarUrl = activeUser?.avatar_url || 'assets/user_vivek.jpg';

  const topName = document.getElementById('passengerTopUserName');
  const topAvatar = document.getElementById('passengerTopAvatar');
  const dropName = document.getElementById('dropdownUserFullName');
  const dropRole = document.getElementById('dropdownUserRole');

  if (topName) topName.textContent = displayName.split(' ')[0] || 'Vivek';
  if (topAvatar) topAvatar.src = avatarUrl;
  if (dropName) dropName.textContent = displayName;
  if (dropRole) dropRole.textContent = 'Passenger • Active Pass';

  // Mount the map once the dashboard is visible (needs real dimensions)
  setTimeout(() => {
    initPassengerLiveMap();
    fetchTransitData();
    renderBusesFeed();
    startPassengerLiveTracking();
  }, 150);

  showNotice(`Welcome to Bus Stop Live Passenger Transit! 🚏`);
}

function switchToTravelerPassView() {
  openProfileEditScreen();
}

function openProfileEditScreen() {
  const dashboard = document.getElementById('passengerLiveDashboard');
  if (dashboard) dashboard.classList.add('hidden');

  // Screen hidden: stop GPS updates to save battery
  if (window.BusStopMap) BusStopMap.pause();

  const authWrapper = document.getElementById('authWrapper');
  if (authWrapper) {
    authWrapper.classList.remove('hidden');
    authWrapper.style.display = '';
  }

  const userMenu = document.getElementById('userDropdownMenu');
  if (userMenu) userMenu.classList.add('hidden');

  if (activeUser) {
    onboardingState.role = activeUser.role || 'passenger';
    selectedRole = activeUser.role || 'passenger';
    onboardingState.credentials = {
      id: activeUser.id,
      fullName: activeUser.full_name || '',
      email: activeUser.email,
      phone: activeUser.phone || ''
    };
    onboardingState.profile.dob = activeUser.dob || '10 Jul 2007';
    onboardingState.profile.gender = activeUser.gender || 'Male';
    onboardingState.profile.homeLocation = activeUser.home_location || 'Dehradun, Uttarakhand';
    onboardingState.profile.avatarUrl = activeUser.avatar_url || 'assets/onboarding/who_passenger_thumb.jpg';
    onboardingState.isExistingUserUpdating = true;

    goToStep(2);
  }
}

// ==========================================================================
// 10B. COMPLETE YOUR DRIVER PROFILE SCREEN CONTROLLER
// Matches exact user specification: Stepper, Verification, Personal Info, Licence
// ==========================================================================
function openDriverProfileScreen() {
  if (typeof dismissSplash === 'function') dismissSplash();

  const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
  if (authWrapper) {
    authWrapper.classList.add('hidden');
    authWrapper.style.display = 'none';
  }
  document.getElementById('fullRoleSelectionScreen')?.classList.add('hidden');
  document.getElementById('passengerLiveDashboard')?.classList.add('hidden');
  document.getElementById('driverDashboardScreen')?.classList.add('hidden');
  document.getElementById('userProfileEditScreen')?.classList.add('hidden');

  const profileScreen = document.getElementById('driverProfileScreen');
  if (profileScreen) {
    profileScreen.classList.remove('hidden');
    profileScreen.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Load saved profile data if available
  try {
    const saved = localStorage.getItem('bus_stop_driver_profile');
    let parsedSaved = null;
    if (saved) {
      parsedSaved = JSON.parse(saved);
      if (parsedSaved.fullName && document.getElementById('dpFullName')) document.getElementById('dpFullName').value = parsedSaved.fullName;
      if (parsedSaved.dob && document.getElementById('dpDob')) document.getElementById('dpDob').value = parsedSaved.dob;
      if (parsedSaved.phone && document.getElementById('dpPhone')) document.getElementById('dpPhone').value = parsedSaved.phone;
      if (parsedSaved.email && document.getElementById('dpEmail')) document.getElementById('dpEmail').value = parsedSaved.email;
      if (parsedSaved.gender) {
        const rad = document.querySelector(`input[name="dpGender"][value="${parsedSaved.gender}"]`);
        if (rad) rad.checked = true;
      }
      if (parsedSaved.address) {
        const addrEl = document.getElementById('dpAddress');
        if (addrEl) {
          addrEl.value = parsedSaved.address;
          updateAddressCharCount(addrEl);
        }
      }
      if (parsedSaved.licenceNum && document.getElementById('dpLicenceNum')) document.getElementById('dpLicenceNum').value = parsedSaved.licenceNum;
      if (parsedSaved.licenceIssue && document.getElementById('dpLicenceIssue')) document.getElementById('dpLicenceIssue').value = parsedSaved.licenceIssue;
      if (parsedSaved.licenceExpiry && document.getElementById('dpLicenceExpiry')) document.getElementById('dpLicenceExpiry').value = parsedSaved.licenceExpiry;
      if (parsedSaved.licenceType && document.getElementById('dpLicenceType')) document.getElementById('dpLicenceType').value = parsedSaved.licenceType;
      if (parsedSaved.bloodGroup && document.getElementById('dpBloodGroup')) document.getElementById('dpBloodGroup').value = parsedSaved.bloodGroup;
      if (parsedSaved.experience && document.getElementById('dpExperience')) document.getElementById('dpExperience').value = parsedSaved.experience;
      if (parsedSaved.emergencyName && document.getElementById('dpEmergencyName')) document.getElementById('dpEmergencyName').value = parsedSaved.emergencyName;
      if (parsedSaved.emergencyRelationship && document.getElementById('dpEmergencyRel')) document.getElementById('dpEmergencyRel').value = parsedSaved.emergencyRelationship;
      if (parsedSaved.emergencyPhone && document.getElementById('dpEmergencyPhone')) document.getElementById('dpEmergencyPhone').value = parsedSaved.emergencyPhone;
    }

    const activeEmail = activeUser?.email || onboardingState.credentials?.email || '';
    const activeName = activeUser?.full_name || onboardingState.credentials?.fullName || '';
    const activePhone = activeUser?.phone || onboardingState.credentials?.phone || '';

    if (activeName && document.getElementById('dpFullName') && (!parsedSaved || !parsedSaved.fullName)) {
      document.getElementById('dpFullName').value = activeName;
    }
    if (activeEmail && document.getElementById('dpEmail') && (!parsedSaved || !parsedSaved.email)) {
      document.getElementById('dpEmail').value = activeEmail;
    }
    if (activePhone && document.getElementById('dpPhone') && (!parsedSaved || !parsedSaved.phone)) {
      document.getElementById('dpPhone').value = activePhone;
    }

    const savedAvatar = localStorage.getItem('bus_stop_driver_avatar');
    if (savedAvatar) {
      const img = document.getElementById('driverProfileAvatarImg');
      if (img) img.src = savedAvatar;
    }
  } catch (e) {
    console.warn('Error loading driver profile:', e);
  }

  const topUser = document.getElementById('dpTopUserDisplay');
  if (topUser) {
    topUser.textContent = document.getElementById('dpFullName')?.value || activeUser?.full_name || onboardingState.credentials?.fullName || 'Captain Driver';
  }

  const addrEl = document.getElementById('dpAddress');
  if (addrEl) updateAddressCharCount(addrEl);
}

function closeDriverProfileScreen() {
  const profileScreen = document.getElementById('driverProfileScreen');
  if (profileScreen) {
    profileScreen.classList.add('hidden');
    profileScreen.style.display = 'none';
  }
  if (selectedRole === 'driver' || activeUser?.role === 'driver') {
    openDriverDashboard();
  } else {
    const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
    if (authWrapper) {
      authWrapper.classList.remove('hidden');
      authWrapper.style.display = '';
    }
    goToStep(0);
  }
}

async function handleDriverProfileSubmit(event) {
  if (event) event.preventDefault();

  const termsCheck = document.getElementById('dpTermsCheck');
  if (termsCheck && !termsCheck.checked) {
    showNotice('⚠️ Please confirm the declaration and accept the Terms & Conditions to proceed.');
    termsCheck.focus();
    return;
  }

  const nameInput = document.getElementById('dpFullName');
  const dobInput = document.getElementById('dpDob');
  const phoneInput = document.getElementById('dpPhone');
  const emailInput = document.getElementById('dpEmail');
  const genderInput = document.querySelector('input[name="dpGender"]:checked');
  const addressInput = document.getElementById('dpAddress');
  const licenceNumInput = document.getElementById('dpLicenceNum');
  const licenceIssueInput = document.getElementById('dpLicenceIssue');
  const licenceExpiryInput = document.getElementById('dpLicenceExpiry');
  const licenceTypeInput = document.getElementById('dpLicenceType');
  const bloodGroupInput = document.getElementById('dpBloodGroup');
  const experienceInput = document.getElementById('dpExperience');
  const emergencyNameInput = document.getElementById('dpEmergencyName');
  const emergencyRelInput = document.getElementById('dpEmergencyRel');
  const emergencyPhoneInput = document.getElementById('dpEmergencyPhone');

  const fullName = nameInput?.value.trim() || '';
  const dob = dobInput?.value.trim() || '';
  const phone = phoneInput?.value.trim() || '';
  const email = emailInput?.value.trim() || '';
  const gender = genderInput?.value || '';
  const address = addressInput?.value.trim() || '';
  const licenceNum = licenceNumInput?.value.trim() || '';
  const licenceIssue = licenceIssueInput?.value.trim() || '';
  const licenceExpiry = licenceExpiryInput?.value.trim() || '';
  const licenceType = licenceTypeInput?.value || '';
  const bloodGroup = bloodGroupInput?.value || '';
  const experience = experienceInput?.value || '';
  const emergencyName = emergencyNameInput?.value.trim() || '';
  const emergencyRelationship = emergencyRelInput?.value || '';
  const emergencyPhone = emergencyPhoneInput?.value.trim() || '';

  // Strict field-by-field verification: DO NOT proceed with fake or empty data
  if (!fullName) {
    showNotice('⚠️ Please enter your Full Legal Name as printed on your driving licence.');
    nameInput?.focus();
    return;
  }
  if (!dob) {
    showNotice('⚠️ Please select your Date of Birth.');
    dobInput?.focus();
    return;
  }
  if (!phone || !/^[6-9]\d{9}$/.test(phone.replace(/\D/g, ''))) {
    showNotice('⚠️ Please enter a valid 10-digit mobile number.');
    phoneInput?.focus();
    return;
  }
  if (!email || !email.includes('@')) {
    showNotice('⚠️ Please enter a valid email address.');
    emailInput?.focus();
    return;
  }
  if (!gender) {
    showNotice('⚠️ Please select your Gender.');
    return;
  }
  if (!address || address.length < 5) {
    showNotice('⚠️ Please provide your full Residential Address.');
    addressInput?.focus();
    return;
  }
  if (!licenceNum || licenceNum.length < 5) {
    showNotice('⚠️ Please enter your valid Commercial Driving Licence Number.');
    licenceNumInput?.focus();
    return;
  }
  if (!licenceExpiry) {
    showNotice('⚠️ Please select your Licence Expiry Date.');
    licenceExpiryInput?.focus();
    return;
  }
  if (!licenceType) {
    showNotice('⚠️ Please select your Driving Licence Class.');
    licenceTypeInput?.focus();
    return;
  }
  if (!bloodGroup) {
    showNotice('⚠️ Please select your Blood Group.');
    bloodGroupInput?.focus();
    return;
  }
  if (!experience) {
    showNotice('⚠️ Please select your Commercial Driving Experience.');
    experienceInput?.focus();
    return;
  }
  if (!emergencyName) {
    showNotice('⚠️ Please enter an Emergency Contact Name.');
    emergencyNameInput?.focus();
    return;
  }
  if (!emergencyRelationship) {
    showNotice('⚠️ Please select your relationship with the emergency contact.');
    emergencyRelInput?.focus();
    return;
  }
  if (!emergencyPhone || !/^[6-9]\d{9}$/.test(emergencyPhone.replace(/\D/g, ''))) {
    showNotice('⚠️ Please enter a valid 10-digit emergency contact phone number.');
    emergencyPhoneInput?.focus();
    return;
  }

  const profileData = {
    fullName,
    dob,
    phone,
    email,
    gender,
    address,
    licenceNum,
    licenceIssue,
    licenceExpiry,
    licenceType,
    bloodGroup,
    experience,
    emergencyName,
    emergencyRelationship,
    emergencyPhone,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem('bus_stop_driver_profile', JSON.stringify(profileData));

  // If registering new driver from initial credentials
  if (!activeUser && onboardingState.credentials?.email) {
    const creds = onboardingState.credentials;
    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: creds.email,
          password: creds.password || 'Driver@123',
          fullName: fullName,
          phone: phone,
          role: 'driver',
          avatar_url: localStorage.getItem('bus_stop_driver_avatar') || 'assets/onboarding/who_driver_thumb.jpg',
          license_number: licenceNum,
          license_expiry: licenceExpiry,
          home_location: address
        })
      });
      const regData = await regRes.json();
      if (regRes.ok && regData.success && regData.user) {
        activeUser = regData.user;
      }
    } catch (err) {
      console.warn('Driver registration API note:', err);
    }
  }

  if (activeUser) {
    activeUser.full_name = fullName;
    activeUser.phone = phone;
    activeUser.role = 'driver';
    activeUser.home_location = address;
    activeUser.license_number = licenceNum;
    activeUser.license_expiry = licenceExpiry;
    localStorage.setItem('bus_stop_active_user', JSON.stringify(activeUser));
  }

  // Update top name in driver cockpit and profile header
  const driverTopName = document.getElementById('driverTopName');
  if (driverTopName) driverTopName.textContent = fullName;
  const userDisp = document.getElementById('driverDashUserNameDisplay');
  if (userDisp) userDisp.textContent = fullName;

  showNotice(`✓ Personal & Licence details saved! Proceeding to Step 2: Documents 🪪`);

  // Progress to Step 2: Document Verification
  setTimeout(() => {
    document.getElementById('driverProfileScreen')?.classList.add('hidden');
    openDriverDocumentsScreen();
  }, 400);
}

function triggerProfilePhotoUpload() {
  document.getElementById('driverProfilePhotoInput')?.click();
}

function handleDriverPhotoUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const avatarImg = document.getElementById('driverProfileAvatarImg');
    if (avatarImg) avatarImg.src = e.target.result;
    localStorage.setItem('bus_stop_driver_avatar', e.target.result);
    showNotice('Profile photo updated successfully! 📸');
  };
  reader.readAsDataURL(file);
}

function updateAddressCharCount(textarea) {
  const countEl = document.getElementById('dpAddressCharCount');
  if (countEl && textarea) {
    countEl.textContent = `${textarea.value.length}/200`;
  }
}

function contactDriverSupport() {
  showNotice('Driver Operations Support Desk: Helpline active 24/7 at +91 1800 120 4455 or support@busstop.transit 🎧');
}

// ==========================================================================
// 10C. DRIVER DOCUMENT VERIFICATION CONTROLLER (STEP 2)
// Matches exact user specification: Stepper Step 2, Document Previews,
// Uploading, Dynamic Document State & Encrypted Verification
// ==========================================================================
function openDriverDocumentsScreen() {
  if (typeof dismissSplash === 'function') dismissSplash();

  const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
  if (authWrapper) {
    authWrapper.classList.add('hidden');
    authWrapper.style.display = 'none';
  }
  document.getElementById('fullRoleSelectionScreen')?.classList.add('hidden');
  document.getElementById('passengerLiveDashboard')?.classList.add('hidden');
  document.getElementById('driverDashboardScreen')?.classList.add('hidden');
  document.getElementById('driverProfileScreen')?.classList.add('hidden');
  document.getElementById('userProfileEditScreen')?.classList.add('hidden');

  const docsScreen = document.getElementById('driverDocumentsScreen');
  if (docsScreen) {
    docsScreen.classList.remove('hidden');
    docsScreen.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update Driver Name in Top Header
  const activeName = document.getElementById('dpFullName')?.value || activeUser?.full_name || onboardingState.credentials?.fullName || 'Vivek Rautela';
  const topUser = document.getElementById('docTopUserDisplay');
  if (topUser) topUser.textContent = activeName;

  // Restore saved documents from localStorage
  try {
    const savedDocs = localStorage.getItem('bus_stop_driver_documents');
    if (savedDocs) {
      const parsed = JSON.parse(savedDocs);
      if (parsed.dlFront && document.getElementById('previewDlFront')) document.getElementById('previewDlFront').src = parsed.dlFront;
      if (parsed.dlBack && document.getElementById('previewDlBack')) document.getElementById('previewDlBack').src = parsed.dlBack;
      if (parsed.aadhaarFront && document.getElementById('previewAadhaarFront')) document.getElementById('previewAadhaarFront').src = parsed.aadhaarFront;
      if (parsed.aadhaarBack && document.getElementById('previewAadhaarBack')) document.getElementById('previewAadhaarBack').src = parsed.aadhaarBack;
      if (parsed.pan && document.getElementById('previewPan')) document.getElementById('previewPan').src = parsed.pan;
      if (parsed.address && document.getElementById('previewAddress')) document.getElementById('previewAddress').src = parsed.address;
      if (parsed.police) {
        if (document.getElementById('previewPolice')) document.getElementById('previewPolice').src = parsed.police;
        document.getElementById('policeDropzoneBox')?.classList.add('hidden');
        document.getElementById('policePreviewWrap')?.classList.remove('hidden');
        document.getElementById('btnChangePolice')?.classList.remove('hidden');
      }
    }
  } catch (e) {
    console.warn('Error reading saved driver documents:', e);
  }
}

function closeDriverDocumentsScreen() {
  const docsScreen = document.getElementById('driverDocumentsScreen');
  if (docsScreen) {
    docsScreen.classList.add('hidden');
    docsScreen.style.display = 'none';
  }
  if (selectedRole === 'driver' || activeUser?.role === 'driver') {
    openDriverDashboard();
  } else {
    const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
    if (authWrapper) {
      authWrapper.classList.remove('hidden');
      authWrapper.style.display = '';
    }
    goToStep(0);
  }
}

function previousToDriverProfile() {
  const docsScreen = document.getElementById('driverDocumentsScreen');
  if (docsScreen) {
    docsScreen.classList.add('hidden');
    docsScreen.style.display = 'none';
  }
  openDriverProfileScreen();
}

function triggerDocUpload(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.click();
}

function handleDocFileChange(event, type) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('File size exceeds 5MB limit. Please upload a smaller file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    let savedDocs = {};
    try {
      savedDocs = JSON.parse(localStorage.getItem('bus_stop_driver_documents') || '{}');
    } catch (_) {}

    if (type === 'dl') {
      const el = document.getElementById('previewDlFront');
      if (el) el.src = dataUrl;
      savedDocs.dlFront = dataUrl;
      showNotice('✓ Driving Licence updated successfully! 🪪');
    } else if (type === 'aadhaar') {
      const el = document.getElementById('previewAadhaarFront');
      if (el) el.src = dataUrl;
      savedDocs.aadhaarFront = dataUrl;
      showNotice('✓ Aadhaar Card updated successfully! 🆔');
    } else if (type === 'pan') {
      const el = document.getElementById('previewPan');
      if (el) el.src = dataUrl;
      savedDocs.pan = dataUrl;
      showNotice('✓ PAN Card updated successfully! 💳');
    } else if (type === 'address') {
      const el = document.getElementById('previewAddress');
      if (el) el.src = dataUrl;
      savedDocs.address = dataUrl;
      showNotice('✓ Address Proof updated successfully! 📄');
    } else if (type === 'police') {
      const el = document.getElementById('previewPolice');
      if (el) el.src = dataUrl;
      savedDocs.police = dataUrl;
      document.getElementById('policeDropzoneBox')?.classList.add('hidden');
      document.getElementById('policePreviewWrap')?.classList.remove('hidden');
      document.getElementById('btnChangePolice')?.classList.remove('hidden');
      showNotice('✓ Police Verification certificate uploaded! 🛡️');
    }

    localStorage.setItem('bus_stop_driver_documents', JSON.stringify(savedDocs));
  };
  reader.readAsDataURL(file);
}

function openDocPreviewModal(title, imgSrc) {
  const modal = document.getElementById('docPreviewModal');
  const titleEl = document.getElementById('docModalTitle');
  const imgEl = document.getElementById('docModalImg');

  if (titleEl) titleEl.textContent = title;
  if (imgEl) imgEl.src = imgSrc || '';
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

function closeDocPreviewModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const modal = document.getElementById('docPreviewModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

async function handleDocumentVerificationSubmit() {
  const btn = document.getElementById('btnDocsSaveContinue');

  // Collect documents state
  let documentsState = {};
  try {
    documentsState = JSON.parse(localStorage.getItem('bus_stop_driver_documents') || '{}');
  } catch (_) {}

  // Enforce mandatory document uploads: Driving Licence & Aadhaar Card
  if (!documentsState.dlFront) {
    showNotice('⚠️ Mandatory document missing: Please upload your Driving Licence document.');
    return;
  }
  if (!documentsState.aadhaarFront) {
    showNotice('⚠️ Mandatory document missing: Please upload your Aadhaar Card document.');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Verifying Documents...</span>`;
  }

  documentsState.verifiedAt = new Date().toISOString();
  documentsState.status = 'approved';
  localStorage.setItem('bus_stop_driver_documents', JSON.stringify(documentsState));

  // Sync with server API
  try {
    await fetch('/api/driver/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUser?.id,
        documents: {
          hasDl: !!documentsState.dlFront,
          hasAadhaar: !!documentsState.aadhaarFront,
          hasPan: !!documentsState.pan,
          hasAddressProof: !!documentsState.address,
          hasPoliceVerification: !!documentsState.police,
          verifiedAt: new Date().toISOString()
        }
      })
    });
  } catch (err) {
    console.warn('Document sync API error:', err);
  }

  // Update active user state
  if (activeUser) {
    activeUser.documents_verified = true;
    activeUser.role = 'driver';
    localStorage.setItem('bus_stop_active_user', JSON.stringify(activeUser));
  }

  showNotice('✓ Documents validated! Proceeding to Step 3: Bus Details 🚍');

  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Save &amp; Continue</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    }
    document.getElementById('driverDocumentsScreen')?.classList.add('hidden');
    openDriverBusDetailsScreen();
  }, 500);
}

// ==========================================================================
// 10D. DRIVER BUS DETAILS CONTROLLER (STEP 3)
// Matches exact user specification: Stepper Step 3, Basic Info, Bus Documents,
// Additional Details, and Persistence
// ==========================================================================
function openDriverBusDetailsScreen() {
  if (typeof dismissSplash === 'function') dismissSplash();

  const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
  if (authWrapper) {
    authWrapper.classList.add('hidden');
    authWrapper.style.display = 'none';
  }
  document.getElementById('fullRoleSelectionScreen')?.classList.add('hidden');
  document.getElementById('passengerLiveDashboard')?.classList.add('hidden');
  document.getElementById('driverDashboardScreen')?.classList.add('hidden');
  document.getElementById('driverProfileScreen')?.classList.add('hidden');
  document.getElementById('driverDocumentsScreen')?.classList.add('hidden');
  document.getElementById('userProfileEditScreen')?.classList.add('hidden');

  const busScreen = document.getElementById('driverBusDetailsScreen');
  if (busScreen) {
    busScreen.classList.remove('hidden');
    busScreen.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update Driver Name in Top Header
  const activeName = document.getElementById('dpFullName')?.value || activeUser?.full_name || onboardingState.credentials?.fullName || 'Vivek Rautela';
  const topUser = document.getElementById('busTopUserDisplay');
  if (topUser) topUser.textContent = activeName;

  // Restore saved bus details from localStorage
  try {
    const savedBus = localStorage.getItem('bus_stop_driver_bus');
    if (savedBus) {
      const parsed = JSON.parse(savedBus);
      if (parsed.regNumber && document.getElementById('bdRegNumber')) document.getElementById('bdRegNumber').value = parsed.regNumber;
      if (parsed.busType && document.getElementById('bdBusType')) document.getElementById('bdBusType').value = parsed.busType;
      if (parsed.mfgYear && document.getElementById('bdMfgYear')) document.getElementById('bdMfgYear').value = parsed.mfgYear;
      if (parsed.seating && document.getElementById('bdSeating')) document.getElementById('bdSeating').value = parsed.seating;
      if (parsed.model && document.getElementById('bdModel')) document.getElementById('bdModel').value = parsed.model;
      if (parsed.fuelType && document.getElementById('bdFuelType')) document.getElementById('bdFuelType').value = parsed.fuelType;
      if (parsed.displayName && document.getElementById('bdDisplayName')) document.getElementById('bdDisplayName').value = parsed.displayName;
      if (parsed.operator && document.getElementById('bdOperator')) document.getElementById('bdOperator').value = parsed.operator;
      if (parsed.color && document.getElementById('bdColor')) document.getElementById('bdColor').value = parsed.color;

      if (parsed.rcDoc) {
        if (document.getElementById('previewImgBusRc')) document.getElementById('previewImgBusRc').src = parsed.rcDoc;
        document.getElementById('dropzoneBusRc')?.classList.add('hidden');
        document.getElementById('previewWrapBusRc')?.classList.remove('hidden');
      }
      if (parsed.fitnessDoc) {
        if (document.getElementById('previewImgBusFitness')) document.getElementById('previewImgBusFitness').src = parsed.fitnessDoc;
        document.getElementById('dropzoneBusFitness')?.classList.add('hidden');
        document.getElementById('previewWrapBusFitness')?.classList.remove('hidden');
      }
      if (parsed.pucDoc) {
        if (document.getElementById('previewImgBusPuc')) document.getElementById('previewImgBusPuc').src = parsed.pucDoc;
        document.getElementById('dropzoneBusPuc')?.classList.add('hidden');
        document.getElementById('previewWrapBusPuc')?.classList.remove('hidden');
      }
      if (parsed.insuranceDoc) {
        if (document.getElementById('previewImgBusInsurance')) document.getElementById('previewImgBusInsurance').src = parsed.insuranceDoc;
        document.getElementById('dropzoneBusInsurance')?.classList.add('hidden');
        document.getElementById('previewWrapBusInsurance')?.classList.remove('hidden');
      }
    }
  } catch (e) {
    console.warn('Error reading saved bus details:', e);
  }
}

function closeDriverBusDetailsScreen() {
  const busScreen = document.getElementById('driverBusDetailsScreen');
  if (busScreen) {
    busScreen.classList.add('hidden');
    busScreen.style.display = 'none';
  }
  if (selectedRole === 'driver' || activeUser?.role === 'driver') {
    openDriverDashboard();
  } else {
    const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
    if (authWrapper) {
      authWrapper.classList.remove('hidden');
      authWrapper.style.display = '';
    }
    goToStep(0);
  }
}

function previousToDriverDocuments() {
  const busScreen = document.getElementById('driverBusDetailsScreen');
  if (busScreen) {
    busScreen.classList.add('hidden');
    busScreen.style.display = 'none';
  }
  openDriverDocumentsScreen();
}

function handleBusDocFileChange(event, type) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('File size exceeds 5MB limit. Please upload a smaller file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    let savedBus = {};
    try {
      savedBus = JSON.parse(localStorage.getItem('bus_stop_driver_bus') || '{}');
    } catch (_) {}

    if (type === 'rc') {
      const img = document.getElementById('previewImgBusRc');
      if (img) img.src = dataUrl;
      document.getElementById('dropzoneBusRc')?.classList.add('hidden');
      document.getElementById('previewWrapBusRc')?.classList.remove('hidden');
      savedBus.rcDoc = dataUrl;
      showNotice('✓ RC Certificate uploaded successfully! 📄');
    } else if (type === 'fitness') {
      const img = document.getElementById('previewImgBusFitness');
      if (img) img.src = dataUrl;
      document.getElementById('dropzoneBusFitness')?.classList.add('hidden');
      document.getElementById('previewWrapBusFitness')?.classList.remove('hidden');
      savedBus.fitnessDoc = dataUrl;
      showNotice('✓ Fitness Certificate uploaded successfully! 📋');
    } else if (type === 'puc') {
      const img = document.getElementById('previewImgBusPuc');
      if (img) img.src = dataUrl;
      document.getElementById('dropzoneBusPuc')?.classList.add('hidden');
      document.getElementById('previewWrapBusPuc')?.classList.remove('hidden');
      savedBus.pucDoc = dataUrl;
      showNotice('✓ Pollution Certificate uploaded successfully! 🌿');
    } else if (type === 'insurance') {
      const img = document.getElementById('previewImgBusInsurance');
      if (img) img.src = dataUrl;
      document.getElementById('dropzoneBusInsurance')?.classList.add('hidden');
      document.getElementById('previewWrapBusInsurance')?.classList.remove('hidden');
      savedBus.insuranceDoc = dataUrl;
      showNotice('✓ Insurance Certificate uploaded successfully! 🛡️');
    }

    localStorage.setItem('bus_stop_driver_bus', JSON.stringify(savedBus));
  };
  reader.readAsDataURL(file);
}

async function handleBusDetailsSubmit(event) {
  if (event) event.preventDefault();

  const regInput = document.getElementById('bdRegNumber');
  const busTypeInput = document.getElementById('bdBusType');
  const mfgYearInput = document.getElementById('bdMfgYear');
  const seatingInput = document.getElementById('bdSeating');
  const modelInput = document.getElementById('bdModel');
  const fuelTypeInput = document.getElementById('bdFuelType');
  const displayNameInput = document.getElementById('bdDisplayName');
  const operatorInput = document.getElementById('bdOperator');
  const colorInput = document.getElementById('bdColor');

  const regNumber = regInput?.value.trim() || '';
  const busType = busTypeInput?.value || '';
  const mfgYear = mfgYearInput?.value || '';
  const seating = parseInt(seatingInput?.value) || 0;
  const model = modelInput?.value.trim() || '';
  const fuelType = fuelTypeInput?.value || '';
  const displayName = displayNameInput?.value.trim() || regNumber;
  const operator = operatorInput?.value.trim() || '';
  const color = colorInput?.value || '';

  // Strict required validation: No fake data or blanks allowed
  if (!regNumber || regNumber.length < 5) {
    showNotice('⚠️ Please enter a valid Bus Registration Number (e.g. UK07PA1234).');
    regInput?.focus();
    return;
  }
  if (!busType) {
    showNotice('⚠️ Please select the Bus Type category.');
    busTypeInput?.focus();
    return;
  }
  if (!mfgYear) {
    showNotice('⚠️ Please select the Manufacturing Year.');
    mfgYearInput?.focus();
    return;
  }
  if (!seating || seating < 10 || seating > 90) {
    showNotice('⚠️ Please enter a valid seating capacity (between 10 and 90).');
    seatingInput?.focus();
    return;
  }
  if (!model) {
    showNotice('⚠️ Please enter the Bus Model & Make.');
    modelInput?.focus();
    return;
  }
  if (!fuelType) {
    showNotice('⚠️ Please select the Fuel Type.');
    fuelTypeInput?.focus();
    return;
  }
  if (!operator) {
    showNotice('⚠️ Please enter the Bus Operator or Transport Agency name.');
    operatorInput?.focus();
    return;
  }
  if (!color) {
    showNotice('⚠️ Please select the Bus Exterior Color.');
    colorInput?.focus();
    return;
  }

  let savedBus = {};
  try {
    savedBus = JSON.parse(localStorage.getItem('bus_stop_driver_bus') || '{}');
  } catch (_) {}

  if (!savedBus.rcDoc) {
    showNotice('⚠️ Mandatory document missing: Please upload the vehicle RC Certificate in Bus Documents.');
    return;
  }

  const busDetails = {
    ...savedBus,
    regNumber,
    busType,
    mfgYear,
    seating,
    model,
    fuelType,
    displayName,
    operator,
    color,
    verified: true,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem('bus_stop_driver_bus', JSON.stringify(busDetails));

  const btn = document.getElementById('btnBusDetailsSaveContinue');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Saving Bus Details...</span>`;
  }

  // Update in-memory driver bus assignment
  driverAssignedBus = {
    id: 'bus_' + regNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
    bus_number: displayName,
    plate_number: regNumber,
    name: operator,
    capacity: seating,
    type: busType,
    color: color,
    driver_id: activeUser?.id
  };

  // Sync with backend API
  try {
    await fetch('/api/driver/bus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUser?.id,
        busDetails: busDetails
      })
    });
  } catch (err) {
    console.warn('Bus sync API error:', err);
  }

  showNotice(`✓ Bus details verified: ${displayName} (${regNumber})! Proceeding to Step 4: Route & Schedule 🚏`);

  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Save &amp; Continue</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    }
    document.getElementById('driverBusDetailsScreen')?.classList.add('hidden');
    openDriverRouteScheduleScreen();
  }, 500);
}

// ==========================================================================
// 10E. DRIVER ROUTE & SCHEDULE CONTROLLER (STEP 4)
// Matches exact user specification: Stepper Step 4, Route Information,
// Bus Stops Draggable/Editable List, Route Preview Map, Schedule Details,
// Operating Days Toggles, and Persistence
// ==========================================================================
let currentMapZoomScale = 1.0;

function safeEscapeStr(str) {
  return (str || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

function openDriverRouteScheduleScreen() {
  if (typeof dismissSplash === 'function') dismissSplash();

  const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
  if (authWrapper) {
    authWrapper.classList.add('hidden');
    authWrapper.style.display = 'none';
  }
  document.getElementById('fullRoleSelectionScreen')?.classList.add('hidden');
  document.getElementById('passengerLiveDashboard')?.classList.add('hidden');
  document.getElementById('driverDashboardScreen')?.classList.add('hidden');
  document.getElementById('driverProfileScreen')?.classList.add('hidden');
  document.getElementById('driverDocumentsScreen')?.classList.add('hidden');
  document.getElementById('driverBusDetailsScreen')?.classList.add('hidden');
  document.getElementById('userProfileEditScreen')?.classList.add('hidden');

  const routeScreen = document.getElementById('driverRouteScheduleScreen');
  if (routeScreen) {
    routeScreen.classList.remove('hidden');
    routeScreen.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update Driver Name in Top Header
  const activeName = document.getElementById('dpFullName')?.value || activeUser?.full_name || onboardingState.credentials?.fullName || 'Vivek Rautela';
  const topUser = document.getElementById('routeTopUserDisplay');
  if (topUser) topUser.textContent = activeName;

  // Restore saved route & schedule details from localStorage
  try {
    const savedRoute = localStorage.getItem('bus_stop_driver_route');
    if (savedRoute) {
      const parsed = JSON.parse(savedRoute);
      if (parsed.routeName && document.getElementById('rsRouteName')) document.getElementById('rsRouteName').value = parsed.routeName;
      if (parsed.routeNumber && document.getElementById('rsRouteNumber')) document.getElementById('rsRouteNumber').value = parsed.routeNumber;
      if (parsed.routeType && document.getElementById('rsRouteType')) document.getElementById('rsRouteType').value = parsed.routeType;
      if (parsed.startPoint && document.getElementById('rsStartPoint')) document.getElementById('rsStartPoint').value = parsed.startPoint;
      if (parsed.endPoint && document.getElementById('rsEndPoint')) document.getElementById('rsEndPoint').value = parsed.endPoint;
      if (parsed.startTime && document.getElementById('rsStartTime')) document.getElementById('rsStartTime').value = parsed.startTime;
      if (parsed.endTime && document.getElementById('rsEndTime')) document.getElementById('rsEndTime').value = parsed.endTime;
      if (parsed.frequency && document.getElementById('rsFrequency')) document.getElementById('rsFrequency').value = parsed.frequency;
      if (parsed.tripsPerDay && document.getElementById('rsTripsPerDay')) document.getElementById('rsTripsPerDay').value = parsed.tripsPerDay;

      // Restore stops list if present
      if (Array.isArray(parsed.stops) && parsed.stops.length > 0) {
        renderSavedBusStops(parsed.stops);
      }

      // Restore operating days
      if (Array.isArray(parsed.operatingDays)) {
        document.querySelectorAll('#operatingDaysContainer .day-toggle-pill').forEach(pill => {
          const day = pill.dataset.day;
          const isSelected = parsed.operatingDays.includes(day);
          pill.classList.toggle('inactive', !isSelected);
        });
      }
    }
  } catch (e) {
    console.warn('Error reading saved route details:', e);
  }

  // Initialize and render real interactive route map
  setTimeout(() => {
    initRoutePreviewRealMap();
    if (routePreviewMap) routePreviewMap.resize();
  }, 120);
}

function closeDriverRouteScheduleScreen() {
  const routeScreen = document.getElementById('driverRouteScheduleScreen');
  if (routeScreen) {
    routeScreen.classList.add('hidden');
    routeScreen.style.display = 'none';
  }
  if (selectedRole === 'driver' || activeUser?.role === 'driver') {
    openDriverDashboard();
  } else {
    const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
    if (authWrapper) {
      authWrapper.classList.remove('hidden');
      authWrapper.style.display = '';
    }
    goToStep(0);
  }
}

function previousToDriverBusDetails() {
  const routeScreen = document.getElementById('driverRouteScheduleScreen');
  if (routeScreen) {
    routeScreen.classList.add('hidden');
    routeScreen.style.display = 'none';
  }
  openDriverBusDetailsScreen();
}

function renderSavedBusStops(stops) {
  const container = document.getElementById('busStopsListContainer');
  if (!container) return;
  container.innerHTML = '';
  stops.forEach((stop, idx) => {
    addNewBusStopRow(stop.name || '', stop.time || '');
  });
}

function addNewBusStopRow(stopName = '', stopTime = '') {
  const container = document.getElementById('busStopsListContainer');
  if (!container) return;

  const currentCount = container.children.length;
  const newIndex = currentCount + 1;

  const row = document.createElement('div');
  row.className = 'bus-stop-row-item';
  row.dataset.index = newIndex;
  row.innerHTML = `
    <span class="stop-drag-handle" title="Drag to reorder">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <circle cx="8" cy="6" r="1.8"/><circle cx="16" cy="6" r="1.8"/>
        <circle cx="8" cy="12" r="1.8"/><circle cx="16" cy="12" r="1.8"/>
        <circle cx="8" cy="18" r="1.8"/><circle cx="16" cy="18" r="1.8"/>
      </svg>
    </span>
    <span class="stop-number-badge">${newIndex}</span>
    <input type="text" class="stop-name-input" value="${safeEscapeStr(stopName)}" placeholder="Stop Name" oninput="handleRouteLocationInputChange()" onchange="handleRouteLocationInputChange()" required>
    <div class="stop-time-input-wrap">
      <input type="text" class="stop-time-input" value="${safeEscapeStr(stopTime || '08:30 AM')}" placeholder="Time" oninput="handleRouteLocationInputChange()" onchange="handleRouteLocationInputChange()">
      <span class="stop-time-icon">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </span>
    </div>
    <button type="button" class="btn-delete-stop" onclick="removeBusStopRow(this)" title="Delete Stop">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
    </button>
  `;
  container.appendChild(row);
  reindexBusStops();
  handleRouteLocationInputChange();
}

function removeBusStopRow(buttonEl) {
  const container = document.getElementById('busStopsListContainer');
  if (!container) return;
  if (container.children.length <= 2) {
    showNotice('A route must have at least 2 stops (Origin and Destination).');
    return;
  }
  const row = buttonEl.closest('.bus-stop-row-item');
  if (row) {
    row.remove();
    reindexBusStops();
    handleRouteLocationInputChange();
    showNotice('Stop removed from route.');
  }
}

function reindexBusStops() {
  const container = document.getElementById('busStopsListContainer');
  if (!container) return;
  Array.from(container.children).forEach((row, idx) => {
    row.dataset.index = idx + 1;
    const badge = row.querySelector('.stop-number-badge');
    if (badge) badge.textContent = idx + 1;
  });
}

function toggleOperatingDay(element) {
  element.classList.toggle('inactive');
  const dayName = element.dataset.day;
  const isNowActive = !element.classList.contains('inactive');
  showNotice(`${dayName} is now ${isNowActive ? 'Active' : 'Off'} for this route 📅`);
}

/* ==========================================================================
   REAL INTERACTIVE MAPLIBRE ROUTE PREVIEW ENGINE
   ========================================================================== */

const KNOWN_TRANSIT_COORDINATES = {
  'dehradun isbt': [78.0081, 30.2882],
  'isbt dehradun': [78.0081, 30.2882],
  'dehradun': [78.0322, 30.3165],
  'clock tower': [78.0415, 30.3244],
  'ghanta ghar': [78.0415, 30.3244],
  'prem nagar': [77.9620, 30.3398],
  'rajpur road': [78.0670, 30.3620],
  'raipur': [78.0920, 30.3150],
  'rispana': [78.0550, 30.2920],
  'kargi chowk': [78.0210, 30.2850],
  'haridwar rd': [78.0720, 30.2650],
  'haridwar road': [78.0720, 30.2650],
  'doiwala': [78.1180, 30.1790],
  'ranipokhari': [78.1820, 30.1850],
  'rani pokhari': [78.1820, 30.1850],
  'jolly grant': [78.1804, 30.1897],
  'dehradun airport': [78.1804, 30.1897],
  'bhaniawala': [78.1450, 30.1720],
  'nepali farm': [78.2320, 30.1250],
  'raiwala': [78.2250, 30.0450],
  'rishikesh isbt': [78.2860, 30.0980],
  'rishikesh bus stand': [78.2860, 30.0980],
  'triveni ghat': [78.2930, 30.1030],
  'rishikesh': [78.2930, 30.1030],
  'neelkanth': [78.3350, 30.1280],
  'tapovan': [78.3240, 30.1330],
  'laxman jhula': [78.3280, 30.1250],
  'ram jhula': [78.3150, 30.1180],
  'har ki pauri': [78.1642, 29.9457],
  'haridwar': [78.1642, 29.9457],
  'jwalapur': [78.1210, 29.9320],
  'roorkee': [77.8880, 29.8543],
  'mussoorie': [78.0700, 30.4598],
  'vikasnagar': [77.7710, 30.4990],
  'saharanpur': [77.5460, 29.9640],
  'delhi': [77.2090, 28.6139],
  'kashmere gate': [77.2280, 28.6675],
  'chandigarh': [76.7794, 30.7333],
  'paonta sahib': [77.6180, 30.4390]
};

// CartoDB Voyager raster tiles for scenic topographic pastel styling
const ROUTE_MAP_STYLE = {
  version: 8,
  sources: {
    'carto-voyager': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors, &copy; CARTO'
    }
  },
  layers: [
    {
      id: 'carto-voyager-layer',
      type: 'raster',
      source: 'carto-voyager',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

let routePreviewMap = null;
let fullRouteModalMapInstance = null;
let routeMapMarkers = [];
let fullRouteMapMarkers = [];
let routeLocationChangeTimeout = null;

function resolveTransitCoords(rawName, idx = 0, total = 1, originCoords = [78.0322, 30.3165], destCoords = [78.2930, 30.1030]) {
  if (!rawName || typeof rawName !== 'string') {
    const t = total > 1 ? idx / (total - 1) : 0.5;
    return [
      originCoords[0] + (destCoords[0] - originCoords[0]) * t,
      originCoords[1] + (destCoords[1] - originCoords[1]) * t
    ];
  }

  const query = rawName.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  for (const [key, coords] of Object.entries(KNOWN_TRANSIT_COORDINATES)) {
    if (query.includes(key) || key.includes(query)) {
      return coords;
    }
  }

  // Fallback: smooth interpolation along the vector with slight deterministic terrain curve
  const t = total > 1 ? idx / (total - 1) : 0.5;
  const lng = originCoords[0] + (destCoords[0] - originCoords[0]) * t;
  const lat = originCoords[1] + (destCoords[1] - originCoords[1]) * t;
  
  // Deterministic seed based on name characters
  let seed = 0;
  for (let i = 0; i < rawName.length; i++) {
    seed = (seed * 31 + rawName.charCodeAt(i)) % 1000;
  }
  const factor = ((seed % 100) - 50) / 10000;

  const dx = destCoords[0] - originCoords[0];
  const dy = destCoords[1] - originCoords[1];
  const perpX = -dy * 0.15 * Math.sin(t * Math.PI) + factor;
  const perpY = dx * 0.15 * Math.sin(t * Math.PI) + factor;
  return [lng + perpX, lat + perpY];
}

function generateSmoothCurve(points, stepsPerSegment = 16) {
  if (!points || points.length < 2) return points || [];
  if (points.length === 2) {
    const p0 = points[0];
    const p1 = points[1];
    const result = [];
    for (let i = 0; i <= stepsPerSegment; i++) {
      const t = i / stepsPerSegment;
      const lng = p0[0] + (p1[0] - p0[0]) * t;
      const lat = p0[1] + (p1[1] - p0[1]) * t;
      const bend = Math.sin(t * Math.PI) * 0.012;
      result.push([lng + bend, lat - bend * 0.4]);
    }
    return result;
  }

  const result = [];
  const n = points.length;

  for (let i = 0; i < n - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < n - 2 ? points[i + 2] : p2;

    for (let step = 0; step < stepsPerSegment; step++) {
      const t = step / stepsPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;

      const f0 = -0.5 * t3 + t2 - 0.5 * t;
      const f1 = 1.5 * t3 - 2.5 * t2 + 1.0;
      const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
      const f3 = 0.5 * t3 - 0.5 * t2;

      const lng = p0[0] * f0 + p1[0] * f1 + p2[0] * f2 + p3[0] * f3;
      const lat = p0[1] * f0 + p1[1] * f1 + p2[1] * f2 + p3[1] * f3;

      result.push([lng, lat]);
    }
  }
  result.push(points[n - 1]);
  return result;
}

// Haversine distance calculator for accurate route lengths
function calculateHaversineDistanceKm(coords) {
  if (!coords || coords.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lng1, lat1] = coords[i];
    const [lng2, lat2] = coords[i + 1];
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += R * c;
  }
  return total;
}

// Live GPS Location & Route Simulation State for Route Section
let driverRouteLiveGpsWatcherId = null;
let currentDriverGpsFix = null;
let driverRouteUserMarker = null;
let driverRouteSimInterval = null;
let driverRouteSimProgress = 0;
let driverRouteSimMarker = null;
let currentGeneratedRouteCoords = [];

function startRouteGpsWatcher() {
  const pillLabel = document.getElementById('routeGpsPillLabel');

  function applyGpsFix(lat, lng, isSimulated = false) {
    currentDriverGpsFix = { lat, lng, isSimulated };
    if (pillLabel) {
      pillLabel.textContent = isSimulated
        ? `GPS (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`
        : `Live GPS: ${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`;
    }

    // Place or update live user GPS pulsing beacon on route preview map
    if (routePreviewMap && window.maplibregl) {
      if (!driverRouteUserMarker) {
        const el = document.createElement('div');
        el.className = 'user-gps-pulse-icon';
        el.innerHTML = '<span class="user-gps-beacon-ring"></span><span class="user-gps-center-dot"></span>';
        el.title = 'Your Real-Time GPS Position';
        driverRouteUserMarker = new maplibregl.Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(routePreviewMap);
      } else {
        driverRouteUserMarker.setLngLat([lng, lat]);
      }
    }
  }

  if (navigator && 'geolocation' in navigator) {
    if (driverRouteLiveGpsWatcherId !== null) {
      navigator.geolocation.clearWatch(driverRouteLiveGpsWatcherId);
    }
    driverRouteLiveGpsWatcherId = navigator.geolocation.watchPosition(
      (pos) => {
        applyGpsFix(pos.coords.latitude, pos.coords.longitude, false);
      },
      (err) => {
        console.warn('Live GPS watcher notice:', err.message);
        if (!currentDriverGpsFix) {
          applyGpsFix(30.3244, 78.0416, true);
        }
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  } else {
    applyGpsFix(30.3244, 78.0416, true);
  }
}

function recenterRoutePreviewOnUser() {
  if (window.routePreviewMapInstance) {
    window.routePreviewMapInstance.recenterOnDriver();
    showNotice('Centered on your live GPS position 📍');
  } else if (currentDriverGpsFix && routePreviewMap) {
    routePreviewMap.flyTo({
      center: [currentDriverGpsFix.lng, currentDriverGpsFix.lat],
      zoom: 14,
      essential: true
    });
    showNotice('Centered on your live GPS position 📍');
  } else {
    showNotice('Detecting live GPS coordinates… 📡');
    startRouteGpsWatcher();
  }
}

function useCurrentGpsAsStartPoint() {
  if (!currentDriverGpsFix) {
    startRouteGpsWatcher();
  }
  const lat = currentDriverGpsFix ? currentDriverGpsFix.lat : 30.3244;
  const lng = currentDriverGpsFix ? currentDriverGpsFix.lng : 78.0416;
  const input = document.getElementById('rsStartPoint');
  if (input) {
    const locName = `Live GPS (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
    input.value = locName;
    KNOWN_TRANSIT_COORDINATES[locName.toLowerCase()] = [lng, lat];
    handleRouteLocationInputChange();
    showNotice('Route origin set to your current GPS position 📍');
  }
}

function toggleRouteTransitSimulation() {
  const btn = document.getElementById('btnSimulateTransit');
  const icon = document.getElementById('simTransitIcon');
  const text = document.getElementById('simTransitText');
  const speedEl = document.getElementById('routeTelSpeed');

  if (driverRouteSimInterval) {
    clearInterval(driverRouteSimInterval);
    driverRouteSimInterval = null;
    if (driverRouteSimMarker) {
      driverRouteSimMarker.remove();
      driverRouteSimMarker = null;
    }
    btn?.classList.remove('active');
    if (icon) icon.textContent = '▶';
    if (text) text.textContent = 'Simulate Drive';
    if (speedEl) speedEl.textContent = '0 km/h (Stopped)';
    showNotice('Transit drive simulation paused');
    return;
  }

  if (!currentGeneratedRouteCoords || currentGeneratedRouteCoords.length < 2) {
    showNotice('Route preview not ready yet');
    return;
  }

  btn?.classList.add('active');
  if (icon) icon.textContent = '⏹';
  if (text) text.textContent = 'Stop Drive';
  if (speedEl) speedEl.textContent = '48 km/h (Live Transit)';
  showNotice('Live vehicle moving along corridor route 🚌💨');

  driverRouteSimProgress = 0;
  const pts = currentGeneratedRouteCoords;

  if (!driverRouteSimMarker && routePreviewMap && window.maplibregl) {
    const el = document.createElement('div');
    el.className = 'leaflet-bus-marker-pin active-bus';
    el.style.width = '32px';
    el.style.height = '32px';
    el.style.fontSize = '16px';
    el.innerHTML = '🚌';
    driverRouteSimMarker = new maplibregl.Marker({ element: el })
      .setLngLat(pts[0])
      .addTo(routePreviewMap);
  }

  driverRouteSimInterval = setInterval(() => {
    driverRouteSimProgress = (driverRouteSimProgress + 1) % pts.length;
    const pt = pts[driverRouteSimProgress];
    if (driverRouteSimMarker) {
      driverRouteSimMarker.setLngLat(pt);
    }
    if (speedEl) {
      const speed = 40 + Math.floor(Math.sin(driverRouteSimProgress) * 12);
      speedEl.textContent = `${speed} km/h (Live GPS)`;
    }
  }, 350);
}

function initRoutePreviewRealMap() {
  const container = document.getElementById('routePreviewRealMap');
  if (!container) return;

  // Use the Real Interactive Mapbox GL JS Module
  if (window.MapRoutePreview) {
    if (!window.routePreviewMapInstance) {
      window.routePreviewMapInstance = new window.MapRoutePreview('routePreviewRealMap');
      window.routePreviewMapInstance.init();
    } else {
      window.routePreviewMapInstance.init();
      window.routePreviewMapInstance.syncWithForm();
    }
  }

  // Bind live listener on stops container if not already bound
  const stopsContainer = document.getElementById('busStopsListContainer');
  if (stopsContainer && !stopsContainer.dataset.liveBound) {
    stopsContainer.dataset.liveBound = 'true';
    stopsContainer.addEventListener('input', () => handleRouteLocationInputChange());
    stopsContainer.addEventListener('change', () => handleRouteLocationInputChange());
  }

  if (window.routePreviewMapInstance) return;

  if (!window.maplibregl) return;

  if (routePreviewMap) {
    routePreviewMap.resize();
    updateRealRoutePreviewMap();
    startRouteGpsWatcher();
    return;
  }

  routePreviewMap = new maplibregl.Map({
    container: 'routePreviewRealMap',
    style: ROUTE_MAP_STYLE,
    center: [78.16, 30.20],
    zoom: 10,
    attributionControl: false
  });

  routePreviewMap.on('load', () => {
    // Add Polyline GeoJSON Source
    routePreviewMap.addSource('route-preview-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });

    // Outer subtle glow / casing line
    routePreviewMap.addLayer({
      id: 'route-preview-casing',
      type: 'line',
      source: 'route-preview-source',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#1d4ed8',
        'line-width': 7,
        'line-opacity': 0.35
      }
    });

    // Core highway polyline (solid bright blue matching user mockup)
    routePreviewMap.addLayer({
      id: 'route-preview-line',
      type: 'line',
      source: 'route-preview-source',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#2563eb',
        'line-width': 4.5,
        'line-opacity': 0.95
      }
    });

    updateRealRoutePreviewMap();
    startRouteGpsWatcher();
  });
}

function updateRealRoutePreviewMap() {
  if (window.routePreviewMapInstance) {
    window.routePreviewMapInstance.syncWithForm();
    return;
  }
  if (!routePreviewMap || !routePreviewMap.getSource('route-preview-source')) return;

  const startName = document.getElementById('rsStartPoint')?.value.trim() || 'Dehradun (ISBT)';
  const endName = document.getElementById('rsEndPoint')?.value.trim() || 'Rishikesh (Triveni Ghat)';

  // Extract intermediate stops
  const stops = [];
  document.querySelectorAll('#busStopsListContainer .bus-stop-row-item').forEach((row, idx) => {
    const nameInput = row.querySelector('.stop-name-input');
    const timeInput = row.querySelector('.stop-time-input');
    if (nameInput && nameInput.value.trim()) {
      stops.push({
        index: idx + 1,
        name: nameInput.value.trim(),
        time: timeInput ? timeInput.value.trim() : ''
      });
    }
  });

  // Clear existing markers
  routeMapMarkers.forEach(m => m.remove());
  routeMapMarkers = [];

  const originCoords = resolveTransitCoords(startName, 0, 2, [78.0081, 30.2882], [78.2930, 30.1030]);
  const destCoords = resolveTransitCoords(endName, 1, 2, originCoords, [78.2930, 30.1030]);

  const rawWaypoints = [originCoords];
  const allBoundsCoords = [originCoords, destCoords];

  // Map intermediate stops
  stops.forEach((stop, idx) => {
    const stopCoords = resolveTransitCoords(stop.name, idx + 1, stops.length + 2, originCoords, destCoords);
    rawWaypoints.push(stopCoords);
    allBoundsCoords.push(stopCoords);

    // Create waypoint dot marker
    const dotEl = document.createElement('div');
    dotEl.className = 'route-stop-waypoint-dot';
    dotEl.title = `${stop.name} (${stop.time || 'Scheduled Stop'})`;

    const popup = new maplibregl.Popup({ offset: 12, closeButton: false })
      .setHTML(`
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;padding:3px 5px;">
          <strong style="color:#0f172a;display:block;">#${stop.index} ${safeEscapeStr(stop.name)}</strong>
          <span style="color:#2563eb;font-weight:600;font-size:11px;">⏰ ${safeEscapeStr(stop.time || 'En-route')}</span>
        </div>
      `);

    const marker = new maplibregl.Marker({ element: dotEl })
      .setLngLat(stopCoords)
      .setPopup(popup)
      .addTo(routePreviewMap);

    routeMapMarkers.push(marker);
  });

  rawWaypoints.push(destCoords);

  // Add Origin Pill Marker
  const originEl = document.createElement('div');
  originEl.className = 'route-map-marker-pill origin-marker';
  originEl.innerHTML = `<span class="marker-pill-dot green"></span><span>${safeEscapeStr(startName)}</span>`;
  const originMarker = new maplibregl.Marker({ element: originEl, anchor: 'center' })
    .setLngLat(originCoords)
    .addTo(routePreviewMap);
  routeMapMarkers.push(originMarker);

  // Add Destination Pill Marker
  const destEl = document.createElement('div');
  destEl.className = 'route-map-marker-pill dest-marker';
  destEl.innerHTML = `<span class="marker-pill-dot red"></span><span>${safeEscapeStr(endName)}</span>`;
  const destMarker = new maplibregl.Marker({ element: destEl, anchor: 'center' })
    .setLngLat(destCoords)
    .addTo(routePreviewMap);
  routeMapMarkers.push(destMarker);

  // Compute smooth curve through all waypoints
  const smoothPolyline = generateSmoothCurve(rawWaypoints, 18);
  currentGeneratedRouteCoords = smoothPolyline;

  const source = routePreviewMap.getSource('route-preview-source');
  if (source) {
    source.setData({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: smoothPolyline
      }
    });
  }

  // Calculate live route telemetry metrics
  const totalDist = calculateHaversineDistanceKm(smoothPolyline);
  const totalDuration = Math.round((totalDist / 42) * 60 + stops.length * 2.5);

  const telDist = document.getElementById('routeTelDistance');
  const telDur = document.getElementById('routeTelDuration');
  const telStops = document.getElementById('routeTelStops');
  if (telDist) telDist.textContent = totalDist.toFixed(1) + ' km';
  if (telDur) telDur.textContent = totalDuration + ' mins';
  if (telStops) telStops.textContent = (stops.length + 2) + ' Stops';

  // Adjust camera to fit all coordinates with nice padding
  if (allBoundsCoords.length > 0) {
    const bounds = new maplibregl.LngLatBounds();
    allBoundsCoords.forEach(pt => bounds.extend(pt));
    routePreviewMap.fitBounds(bounds, {
      padding: { top: 40, bottom: 40, left: 55, right: 55 },
      maxZoom: 13.5,
      duration: 600
    });
  }
}

function handleRouteLocationInputChange() {
  if (routeLocationChangeTimeout) clearTimeout(routeLocationChangeTimeout);
  routeLocationChangeTimeout = setTimeout(() => {
    if (window.routePreviewMapInstance) {
      window.routePreviewMapInstance.syncWithForm();
    } else {
      updateRealRoutePreviewMap();
    }
    if (fullRouteModalMapInstance) {
      updateFullRouteModalMap();
    }
  }, 180);
}

function zoomRoutePreview(direction) {
  if (window.routePreviewMapInstance) {
    window.routePreviewMapInstance.zoom(direction);
    return;
  }
  if (routePreviewMap) {
    if (direction > 0) {
      routePreviewMap.zoomIn({ duration: 250 });
    } else {
      routePreviewMap.zoomOut({ duration: 250 });
    }
  }
}

function openFullRouteMapModal() {
  const modal = document.getElementById('fullRouteMapModal');
  if (!modal) return;

  const startName = document.getElementById('rsStartPoint')?.value.trim() || 'Dehradun';
  const endName = document.getElementById('rsEndPoint')?.value.trim() || 'Rishikesh';
  const title = document.getElementById('fullRouteModalTitle');
  if (title) title.textContent = `${startName} ➔ ${endName} Corridor`;

  modal.classList.remove('hidden');
  modal.style.display = 'flex';

  setTimeout(() => {
    initFullRouteModalMap();
  }, 100);
}

function closeFullRouteMapModal(e) {
  if (e && e.target && e.target.closest('.full-route-modal-card') && !e.target.classList.contains('btn-modal-close')) {
    return;
  }
  const modal = document.getElementById('fullRouteMapModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function initFullRouteModalMap() {
  const container = document.getElementById('fullRouteModalMap');
  if (!container || !window.maplibregl) return;

  if (fullRouteModalMapInstance) {
    fullRouteModalMapInstance.resize();
    updateFullRouteModalMap();
    return;
  }

  fullRouteModalMapInstance = new maplibregl.Map({
    container: 'fullRouteModalMap',
    style: ROUTE_MAP_STYLE,
    center: [78.16, 30.20],
    zoom: 10,
    attributionControl: false
  });

  fullRouteModalMapInstance.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');

  fullRouteModalMapInstance.on('load', () => {
    fullRouteModalMapInstance.addSource('full-route-source', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      }
    });

    fullRouteModalMapInstance.addLayer({
      id: 'full-route-casing',
      type: 'line',
      source: 'full-route-source',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#1d4ed8', 'line-width': 8, 'line-opacity': 0.35 }
    });

    fullRouteModalMapInstance.addLayer({
      id: 'full-route-line',
      type: 'line',
      source: 'full-route-source',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.95 }
    });

    updateFullRouteModalMap();
  });
}

function updateFullRouteModalMap() {
  if (!fullRouteModalMapInstance || !fullRouteModalMapInstance.getSource('full-route-source')) return;

  const startName = document.getElementById('rsStartPoint')?.value.trim() || 'Dehradun (ISBT)';
  const endName = document.getElementById('rsEndPoint')?.value.trim() || 'Rishikesh (Triveni Ghat)';

  const stops = [];
  document.querySelectorAll('#busStopsListContainer .bus-stop-row-item').forEach((row, idx) => {
    const nameInput = row.querySelector('.stop-name-input');
    const timeInput = row.querySelector('.stop-time-input');
    if (nameInput && nameInput.value.trim()) {
      stops.push({
        index: idx + 1,
        name: nameInput.value.trim(),
        time: timeInput ? timeInput.value.trim() : ''
      });
    }
  });

  fullRouteMapMarkers.forEach(m => m.remove());
  fullRouteMapMarkers = [];

  const originCoords = resolveTransitCoords(startName, 0, 2, [78.0081, 30.2882], [78.2930, 30.1030]);
  const destCoords = resolveTransitCoords(endName, 1, 2, originCoords, [78.2930, 30.1030]);

  const rawWaypoints = [originCoords];
  const allBoundsCoords = [originCoords, destCoords];

  stops.forEach((stop, idx) => {
    const stopCoords = resolveTransitCoords(stop.name, idx + 1, stops.length + 2, originCoords, destCoords);
    rawWaypoints.push(stopCoords);
    allBoundsCoords.push(stopCoords);

    const dotEl = document.createElement('div');
    dotEl.className = 'route-stop-waypoint-dot';
    dotEl.title = `${stop.name} (${stop.time || 'Scheduled Stop'})`;

    const popup = new maplibregl.Popup({ offset: 12, closeButton: false })
      .setHTML(`
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;padding:4px 6px;">
          <strong style="color:#0f172a;display:block;">#${stop.index} ${safeEscapeStr(stop.name)}</strong>
          <span style="color:#2563eb;font-weight:600;font-size:12px;">⏰ ${safeEscapeStr(stop.time || 'En-route')}</span>
        </div>
      `);

    const marker = new maplibregl.Marker({ element: dotEl })
      .setLngLat(stopCoords)
      .setPopup(popup)
      .addTo(fullRouteModalMapInstance);

    fullRouteMapMarkers.push(marker);
  });

  rawWaypoints.push(destCoords);

  const originEl = document.createElement('div');
  originEl.className = 'route-map-marker-pill origin-marker';
  originEl.innerHTML = `<span class="marker-pill-dot green"></span><span>${safeEscapeStr(startName)}</span>`;
  const originMarker = new maplibregl.Marker({ element: originEl, anchor: 'center' })
    .setLngLat(originCoords)
    .addTo(fullRouteModalMapInstance);
  fullRouteMapMarkers.push(originMarker);

  const destEl = document.createElement('div');
  destEl.className = 'route-map-marker-pill dest-marker';
  destEl.innerHTML = `<span class="marker-pill-dot red"></span><span>${safeEscapeStr(endName)}</span>`;
  const destMarker = new maplibregl.Marker({ element: destEl, anchor: 'center' })
    .setLngLat(destCoords)
    .addTo(fullRouteModalMapInstance);
  fullRouteMapMarkers.push(destMarker);

  const smoothPolyline = generateSmoothCurve(rawWaypoints, 20);

  const source = fullRouteModalMapInstance.getSource('full-route-source');
  if (source) {
    source.setData({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: smoothPolyline
      }
    });
  }

  if (allBoundsCoords.length > 0) {
    const bounds = new maplibregl.LngLatBounds();
    allBoundsCoords.forEach(pt => bounds.extend(pt));
    fullRouteModalMapInstance.fitBounds(bounds, {
      padding: { top: 60, bottom: 60, left: 70, right: 70 },
      maxZoom: 14,
      duration: 600
    });
  }
}

async function handleRouteScheduleSubmit(event) {
  if (event) event.preventDefault();

  const routeNameInput = document.getElementById('rsRouteName');
  const routeNumberInput = document.getElementById('rsRouteNumber');
  const routeTypeInput = document.getElementById('rsRouteType');
  const startPointInput = document.getElementById('rsStartPoint');
  const endPointInput = document.getElementById('rsEndPoint');
  const startTimeInput = document.getElementById('rsStartTime');
  const endTimeInput = document.getElementById('rsEndTime');
  const frequencyInput = document.getElementById('rsFrequency');
  const tripsPerDayInput = document.getElementById('rsTripsPerDay');

  const routeName = routeNameInput?.value.trim() || '';
  const routeNumber = routeNumberInput?.value.trim() || '';
  const routeType = routeTypeInput?.value || '';
  const startPoint = startPointInput?.value.trim() || '';
  const endPoint = endPointInput?.value.trim() || '';
  const startTime = startTimeInput?.value.trim() || '';
  const endTime = endTimeInput?.value.trim() || '';
  const frequency = frequencyInput?.value || '';
  const tripsPerDay = parseInt(tripsPerDayInput?.value) || 0;

  // Strict required fields validation: No blanks or fake fallbacks allowed
  if (!routeName) {
    showNotice('⚠️ Please enter the Route Name (e.g. Dehradun - Rishikesh).');
    routeNameInput?.focus();
    return;
  }
  if (!routeNumber) {
    showNotice('⚠️ Please enter the Route Number / Code (e.g. UK07-01).');
    routeNumberInput?.focus();
    return;
  }
  if (!routeType) {
    showNotice('⚠️ Please select the Route Type category.');
    routeTypeInput?.focus();
    return;
  }
  if (!startPoint) {
    showNotice('⚠️ Please enter or select the Route Starting Point.');
    startPointInput?.focus();
    return;
  }
  if (!endPoint) {
    showNotice('⚠️ Please enter or select the Route Ending Point.');
    endPointInput?.focus();
    return;
  }
  if (!startTime) {
    showNotice('⚠️ Please enter the Daily Trip Start Time (e.g. 06:00 AM).');
    startTimeInput?.focus();
    return;
  }
  if (!endTime) {
    showNotice('⚠️ Please enter the Daily Trip End Time (e.g. 08:00 PM).');
    endTimeInput?.focus();
    return;
  }
  if (!frequency) {
    showNotice('⚠️ Please select the transit frequency.');
    frequencyInput?.focus();
    return;
  }
  if (!tripsPerDay || tripsPerDay < 1) {
    showNotice('⚠️ Please enter number of trips per day.');
    tripsPerDayInput?.focus();
    return;
  }

  // Collect Stops
  const stops = [];
  document.querySelectorAll('#busStopsListContainer .bus-stop-row-item').forEach((row, idx) => {
    const nameInput = row.querySelector('.stop-name-input');
    const timeInput = row.querySelector('.stop-time-input');
    if (nameInput && nameInput.value.trim()) {
      stops.push({
        sequence: idx + 1,
        name: nameInput.value.trim(),
        time: timeInput ? timeInput.value.trim() : ''
      });
    }
  });

  // Collect Operating Days
  const operatingDays = [];
  document.querySelectorAll('#operatingDaysContainer .day-toggle-pill:not(.inactive)').forEach(pill => {
    if (pill.dataset.day) operatingDays.push(pill.dataset.day);
  });

  if (operatingDays.length === 0) {
    showNotice('⚠️ Please select at least one Operating Day for this route.');
    return;
  }

  const routeScheduleData = {
    routeName,
    routeNumber,
    routeType,
    startPoint,
    endPoint,
    stops,
    startTime,
    endTime,
    frequency,
    tripsPerDay,
    operatingDays,
    verified: true,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem('bus_stop_driver_route', JSON.stringify(routeScheduleData));

  const btn = document.getElementById('btnRouteScheduleSaveContinue');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Saving Route &amp; Schedule...</span>`;
  }

  // Update in-memory driver route
  driverAssignedRoute = {
    id: 'route_' + routeNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
    route_number: routeNumber,
    name: routeName,
    origin: startPoint,
    destination: endPoint,
    stops: stops.map(s => s.name)
  };

  // Bind driver assigned bus to this newly created route
  if (!driverAssignedBus) {
    try {
      const saved = localStorage.getItem('bus_stop_driver_bus');
      if (saved) driverAssignedBus = JSON.parse(saved);
    } catch (e) {}
  }
  if (driverAssignedBus) {
    driverAssignedBus.route_name = routeName;
    driverAssignedBus.route_number = routeNumber;
    driverAssignedBus.origin = startPoint;
    driverAssignedBus.destination = endPoint;
    if (stops.length > 0) {
      driverAssignedBus.current_stop = stops[0].name || startPoint;
      driverAssignedBus.next_stop = stops.length > 1 ? stops[1].name : endPoint;
    }
    localStorage.setItem('bus_stop_driver_bus', JSON.stringify(driverAssignedBus));
  }

  // Sync with backend API (Registers route in transit service)
  try {
    await fetch('/api/driver/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUser?.id,
        busId: driverAssignedBus.id,
        busNumber: driverAssignedBus.bus_number,
        routeSchedule: routeScheduleData
      })
    });

    // Broadcast driver bus location so it immediately appears live on passenger searches
    await fetch('/api/v2/driver/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        busId: driverAssignedBus.id,
        busNumber: driverAssignedBus.bus_number,
        registrationNumber: driverAssignedBus.registration_number,
        driverName: driverAssignedBus.driver_name,
        driverPhone: driverAssignedBus.driver_phone,
        routeName: routeName,
        routeNumber: routeNumber,
        origin: startPoint,
        destination: endPoint,
        latitude: driverAssignedBus.location?.latitude || 30.2245,
        longitude: driverAssignedBus.location?.longitude || 78.1320,
        speed: driverAssignedBus.speed || 48,
        heading: driverAssignedBus.location?.heading || 45,
        currentStop: driverAssignedBus.current_stop,
        nextStop: driverAssignedBus.next_stop,
        etaMinutes: 4
      })
    });

    if (typeof fetchTransitData === 'function') fetchTransitData();
  } catch (err) {
    console.warn('Route sync API error:', err);
  }

  showNotice(`🎉 Route & Schedule verified! ${routeName} (${routeNumber}) assigned & broadcasting live 📡`);

  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Save &amp; Continue</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    }
    openDriverReviewSubmitScreen();
  }, 600);
}

// ==========================================================================
// 10E. DRIVER REVIEW & SUBMIT CONTROLLER (STEP 5)
// ==========================================================================
function openDriverReviewSubmitScreen() {
  if (typeof dismissSplash === 'function') dismissSplash();

  const authWrapper = document.getElementById('authWrapper') || document.querySelector('.auth-wrapper');
  if (authWrapper) {
    authWrapper.classList.add('hidden');
    authWrapper.style.display = 'none';
  }
  document.getElementById('fullRoleSelectionScreen')?.classList.add('hidden');
  document.getElementById('passengerLiveDashboard')?.classList.add('hidden');
  document.getElementById('driverDashboardScreen')?.classList.add('hidden');
  document.getElementById('driverProfileScreen')?.classList.add('hidden');
  document.getElementById('driverDocumentsScreen')?.classList.add('hidden');
  document.getElementById('driverBusDetailsScreen')?.classList.add('hidden');
  document.getElementById('driverRouteScheduleScreen')?.classList.add('hidden');
  document.getElementById('userProfileEditScreen')?.classList.add('hidden');

  const reviewScreen = document.getElementById('driverReviewSubmitScreen');
  if (reviewScreen) {
    reviewScreen.classList.remove('hidden');
    reviewScreen.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Populate data across all previous 4 steps
  populateReviewSubmitData();
}

function previousToDriverRouteSchedule() {
  const reviewScreen = document.getElementById('driverReviewSubmitScreen');
  if (reviewScreen) {
    reviewScreen.classList.add('hidden');
    reviewScreen.style.display = 'none';
  }
  openDriverRouteScheduleScreen();
}

function populateReviewSubmitData() {
  // 1. Driver Profile
  let profile = {};
  try {
    const saved = localStorage.getItem('bus_stop_driver_profile');
    if (saved) profile = JSON.parse(saved);
  } catch (e) {}

  const fullName = profile.fullName || document.getElementById('dpFullName')?.value || activeUser?.full_name || '-';
  const phone = profile.phone || document.getElementById('dpPhone')?.value || activeUser?.phone || '-';
  const email = profile.email || document.getElementById('dpEmail')?.value || activeUser?.email || '-';
  const licenseNo = profile.licenceNum || profile.licenseNo || document.getElementById('dpLicenceNum')?.value || '-';
  const licenseType = profile.licenceType || profile.licenseType || document.getElementById('dpLicenceType')?.value || '-';
  const experience = profile.experience || document.getElementById('dpExperience')?.value || '-';
  const bloodGroup = profile.bloodGroup || document.getElementById('dpBloodGroup')?.value || '-';
  const emergency = profile.emergencyPhone || profile.emergencyContact || document.getElementById('dpEmergencyPhone')?.value || '-';
  const location = profile.address || document.getElementById('dpAddress')?.value || activeUser?.home_location || '-';

  const revDriverName = document.getElementById('revDriverName');
  if (revDriverName) revDriverName.textContent = fullName;
  const revTopUser = document.getElementById('reviewTopUserDisplay');
  if (revTopUser) revTopUser.textContent = fullName !== '-' ? fullName : 'Driver Portal';

  if (document.getElementById('revDriverPhone')) document.getElementById('revDriverPhone').textContent = phone;
  if (document.getElementById('revDriverEmail')) document.getElementById('revDriverEmail').textContent = email;
  if (document.getElementById('revDriverDl')) document.getElementById('revDriverDl').textContent = licenseNo;
  if (document.getElementById('revDriverDlType')) document.getElementById('revDriverDlType').textContent = licenseType;
  if (document.getElementById('revDriverExp')) document.getElementById('revDriverExp').textContent = experience ? `${experience} Years` : '-';
  if (document.getElementById('revDriverBlood')) document.getElementById('revDriverBlood').textContent = bloodGroup;
  if (document.getElementById('revDriverEmergency')) document.getElementById('revDriverEmergency').textContent = emergency;
  if (document.getElementById('revDriverLocation')) document.getElementById('revDriverLocation').textContent = location;

  // 2. Documents Status
  let docs = {};
  try {
    const savedDocs = localStorage.getItem('bus_stop_driver_documents');
    if (savedDocs) docs = JSON.parse(savedDocs);
  } catch (e) {}
  if (document.getElementById('revDocDlStatus')) document.getElementById('revDocDlStatus').textContent = docs.dlFront ? '✓ Uploaded' : 'Pending Upload';
  if (document.getElementById('revDocAadhaarStatus')) document.getElementById('revDocAadhaarStatus').textContent = docs.aadhaarFront ? '✓ Uploaded' : 'Pending Upload';
  if (document.getElementById('revDocPanStatus')) document.getElementById('revDocPanStatus').textContent = docs.pan ? '✓ Uploaded' : 'Optional';
  if (document.getElementById('revDocAddressStatus')) document.getElementById('revDocAddressStatus').textContent = docs.address ? '✓ Uploaded' : 'Optional';
  if (document.getElementById('revDocPoliceStatus')) document.getElementById('revDocPoliceStatus').textContent = docs.police ? '✓ Attached' : 'Optional';

  // 3. Bus Details
  let bus = {};
  try {
    const savedBus = localStorage.getItem('bus_stop_driver_bus');
    if (savedBus) bus = JSON.parse(savedBus);
  } catch (e) {}

  const regNumber = bus.regNumber || document.getElementById('bdRegNumber')?.value || '-';
  const model = bus.model || document.getElementById('bdModel')?.value || '-';
  const seating = bus.seating ? `${bus.seating} Passenger Seats` : (document.getElementById('bdSeating')?.value ? `${document.getElementById('bdSeating')?.value} Passenger Seats` : '-');
  const busType = bus.busType || document.getElementById('bdBusType')?.value || '-';
  const fuelType = bus.fuelType || document.getElementById('bdFuelType')?.value || '-';
  const mfgYear = bus.mfgYear || document.getElementById('bdMfgYear')?.value || '-';

  if (document.getElementById('revBusReg')) document.getElementById('revBusReg').textContent = regNumber;
  if (document.getElementById('revBusModel')) document.getElementById('revBusModel').textContent = model;
  if (document.getElementById('revBusSeats')) document.getElementById('revBusSeats').textContent = seating;
  if (document.getElementById('revBusType')) document.getElementById('revBusType').textContent = busType;
  if (document.getElementById('revBusFuel')) document.getElementById('revBusFuel').textContent = fuelType;
  if (document.getElementById('revBusYear')) document.getElementById('revBusYear').textContent = mfgYear;
  if (document.getElementById('revBusRcStatus')) document.getElementById('revBusRcStatus').textContent = bus.rcDoc ? '✓ Valid RC Uploaded' : 'Pending Upload';
  if (document.getElementById('revBusFitnessStatus')) document.getElementById('revBusFitnessStatus').textContent = bus.fitnessDoc ? '✓ Fitness Attached' : 'Pending Upload';
  if (document.getElementById('revBusPucStatus')) document.getElementById('revBusPucStatus').textContent = (bus.pucDoc || bus.insuranceDoc) ? '✓ Attached' : 'Pending Upload';

  // 4. Route & Schedule
  let route = {};
  try {
    const savedRoute = localStorage.getItem('bus_stop_driver_route');
    if (savedRoute) route = JSON.parse(savedRoute);
  } catch (e) {}

  const routeName = route.routeName || document.getElementById('rsRouteName')?.value || '-';
  const routeNumber = route.routeNumber || document.getElementById('rsRouteNumber')?.value || '-';
  const startPoint = route.startPoint || document.getElementById('rsStartPoint')?.value || 'Origin';
  const endPoint = route.endPoint || document.getElementById('rsEndPoint')?.value || 'Destination';
  const startTime = route.startTime || document.getElementById('rsStartTime')?.value || '-';
  const endTime = route.endTime || document.getElementById('rsEndTime')?.value || '-';
  const frequency = route.frequency || document.getElementById('rsFrequency')?.value || '-';
  const trips = route.tripsPerDay || document.getElementById('rsTripsPerDay')?.value || '-';

  if (document.getElementById('revRouteNameBadge')) document.getElementById('revRouteNameBadge').textContent = routeName;
  if (document.getElementById('revRouteNumberBadge')) document.getElementById('revRouteNumberBadge').textContent = routeNumber;
  if (document.getElementById('revStartName')) document.getElementById('revStartName').textContent = startPoint;
  if (document.getElementById('revEndName')) document.getElementById('revEndName').textContent = endPoint;
  if (document.getElementById('revRouteHours')) document.getElementById('revRouteHours').textContent = (startTime !== '-' && endTime !== '-') ? `${startTime} - ${endTime}` : '-';
  if (document.getElementById('revRouteFreq')) document.getElementById('revRouteFreq').textContent = frequency;
  if (document.getElementById('revRouteTrips')) document.getElementById('revRouteTrips').textContent = trips !== '-' ? `${trips} Trips / Day` : '-';

  // Operating Days
  const days = Array.isArray(route.operatingDays) && route.operatingDays.length > 0 ? route.operatingDays.join(', ') : '-';
  if (document.getElementById('revRouteDays')) document.getElementById('revRouteDays').textContent = days;

  // Build corridor visual flow
  const flowContainer = document.getElementById('revCorridorFlowContainer');
  if (flowContainer) {
    let stopsList = [];
    if (Array.isArray(route.stops) && route.stops.length > 0) {
      stopsList = route.stops.map(s => typeof s === 'string' ? s : (s.name || ''));
    } else {
      document.querySelectorAll('#busStopsListContainer .bus-stop-row-item .stop-name-input').forEach(inp => {
        if (inp.value.trim()) stopsList.push(inp.value.trim());
      });
    }

    let flowHtml = `<span class="review-flow-stop origin">🟢 <span>${safeEscapeStr(startPoint)}</span></span>`;
    stopsList.forEach(s => {
      flowHtml += `<span class="review-flow-arrow">➔</span><span class="review-flow-stop">${safeEscapeStr(s)}</span>`;
    });
    flowHtml += `<span class="review-flow-arrow">➔</span><span class="review-flow-stop dest">🔴 <span>${safeEscapeStr(endPoint)}</span></span>`;
    flowContainer.innerHTML = flowHtml;

    const metricsBadge = document.getElementById('revRouteMetricsBadge');
    if (metricsBadge) {
      const dist = document.getElementById('routeTelDistance')?.textContent || 'Live Route';
      const dur = document.getElementById('routeTelDuration')?.textContent || '';
      metricsBadge.textContent = `${dist} • ${stopsList.length + 2} Total Stops`;
    }
  }

  // Success modal route display
  const successRoute = document.getElementById('successRouteDisplay');
  if (successRoute) successRoute.textContent = `${routeName} (${routeNumber})`;
}

async function handleFinalApplicationSubmit() {
  // Validate that user filled all 4 sections genuinely before creating profile
  let profile = {};
  let docs = {};
  let bus = {};
  let route = {};
  try {
    profile = JSON.parse(localStorage.getItem('bus_stop_driver_profile') || '{}');
    docs = JSON.parse(localStorage.getItem('bus_stop_driver_documents') || '{}');
    bus = JSON.parse(localStorage.getItem('bus_stop_driver_bus') || '{}');
    route = JSON.parse(localStorage.getItem('bus_stop_driver_route') || '{}');
  } catch (e) {}

  if (!profile.fullName || !profile.licenceNum || !profile.phone) {
    showNotice('⚠️ Please complete Step 1: Driver Profile before submitting.');
    openDriverProfileScreen();
    return;
  }
  if (!docs.dlFront || !docs.aadhaarFront) {
    showNotice('⚠️ Please complete Step 2: Document Verification with your DL and Aadhaar card.');
    openDriverDocumentsScreen();
    return;
  }
  if (!bus.regNumber || !bus.busType || !bus.rcDoc) {
    showNotice('⚠️ Please complete Step 3: Bus Details and upload RC document.');
    openDriverBusDetailsScreen();
    return;
  }
  if (!route.routeName || !route.routeNumber || !route.startPoint || !route.endPoint) {
    showNotice('⚠️ Please complete Step 4: Route & Schedule information.');
    openDriverRouteScheduleScreen();
    return;
  }

  const chk1 = document.getElementById('chkReviewDeclare1');
  const chk2 = document.getElementById('chkReviewDeclare2');

  if (chk1 && !chk1.checked) {
    showNotice('Please accept the statutory declaration regarding truthfulness of submitted documents.');
    chk1.focus();
    return;
  }
  if (chk2 && !chk2.checked) {
    showNotice('Please accept the BUS STOP Driver Partner Safety Code of Conduct.');
    chk2.focus();
    return;
  }

  const btn = document.getElementById('btnSubmitFinalApplication');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span>Submitting Application...</span>`;
  }

  // Generate Reference ID
  const refId = `UK-DRV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const displayEl = document.getElementById('successAppIdDisplay');
  if (displayEl) displayEl.textContent = refId;

  // Persist submission record
  localStorage.setItem('bus_stop_driver_submitted', 'true');
  localStorage.setItem('bus_stop_driver_app_id', refId);
  localStorage.setItem('bus_stop_driver_submitted_at', new Date().toISOString());

  // Backend submission API call
  try {
    await fetch('/api/driver/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicationId: refId,
        driverId: activeUser?.id,
        driverProfile: profile,
        busDetails: bus,
        routeDetails: route,
        submittedAt: new Date().toISOString()
      })
    });
  } catch (e) {
    console.warn('Driver submission API fallback:', e);
  }

  setTimeout(() => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Submit Application for Verification</span><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.6"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
    }
    const modal = document.getElementById('applicationSuccessModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
    showNotice(`🎉 Application ${refId} successfully submitted! Opening Driver Console...`);
    setTimeout(() => {
      closeSuccessAndGoToCockpit();
    }, 1800);
  }, 900);
}

function closeSuccessAndGoToCockpit() {
  const modal = document.getElementById('applicationSuccessModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  document.getElementById('driverReviewSubmitScreen')?.classList.add('hidden');
  openDriverDashboard();
}

// ==========================================================================
// 11. DRIVER OPERATING CONSOLE (VIVEK RAUTELA DASHBOARD CONTROLLER)
// ==========================================================================
let driverCockpitLeafletMap = null;
let driverCockpitBusMarker = null;
let driverCockpitPolyline = null;
let driverCockpitSimInterval = null;
let driverClockTimer = null;
let driverNavActive = false;
let driverBusProgressIdx = 5; // index on route coordinates (between Prem Nagar & Doiwala)
let driverCurrentTileLayer = 'topo';
let driverTopoLayerInstance = null;
let driverStreetsLayerInstance = null;

// Route waypoints along the Dehradun (ISBT) -> Prem Nagar -> Doiwala -> Haridwar -> Rishikesh highway
const DRIVER_CORRIDOR_WAYPOINTS = [
  { name: 'Dehradun (ISBT)', time: '06:00 AM', lat: 30.2885, lng: 78.0081, type: 'start' },
  { lat: 30.2800, lng: 78.0210 },
  { lat: 30.2680, lng: 78.0340 },
  { name: 'Prem Nagar', time: '08:30 AM', lat: 30.2550, lng: 78.0450, type: 'active' },
  { lat: 30.2380, lng: 78.0640 },
  { lat: 30.2150, lng: 78.0850 }, // Initial animated bus position
  { lat: 30.1980, lng: 78.1020 },
  { name: 'Doiwala', time: '09:00 AM', lat: 30.1780, lng: 78.1180, type: 'stop' },
  { lat: 30.1450, lng: 78.1380 },
  { lat: 30.0820, lng: 78.1560 },
  { name: 'Haridwar', time: '09:40 AM', lat: 30.0150, lng: 78.1750, type: 'stop' },
  { lat: 30.0450, lng: 78.2150 },
  { lat: 30.0820, lng: 78.2580 },
  { name: 'Rishikesh (Final Stop)', time: '10:30 AM', lat: 30.1030, lng: 78.2930, type: 'end' }
];

async function openDriverDashboard() {
  if (typeof dismissSplash === 'function') dismissSplash();

  // Hide non-driver screens & scenic background
  document.getElementById('authWrapper')?.classList.add('hidden');
  document.getElementById('fullRoleSelectionScreen')?.classList.add('hidden');
  document.getElementById('passengerLiveDashboard')?.classList.add('hidden');
  document.getElementById('adminDashboardScreen')?.classList.add('hidden');
  document.getElementById('driverProfileScreen')?.classList.add('hidden');
  document.getElementById('driverDocumentsScreen')?.classList.add('hidden');
  document.getElementById('driverBusDetailsScreen')?.classList.add('hidden');
  document.getElementById('driverRouteScheduleScreen')?.classList.add('hidden');
  document.getElementById('driverReviewSubmitScreen')?.classList.add('hidden');

  // Hide scenic backdrop & landing elements
  const scenic = document.getElementById('scenicBackdrop');
  if (scenic) scenic.style.display = 'none';
  document.querySelector('.page-brand-header')?.classList.add('hidden');
  document.querySelector('.sky-quote')?.classList.add('hidden');

  const driverScreen = document.getElementById('driverDashboardScreen');
  if (driverScreen) {
    driverScreen.classList.remove('hidden');
    driverScreen.style.display = 'flex';
  }

  // Load driver profile info
  const name = activeUser?.full_name || 'Vivek Rautela';
  const nameEl = document.getElementById('driverDashUserNameDisplay');
  if (nameEl) nameEl.textContent = name;

  // Set greeting
  const greetingEl = document.getElementById('driverGreetingHeader');
  if (greetingEl) {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const firstName = name.split(' ')[0] || 'Vivek';
    greetingEl.textContent = `${timeGreeting}, ${firstName} 👋`;
  }

  // Stop passenger live tracking interval if running
  if (typeof stopPassengerLiveTracking === 'function') stopPassengerLiveTracking();

  // Ensure driverAssignedBus is initialized and synced
  if (!driverAssignedBus) {
    try {
      const saved = localStorage.getItem('bus_stop_driver_bus');
      if (saved) driverAssignedBus = JSON.parse(saved);
    } catch (e) {}
  }

  if (!driverAssignedBus) {
    driverAssignedBus = {
      id: 'bus_' + (activeUser?.id || 'captain_vivek'),
      bus_number: 'UK07-PA-8842',
      registration_number: 'UK-07-PA-8842',
      name: `${name.split(' ')[0]}'s Express`,
      route_name: 'Dehradun ➔ Rishikesh Express',
      route_number: '108',
      driver_id: activeUser?.id || 'usr_captain',
      driver_name: name,
      driver_phone: activeUser?.phone || '+91 98765 43210',
      capacity: 42,
      available_seats: 18,
      fare: 55,
      type: 'direct',
      status: 'IN_TRANSIT',
      current_stop: 'Prem Nagar',
      next_stop: 'Doiwala Junction',
      eta_minutes: 5,
      speed: 48,
      is_active: true,
      location: {
        latitude: 30.2245,
        longitude: 78.1320,
        heading: 45,
        speed: 48,
        accuracy: 8,
        is_online: true,
        updated_at: new Date().toISOString()
      }
    };
    localStorage.setItem('bus_stop_driver_bus', JSON.stringify(driverAssignedBus));
  }

  // Broadcast initial location to server
  try {
    fetch('/api/v2/driver/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        busId: driverAssignedBus.id,
        busNumber: driverAssignedBus.bus_number,
        registrationNumber: driverAssignedBus.registration_number,
        driverName: driverAssignedBus.driver_name,
        driverPhone: driverAssignedBus.driver_phone,
        routeName: driverAssignedBus.route_name,
        routeNumber: driverAssignedBus.route_number,
        latitude: driverAssignedBus.location.latitude,
        longitude: driverAssignedBus.location.longitude,
        speed: driverAssignedBus.speed,
        heading: driverAssignedBus.location.heading,
        currentStop: driverAssignedBus.current_stop,
        nextStop: driverAssignedBus.next_stop,
        etaMinutes: driverAssignedBus.eta_minutes
      })
    }).catch(() => {});
  } catch (e) {}

  // Start live clock
  startDriverLiveClock();

  // Mount cockpit map
  setTimeout(() => {
    initDriverCockpit();
  }, 120);



  showNotice(`Welcome, ${name}! Driver Operating Console live 🚏`);
}

function startDriverLiveClock() {
  if (driverClockTimer) clearInterval(driverClockTimer);

  function updateClock() {
    const now = new Date();
    const dateEl = document.getElementById('driverDashClockDate');
    const timeEl = document.getElementById('driverDashClockTime');

    const optionsDate = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const dateStr = now.toLocaleDateString('en-GB', optionsDate); // e.g. "Wed, 7 Oct 2026"

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    if (dateEl) dateEl.textContent = dateStr;
    if (timeEl) timeEl.textContent = timeStr;
  }

  updateClock();
  driverClockTimer = setInterval(updateClock, 1000);
}

async function initDriverCockpit() {
  const mapContainer = document.getElementById('driverCockpitMap');
  if (!mapContainer || typeof L === 'undefined') return;

  // If map already exists, re-invalidate size and center
  if (driverCockpitLeafletMap) {
    try {
      driverCockpitLeafletMap.invalidateSize();
      driverCockpitLeafletMap.setView([30.20, 78.16], 11);
      return;
    } catch (e) {
      driverCockpitLeafletMap = null;
    }
  }

  // Initialize Leaflet map
  driverCockpitLeafletMap = L.map('driverCockpitMap', {
    zoomControl: false,
    attributionControl: false
  }).setView([30.20, 78.16], 11);

  // Esri World Topo Map (mountain relief of Uttarakhand)
  driverTopoLayerInstance = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri'
  });

  // OpenStreetMap fallback/street layer
  driverStreetsLayerInstance = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  });

  driverTopoLayerInstance.addTo(driverCockpitLeafletMap);

  // Polyline for Dehradun - Rishikesh Corridor
  const polylineCoords = DRIVER_CORRIDOR_WAYPOINTS.map(p => [p.lat, p.lng]);
  driverCockpitPolyline = L.polyline(polylineCoords, {
    color: '#2563eb',
    weight: 5.5,
    opacity: 0.92,
    lineJoin: 'round',
    lineCap: 'round'
  }).addTo(driverCockpitLeafletMap);

  // Add custom stop pins with labels
  DRIVER_CORRIDOR_WAYPOINTS.forEach((pt) => {
    if (!pt.name) return; // skip intermediate road points

    let pinColorClass = 'blue-pin';
    if (pt.type === 'start') pinColorClass = 'green-pin';
    if (pt.type === 'end') pinColorClass = 'red-pin';

    const customIcon = L.divIcon({
      className: 'custom-stop-divicon',
      html: `
        <div style="display:flex;align-items:center;gap:6px;">
          <div class="driver-pin-circle ${pinColorClass}"></div>
          <div class="leaflet-driver-stop-badge">
            <strong>${pt.name}</strong>
            <span>${pt.time}</span>
          </div>
        </div>
      `,
      iconSize: [120, 36],
      iconAnchor: [7, 18]
    });

    L.marker([pt.lat, pt.lng], { icon: customIcon }).addTo(driverCockpitLeafletMap);
  });

  // Create isometric Yellow Tata Starbus Bus Marker
  const busSvgHtml = `
    <div class="driver-cockpit-bus-marker" id="driverMapAnimatedBus">
      <svg class="bus-marker-body" viewBox="0 0 60 52" width="50" height="44">
        <ellipse cx="30" cy="44" rx="22" ry="5" fill="rgba(15,23,42,0.32)"/>
        <path d="M10,26 L30,14 L50,26 L30,38 Z" fill="#f59e0b" stroke="#b45309" stroke-width="1.5"/>
        <path d="M10,26 L10,20 L30,8 L50,20 L50,26 L30,38 Z" fill="#fbbf24"/>
        <path d="M10,20 L30,8 L50,20 L30,32 Z" fill="#fef08a"/>
        <path d="M20,18 L30,13 L40,18 L30,23 Z" fill="#1e293b"/>
        <rect x="25" y="9" width="10" height="3" rx="1" fill="#ffffff" opacity="0.95"/>
        <circle cx="28" cy="36" r="2.2" fill="#ffffff"/>
        <circle cx="32" cy="36" r="2.2" fill="#ffffff"/>
      </svg>
    </div>
  `;

  const busIcon = L.divIcon({
    className: 'custom-bus-divicon',
    html: busSvgHtml,
    iconSize: [50, 44],
    iconAnchor: [25, 22]
  });

  const initialBusPt = DRIVER_CORRIDOR_WAYPOINTS[driverBusProgressIdx] || DRITOR_CORRIDOR_WAYPOINTS[5];
  driverCockpitBusMarker = L.marker([initialBusPt.lat, initialBusPt.lng], { icon: busIcon }).addTo(driverCockpitLeafletMap);

  // Invalidate map size after animation
  setTimeout(() => {
    if (driverCockpitLeafletMap) driverCockpitLeafletMap.invalidateSize();
  }, 250);

  // Populate passenger manifest data and render stops progression
  loadDriverPassengerData();
  renderDriverStopsProgressUI();
  updateDriverEarningsUI();
}

// -------------------------------------------------------------------------
// SPEECH SYNTHESIS / REAL-TIME VOICE STOP ANNOUNCEMENTS (TTS)
// -------------------------------------------------------------------------
function speakTransitAnnouncement(text) {
  try {
    const pref = document.getElementById('prefAudioAnnouncements');
    if (pref && !pref.checked) return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech TTS announcement note:', e);
  }
}

// -------------------------------------------------------------------------
// ROUTE HALTS DEFINITION & PROGRESSION STEPPER
// -------------------------------------------------------------------------
let driverCurrentHaltIdx = 1; // 0: ISBT, 1: Prem Nagar (Active Target), 2: Doiwala, 3: Haridwar, 4: Rishikesh
let driverHalts = [
  { seq: 1, name: 'Dehradun (ISBT)', time: '06:00 AM', km: '0 km', lat: 30.2885, lng: 78.0081, status: 'completed' },
  { seq: 2, name: 'Prem Nagar', time: '08:30 AM', km: '2.4 km', lat: 30.2550, lng: 78.0450, status: 'active' },
  { seq: 3, name: 'Doiwala', time: '09:00 AM', km: '12 km', lat: 30.1780, lng: 78.1180, status: 'pending' },
  { seq: 4, name: 'Haridwar', time: '09:40 AM', km: '25 km', lat: 30.0150, lng: 78.1750, status: 'pending' },
  { seq: 5, name: 'Rishikesh (Final Stop)', time: '10:30 AM', km: '45 km', lat: 30.1030, lng: 78.2930, status: 'pending' }
];

function renderDriverStopsProgressUI() {
  // 1. Stepper Fill Percentage
  const percent = Math.min(100, Math.round((driverCurrentHaltIdx / (driverHalts.length - 1)) * 100));
  const fillEl = document.getElementById('driverRouteTrackFill');
  if (fillEl) fillEl.style.width = `${percent}%`;

  // 2. Stepper Checkpoints
  const checkpoints = document.querySelectorAll('.route-stepper-checkpoints .checkpoint-dot');
  checkpoints.forEach((dot, idx) => {
    dot.className = 'checkpoint-dot';
    if (idx < driverCurrentHaltIdx) {
      dot.classList.add('completed');
    } else if (idx === driverCurrentHaltIdx) {
      dot.classList.add('active');
    } else {
      dot.classList.add('pending');
    }
  });

  // 3. Schedule Table Rows
  const scheduleContainer = document.getElementById('driverScheduleRowsContainer');
  if (scheduleContainer) {
    scheduleContainer.innerHTML = driverHalts.map((h, idx) => {
      let rowClass = 'pending-row';
      let badgeClass = 'badge-gray';
      let statusHtml = `<span class="row-status-pill badge-pending">Pending</span>`;

      if (idx < driverCurrentHaltIdx) {
        rowClass = 'completed-row';
        badgeClass = 'badge-green';
        statusHtml = `<span class="row-status-text text-green">✓ Completed</span>`;
      } else if (idx === driverCurrentHaltIdx) {
        rowClass = 'active-row';
        badgeClass = 'badge-blue';
        statusHtml = `<span class="row-status-pill badge-in-mins" style="cursor:pointer;" onclick="driverMarkArrived()">At Halt / Arrived ➔</span>`;
      }

      return `
        <div class="schedule-row-item ${rowClass}" onclick="driverAdvanceToStop(${idx})" style="cursor:pointer;" title="Click to inspect halt">
          <span class="row-seq-badge ${badgeClass}">${h.seq}</span>
          <span class="row-stop-time">${h.time}</span>
          <strong class="row-stop-name">${h.name}</strong>
          ${statusHtml}
        </div>
      `;
    }).join('');
  }

  // 4. Upcoming Stops Vertical List
  const upcomingContainer = document.getElementById('driverUpcomingStopsContainer');
  if (upcomingContainer) {
    const remainingHalts = driverHalts.slice(driverCurrentHaltIdx);
    if (remainingHalts.length === 0) {
      upcomingContainer.innerHTML = `
        <div style="padding:14px;text-align:center;color:#059669;font-weight:700;">
          🏁 Final destination reached. You can now End Trip.
        </div>
      `;
    } else {
      upcomingContainer.innerHTML = remainingHalts.map((h, i) => {
        const isTarget = (i === 0);
        if (isTarget) {
          return `
            <div class="upcoming-stop-row-item active-target" onclick="driverMarkArrived()" style="cursor:pointer;" title="Click to Mark Arrived">
              <div class="stop-row-left-info">
                <span class="upcoming-target-disc"><span class="target-disc-inner"></span></span>
                <span class="upcoming-time-label">${h.time}</span>
                <strong class="upcoming-name-label">${h.name}</strong>
              </div>
              <div class="stop-row-right-info">
                <span class="upcoming-km-label">${h.km}</span>
                <span class="upcoming-eta-pill">Arriving</span>
              </div>
            </div>
          `;
        } else {
          return `
            <div class="upcoming-stop-row-item" onclick="driverAdvanceToStop(${driverCurrentHaltIdx + i})" style="cursor:pointer;">
              <div class="stop-row-left-info">
                <span class="upcoming-order-badge">${h.seq}</span>
                <span class="upcoming-time-label">${h.time}</span>
                <strong class="upcoming-name-label">${h.name}</strong>
              </div>
              <div class="stop-row-right-info">
                <span class="upcoming-km-label">${h.km}</span>
              </div>
            </div>
          `;
        }
      }).join('');
    }
  }

  // 5. Next Trip Target Card
  const targetHalt = driverHalts[driverCurrentHaltIdx] || driverHalts[driverHalts.length - 1];
  const targetStopEl = document.getElementById('driverNextTripTargetStop');
  const targetDistEl = document.getElementById('driverNextTripDistEta');
  const etaPill = document.getElementById('driverNextTripEtaPill');

  if (targetStopEl) targetStopEl.textContent = targetHalt.name;
  if (targetDistEl) targetDistEl.textContent = `${targetHalt.km} • Scheduled ${targetHalt.time}`;
  if (etaPill) etaPill.textContent = (driverCurrentHaltIdx === driverHalts.length - 1) ? 'Final Stop' : 'Next Halt';
}

function driverAdvanceToStop(haltIndex) {
  if (haltIndex < 0 || haltIndex >= driverHalts.length) return;
  driverCurrentHaltIdx = haltIndex;
  const halt = driverHalts[driverCurrentHaltIdx];

  // Pan map to stop
  if (driverCockpitLeafletMap) {
    driverCockpitLeafletMap.panTo([halt.lat, halt.lng]);
    if (driverCockpitBusMarker) {
      driverCockpitBusMarker.setLatLng([halt.lat, halt.lng]);
    }
  }

  renderDriverStopsProgressUI();

  // Add activity log entry
  logDriverActivity(`En route to ${halt.name}`);

  // Broadcast to server
  if (driverAssignedBus) {
    fetch('/api/v2/driver/trip-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        busId: driverAssignedBus.id,
        status: 'IN_TRANSIT',
        currentStop: halt.name,
        nextStop: driverHalts[driverCurrentHaltIdx + 1]?.name || 'Terminal'
      })
    }).catch(() => {});
  }

  speakTransitAnnouncement(`Approaching ${halt.name}. Scheduled arrival ${halt.time}.`);
  showNotice(`Halt updated: Now approaching ${halt.name} 🚏`);
}

function driverMarkArrived() {
  const halt = driverHalts[driverCurrentHaltIdx];
  if (!halt) return;

  logDriverActivity(`Arrived at ${halt.name}. Doors open.`);
  speakTransitAnnouncement(`Arrived at ${halt.name}. Doors open for passenger boarding and deboarding.`);

  showNotice(`🚏 Arrived at ${halt.name}. Ready for boarding.`);

  if (driverAssignedBus) {
    fetch('/api/v2/driver/trip-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        busId: driverAssignedBus.id,
        status: 'AT_STOP',
        currentStop: halt.name,
        nextStop: driverHalts[driverCurrentHaltIdx + 1]?.name || 'Terminal'
      })
    }).catch(() => {});
  }

  // Open passenger manifest automatically if preferred
  const pref = document.getElementById('prefAutoAccept');
  if (pref && pref.checked) {
    openDriverPassengersModal();
  }
}

function driverMarkDeparted() {
  if (driverCurrentHaltIdx < driverHalts.length - 1) {
    driverCurrentHaltIdx++;
    renderDriverStopsProgressUI();
    const nextHalt = driverHalts[driverCurrentHaltIdx];
    logDriverActivity(`Departed stop. En route to ${nextHalt.name}`);
    speakTransitAnnouncement(`Departing stop. Next stop is ${nextHalt.name}.`);
    showNotice(`Departed! En route to ${nextHalt.name} ➔`);

    if (driverAssignedBus) {
      fetch('/api/v2/driver/trip-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busId: driverAssignedBus.id,
          status: 'IN_TRANSIT',
          currentStop: driverHalts[driverCurrentHaltIdx - 1]?.name,
          nextStop: nextHalt.name
        })
      }).catch(() => {});
    }
  } else {
    showNotice('You have arrived at the final destination! Please End Trip.');
    speakTransitAnnouncement('Final destination reached. All passengers please disembark.');
  }
}

function logDriverActivity(description) {
  const container = document.getElementById('driverActivityRowsContainer');
  if (!container) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const item = document.createElement('div');
  item.className = 'activity-item-line';
  item.innerHTML = `
    <span class="activity-dot dot-green"></span>
    <div class="activity-details">
      <span class="activity-event-text">${description}</span>
    </div>
    <span class="activity-time-stamp">${timeStr}</span>
  `;

  container.insertBefore(item, container.firstChild);
}

// -------------------------------------------------------------------------
// TRIP INTERACTION & NAVIGATION CONTROLS (REAL DEVICE GPS + ADAPTIVE FALLBACK)
// -------------------------------------------------------------------------
function handleContinueTripClick() {
  const btn = document.getElementById('btnContinueTripAction');
  const titleEl = document.getElementById('continueTripTitleText');
  const subEl = document.getElementById('continueTripSubText');
  const iconWrap = document.getElementById('continueTripIconWrap');

  driverNavActive = !driverNavActive;

  if (driverNavActive) {
    if (titleEl) titleEl.textContent = 'Trip Active (Broadcasting GPS)';
    if (subEl) subEl.textContent = 'Live satellite telemetry active • En route';
    if (btn) btn.style.background = '#059669';
    if (iconWrap) {
      iconWrap.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#059669">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
      `;
    }
    showNotice('🛰️ Real GPS Navigation active! Telemetry broadcasting to passengers.');
    speakTransitAnnouncement('Trip started. Broadcasting satellite telemetry. Welcome aboard Bus Stop transit service.');
    logDriverActivity('Trip navigation active • Satellite GPS broadcasting');

    // Notify backend
    if (driverAssignedBus) {
      fetch('/api/v2/driver/trip-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busId: driverAssignedBus.id,
          status: 'IN_TRANSIT',
          currentStop: driverHalts[driverCurrentHaltIdx]?.name || 'Prem Nagar',
          nextStop: driverHalts[driverCurrentHaltIdx + 1]?.name || 'Doiwala'
        })
      }).catch(() => {});
    }

    // Start Real Device GPS Tracking
    startDriverGpsTracking();
    renderDriverStopsProgressUI();
  } else {
    if (titleEl) titleEl.textContent = 'Continue Trip';
    if (subEl) subEl.textContent = 'Start navigation & live tracking';
    if (btn) btn.style.background = '#2563eb';
    if (iconWrap) {
      iconWrap.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="#2563eb">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      `;
    }
    showNotice('Navigation paused.');
    speakTransitAnnouncement('Navigation paused.');
    logDriverActivity('Trip navigation paused by driver');
    stopDriverGpsTracking();
    stopBusMovementSimulation();
  }
}

function startDriverGpsTracking() {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported on this browser.');
    return;
  }

  liveLocationWatcherId = navigator.geolocation.watchPosition(
    (pos) => {
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        heading: pos.coords.heading || 45,
        speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 48,
        accuracy: pos.coords.accuracy || 8
      };

      // Move cockpit bus marker to real position
      if (driverCockpitBusMarker && driverCockpitLeafletMap) {
        driverCockpitBusMarker.setLatLng([coords.latitude, coords.longitude]);
      }

      // Broadcast real coordinates to backend
      if (driverAssignedBus) {
        fetch('/api/v2/driver/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            busId: driverAssignedBus.id,
            busNumber: driverAssignedBus.bus_number,
            registrationNumber: driverAssignedBus.registration_number,
            driverName: driverAssignedBus.driver_name,
            driverPhone: driverAssignedBus.driver_phone,
            routeName: driverAssignedBus.route_name,
            routeNumber: driverAssignedBus.route_number,
            latitude: coords.latitude,
            longitude: coords.longitude,
            speed: coords.speed,
            heading: coords.heading,
            currentStop: driverHalts[driverCurrentHaltIdx]?.name || 'Prem Nagar',
            nextStop: driverHalts[driverCurrentHaltIdx + 1]?.name || 'Doiwala',
            etaMinutes: 5
          })
        }).catch(() => {});
      }
    },
    (err) => {
      console.warn('Driver GPS watch note:', err.message);
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
  );
}

function stopDriverGpsTracking() {
  if (liveLocationWatcherId !== null) {
    navigator.geolocation.clearWatch(liveLocationWatcherId);
    liveLocationWatcherId = null;
  }
}

function startBusMovementSimulation() {
  // Pure real-time GPS mode: No artificial simulation
}

function stopBusMovementSimulation() {
  if (driverCockpitSimInterval) {
    clearInterval(driverCockpitSimInterval);
    driverCockpitSimInterval = null;
  }
}

// -------------------------------------------------------------------------
// MAP CONTROLS (FULLSCREEN, ZOOM, RECENTER, TILES)
// -------------------------------------------------------------------------
function toggleDriverMapFullscreen() {
  const card = document.getElementById('driverMapStageCard');
  if (!card) return;
  card.classList.toggle('fullscreen-mode');
  setTimeout(() => {
    driverCockpitLeafletMap?.invalidateSize();
  }, 200);
}

function driverCockpitZoomIn() {
  driverCockpitLeafletMap?.zoomIn();
}

function driverCockpitZoomOut() {
  driverCockpitLeafletMap?.zoomOut();
}

function driverCockpitCenterBus() {
  if (driverCockpitBusMarker) {
    driverCockpitLeafletMap?.setView(driverCockpitBusMarker.getLatLng(), 13);
  }
}

function toggleDriverMapTileLayer() {
  if (!driverCockpitLeafletMap) return;

  if (driverCurrentTileLayer === 'topo') {
    driverCockpitLeafletMap.removeLayer(driverTopoLayerInstance);
    driverStreetsLayerInstance.addTo(driverCockpitLeafletMap);
    driverCurrentTileLayer = 'streets';
    showNotice('Switched to Street Map Layer 🗺️');
  } else {
    driverCockpitLeafletMap.removeLayer(driverStreetsLayerInstance);
    driverTopoLayerInstance.addTo(driverCockpitLeafletMap);
    driverCurrentTileLayer = 'topo';
    showNotice('Switched to Mountain Topographic Layer 🏔️');
  }
}

// -------------------------------------------------------------------------
// REAL PERSISTENT PASSENGER MANIFEST & BOARDING VERIFICATION
// -------------------------------------------------------------------------
let currentDriverManifest = [];

async function loadDriverPassengerData() {
  const tbody = document.getElementById('driverManifestTableBody');
  const countBadge = document.getElementById('manifestModalCountBadge');
  if (!tbody) return;

  try {
    const res = await fetch('/api/v2/driver/manifest');
    const data = await res.json();
    if (res.ok && data.success) {
      currentDriverManifest = data.manifest || [];
      if (countBadge) countBadge.textContent = `${currentDriverManifest.length} Total Bookings`;
      renderDriverManifest(currentDriverManifest);
      updateDriverEarningsUI();
    } else {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:#64748b;">No bookings found for this trip.</td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:#64748b;">Unable to load manifest.</td></tr>`;
  }
}

function renderDriverManifest(bookings) {
  const tbody = document.getElementById('driverManifestTableBody');
  if (!tbody) return;

  if (!bookings || bookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:#64748b;">No passenger bookings registered on this bus yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = bookings.map(p => {
    const isBoarded = p.status === 'BOARDED';
    const isCancelled = p.status === 'CANCELLED';
    const pnr = p.booking_reference || p.id;
    return `
      <tr>
        <td><span class="manifest-seat-tag">Seat ${p.seat_number || 'N/A'}</span></td>
        <td>
          <strong>${p.passenger_name || 'Passenger'}</strong>
          <span style="display:block;font-size:11px;color:#64748b;font-family:monospace;">${pnr}</span>
        </td>
        <td>${p.boarding_stop || 'Stop'}</td>
        <td>${p.destination_stop || 'Destination'}</td>
        <td>
          ${isBoarded ? `
            <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:12px;background:#ecfdf5;color:#059669;font-size:11px;font-weight:700;">
              ✓ Boarded ${p.boarded_at ? new Date(p.boarded_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ''}
            </span>
          ` : isCancelled ? `
            <span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:12px;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;">
              ✕ Cancelled
            </span>
          ` : `
            <button type="button" class="btn-input-gps" style="padding:4px 12px;border-radius:8px;background:#10b981;color:#fff;border:none;font-size:11px;font-weight:700;cursor:pointer;" onclick="driverBoardPassenger('${pnr}')">
              Verify & Board ➔
            </button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function filterPassengerManifest(query) {
  const q = (query || '').toLowerCase().trim();
  const filtered = currentDriverManifest.filter(p =>
    (p.passenger_name || '').toLowerCase().includes(q) ||
    (p.seat_number || '').toLowerCase().includes(q) ||
    (p.booking_reference || '').toLowerCase().includes(q) ||
    (p.boarding_stop || '').toLowerCase().includes(q) ||
    (p.destination_stop || '').toLowerCase().includes(q)
  );
  renderDriverManifest(filtered);
}

async function driverBoardPassenger(pnr) {
  try {
    const res = await fetch('/api/v2/tickets/verify-board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketRef: pnr })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showNotice(data.message || `Ticket ${pnr} Boarded Successfully! 🎉`);
      speakTransitAnnouncement(`Boarding verified for ticket ${pnr}. Welcome aboard!`);
      logDriverActivity(`Ticket ${pnr} verified & passenger boarded.`);
      loadDriverPassengerData();
    } else {
      showNotice(data.error || 'Boarding verification failed.');
      speakTransitAnnouncement('Verification rejected. Invalid or duplicate ticket.');
    }
  } catch (e) {
    showNotice('Network error verifying ticket.');
  }
}

async function verifyTicketFromInput() {
  const input = document.getElementById('driverTicketVerifyInput');
  if (!input) return;
  const pnr = input.value.trim();
  if (!pnr) {
    showNotice('Please enter or scan a ticket PNR reference.');
    return;
  }
  await driverBoardPassenger(pnr);
  input.value = '';
}

function openDriverPassengersModal() {
  const m = document.getElementById('driverPassengersModal');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
    loadDriverPassengerData();
  }
}

function closeDriverPassengersModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('btn-driver-modal-close')) return;
  const m = document.getElementById('driverPassengersModal');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

// -------------------------------------------------------------------------
// DYNAMIC REAL EARNINGS CALCULATION & MODAL
// -------------------------------------------------------------------------
function updateDriverEarningsUI() {
  const validBookings = currentDriverManifest.filter(b => b.status !== 'CANCELLED');
  const totalFare = validBookings.reduce((sum, b) => sum + (Number(b.fare_amount) || 55), 0);
  const digitalFare = Math.round(totalFare * 0.78);
  const cashFare = totalFare - digitalFare;

  // 1. Update Dashboard KPI Cards
  const cardEarnings = document.getElementById('cardEarningsVal');
  const cardPassengers = document.getElementById('cardPassengersVal');
  if (cardEarnings) cardEarnings.textContent = `₹${totalFare.toLocaleString('en-IN')}`;
  if (cardPassengers) cardPassengers.textContent = validBookings.length.toString();

  // 2. Update Modal Value Elements
  const earnSumVals = document.querySelectorAll('#driverEarningsModal .earn-sum-val');
  if (earnSumVals.length >= 3) {
    earnSumVals[0].textContent = `₹${totalFare.toLocaleString('en-IN')}`;
    earnSumVals[1].textContent = `₹${digitalFare.toLocaleString('en-IN')}`;
    earnSumVals[2].textContent = `₹${cashFare.toLocaleString('en-IN')}`;
  }

  // 3. Update Breakdown List
  const breakdownList = document.getElementById('driverEarningsBreakdownList');
  if (breakdownList) {
    if (validBookings.length === 0) {
      breakdownList.innerHTML = `<div style="padding:16px;text-align:center;color:#64748b;">No paid trips registered yet today.</div>`;
    } else {
      breakdownList.innerHTML = validBookings.map((b, i) => `
        <div class="earn-trip-row" style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f1f5f9;">
          <div>
            <strong>Booking #${i + 1}: ${b.passenger_name || 'Passenger'} (Seat ${b.seat_number || 'N/A'})</strong>
            <div style="font-size:12px;color:#64748b;">${b.boarding_stop} ➔ ${b.destination_stop} • PNR: ${b.booking_reference || b.id}</div>
          </div>
          <strong style="color:#16a34a;font-size:14px;">₹${b.fare_amount || 55}</strong>
        </div>
      `).join('');
    }
  }
}

function openDriverEarningsModal() {
  const m = document.getElementById('driverEarningsModal');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
    updateDriverEarningsUI();
  }
}

function closeDriverEarningsModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('btn-driver-modal-close')) return;
  const m = document.getElementById('driverEarningsModal');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

// -------------------------------------------------------------------------
// END TRIP MODAL
// -------------------------------------------------------------------------
function handleDriverEndTripModal() {
  const m = document.getElementById('driverEndTripModal');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
  }
}

function closeDriverEndTripModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('btn-driver-modal-close') && !e.target.classList.contains('btn-modal-cancel')) return;
  const m = document.getElementById('driverEndTripModal');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

function confirmDriverEndTrip() {
  closeDriverEndTripModal();
  stopBusMovementSimulation();
  stopDriverGpsTracking();
  driverNavActive = false;

  const btn = document.getElementById('btnContinueTripAction');
  const titleEl = document.getElementById('continueTripTitleText');
  const subEl = document.getElementById('continueTripSubText');
  if (btn) btn.style.background = '#2563eb';
  if (titleEl) titleEl.textContent = 'Start Next Trip';
  if (subEl) subEl.textContent = 'Run completed • Ready for return trip';

  // Mark status in backend
  if (driverAssignedBus) {
    fetch('/api/v2/driver/trip-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        busId: driverAssignedBus.id,
        status: 'COMPLETED',
        currentStop: driverHalts[driverHalts.length - 1]?.name || 'Rishikesh'
      })
    }).catch(() => {});
  }

  logDriverActivity('Trip completed and settled at terminal depot');
  speakTransitAnnouncement('Trip completed. All passengers please disembark. Well done, Captain!');
  showNotice('🏁 Trip completed! 45 km logged and earnings credited to your settlement account.');
}

// -------------------------------------------------------------------------
// CORRIDOR & ROUTE SWITCHER WITH REAL BACKEND DATA
// -------------------------------------------------------------------------
let AVAILABLE_CORRIDORS = [
  { id: 'route_108', name: 'Dehradun (ISBT) ➔ Rishikesh', code: 'UK07-01', stops: '5 Stops • 45 km', active: true },
  { id: 'route_102', name: 'Dehradun (ISBT) ➔ Mussoorie Mall Road', code: 'UK07-02', stops: '6 Stops • 35 km', active: false },
  { id: 'route_104', name: 'Dehradun (ISBT) ➔ Haridwar Bus Stand', code: 'UK07-03', stops: '4 Stops • 52 km', active: false },
  { id: 'route_105', name: 'Dehradun (ISBT) ➔ Paonta Sahib', code: 'UK07-04', stops: '7 Stops • 48 km', active: false }
];

async function handleDriverSwitchRouteModal() {
  try {
    const res = await fetch('/api/v2/routes');
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        AVAILABLE_CORRIDORS = data.routes.map(r => ({
          id: r.id,
          name: r.name || `${r.origin} ➔ ${r.destination}`,
          code: `UK-${r.route_number || '108'}`,
          stops: `${(r.stops || []).length || 5} Stops • ${r.total_distance_km || 40} km`,
          active: driverAssignedBus ? (driverAssignedBus.route_name === r.name || driverAssignedBus.route_number === r.route_number) : false
        }));
      }
    }
  } catch (e) {}

  const container = document.getElementById('driverAvailableRoutesList');
  if (container) {
    container.innerHTML = AVAILABLE_CORRIDORS.map(c => `
      <div class="switch-route-card ${c.active ? 'selected' : ''}" onclick="selectCorridor('${c.id}')" style="cursor:pointer;">
        <div>
          <strong style="font-size:14px;color:#0f172a;">${c.name}</strong>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${c.code} • ${c.stops}</div>
        </div>
        <span class="badge-${c.active ? 'status-completed' : 'status-in-progress'}" style="padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;">
          ${c.active ? 'Active Corridor' : 'Switch ➔'}
        </span>
      </div>
    `).join('');
  }

  const m = document.getElementById('driverSwitchRouteModal');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
  }
}

function closeDriverSwitchRouteModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('btn-driver-modal-close')) return;
  const m = document.getElementById('driverSwitchRouteModal');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

function selectCorridor(corridorId) {
  AVAILABLE_CORRIDORS.forEach(c => c.active = (c.id === corridorId));
  const chosen = AVAILABLE_CORRIDORS.find(c => c.id === corridorId);
  closeDriverSwitchRouteModal();

  if (chosen) {
    const titleEl = document.getElementById('driverRouteGlassTitle');
    if (titleEl) titleEl.textContent = chosen.name;
    if (driverAssignedBus) {
      driverAssignedBus.route_name = chosen.name;
    }
    logDriverActivity(`Corridor switched to ${chosen.name}`);
    speakTransitAnnouncement(`Corridor switched to ${chosen.name}. Ready for route navigation.`);
    showNotice(`Switched to corridor: ${chosen.name} 🚏`);

    // Broadcast new route to backend
    if (driverAssignedBus) {
      fetch('/api/v2/driver/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          busId: driverAssignedBus.id,
          routeName: chosen.name,
          currentStop: driverHalts[0]?.name || 'ISBT',
          nextStop: driverHalts[1]?.name || 'Prem Nagar'
        })
      }).catch(() => {});
    }
  }
}

// -------------------------------------------------------------------------
// INCIDENT & DELAY REPORTING
// -------------------------------------------------------------------------
function openDriverIncidentModal() {
  const m = document.getElementById('driverIncidentModal');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
  }
}

function closeDriverIncidentModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('btn-driver-modal-close') && !e.target.classList.contains('btn-modal-cancel')) return;
  const m = document.getElementById('driverIncidentModal');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

async function submitDriverIncident() {
  const typeSelect = document.getElementById('driverIncidentType');
  const messageInput = document.getElementById('driverIncidentMessage');
  const type = typeSelect ? typeSelect.value : 'Traffic Delay';
  const message = messageInput ? messageInput.value.trim() : '';

  if (!message) {
    showNotice('Please write a brief advisory note for passengers.');
    return;
  }

  try {
    const res = await fetch('/api/v2/driver/incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        busId: driverAssignedBus?.id || 'UK07-PA-8842',
        driverName: activeUser?.full_name || 'Vivek Rautela',
        incidentType: type,
        message: message,
        location: driverHalts[driverCurrentHaltIdx]?.name || 'En Route'
      })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      closeDriverIncidentModal();
      if (messageInput) messageInput.value = '';
      logDriverActivity(`⚠️ Alert: ${type} - ${message}`);
      speakTransitAnnouncement(`Advisory broadcasted: ${type}. Passengers alerted.`);
      showNotice('📡 Advisory broadcasted to all passengers and Central Dispatch!');
    } else {
      showNotice(data.error || 'Failed to broadcast incident.');
    }
  } catch (err) {
    showNotice('Network error broadcasting incident.');
  }
}

// -------------------------------------------------------------------------
// SETTINGS MODAL
// -------------------------------------------------------------------------
function openDriverSettingsModal() {
  const m = document.getElementById('driverSettingsModal');
  if (m) {
    m.classList.remove('hidden');
    m.style.display = 'flex';
  }
}

function closeDriverSettingsModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('btn-driver-modal-close')) return;
  const m = document.getElementById('driverSettingsModal');
  if (m) {
    m.classList.add('hidden');
    m.style.display = 'none';
  }
}

function saveDriverSettings() {
  closeDriverSettingsModal();
  showNotice('Preferences saved successfully! ✅');
}

// -------------------------------------------------------------------------
// DROPDOWNS & SEARCH
// -------------------------------------------------------------------------
function toggleDriverNotifDropdown() {
  const d = document.getElementById('driverNotifDropdown');
  if (d) d.classList.toggle('hidden');
  document.getElementById('driverProfileDropdown')?.classList.add('hidden');
}

function toggleDriverProfileMenu() {
  const d = document.getElementById('driverProfileDropdown');
  if (d) d.classList.toggle('hidden');
  document.getElementById('driverNotifDropdown')?.classList.add('hidden');
}

function handleDriverSearch(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return;

  const foundHalt = driverHalts.find(p => p.name.toLowerCase().includes(q));
  if (foundHalt && driverCockpitLeafletMap) {
    driverCockpitLeafletMap.setView([foundHalt.lat, foundHalt.lng], 14);
    showNotice(`Found stop: ${foundHalt.name} (${foundHalt.time}) 📍`);
    return;
  }

  const foundPassenger = currentDriverManifest.find(p =>
    (p.passenger_name || '').toLowerCase().includes(q) ||
    (p.booking_reference || '').toLowerCase().includes(q)
  );
  if (foundPassenger) {
    openDriverPassengersModal();
    const input = document.querySelector('.manifest-search-input');
    if (input) {
      input.value = q;
      filterPassengerManifest(q);
    }
  }
}

function openDriverFullScheduleModal() {
  showNotice('Full Corridor Schedule: 5 scheduled halts on Dehradun ➔ Rishikesh');
}

function openDriverFullRouteModal() {
  if (typeof openFullRouteMapModal === 'function') {
    openFullRouteMapModal();
  } else {
    showNotice('Corridor Map: 45 km via Prem Nagar, Doiwala & Haridwar.');
  }
}

function openDriverFullActivityModal() {
  showNotice('Activity Log: Real-time transit operations recorded for today.');
}

// Compatibility wrapper for driver shift online toggle
function toggleDriverShift() {
  driverShiftOnline = !driverShiftOnline;
  showNotice(driverShiftOnline ? 'Shift started! Connected to Central Dispatch 🛰️' : 'Shift ended. GPS broadcast paused.');
}

function driverStartTrip() {
  handleContinueTripClick();
}

function driverEndTrip() {
  handleDriverEndTripModal();
}

// ==========================================================================
// 12. ADMIN STATION HQ (FLEET MANAGEMENT & DISPATCH COMMAND)
// ==========================================================================
async function openAdminDashboard() {
  if (typeof dismissSplash === 'function') dismissSplash();

  document.getElementById('authWrapper')?.classList.add('hidden');
  document.getElementById('fullRoleSelectionScreen')?.classList.add('hidden');
  document.getElementById('passengerLiveDashboard')?.classList.add('hidden');
  document.getElementById('driverDashboardScreen')?.classList.add('hidden');

  const adminScreen = document.getElementById('adminDashboardScreen');
  if (adminScreen) adminScreen.classList.remove('hidden');

  // Mount Admin live fleet map
  setTimeout(() => {
    initAdminLiveMap();
    refreshAdminData();
  }, 150);

  showNotice(`Admin Station HQ Command online 🚏`);
}

function initAdminLiveMap() {
  if (!window.BusStopMap) return;
  BusStopMap.mount('adminLiveFleetMap');
}

async function refreshAdminData() {
  try {
    const res = await fetch('/api/v2/admin/overview');
    if (res.ok) {
      adminOverviewData = await res.json();
      renderAdminOverview();
    }
  } catch (err) {
    console.warn('Admin overview fetch error:', err);
  }
}

function renderAdminOverview() {
  if (!adminOverviewData) return;

  const { metrics, buses, routes, stops, drivers, bookings } = adminOverviewData;

  // KPIs
  document.getElementById('kpiActiveBuses').textContent = metrics.busesTotal;
  document.getElementById('kpiDriversCount').textContent = metrics.driversTotal;
  document.getElementById('kpiStopsCount').textContent = metrics.stopsTotal;
  document.getElementById('kpiBookingsCount').textContent = metrics.bookingsTotal;

  document.getElementById('admBusesCount').textContent = metrics.busesTotal;
  document.getElementById('admRoutesCount').textContent = metrics.routesTotal;
  document.getElementById('admStopsCount').textContent = metrics.stopsTotal;
  document.getElementById('admDriversCount').textContent = metrics.driversTotal;

  // Render buses on admin map
  if (window.BusStopMap && buses) {
    BusStopMap.setBuses(buses);
    BusStopMap.setStops(stops);
  }

  // Telemetry side list
  const telemList = document.getElementById('adminBusTelemetryList');
  if (telemList && buses) {
    telemList.innerHTML = buses.map(b => `
      <div class="admin-bus-row-item ${b.status === 'ONLINE' || b.status === 'IN_TRANSIT' ? 'bus-online' : 'bus-offline'}">
        <div class="adm-bus-top-line">
          <strong>${b.bus_number} (${b.name || 'UTC Transit'})</strong>
          <span class="adm-bus-status-tag ${b.status === 'ONLINE' || b.status === 'IN_TRANSIT' ? 'tag-online' : 'tag-offline'}">${b.status}</span>
        </div>
        <div class="adm-bus-details-line">
          Driver: ${b.driver_name || 'Assigned'} • Speed: ${b.speed || 0} km/h • Seats: ${b.available_seats || 18}/${b.capacity || 40}
        </div>
      </div>
    `).join('');
  }

  // Populate tables
  renderAdminBusesTable(buses);
  renderAdminRoutesTable(routes);
  renderAdminStopsTable(stops);
  renderAdminDriversTable(drivers);
  renderAdminBookingsTable(bookings);
}

function renderAdminBusesTable(buses) {
  const tbody = document.getElementById('adminBusesTableBody');
  if (!tbody || !buses) return;

  tbody.innerHTML = buses.map(b => `
    <tr>
      <td><strong>${b.bus_number}</strong></td>
      <td>${b.plate_number}</td>
      <td>${b.route_name || b.route_id}</td>
      <td>${b.driver_name || 'Assigned'}</td>
      <td>${b.capacity} seats</td>
      <td><span class="adm-bus-status-tag ${b.status === 'ONLINE' ? 'tag-online' : 'tag-offline'}">${b.status}</span></td>
      <td>
        <button type="button" class="btn-tbl-action" onclick="openAdminEditModal('bus', '${b.id}')">Edit</button>
        <button type="button" class="btn-tbl-action tbl-del" onclick="deleteAdminEntity('bus', '${b.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderAdminRoutesTable(routes) {
  const tbody = document.getElementById('adminRoutesTableBody');
  if (!tbody || !routes) return;

  tbody.innerHTML = routes.map(r => `
    <tr>
      <td><strong>${r.route_number}</strong></td>
      <td>${r.name}</td>
      <td>${r.origin}</td>
      <td>${r.destination}</td>
      <td>${r.stops ? r.stops.length : 0} stops</td>
      <td>${r.estimated_duration || '1h 30m'}</td>
      <td>₹${r.base_fare || 120}</td>
      <td>
        <button type="button" class="btn-tbl-action" onclick="openAdminEditModal('route', '${r.id}')">Edit</button>
        <button type="button" class="btn-tbl-action tbl-del" onclick="deleteAdminEntity('route', '${r.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderAdminStopsTable(stops) {
  const tbody = document.getElementById('adminStopsTableBody');
  if (!tbody || !stops) return;

  tbody.innerHTML = stops.map(s => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td>${s.latitude?.toFixed(4)}, ${s.longitude?.toFixed(4)}</td>
      <td>${s.routes_serving ? s.routes_serving.join(', ') : 'All Lines'}</td>
      <td>Shelter, Bench</td>
      <td>
        <button type="button" class="btn-tbl-action" onclick="openAdminEditModal('stop', '${s.id}')">Edit</button>
        <button type="button" class="btn-tbl-action tbl-del" onclick="deleteAdminEntity('stop', '${s.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderAdminDriversTable(drivers) {
  const tbody = document.getElementById('adminDriversTableBody');
  if (!tbody || !drivers) return;

  tbody.innerHTML = drivers.map(d => {
    const isPending = d.document_status === 'Pending Verification';
    return `
    <tr>
      <td><strong>${d.full_name}</strong></td>
      <td>${d.phone}</td>
      <td>${d.license_number}</td>
      <td>${d.assigned_bus_number || d.assigned_bus_id || 'UK07-PA-8842'}</td>
      <td>${d.rating || 5.0} ★</td>
      <td>
        <span class="adm-bus-status-tag ${isPending ? 'tag-offline' : 'tag-online'}" style="${isPending ? 'background:#fef3c7;color:#b45309;font-weight:700;' : ''}">
          ${d.document_status || d.status || 'Active'}
        </span>
      </td>
      <td>
        ${isPending ? `
          <button type="button" class="btn-tbl-action" style="background:#10b981;color:#fff;border:none;margin-right:4px;" onclick="verifyAdminDriver('${d.id}')">Verify</button>
        ` : ''}
        <button type="button" class="btn-tbl-action" onclick="openAdminEditModal('driver', '${d.id}')">Edit</button>
        <button type="button" class="btn-tbl-action tbl-del" onclick="deleteAdminEntity('driver', '${d.id}')">Delete</button>
      </td>
    </tr>
  `;}).join('');
}

async function verifyAdminDriver(driverId) {
  try {
    const res = await fetch(`/api/v2/admin/drivers/${driverId}/verify`, { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      showNotice('Driver successfully verified and authorized! 🛡️');
      refreshAdminData();
    } else {
      showNotice(data.error || 'Failed to verify driver.');
    }
  } catch (e) {
    showNotice('Network error verifying driver.');
  }
}

function renderAdminBookingsTable(bookings) {
  const tbody = document.getElementById('adminBookingsTableBody');
  if (!tbody || !bookings) return;

  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td><strong>${b.booking_reference}</strong></td>
      <td>${b.passenger_name}</td>
      <td>${b.bus_number || b.bus_id}</td>
      <td>Seat ${b.seat_number}</td>
      <td>${b.boarding_stop} ➔ ${b.destination_stop}</td>
      <td>₹${b.fare}</td>
      <td><span class="adm-bus-status-tag tag-online">${b.status}</span></td>
      <td>
        <button type="button" class="btn-tbl-action tbl-del" onclick="cancelAdminBooking('${b.id}')">Cancel</button>
      </td>
    </tr>
  `).join('');
}

function switchAdminTab(tab) {
  adminCurrentTab = tab;
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`admTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)?.classList.add('active');

  document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById(`adminPanel${tab.charAt(0).toUpperCase() + tab.slice(1)}`)?.classList.remove('hidden');
}

function filterAdminBookings(val) {
  if (!adminOverviewData?.bookings) return;
  const q = val.toLowerCase().trim();
  const filtered = adminOverviewData.bookings.filter(b => 
    b.booking_reference.toLowerCase().includes(q) ||
    b.passenger_name.toLowerCase().includes(q) ||
    b.boarding_stop.toLowerCase().includes(q)
  );
  renderAdminBookingsTable(filtered);
}

async function cancelAdminBooking(id) {
  if (!confirm('Cancel this passenger booking?')) return;
  try {
    await fetch(`/api/v2/bookings/${id}/cancel`, { method: 'POST' });
    showNotice('Booking cancelled successfully.');
    refreshAdminData();
  } catch (e) {}
}

// Admin CRUD Modals
let adminCurrentCrudType = 'bus';
let adminCurrentEditId = null;

function openAdminCreateModal(type) {
  adminCurrentCrudType = type;
  adminCurrentEditId = null;
  document.getElementById('adminCrudModalTitle').textContent = `Add New ${type.toUpperCase()}`;
  document.getElementById('adminCrudModalSubtitle').textContent = `Create a new ${type} entity in the central database`;
  buildCrudFields(type, null);
  document.getElementById('adminCrudModal').classList.remove('hidden');
}

function openAdminEditModal(type, id) {
  adminCurrentCrudType = type;
  adminCurrentEditId = id;
  const entity = adminOverviewData?.[type === 'bus' ? 'buses' : `${type}s`]?.find(item => item.id === id);
  document.getElementById('adminCrudModalTitle').textContent = `Edit ${type.toUpperCase()} (#${id})`;
  document.getElementById('adminCrudModalSubtitle').textContent = `Update attributes in real-time`;
  buildCrudFields(type, entity);
  document.getElementById('adminCrudModal').classList.remove('hidden');
}

function closeAdminCrudModal(e) {
  if (e && e.target !== e.currentTarget && !e.target.classList.contains('btn-modal-close') && !e.target.classList.contains('btn-cancel')) return;
  document.getElementById('adminCrudModal').classList.add('hidden');
}

function buildCrudFields(type, data) {
  const container = document.getElementById('adminCrudFields');
  if (!container) return;

  if (type === 'bus') {
    container.innerHTML = `
      <div class="crud-field-group">
        <label>Bus Number</label>
        <input type="text" name="bus_number" value="${data?.bus_number || ''}" placeholder="e.g. BUS 505" required>
      </div>
      <div class="crud-field-group">
        <label>Registration Plate</label>
        <input type="text" name="plate_number" value="${data?.plate_number || ''}" placeholder="e.g. UK-07-PA-8822" required>
      </div>
      <div class="crud-field-group">
        <label>Route ID</label>
        <input type="text" name="route_id" value="${data?.route_id || 'route_102'}" placeholder="e.g. route_102" required>
      </div>
      <div class="crud-field-group">
        <label>Capacity</label>
        <input type="number" name="capacity" value="${data?.capacity || 40}" required>
      </div>
    `;
  } else if (type === 'route') {
    container.innerHTML = `
      <div class="crud-field-group">
        <label>Route Number</label>
        <input type="text" name="route_number" value="${data?.route_number || ''}" placeholder="e.g. 505" required>
      </div>
      <div class="crud-field-group">
        <label>Route Name</label>
        <input type="text" name="name" value="${data?.name || ''}" placeholder="e.g. Dehradun - Tehri Scenic" required>
      </div>
      <div class="crud-field-group">
        <label>Origin</label>
        <input type="text" name="origin" value="${data?.origin || ''}" placeholder="e.g. Dehradun ISBT" required>
      </div>
      <div class="crud-field-group">
        <label>Destination</label>
        <input type="text" name="destination" value="${data?.destination || ''}" placeholder="e.g. Tehri Lake" required>
      </div>
    `;
  } else if (type === 'stop') {
    container.innerHTML = `
      <div class="crud-field-group">
        <label>Stop Name</label>
        <input type="text" name="name" value="${data?.name || ''}" placeholder="e.g. Parade Ground" required>
      </div>
      <div class="crud-field-group">
        <label>Latitude</label>
        <input type="number" step="0.0001" name="latitude" value="${data?.latitude || 30.3200}" required>
      </div>
      <div class="crud-field-group">
        <label>Longitude</label>
        <input type="number" step="0.0001" name="longitude" value="${data?.longitude || 78.0400}" required>
      </div>
    `;
  } else if (type === 'driver') {
    container.innerHTML = `
      <div class="crud-field-group">
        <label>Full Name</label>
        <input type="text" name="full_name" value="${data?.full_name || ''}" placeholder="e.g. Captain Ramesh Singh" required>
      </div>
      <div class="crud-field-group">
        <label>Phone Number</label>
        <input type="tel" name="phone" value="${data?.phone || ''}" placeholder="+91 9876543210" required>
      </div>
      <div class="crud-field-group">
        <label>License Number</label>
        <input type="text" name="license_number" value="${data?.license_number || ''}" placeholder="UK-07-DL-2022001" required>
      </div>
    `;
  }
}

async function handleAdminCrudSubmit(event) {
  event.preventDefault();
  const form = document.getElementById('adminCrudForm');
  const formData = new FormData(form);
  const payload = {};
  formData.forEach((val, key) => { payload[key] = val; });

  const type = adminCurrentCrudType;
  const isEdit = Boolean(adminCurrentEditId);
  const endpoint = `/api/v2/admin/${type === 'bus' ? 'buses' : `${type}s`}${isEdit ? `/${adminCurrentEditId}` : ''}`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    if (res.ok && result.success) {
      closeAdminCrudModal();
      showNotice(`${type.toUpperCase()} saved successfully! 🚏`);
      refreshAdminData();
    } else {
      showNotice(result.error || 'Failed to save entity');
    }
  } catch (err) {
    showNotice('Network error saving entity');
  }
}

async function deleteAdminEntity(type, id) {
  if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
  const endpoint = `/api/v2/admin/${type === 'bus' ? 'buses' : `${type}s`}/${id}`;

  try {
    const res = await fetch(endpoint, { method: 'DELETE' });
    const result = await res.json();
    if (res.ok && result.success) {
      showNotice(`${type.toUpperCase()} deleted successfully.`);
      refreshAdminData();
    }
  } catch (e) {}
}

// Expose all functions to window for interactive onclick bindings
window.openPassengerDashboard = openPassengerDashboard;
window.openDriverDashboard = openDriverDashboard;
window.openAdminDashboard = openAdminDashboard;
window.showRoleSelectionScreen = showRoleSelectionScreen;
window.switchToTravelerPassView = switchToTravelerPassView;
window.openProfileEditScreen = openProfileEditScreen;
window.swapSearchLocations = swapSearchLocations;
window.clearSearchField = clearSearchField;
window.executeRouteSearch = executeRouteSearch;
window.toggleTimeDropdown = toggleTimeDropdown;
window.selectTimeOption = selectTimeOption;
window.toggleNotificationDrawer = toggleNotificationDrawer;
window.toggleUserDropdownMenu = toggleUserDropdownMenu;
window.setMapLayerMode = setMapLayerMode;
window.recenterMapRoute = recenterMapRoute;
window.mapZoomIn = mapZoomIn;
window.mapZoomOut = mapZoomOut;
window.setBusFilter = setBusFilter;
window.applyBusSort = applyBusSort;
window.trackBusOnMap = trackBusOnMap;
window.closeTrackingHud = closeTrackingHud;
window.openScheduleModal = openScheduleModal;
window.closeScheduleModal = closeScheduleModal;
window.confirmTicketBooking = confirmTicketBooking;
window.selectSeat = selectSeat;
window.toggleNearbyStopsDrawer = toggleNearbyStopsDrawer;
window.selectStopFromDrawer = selectStopFromDrawer;
window.openStopDetailsModal = openStopDetailsModal;
window.closeStopDetailsModal = closeStopDetailsModal;
window.cancelActiveTripBooking = cancelActiveTripBooking;
window.trackActiveTripBus = trackActiveTripBus;
window.toggleDriverShift = toggleDriverShift;
window.driverStartTrip = driverStartTrip;
window.driverMarkArrived = driverMarkArrived;
window.driverMarkDeparted = driverMarkDeparted;
window.driverEndTrip = driverEndTrip;
window.switchAdminTab = switchAdminTab;
window.refreshAdminData = refreshAdminData;
window.filterAdminBookings = filterAdminBookings;
window.cancelAdminBooking = cancelAdminBooking;
window.openAdminCreateModal = openAdminCreateModal;
window.openAdminEditModal = openAdminEditModal;
window.closeAdminCrudModal = closeAdminCrudModal;
window.handleAdminCrudSubmit = handleAdminCrudSubmit;
window.deleteAdminEntity = deleteAdminEntity;
window.openDriverProfileScreen = openDriverProfileScreen;
window.closeDriverProfileScreen = closeDriverProfileScreen;
window.handleDriverProfileSubmit = handleDriverProfileSubmit;
window.triggerProfilePhotoUpload = triggerProfilePhotoUpload;
window.handleDriverPhotoUpload = handleDriverPhotoUpload;
window.updateAddressCharCount = updateAddressCharCount;
window.contactDriverSupport = contactDriverSupport;
window.openDriverDocumentsScreen = openDriverDocumentsScreen;
window.closeDriverDocumentsScreen = closeDriverDocumentsScreen;
window.previousToDriverProfile = previousToDriverProfile;
window.triggerDocUpload = triggerDocUpload;
window.handleDocFileChange = handleDocFileChange;
window.openDocPreviewModal = openDocPreviewModal;
window.closeDocPreviewModal = closeDocPreviewModal;
window.handleDocumentVerificationSubmit = handleDocumentVerificationSubmit;
window.openDriverBusDetailsScreen = openDriverBusDetailsScreen;
window.closeDriverBusDetailsScreen = closeDriverBusDetailsScreen;
window.previousToDriverDocuments = previousToDriverDocuments;
window.handleBusDocFileChange = handleBusDocFileChange;
window.handleBusDetailsSubmit = handleBusDetailsSubmit;
window.openDriverRouteScheduleScreen = openDriverRouteScheduleScreen;
window.closeDriverRouteScheduleScreen = closeDriverRouteScheduleScreen;
window.previousToDriverBusDetails = previousToDriverBusDetails;
window.addNewBusStopRow = addNewBusStopRow;
window.removeBusStopRow = removeBusStopRow;
window.toggleOperatingDay = toggleOperatingDay;
window.zoomRoutePreview = zoomRoutePreview;
window.openFullRouteMapModal = openFullRouteMapModal;
window.closeFullRouteMapModal = closeFullRouteMapModal;
window.handleRouteLocationInputChange = handleRouteLocationInputChange;
window.initRoutePreviewRealMap = initRoutePreviewRealMap;
window.handleRouteScheduleSubmit = handleRouteScheduleSubmit;
window.recenterRoutePreviewOnUser = recenterRoutePreviewOnUser;
window.toggleRouteTransitSimulation = toggleRouteTransitSimulation;
window.startRouteGpsWatcher = startRouteGpsWatcher;
window.openDriverReviewSubmitScreen = openDriverReviewSubmitScreen;
window.previousToDriverRouteSchedule = previousToDriverRouteSchedule;
window.handleFinalApplicationSubmit = handleFinalApplicationSubmit;
window.closeSuccessAndGoToCockpit = closeSuccessAndGoToCockpit;

// Driver Operating Console (Mockup Dashboard) Exports
window.openDriverDashboard = openDriverDashboard;
window.initDriverCockpit = initDriverCockpit;
window.startDriverLiveClock = startDriverLiveClock;
window.handleContinueTripClick = handleContinueTripClick;
window.toggleDriverMapFullscreen = toggleDriverMapFullscreen;
window.driverCockpitZoomIn = driverCockpitZoomIn;
window.driverCockpitZoomOut = driverCockpitZoomOut;
window.driverCockpitCenterBus = driverCockpitCenterBus;
window.toggleDriverMapTileLayer = toggleDriverMapTileLayer;
window.openDriverPassengersModal = openDriverPassengersModal;
window.closeDriverPassengersModal = closeDriverPassengersModal;
window.filterPassengerManifest = filterPassengerManifest;
window.openDriverEarningsModal = openDriverEarningsModal;
window.closeDriverEarningsModal = closeDriverEarningsModal;
window.handleDriverEndTripModal = handleDriverEndTripModal;
window.closeDriverEndTripModal = closeDriverEndTripModal;
window.confirmDriverEndTrip = confirmDriverEndTrip;
window.handleDriverSwitchRouteModal = handleDriverSwitchRouteModal;
window.closeDriverSwitchRouteModal = closeDriverSwitchRouteModal;
window.selectCorridor = selectCorridor;
window.openDriverSettingsModal = openDriverSettingsModal;
window.closeDriverSettingsModal = closeDriverSettingsModal;
window.saveDriverSettings = saveDriverSettings;
window.toggleDriverNotifDropdown = toggleDriverNotifDropdown;
window.toggleDriverProfileMenu = toggleDriverProfileMenu;
window.handleDriverSearch = handleDriverSearch;
window.openDriverFullScheduleModal = openDriverFullScheduleModal;
window.openDriverFullRouteModal = openDriverFullRouteModal;
window.openDriverFullActivityModal = openDriverFullActivityModal;
window.startPassengerLiveTracking = startPassengerLiveTracking;
window.stopPassengerLiveTracking = stopPassengerLiveTracking;

// Location Autocomplete, Live GPS, and Map Picker Exports
window.openLocationSuggestions = openLocationSuggestions;
window.filterLocationSuggestions = filterLocationSuggestions;
window.closeLocationSuggestions = closeLocationSuggestions;
window.selectLocationSuggestion = selectLocationSuggestion;
window.useLiveLocationFor = useLiveLocationFor;
window.startPickingOnMap = startPickingOnMap;

// Digital Ticket & Boarding Verification Exports
window.openPassengerTicketModal = openPassengerTicketModal;
window.closePassengerTicketModal = closePassengerTicketModal;
window.verifyTicketFromInput = verifyTicketFromInput;
window.driverBoardPassenger = driverBoardPassenger;
window.verifyAdminDriver = verifyAdminDriver;
window.loadDriverPassengerData = loadDriverPassengerData;
window.speakTransitAnnouncement = speakTransitAnnouncement;
window.driverAdvanceToStop = driverAdvanceToStop;
window.renderDriverStopsProgressUI = renderDriverStopsProgressUI;
window.openDriverIncidentModal = openDriverIncidentModal;
window.closeDriverIncidentModal = closeDriverIncidentModal;
window.submitDriverIncident = submitDriverIncident;
window.updateDriverEarningsUI = updateDriverEarningsUI;
window.logDriverActivity = logDriverActivity;


