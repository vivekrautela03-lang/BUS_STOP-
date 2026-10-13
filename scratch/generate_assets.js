const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(__dirname, '..', 'mobile', 'assets');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// 1. Master Icon SVG (1024x1024)
// Modern, geometric composition combining:
// - A rounded modern bus silhouette in crisp white & soft light blue
// - Panoramic curved windshield
// - A winding road motif curving under the bus
// - A vibrant location beacon / transit pin
// - Background: Deep Navy #142B45 with radial gradient toward electric blue #2589E8
const iconSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#142B45"/>
      <stop offset="60%" stop-color="#1D3E64"/>
      <stop offset="100%" stop-color="#2589E8"/>
    </linearGradient>

    <!-- Bus Body Gradient -->
    <linearGradient id="busBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#EAF5FF"/>
    </linearGradient>

    <!-- Windshield Gradient -->
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2589E8"/>
      <stop offset="100%" stop-color="#142B45"/>
    </linearGradient>

    <!-- Road Highway Gradient -->
    <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="50%" stop-color="#60A5FA"/>
      <stop offset="100%" stop-color="#2589E8"/>
    </linearGradient>

    <!-- Soft Drop Shadows -->
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="0" stdDeviation="18" flood-color="#38BDF8" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Base Rounded Container -->
  <rect width="1024" height="1024" rx="224" fill="url(#bgGrad)"/>

  <!-- Subtle Outer Route Ring Track -->
  <circle cx="512" cy="512" r="410" fill="none" stroke="#2589E8" stroke-width="8" stroke-dasharray="16 24" opacity="0.25"/>

  <!-- Dynamic Highway Path Curving Upward -->
  <path d="M 120 780 C 320 860, 420 680, 512 680 C 604 680, 700 860, 904 780" 
        fill="none" stroke="url(#roadGrad)" stroke-width="32" stroke-linecap="round" opacity="0.9" filter="url(#glow)"/>

  <!-- Road Dashed Centerline -->
  <path d="M 160 785 C 330 855, 430 685, 512 685 C 594 685, 690 855, 864 785" 
        fill="none" stroke="#FFFFFF" stroke-width="8" stroke-dasharray="24 28" stroke-linecap="round" opacity="0.85"/>

  <!-- Pin Beacon Marker Behind Bus -->
  <g transform="translate(512, 280)" filter="url(#shadow)">
    <path d="M 0 -80 C 55 -80, 100 -35, 100 20 C 100 80, 0 170, 0 170 C 0 170, -100 80, -100 20 C -100 -35, -55 -80, 0 -80 Z" 
          fill="#38BDF8" opacity="0.95"/>
    <circle cx="0" cy="20" r="40" fill="#FFFFFF"/>
    <circle cx="0" cy="20" r="22" fill="#2589E8"/>
  </g>

  <!-- Main Hero Bus Silhouette -->
  <g transform="translate(256, 310)" filter="url(#shadow)">
    <!-- Bus Shell -->
    <path d="M 64 80 
             C 64 36, 100 0, 144 0 
             L 368 0 
             C 412 0, 448 36, 448 80 
             L 448 300 
             C 448 332, 422 358, 390 358 
             L 122 358 
             C 90 358, 64 332, 64 300 
             Z" 
          fill="url(#busBodyGrad)"/>

    <!-- Front Panoramic Windshield (Upper Half) -->
    <path d="M 96 68 
             C 96 48, 116 32, 136 32 
             L 376 32 
             C 396 32, 416 48, 416 68 
             L 416 172 
             L 96 172 
             Z" 
          fill="url(#glassGrad)"/>

    <!-- Windshield Reflection Glare -->
    <path d="M 112 48 L 220 48 L 160 160 L 100 160 Z" fill="#FFFFFF" opacity="0.2"/>

    <!-- Destination Display Board (LED) -->
    <rect x="180" y="44" width="152" height="24" rx="8" fill="#142B45" opacity="0.8"/>
    <circle cx="210" cy="56" r="4" fill="#38BDF8"/>
    <circle cx="230" cy="56" r="4" fill="#38BDF8"/>
    <circle cx="250" cy="56" r="4" fill="#38BDF8"/>
    <circle cx="270" cy="56" r="4" fill="#38BDF8"/>
    <circle cx="290" cy="56" r="4" fill="#38BDF8"/>

    <!-- Lower Grill & Front Bumper -->
    <rect x="184" y="272" width="144" height="20" rx="10" fill="#CBD5E1"/>
    <rect x="204" y="278" width="104" height="8" rx="4" fill="#64748B"/>

    <!-- Dual Twin LED Headlights (Electric Blue & Amber) -->
    <!-- Left Light Cluster -->
    <g transform="translate(100, 240)">
      <rect width="64" height="32" rx="12" fill="#E2E8F0"/>
      <circle cx="20" cy="16" r="10" fill="#38BDF8" filter="url(#glow)"/>
      <circle cx="48" cy="16" r="7" fill="#F59E0B"/>
    </g>

    <!-- Right Light Cluster -->
    <g transform="translate(348, 240)">
      <rect width="64" height="32" rx="12" fill="#E2E8F0"/>
      <circle cx="16" cy="16" r="7" fill="#F59E0B"/>
      <circle cx="44" cy="16" r="10" fill="#38BDF8" filter="url(#glow)"/>
    </g>

    <!-- Wheels & Tires -->
    <!-- Left Wheel -->
    <g transform="translate(90, 326)">
      <rect width="64" height="68" rx="20" fill="#0F172A"/>
      <rect x="10" y="10" width="44" height="48" rx="14" fill="#334155"/>
      <circle cx="32" cy="34" r="12" fill="#CBD5E1"/>
    </g>

    <!-- Right Wheel -->
    <g transform="translate(358, 326)">
      <rect width="64" height="68" rx="20" fill="#0F172A"/>
      <rect x="10" y="10" width="44" height="48" rx="14" fill="#334155"/>
      <circle cx="32" cy="34" r="12" fill="#CBD5E1"/>
    </g>

    <!-- Under-Chassis Neon Glow -->
    <ellipse cx="256" cy="390" rx="180" ry="16" fill="#38BDF8" opacity="0.45" filter="url(#glow)"/>
  </g>
