// ============================================================================
// BUS STOP — PRODUCTION USER DATABASE & AUTHENTICATION SERVICE
// Persistent Database Table for Users, Passwords & Role Profiles
// Fully supports instant registration, secure login, and Supabase synchronization
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Database storage directory & table file
const DATA_DIR = path.join(__dirname, 'data');
const USERS_TABLE_FILE = path.join(DATA_DIR, 'users_table.json');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ----------------------------------------------------------------------------
// Helper: Hash & Verify Passwords with crypto.scrypt
// ----------------------------------------------------------------------------
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, storedHash) {
  const hash = hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch (e) {
    return false;
  }
}

// ----------------------------------------------------------------------------
// Database Table Operations (Atomic JSON File Table)
// ----------------------------------------------------------------------------
function readUsersTable() {
  if (!fs.existsSync(USERS_TABLE_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(USERS_TABLE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading users table file:', err);
    return [];
  }
}

function writeUsersTable(users) {
  try {
    const tempFile = USERS_TABLE_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf8');
    fs.renameSync(tempFile, USERS_TABLE_FILE);
    return true;
  } catch (err) {
    console.error('Error writing users table file:', err);
    return false;
  }
}

// Strip sensitive hashes before returning to client
function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, salt, ...safeUser } = user;
  return safeUser;
}