</svg>
`;

// 2. Adaptive Icon Foreground (Transparent background with icon element centered in safe zone)
const adaptiveForegroundSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="busBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#EAF5FF"/>
    </linearGradient>
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2589E8"/>
      <stop offset="100%" stop-color="#142B45"/>
    </linearGradient>
    <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#2589E8"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Highway Path in Safe Zone -->
  <path d="M 220 740 C 360 800, 440 670, 512 670 C 584 670, 664 800, 804 740" 
        fill="none" stroke="url(#roadGrad)" stroke-width="28" stroke-linecap="round"/>
  <path d="M 260 745 C 370 795, 450 675, 512 675 C 574 675, 654 795, 764 745" 
        fill="none" stroke="#FFFFFF" stroke-width="6" stroke-dasharray="20 22" stroke-linecap="round"/>

  <!-- Pin Beacon -->
  <g transform="translate(512, 320)" filter="url(#shadow)">
    <path d="M 0 -70 C 45 -70, 80 -35, 80 15 C 80 65, 0 140, 0 140 C 0 140, -80 65, -80 15 C -80 -35, -45 -70, 0 -70 Z" 
          fill="#38BDF8"/>
    <circle cx="0" cy="15" r="32" fill="#FFFFFF"/>
    <circle cx="0" cy="15" r="18" fill="#2589E8"/>
  </g>

  <!-- Hero Bus (Scale adjusted to 75% for Android adaptive safe circle) -->
  <g transform="translate(307, 340) scale(0.8)" filter="url(#shadow)">
    <path d="M 64 80 C 64 36, 100 0, 144 0 L 368 0 C 412 0, 448 36, 448 80 L 448 300 C 448 332, 422 358, 390 358 L 122 358 C 90 358, 64 332, 64 300 Z" 
          fill="url(#busBodyGrad)"/>
    <path d="M 96 68 C 96 48, 116 32, 136 32 L 376 32 C 396 32, 416 48, 416 68 L 416 172 L 96 172 Z" 
          fill="url(#glassGrad)"/>
    <rect x="180" y="44" width="152" height="24" rx="8" fill="#142B45" opacity="0.8"/>
    <rect x="184" y="272" width="144" height="20" rx="10" fill="#CBD5E1"/>
    
    <g transform="translate(100, 240)">
      <rect width="64" height="32" rx="12" fill="#E2E8F0"/>
      <circle cx="20" cy="16" r="10" fill="#38BDF8"/>
      <circle cx="48" cy="16" r="7" fill="#F59E0B"/>
    </g>
    <g transform="translate(348, 240)">
      <rect width="64" height="32" rx="12" fill="#E2E8F0"/>
      <circle cx="16" cy="16" r="7" fill="#F59E0B"/>
      <circle cx="44" cy="16" r="10" fill="#38BDF8"/>
    </g>

    <g transform="translate(90, 326)">
      <rect width="64" height="68" rx="20" fill="#0F172A"/>
      <circle cx="32" cy="34" r="12" fill="#CBD5E1"/>
    </g>
    <g transform="translate(358, 326)">
      <rect width="64" height="68" rx="20" fill="#0F172A"/>
      <circle cx="32" cy="34" r="12" fill="#CBD5E1"/>
    </g>
  </g>
</svg>
`;

// 3. Adaptive Icon Background
const adaptiveBackgroundSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#142B45"/>
      <stop offset="60%" stop-color="#1D3E64"/>
      <stop offset="100%" stop-color="#2589E8"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bgGrad)"/>
  <circle cx="512" cy="512" r="410" fill="none" stroke="#2589E8" stroke-width="8" stroke-dasharray="16 24" opacity="0.2"/>
</svg>
`;

// 4. Premium Vertical Splash Screen (1284x2778)
const splashSvg = `
<svg width="1284" height="2778" viewBox="0 0 1284 2778" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="40%" stop-color="#F0F8FF"/>
      <stop offset="100%" stop-color="#E1F0FD"/>
    </linearGradient>
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#142B45"/>
      <stop offset="60%" stop-color="#2589E8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
    <filter id="splashShadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#142B45" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Clean, calming light blue/white backdrop -->
  <rect width="1284" height="2778" fill="url(#splashBg)"/>

  <!-- Subtle Top Decorative Curves -->
  <path d="M 0 0 C 400 120, 900 60, 1284 200 L 1284 0 Z" fill="#EAF5FF" opacity="0.6"/>

  <!-- Soft Mountain Horizon Contour in Background -->
  <path d="M 0 1800 C 350 1700, 750 1850, 1284 1750 L 1284 2778 L 0 2778 Z" fill="#E2F0FD" opacity="0.5"/>
  <path d="M 0 1960 C 450 1880, 900 2000, 1284 1910 L 1284 2778 L 0 2778 Z" fill="#D0E7FC" opacity="0.4"/>

  <!-- Centered Brand Card with Bus Mark -->
  <g transform="translate(642, 1140)" filter="url(#splashShadow)">
    <!-- Circle Glow Badge -->
    <circle cx="0" cy="-140" r="160" fill="#FFFFFF"/>
    <circle cx="0" cy="-140" r="150" fill="#EAF5FF"/>
    
    <!-- Mini Bus Silhouette -->
    <g transform="translate(-100, -240) scale(0.4)">
      <path d="M 64 80 C 64 36, 100 0, 144 0 L 368 0 C 412 0, 448 36, 448 80 L 448 300 C 448 332, 422 358, 390 358 L 122 358 C 90 358, 64 332, 64 300 Z" 
            fill="#2589E8"/>
      <path d="M 96 68 C 96 48, 116 32, 136 32 L 376 32 C 396 32, 416 48, 416 68 L 416 172 L 96 172 Z" 
            fill="#FFFFFF"/>
      <rect x="180" y="44" width="152" height="24" rx="8" fill="#142B45" opacity="0.8"/>
      <g transform="translate(100, 240)">
        <rect width="64" height="32" rx="12" fill="#FFFFFF"/>
        <circle cx="20" cy="16" r="10" fill="#38BDF8"/>
      </g>
      <g transform="translate(348, 240)">
        <rect width="64" height="32" rx="12" fill="#FFFFFF"/>
        <circle cx="44" cy="16" r="10" fill="#38BDF8"/>
      </g>
      <circle cx="122" cy="360" r="28" fill="#142B45"/>
      <circle cx="390" cy="360" r="28" fill="#142B45"/>
    </g>

    <!-- Wordmark -->
    <text x="0" y="80" 
          font-family="system-ui, -apple-system, Roboto, sans-serif" 
          font-size="68" 
          font-weight="900" 
          letter-spacing="4" 
          text-anchor="middle" 
          fill="#142B45">
      BUS <tspan fill="#2589E8">STOP</tspan>
    </text>

    <!-- Transit Line Badge -->
    <rect x="-140" y="112" width="280" height="32" rx="16" fill="#EAF5FF"/>
    <text x="0" y="134" 
          font-family="system-ui, -apple-system, Roboto, sans-serif" 
          font-size="16" 
          font-weight="700" 
          letter-spacing="2" 
          text-anchor="middle" 
          fill="#2589E8">
      MOUNTAIN TRANSIT NETWORK
    </text>

    <!-- Tagline Required by spec: "Every journey starts somewhere." -->
    <text x="0" y="210" 
          font-family="system-ui, -apple-system, Roboto, sans-serif" 
          font-size="28" 
          font-weight="500" 
          font-style="italic" 
          text-anchor="middle" 
          fill="#64748B">
      Every journey starts somewhere.
    </text>
  </g>

  <!-- Bottom Version Indicator -->
  <text x="642" y="2640" 
        font-family="system-ui, -apple-system, Roboto, sans-serif" 
        font-size="20" 
        font-weight="600" 
        letter-spacing="1" 
        text-anchor="middle" 
        fill="#94A3B8">
    BUS STOP MOBILE &#8226; VERSION 2.0
  </text>