// ----------------------------------------------------------------------------
// Seed Initial Staff & Travelers if Table is Empty
// ----------------------------------------------------------------------------
function initDatabase() {
  const users = readUsersTable();
  console.log('[UserService] Verifying users database table profiles...');

  const defaultProfiles = [
    {
      id: '2e7c3865-4fda-42ed-b46d-141356e88003',
      email: 'vivekrautela03@gmail.com',
      password_raw: 'password123',
      full_name: 'Vivek Rautela',
      phone: '+91 90688 50966',
      role: 'passenger',
      badge_level: 'Scenic Mountain Line • Citizen Traveler',
      assigned_bus: null,
      shift_status: 'Active Pass Holder',
      avatar_url: 'assets/onboarding/who_passenger_thumb.jpg',
      dob: '10 Jul 2007',
      gender: 'Male',
      home_location: 'Dehradun, Uttarakhand',
      preferred_radius: '10 km'
    },
    {
      id: '2900b113-150a-4ede-9fe6-c7b67dece3b8',
      email: 'avantikam936@gmail.com',
      password_raw: 'password123',
      full_name: 'Avantika Mishra',
      phone: '+91 90688 50966',
      role: 'passenger',
      badge_level: 'Scenic Mountain Line • Citizen Traveler',
      assigned_bus: null,
      shift_status: 'Active Pass Holder',
      avatar_url: 'assets/onboarding/who_passenger_thumb.jpg',
      dob: '10 May 2007',
      gender: 'Female',
      home_location: 'Dehradun, Uttarakhand',
      preferred_radius: '10 km'
    },
    {
      id: '733ca121-d639-47f4-8e59-17d107a4e46d',
      email: 'shivanshmourya078@gmail.com',
      password_raw: 'password123',
      full_name: 'Shivansh Mourya',
      phone: '8439238588',
      role: 'driver',
      badge_level: 'Mountain Transit Authority • Fleet Captain',
      assigned_bus: '#BS-402',
      shift_status: 'Standby',
      avatar_url: 'assets/onboarding/who_driver_thumb.jpg',
      dob: '',
      gender: 'Male',
      home_location: 'Dehradun, Uttarakhand',
      preferred_radius: '10 km',
      license_number: 'DL-042023001894',
      license_expiry: '28 Oct 2030'
    }
  ];

  let modified = false;
  for (const def of defaultProfiles) {
    const existing = users.find(u => u.email === def.email.toLowerCase().trim());
    if (!existing) {
      const salt = crypto.randomBytes(16).toString('hex');
      const password_hash = hashPassword(def.password_raw, salt);
      users.push({
        id: def.id,
        email: def.email.toLowerCase().trim(),
        password_hash,
        salt,
        full_name: def.full_name,
        phone: def.phone,
        role: def.role,
        badge_level: def.badge_level,
        assigned_bus: def.assigned_bus,
        shift_status: def.shift_status,
        avatar_url: def.avatar_url,
        dob: def.dob || '',
        gender: def.gender || 'Not Specified',
        home_location: def.home_location || 'Dehradun, Uttarakhand',
        preferred_radius: def.preferred_radius || '10 km',
        license_number: def.license_number || '',
        license_expiry: def.license_expiry || '',
        document_status: 'Verified',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      modified = true;
    }
  }

  if (modified || users.length === 0) {
    writeUsersTable(users);
    console.log(`[UserService] Successfully verified/seeded users table (${users.length} active users).`);
  }
}

initDatabase();

// ----------------------------------------------------------------------------
// Core User Management & Authentication Functions
// ----------------------------------------------------------------------------

/**
 * Register a new user in the database table with rich profile details
 */
async function registerUser({
  email,
  password,
  fullName,
  phone,
  role,
  avatar_url,
  dob,
  gender,
  home_location,
  preferred_radius,
  license_number,
  license_expiry,
  aadhaar_number,
  documents,
  document_status
}) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const cleanEmail = email.toLowerCase().trim();
  const users = readUsersTable();

  // Check if user already exists
  const existing = users.find(u => u.email === cleanEmail);
  if (existing) {
    throw new Error('An account with this email already exists. Please login instead.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const password_hash = hashPassword(password, salt);
  const id = crypto.randomUUID();

  const chosenRole = (role === 'driver') ? 'driver' : ((role === 'station_master' || role === 'admin') ? 'admin' : 'passenger');
  const badgeLevel = chosenRole === 'driver' 
    ? 'Mountain Transit Authority • Fleet Captain' 
    : (chosenRole === 'admin' ? 'Regional Transit Headquarters • Chief Controller' : 'Scenic Mountain Line • Citizen Traveler');

  const newUser = {
    id,
    email: cleanEmail,
    password_hash,
    salt,
    full_name: fullName || cleanEmail.split('@')[0],
    phone: phone || '',
    role: chosenRole,
    badge_level: badgeLevel,
    assigned_bus: chosenRole === 'driver' ? '#BS-402' : null,
    shift_status: chosenRole === 'driver' ? 'Standby' : 'Active Pass Holder',
    avatar_url: avatar_url || (chosenRole === 'driver' ? 'assets/onboarding/who_driver_thumb.jpg' : 'assets/onboarding/who_passenger_thumb.jpg'),
    dob: dob || '10 Jul 2007',
    gender: gender || 'Male',
    home_location: home_location || 'Dehradun, Uttarakhand',
    preferred_radius: preferred_radius || '10 km',
    license_number: license_number || '',
    license_expiry: license_expiry || '',
    aadhaar_number: aadhaar_number || '',
    documents: documents || {},
    document_status: document_status || (chosenRole === 'driver' ? 'Pending Verification' : 'Verified'),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  users.push(newUser);
  writeUsersTable(users);

  console.log(`[UserService] New user registered and stored in database table: ${newUser.email} (ID: ${newUser.id}) [Role: ${newUser.role}]`);
  return sanitizeUser(newUser);
}

/**
 * Authenticate a user with email and password from the database table
 */
async function authenticateUser({ email, password }) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const cleanEmail = email.toLowerCase().trim();
  const users = readUsersTable();
  let user = users.find(u => u.email === cleanEmail);

  if (!user) {
    throw new Error('Account not found with this email. Click "Create Account" above to register!');
  }

  const isValid = verifyPassword(password, user.salt, user.password_hash);
  if (!isValid) {
    throw new Error('Incorrect password. Please verify and try again.');
  }

  console.log(`[UserService] User authenticated successfully: ${user.email} (Role: ${user.role})`);
  return sanitizeUser(user);
}

/**
 * Update user profile (e.g. role, phone, badge level, and profile details)
 */
async function updateUserProfile(id, updates) {
  if (!id) return null;

  const users = readUsersTable();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return null;
  }

  const user = users[index];
  if (updates.role) {
    user.role = (updates.role === 'admin' || updates.role === 'station_master') ? 'admin' : updates.role;
    user.badge_level = user.role === 'driver' 
      ? 'Mountain Transit Authority • Fleet Captain' 
      : (user.role === 'admin' ? 'Regional Transit Headquarters • Chief Controller' : 'Scenic Mountain Line • Citizen Traveler');
    if (user.role === 'driver' && !user.assigned_bus) {
      user.assigned_bus = '#BS-402';
    }
  }

  if (updates.full_name) user.full_name = updates.full_name;
  if (updates.phone !== undefined) user.phone = updates.phone;
  if (updates.avatar_url) user.avatar_url = updates.avatar_url;
  if (updates.dob !== undefined) user.dob = updates.dob;
  if (updates.gender !== undefined) user.gender = updates.gender;
  if (updates.home_location !== undefined) user.home_location = updates.home_location;
  if (updates.preferred_radius !== undefined) user.preferred_radius = updates.preferred_radius;
  if (updates.license_number !== undefined) user.license_number = updates.license_number;
  if (updates.license_expiry !== undefined) user.license_expiry = updates.license_expiry;
  if (updates.aadhaar_number !== undefined) user.aadhaar_number = updates.aadhaar_number;
  if (updates.documents !== undefined) user.documents = updates.documents;
  if (updates.document_status !== undefined) user.document_status = updates.document_status;
  if (updates.assigned_bus !== undefined) user.assigned_bus = updates.assigned_bus;
  if (updates.shift_status !== undefined) user.shift_status = updates.shift_status;
  user.updated_at = new Date().toISOString();

  users[index] = user;
  writeUsersTable(users);

  return sanitizeUser(user);
}

/**
 * Get user by ID
 */
function getUserById(id) {
  const users = readUsersTable();
  const user = users.find(u => u.id === id);
  return sanitizeUser(user);
}

/**
 * Get user by Email
 */
function getUserByEmail(email) {
  const cleanEmail = (email || '').toLowerCase().trim();
  const users = readUsersTable();
  const user = users.find(u => u.email === cleanEmail);
  return sanitizeUser(user);
}

/**
 * List all registered users
 */
function listUsers() {
  const users = readUsersTable();
  return users.map(sanitizeUser);
}

module.exports = {
  registerUser,
  authenticateUser,
  updateUserProfile,
  getUserById,
  getUserByEmail,
  listUsers
};