</svg>
`;

async function generateAllAssets() {
  console.log('[Assets] Generating production icon and splash screen assets...');

  // Save master SVG
  fs.writeFileSync(path.join(ASSETS_DIR, 'logo.svg'), iconSvg, 'utf-8');
  fs.writeFileSync(path.join(ASSETS_DIR, 'splash.svg'), splashSvg, 'utf-8');

  // 1. App Icon PNG (1024x1024)
  await sharp(Buffer.from(iconSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'icon.png'));
  console.log('✓ Created mobile/assets/icon.png (1024x1024)');

  // 2. Android Adaptive Icon Foreground (1024x1024)
  await sharp(Buffer.from(adaptiveForegroundSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'adaptive-icon.png'));
  console.log('✓ Created mobile/assets/adaptive-icon.png (1024x1024)');

  // 3. Android Adaptive Icon Background (1024x1024)
  await sharp(Buffer.from(adaptiveBackgroundSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(ASSETS_DIR, 'adaptive-icon-background.png'));
  console.log('✓ Created mobile/assets/adaptive-icon-background.png (1024x1024)');

  // 4. Splash Screen PNG (1284x2778)
  await sharp(Buffer.from(splashSvg))
    .resize(1284, 2778)
    .png()
    .toFile(path.join(ASSETS_DIR, 'splash.png'));
  console.log('✓ Created mobile/assets/splash.png (1284x2778)');

  // 5. Favicon PNG (192x192)
  await sharp(Buffer.from(iconSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(ASSETS_DIR, 'favicon.png'));
  console.log('✓ Created mobile/assets/favicon.png (192x192)');

  // Copy favicon to root assets for web sync as well
  const webAssetsDir = path.join(__dirname, '..', 'assets');
  if (fs.existsSync(webAssetsDir)) {
    fs.copyFileSync(path.join(ASSETS_DIR, 'favicon.png'), path.join(webAssetsDir, 'favicon.png'));
    console.log('✓ Synced favicon to web assets/favicon.png');
  }

  console.log('[Assets] All icon and splash assets successfully generated!');
}

generateAllAssets().catch(err => {
  console.error('[Assets] Generation error:', err);
  process.exit(1);
});
