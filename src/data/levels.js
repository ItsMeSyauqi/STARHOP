/**
 * STARHOP - Level configurations (10 Unique Stages)
 * Each level features distinctive themes, escalating mechanics, and unique entities:
 * - Level 1: First Orbit (Basic platforming, Coin Magnet, Shield)
 * - Level 2: Neon Drift (Moving shuttles across deep void)
 * - Level 3: Gravity Garden (Crumbling fragile asteroid bridges, Plasma Orbs, 2X Score)
 * - Level 4: Cosmic Core (Timed Pulsing Laser Gates)
 * - Level 5: Asteroid Belt (Kinetic Bounce Pads Catapulting high across asteroid chasms)
 * - Level 6: Nebula Storm (Zero-G Gravity Distortion Rifts with moon-jump physics)
 * - Level 7: Solar Flare (Maglev Conveyor Belts carrying player at high velocity)
 * - Level 8: Vortex Depths (Aerial Patrol Sentry Drones + Moving Lifts)
 * - Level 9: Supernova Remnant (Master Gauntlet: Bounce Pads + Laser Grids + Conveyors)
 * - Level 10: The Cosmic Throne (The Grand Finale Apex Citadel combining all mechanics)
 */

export const LEVELS = [
  // ==========================================================================
  // LEVEL 1: FIRST ORBIT (Training Ground)
  // ==========================================================================
  {
    id: 1,
    name: 'First Orbit',
    subtitle: 'Orbital Training Ground',
    description: 'Learn the fundamentals of zero-g platforming, jump timing, and coin harvesting.',
    worldWidth: 1600,
    worldHeight: 600,
    spawn: { x: 100, y: 440 },
    portal: { x: 1500, y: 430 },
    completionBonus: 1000,
    staticPlatforms: [
      { x: 140, y: 500, w: 260, h: 48 },
      { x: 380, y: 440, w: 140, h: 32 },
      { x: 580, y: 360, w: 180, h: 32 },
      { x: 840, y: 460, w: 220, h: 32 },
      { x: 1020, y: 380, w: 140, h: 32 },
      { x: 1220, y: 420, w: 160, h: 32 },
      { x: 1480, y: 500, w: 220, h: 48 }
    ],
    movingPlatforms: [
      { x: 720, y: 410, w: 90, h: 24, rangeX: 70, speedX: 55, rangeY: 0, speedY: 0 }
    ],
    crumblingPlatforms: [],
    bouncePads: [],
    laserGates: [],
    patrolDrones: [],
    conveyors: [],
    gravityRifts: [],
    hazards: [
      { x: 840, y: 440, type: 'spikes', w: 36, h: 18 }
    ],
    coins: [
      { x: 200, y: 450 }, { x: 240, y: 450 },
      { x: 380, y: 390 }, { x: 420, y: 390 },
      { x: 560, y: 310 }, { x: 600, y: 310 },
      { x: 720, y: 360 },
      { x: 890, y: 410 }, { x: 920, y: 410 },
      { x: 1020, y: 330 }, { x: 1060, y: 330 },
      { x: 1220, y: 370 }, { x: 1260, y: 370 }
    ],
    crystals: [
      { x: 1040, y: 280 }
    ],
    powerups: [
      { x: 340, y: 420, type: 'shield' },
      { x: 580, y: 310, type: 'magnet' }
    ]
  },

  // ==========================================================================
  // LEVEL 2: NEON DRIFT (Moving Shuttles)
  // ==========================================================================
  {
    id: 2,
    name: 'Neon Drift',
    subtitle: 'Kinetic Floating Islands',
    description: 'Traverse moving asteroid platforms across the neon void. Watch out for cosmic spikes!',
    worldWidth: 2300,
    worldHeight: 650,
    spawn: { x: 100, y: 490 },
    portal: { x: 2200, y: 450 },
    completionBonus: 2000,
    staticPlatforms: [
      { x: 120, y: 550, w: 220, h: 48 },
      { x: 340, y: 480, w: 120, h: 32 },
      { x: 740, y: 440, w: 180, h: 32 },
      { x: 1080, y: 340, w: 140, h: 32 },
      { x: 1400, y: 480, w: 240, h: 36 },
      { x: 1590, y: 450, w: 75, h: 24 },
      { x: 1760, y: 410, w: 130, h: 32 },
      { x: 2180, y: 530, w: 220, h: 48 }
    ],
    movingPlatforms: [
      { x: 530, y: 450, w: 90, h: 24, rangeX: 90, speedX: 65, rangeY: 0, speedY: 0 },
      { x: 930, y: 420, w: 90, h: 24, rangeX: 0, speedX: 0, rangeY: 70, speedY: 55 },
      { x: 1240, y: 430, w: 90, h: 24, rangeX: 75, speedX: 60, rangeY: 0, speedY: 0 },
      { x: 1960, y: 460, w: 90, h: 24, rangeX: 85, speedX: 70, rangeY: 0, speedY: 0 }
    ],
    crumblingPlatforms: [],
    bouncePads: [],
    laserGates: [],
    patrolDrones: [
      { x: 1120, y: 320, rangeX: 65, speedX: 55 }
    ],
    conveyors: [],
    gravityRifts: [],
    hazards: [
      { x: 740, y: 420, type: 'spikes', w: 36, h: 18 },
      { x: 1400, y: 460, type: 'spikes', w: 48, h: 18 }
    ],
    coins: [
      { x: 200, y: 500 }, { x: 340, y: 430 },
      { x: 530, y: 390 }, { x: 740, y: 380 },
      { x: 930, y: 320 }, { x: 1080, y: 280 },
      { x: 1240, y: 370 }, { x: 1360, y: 420 },
      { x: 1440, y: 420 }, { x: 1590, y: 400 },
      { x: 1760, y: 350 }, { x: 1960, y: 400 }
    ],
    crystals: [
      { x: 1080, y: 250 },
      { x: 1760, y: 330 }
    ],
    powerups: [
      { x: 880, y: 350, type: 'shield' },
      { x: 1590, y: 380, type: 'score2x' }
    ]
  },

  // ==========================================================================
  // LEVEL 3: GRAVITY GARDEN (Fragile Stepping Stones)
  // ==========================================================================
  {
    id: 3,
    name: 'Gravity Garden',
    subtitle: 'The Collapsing Ruins',
    description: 'Fragile floating platforms crumble beneath your feet! Pulsing plasma orbs guard the void.',
    worldWidth: 2600,
    worldHeight: 700,
    spawn: { x: 100, y: 520 },
    portal: { x: 2500, y: 470 },
    completionBonus: 3500,
    staticPlatforms: [
      { x: 120, y: 580, w: 220, h: 48 },
      { x: 420, y: 460, w: 120, h: 32 },
      { x: 1120, y: 430, w: 200, h: 32 },
      { x: 1680, y: 440, w: 140, h: 32 },
      { x: 2060, y: 490, w: 160, h: 32 },
      { x: 2480, y: 540, w: 220, h: 48 }
    ],
    movingPlatforms: [
      { x: 1440, y: 410, w: 85, h: 22, rangeX: 75, speedX: 65, rangeY: 0, speedY: 0 }
    ],
    crumblingPlatforms: [
      { x: 280, y: 520, w: 80, h: 22 },
      { x: 590, y: 440, w: 80, h: 22 },
      { x: 740, y: 440, w: 80, h: 22 },
      { x: 890, y: 440, w: 80, h: 22 },
      { x: 1280, y: 410, w: 80, h: 22 },
      { x: 1860, y: 460, w: 80, h: 22 },
      { x: 2240, y: 510, w: 80, h: 22 }
    ],
    bouncePads: [],
    laserGates: [],
    patrolDrones: [],
    conveyors: [],
    gravityRifts: [],
    hazards: [
      { x: 665, y: 390, type: 'plasma' },
      { x: 815, y: 390, type: 'plasma' },
      { x: 1120, y: 410, type: 'spikes', w: 40, h: 18 },
      { x: 1560, y: 380, type: 'plasma' }
    ],
    coins: [
      { x: 280, y: 470 }, { x: 420, y: 410 },
      { x: 590, y: 380 }, { x: 740, y: 380 },
      { x: 890, y: 380 }, { x: 1120, y: 360 },
      { x: 1280, y: 350 }, { x: 1440, y: 350 },
      { x: 1680, y: 370 }, { x: 1860, y: 400 },
      { x: 2060, y: 430 }, { x: 2240, y: 450 }
    ],
    crystals: [
      { x: 890, y: 320 },
      { x: 1680, y: 300 }
    ],
    powerups: [
      { x: 420, y: 410, type: 'shield' },
      { x: 1120, y: 330, type: 'score2x' },
      { x: 1680, y: 340, type: 'magnet' }
    ]
  },

  // ==========================================================================
  // LEVEL 4: COSMIC CORE (Laser Security Citadel) - NEW: Laser Gates!
  // ==========================================================================
  {
    id: 4,
    name: 'Cosmic Core',
    subtitle: 'Citadel of Energy',
    description: 'High-tech laser security corridors! Wait for the amber warning phase to clear before dashing.',
    worldWidth: 2800,
    worldHeight: 700,
    spawn: { x: 100, y: 520 },
    portal: { x: 2700, y: 480 },
    completionBonus: 5000,
    staticPlatforms: [
      { x: 120, y: 580, w: 220, h: 48 },
      { x: 450, y: 480, w: 160, h: 32 },
      { x: 880, y: 430, w: 200, h: 32 },
      { x: 1300, y: 440, w: 180, h: 32 },
      { x: 1720, y: 410, w: 220, h: 32 },
      { x: 2160, y: 460, w: 180, h: 32 },
      { x: 2680, y: 550, w: 220, h: 48 }
    ],
    movingPlatforms: [
      { x: 670, y: 450, w: 85, h: 22, rangeX: 75, speedX: 65, rangeY: 0, speedY: 0 },
      { x: 1510, y: 420, w: 85, h: 22, rangeX: 75, speedX: 70, rangeY: 0, speedY: 0 },
      { x: 1940, y: 430, w: 85, h: 22, rangeX: 70, speedX: 65, rangeY: 0, speedY: 0 },
      { x: 2420, y: 500, w: 85, h: 22, rangeX: 85, speedX: 75, rangeY: 0, speedY: 0 }
    ],
    crumblingPlatforms: [
      { x: 1100, y: 440, w: 75, h: 20 }
    ],
    bouncePads: [],
    // NEW: Timed Laser Gates
    laserGates: [
      { x: 880, y: 360, h: 70, periodMs: 2800, activeMs: 1400, offsetMs: 0 },
      { x: 1720, y: 340, h: 70, periodMs: 3200, activeMs: 1500, offsetMs: 800 },
      { x: 2160, y: 390, h: 70, periodMs: 2800, activeMs: 1300, offsetMs: 400 }
    ],
    patrolDrones: [
      { x: 1300, y: 350, rangeX: 70, speedX: 65 }
    ],
    conveyors: [],
    gravityRifts: [],
    hazards: [
      { x: 450, y: 460, type: 'spikes', w: 36, h: 18 }
    ],
    coins: [
      { x: 200, y: 520 }, { x: 450, y: 420 },
      { x: 670, y: 390 }, { x: 820, y: 380 }, { x: 940, y: 380 },
      { x: 1100, y: 380 }, { x: 1300, y: 380 },
      { x: 1510, y: 360 }, { x: 1720, y: 320 },
      { x: 1940, y: 370 }, { x: 2160, y: 370 }, { x: 2420, y: 430 }
    ],
    crystals: [
      { x: 1300, y: 320 },
      { x: 2160, y: 300 }
    ],
    powerups: [
      { x: 450, y: 420, type: 'shield' },
      { x: 1300, y: 350, type: 'magnet' }
    ]
  },

  // ==========================================================================
  // LEVEL 5: ASTEROID BELT (Kinetic Launchpad) - NEW: Bounce Pads!
  // ==========================================================================
  {
    id: 5,
    name: 'Asteroid Belt',
    subtitle: 'Kinetic Catapult',
    description: 'Massive void chasms! Step on Kinetic Bounce Pads to launch sky-high over shattered asteroids.',
    worldWidth: 3000,
    worldHeight: 750,
    spawn: { x: 100, y: 550 },
    portal: { x: 2900, y: 430 },
    completionBonus: 6000,
    staticPlatforms: [
      { x: 120, y: 610, w: 220, h: 48 },
      // Low launchpad ledge
      { x: 400, y: 570, w: 140, h: 32 },
      // Towering sky asteroid reached via bounce pad!
      { x: 620, y: 320, w: 160, h: 32 },
      { x: 1020, y: 460, w: 160, h: 32 },
      // High sky roost
      { x: 1280, y: 260, w: 160, h: 32 },
      { x: 1720, y: 480, w: 180, h: 32 },
      { x: 2200, y: 440, w: 180, h: 32 },
      { x: 2880, y: 510, w: 220, h: 48 }
    ],
    movingPlatforms: [
      { x: 820, y: 390, w: 85, h: 22, rangeX: 70, speedX: 65, rangeY: 0, speedY: 0 },
      { x: 1960, y: 460, w: 85, h: 22, rangeX: 85, speedX: 70, rangeY: 0, speedY: 0 },
      { x: 2540, y: 460, w: 85, h: 22, rangeX: 90, speedX: 75, rangeY: 0, speedY: 0 }
    ],
    crumblingPlatforms: [
      { x: 1480, y: 360, w: 80, h: 22 },
      { x: 1600, y: 420, w: 80, h: 22 },
      { x: 2380, y: 450, w: 80, h: 22 }
    ],
    // NEW: Kinetic Bounce Pads
    bouncePads: [
      { x: 400, y: 552 },
      { x: 1020, y: 442 },
      { x: 1720, y: 462 }
    ],
    laserGates: [],
    patrolDrones: [],
    conveyors: [],
    gravityRifts: [],
    hazards: [
      { x: 620, y: 300, type: 'spikes', w: 36, h: 18 },
      { x: 1140, y: 350, type: 'plasma' },
      { x: 2200, y: 420, type: 'spikes', w: 36, h: 18 }
    ],
    coins: [
      { x: 200, y: 550 },
      // Arch coins above bounce pad 1
      { x: 400, y: 440 }, { x: 430, y: 360 }, { x: 480, y: 300 },
      { x: 620, y: 260 }, { x: 820, y: 330 },
      // Arch coins above bounce pad 2
      { x: 1020, y: 340 }, { x: 1060, y: 250 }, { x: 1120, y: 200 },
      { x: 1280, y: 200 }, { x: 1480, y: 300 }, { x: 1720, y: 400 },
      { x: 1960, y: 400 }, { x: 2200, y: 370 }, { x: 2540, y: 400 }
    ],
    crystals: [
      { x: 1280, y: 150 },
      { x: 2380, y: 380 }
    ],
    powerups: [
      { x: 620, y: 230, type: 'score2x' },
      { x: 1500, y: 230, type: 'shield' }
    ]
  },

  // ==========================================================================
  // LEVEL 6: NEBULA STORM (Zero-G Sanctuary) - NEW: Gravity Distortion Rifts!
  // ==========================================================================
  {
    id: 6,
    name: 'Nebula Storm',
    subtitle: 'Zero-G Sanctuary',
    description: 'Step into glowing purple Gravity Distortion Rifts to float with low-g moon physics across ionized clouds.',
    worldWidth: 3000,
    worldHeight: 750,
    spawn: { x: 100, y: 540 },
    portal: { x: 2900, y: 450 },
    completionBonus: 7500,
    staticPlatforms: [
      { x: 120, y: 600, w: 220, h: 48 },
      { x: 480, y: 500, w: 160, h: 32 },
      { x: 1100, y: 380, w: 160, h: 32 },
      { x: 1720, y: 520, w: 160, h: 32 },
      { x: 2280, y: 380, w: 160, h: 32 },
      { x: 2880, y: 530, w: 220, h: 48 }
    ],
    movingPlatforms: [
      { x: 740, y: 440, w: 85, h: 22, rangeX: 0, speedX: 0, rangeY: 70, speedY: 60 },
      { x: 1420, y: 450, w: 85, h: 22, rangeX: 85, speedX: 70, rangeY: 0, speedY: 0 },
      { x: 2020, y: 460, w: 85, h: 22, rangeX: 0, speedX: 0, rangeY: 70, speedY: 65 },
      { x: 2600, y: 460, w: 85, h: 22, rangeX: 80, speedX: 70, rangeY: 0, speedY: 0 }
    ],
    crumblingPlatforms: [
      { x: 920, y: 420, w: 75, h: 20 },
      { x: 1580, y: 480, w: 75, h: 20 },
      { x: 2440, y: 420, w: 75, h: 20 }
    ],
    bouncePads: [],
    laserGates: [],
    patrolDrones: [],
    conveyors: [],
    // NEW: Zero-G Gravity Distortion Rifts
    gravityRifts: [
      { x: 800, y: 420, w: 320, h: 260 },
      { x: 2150, y: 420, w: 320, h: 260 }
    ],
    hazards: [
      { x: 480, y: 480, type: 'spikes', w: 36, h: 18 },
      { x: 800, y: 340, type: 'plasma' },
      { x: 1720, y: 500, type: 'spikes', w: 36, h: 18 },
      { x: 2150, y: 340, type: 'plasma' }
    ],
    coins: [
      { x: 200, y: 540 }, { x: 480, y: 440 },
      // High floaty arc in zero-g rift 1
      { x: 740, y: 320 }, { x: 800, y: 260 }, { x: 860, y: 260 }, { x: 920, y: 340 },
      { x: 1100, y: 320 }, { x: 1420, y: 390 }, { x: 1580, y: 420 },
      { x: 1720, y: 460 },
      // High floaty arc in zero-g rift 2
      { x: 2020, y: 340 }, { x: 2150, y: 260 }, { x: 2280, y: 320 },
      { x: 2600, y: 400 }
    ],
    crystals: [
      { x: 800, y: 200 }, // Sky high in zero-g rift
      { x: 2150, y: 200 }
    ],
    powerups: [
      { x: 480, y: 440, type: 'shield' },
      { x: 1100, y: 320, type: 'magnet' },
      { x: 1720, y: 460, type: 'score2x' }
    ]
  },

  // ==========================================================================
  // LEVEL 7: SOLAR FLARE (High-Velocity Maglev) - NEW: Conveyor Platforms!
  // ==========================================================================
  {
    id: 7,
    name: 'Solar Flare',
    subtitle: 'Coronal Spires & Maglev Run',
    description: 'High-speed Maglev Conveyor Belts push your robot across scorching solar heat vents!',
    worldWidth: 3200,
    worldHeight: 750,
    spawn: { x: 100, y: 540 },
    portal: { x: 3100, y: 440 },
    completionBonus: 9000,
    staticPlatforms: [
      { x: 120, y: 600, w: 220, h: 48 },
      { x: 720, y: 460, w: 160, h: 32 },
      { x: 1300, y: 430, w: 180, h: 32 },
      { x: 1900, y: 420, w: 180, h: 32 },
      { x: 2500, y: 450, w: 180, h: 32 },
      { x: 3080, y: 520, w: 220, h: 48 }
    ],
    // NEW: Maglev Conveyor Belts
    conveyors: [
      // Fast forward conveyor over chasm 1
      { x: 420, y: 520, w: 192, dir: 1, speed: 140 },
      // Opposing backward conveyor over chasm 2
      { x: 1020, y: 460, w: 192, dir: -1, speed: 120 },
      // Fast forward conveyor 3
      { x: 1620, y: 440, w: 192, dir: 1, speed: 150 },
      // High speed booster conveyor 4
      { x: 2200, y: 440, w: 192, dir: 1, speed: 160 }
    ],
    movingPlatforms: [
      { x: 2800, y: 470, w: 85, h: 22, rangeX: 80, speedX: 75, rangeY: 0, speedY: 0 }
    ],
    crumblingPlatforms: [
      { x: 1440, y: 440, w: 75, h: 20 },
      { x: 2040, y: 430, w: 75, h: 20 }
    ],
    bouncePads: [],
    laserGates: [
      { x: 1300, y: 350, h: 70, periodMs: 3000, activeMs: 1400, offsetMs: 0 },
      { x: 1900, y: 340, h: 70, periodMs: 3000, activeMs: 1400, offsetMs: 1500 }
    ],
    patrolDrones: [],
    gravityRifts: [],
    hazards: [
      { x: 720, y: 440, type: 'spikes', w: 36, h: 18 },
      { x: 2500, y: 430, type: 'spikes', w: 36, h: 18 }
    ],
    coins: [
      { x: 200, y: 540 },
      // Conveyor 1 speed trail
      { x: 360, y: 470 }, { x: 420, y: 470 }, { x: 480, y: 470 },
      { x: 720, y: 400 },
      // Conveyor 2 trail
      { x: 960, y: 410 }, { x: 1020, y: 410 }, { x: 1080, y: 410 },
      { x: 1300, y: 380 }, { x: 1440, y: 380 },
      // Conveyor 3 trail
      { x: 1560, y: 390 }, { x: 1620, y: 390 }, { x: 1680, y: 390 },
      { x: 1900, y: 370 }, { x: 2040, y: 370 },
      // Conveyor 4 trail
      { x: 2140, y: 390 }, { x: 2200, y: 390 }, { x: 2260, y: 390 },
      { x: 2500, y: 390 }, { x: 2800, y: 410 }
    ],
    crystals: [
      { x: 1020, y: 350 },
      { x: 2200, y: 330 }
    ],
    powerups: [
      { x: 720, y: 400, type: 'shield' },
      { x: 1900, y: 360, type: 'magnet' }
    ]
  },

  // ==========================================================================
  // LEVEL 8: VORTEX DEPTHS (Sentry Infiltration) - NEW: Patrol Drones!
  // ==========================================================================
  {
    id: 8,
    name: 'Vortex Depths',
    subtitle: 'Sentry Infiltration',
    description: 'Aerial Patrol Sentry Drones guard the abyssal quantum well. Dodge scanning eyes and timed lasers!',
    worldWidth: 3200,
    worldHeight: 750,
    spawn: { x: 100, y: 540 },
    portal: { x: 3100, y: 460 },
    completionBonus: 10500,
    staticPlatforms: [
      { x: 120, y: 600, w: 220, h: 48 },
      { x: 520, y: 490, w: 180, h: 32 },
      { x: 980, y: 420, w: 200, h: 32 },
      { x: 1450, y: 440, w: 180, h: 32 },
      { x: 1950, y: 410, w: 200, h: 32 },
      { x: 2450, y: 460, w: 180, h: 32 },
      { x: 3080, y: 530, w: 220, h: 48 }
    ],
    movingPlatforms: [
      { x: 750, y: 450, w: 85, h: 22, rangeX: 75, speedX: 65, rangeY: 0, speedY: 0 },
      { x: 1220, y: 430, w: 85, h: 22, rangeX: 0, speedX: 0, rangeY: 70, speedY: 60 },
      { x: 1700, y: 430, w: 85, h: 22, rangeX: 75, speedX: 70, rangeY: 0, speedY: 0 },
      { x: 2200, y: 440, w: 85, h: 22, rangeX: 0, speedX: 0, rangeY: 70, speedY: 65 },
      { x: 2750, y: 490, w: 85, h: 22, rangeX: 85, speedX: 75, rangeY: 0, speedY: 0 }
    ],
    crumblingPlatforms: [],
    bouncePads: [],
    laserGates: [
      { x: 980, y: 340, h: 70, periodMs: 3000, activeMs: 1400, offsetMs: 0 },
      { x: 1950, y: 330, h: 70, periodMs: 3000, activeMs: 1400, offsetMs: 600 }
    ],
    // NEW: Aerial Patrol Sentry Drones!
    patrolDrones: [
      { x: 520, y: 420, rangeX: 75, speedX: 70 },
      { x: 1450, y: 370, rangeX: 75, speedX: 80 },
      { x: 2450, y: 390, rangeX: 75, speedX: 85 }
    ],
    conveyors: [],
    gravityRifts: [],
    hazards: [
      { x: 980, y: 400, type: 'spikes', w: 36, h: 18 }
    ],
    coins: [
      { x: 200, y: 540 }, { x: 520, y: 430 },
      { x: 750, y: 390 }, { x: 920, y: 360 }, { x: 1040, y: 360 },
      { x: 1220, y: 340 }, { x: 1450, y: 380 },
      { x: 1700, y: 370 }, { x: 1880, y: 350 }, { x: 2020, y: 350 },
      { x: 2200, y: 350 }, { x: 2450, y: 400 }, { x: 2750, y: 430 }
    ],
    crystals: [
      { x: 1450, y: 290 },
      { x: 1950, y: 260 }
    ],
    powerups: [
      { x: 520, y: 440, type: 'shield' },
      { x: 1450, y: 330, type: 'score2x' }
    ]
  },

  // ==========================================================================
  // LEVEL 9: SUPERNOVA REMNANT (The Master Gauntlet) - COMBO MECHANICS!
  // ==========================================================================
  {
    id: 9,
    name: 'Supernova Remnant',
    subtitle: 'The Master Gauntlet',
    description: 'Catapult via Bounce Pads across Maglev Conveyors through timed Laser Gates! The ultimate precision challenge.',
    worldWidth: 3400,
    worldHeight: 750,
    spawn: { x: 100, y: 540 },
    portal: { x: 3300, y: 430 },
    completionBonus: 12500,
    staticPlatforms: [
      { x: 120, y: 600, w: 220, h: 48 },
      { x: 420, y: 540, w: 140, h: 32 },
      // High sky tower reached via bounce pad!
      { x: 680, y: 300, w: 160, h: 32 },
      { x: 1220, y: 420, w: 160, h: 32 },
      // High sky perch 2
      { x: 1540, y: 240, w: 160, h: 32 },
      { x: 2080, y: 440, w: 160, h: 32 },
      { x: 2640, y: 420, w: 160, h: 32 },
      { x: 3280, y: 510, w: 220, h: 48 }
    ],
    // COMBO: Bounce Pads
    bouncePads: [
      { x: 420, y: 522 },
      { x: 1220, y: 402 }
    ],
    // COMBO: Maglev Conveyors
    conveyors: [
      { x: 1800, y: 440, w: 192, dir: 1, speed: 150 },
      { x: 2360, y: 430, w: 192, dir: -1, speed: 130 }
    ],
    movingPlatforms: [
      { x: 950, y: 380, w: 85, h: 22, rangeX: 85, speedX: 75, rangeY: 0, speedY: 0 },
      { x: 2950, y: 460, w: 85, h: 22, rangeX: 85, speedX: 80, rangeY: 0, speedY: 0 }
    ],
    crumblingPlatforms: [
      { x: 2780, y: 440, w: 75, h: 20 }
    ],
    // COMBO: Laser Gates
    laserGates: [
      { x: 680, y: 220, h: 70, periodMs: 2800, activeMs: 1300, offsetMs: 0 },
      { x: 1800, y: 360, h: 70, periodMs: 3000, activeMs: 1400, offsetMs: 700 },
      { x: 2640, y: 340, h: 70, periodMs: 2800, activeMs: 1300, offsetMs: 300 }
    ],
    // COMBO: Patrol Drones
    patrolDrones: [
      { x: 1540, y: 160, rangeX: 75, speedX: 80 },
      { x: 2360, y: 350, rangeX: 75, speedX: 80 }
    ],
    gravityRifts: [],
    hazards: [
      { x: 1220, y: 340, type: 'plasma' },
      { x: 2080, y: 420, type: 'spikes', w: 36, h: 18 }
    ],
    coins: [
      { x: 200, y: 540 },
      // Bounce pad 1 catapult arc
      { x: 420, y: 420 }, { x: 480, y: 320 }, { x: 550, y: 240 },
      { x: 680, y: 240 }, { x: 950, y: 320 },
      // Bounce pad 2 catapult arc
      { x: 1220, y: 300 }, { x: 1280, y: 200 }, { x: 1380, y: 160 },
      { x: 1540, y: 180 },
      // Conveyor trails
      { x: 1740, y: 390 }, { x: 1800, y: 390 }, { x: 1860, y: 390 },
      { x: 2080, y: 380 },
      { x: 2300, y: 380 }, { x: 2360, y: 380 }, { x: 2420, y: 380 },
      { x: 2640, y: 360 }, { x: 2780, y: 380 }, { x: 2950, y: 400 }
    ],
    crystals: [
      { x: 680, y: 150 },
      { x: 1540, y: 100 },
      { x: 2640, y: 270 }
    ],
    powerups: [
      { x: 680, y: 230, type: 'shield' },
      { x: 1540, y: 180, type: 'score2x' },
      { x: 2080, y: 380, type: 'magnet' }
    ]
  },

  // ==========================================================================
  // LEVEL 10: THE COSMIC THRONE (Grand Finale Apex Citadel)
  // ==========================================================================
  {
    id: 10,
    name: 'The Cosmic Throne',
    subtitle: 'The Grand Finale Apex Citadel',
    description: 'The Emperor’s Apex Citadel! Conveyors, Sentry Drones, Laser Gates, Bounce Pads, and a majestic Zero-G Throne Hall.',
    worldWidth: 3800,
    worldHeight: 800,
    spawn: { x: 100, y: 560 },
    portal: { x: 3700, y: 380 },
    completionBonus: 15000,
    staticPlatforms: [
      // Starting Port
      { x: 120, y: 620, w: 220, h: 48 },
      // Sector 1: Sentry Ledge
      { x: 700, y: 500, w: 180, h: 32 },
      // Sector 2: Laser Fortress Base
      { x: 1280, y: 460, w: 200, h: 32 },
      // Sector 3: Catapult Spire Base
      { x: 1800, y: 540, w: 160, h: 32 },
      // High Sky Citadel (reached via Bounce Pad 1)
      { x: 2080, y: 280, w: 160, h: 32 },
      // Sector 4: Throne Approach
      { x: 2600, y: 480, w: 180, h: 32 },
      // Sector 5: Zero-G Royal Hall Ledge
      { x: 3200, y: 420, w: 180, h: 32 },
      // Emperor Throne Platform
      { x: 3680, y: 460, w: 240, h: 56 }
    ],
    // Maglev Conveyors (Stage 1 approach & Stage 3)
    conveyors: [
      { x: 410, y: 540, w: 192, dir: 1, speed: 140 },
      { x: 2340, y: 340, w: 192, dir: 1, speed: 150 }
    ],
    // Kinetic Bounce Pads (Catapults to Sky Citadel)
    bouncePads: [
      { x: 1800, y: 522 },
      { x: 2600, y: 462 }
    ],
    movingPlatforms: [
      { x: 990, y: 470, w: 85, h: 22, rangeX: 85, speedX: 70, rangeY: 0, speedY: 0 },
      { x: 1540, y: 480, w: 85, h: 22, rangeX: 75, speedX: 70, rangeY: 0, speedY: 0 },
      { x: 2900, y: 450, w: 85, h: 22, rangeX: 85, speedX: 75, rangeY: 0, speedY: 0 }
    ],
    crumblingPlatforms: [
      { x: 2750, y: 460, w: 75, h: 20 }
    ],
    // Timed Laser Gates
    laserGates: [
      { x: 1280, y: 380, h: 70, periodMs: 2800, activeMs: 1300, offsetMs: 0 },
      { x: 2080, y: 200, h: 70, periodMs: 3000, activeMs: 1400, offsetMs: 500 }
    ],
    // Patrol Sentry Drones
    patrolDrones: [
      { x: 700, y: 420, rangeX: 75, speedX: 75 },
      { x: 2600, y: 400, rangeX: 75, speedX: 85 }
    ],
    // Zero-G Gravity Rift: Royal Throne Hall
    gravityRifts: [
      { x: 3440, y: 420, w: 340, h: 280 }
    ],
    hazards: [
      { x: 700, y: 480, type: 'spikes', w: 36, h: 18 },
      { x: 1280, y: 320, type: 'plasma' },
      { x: 3200, y: 400, type: 'spikes', w: 36, h: 18 }
    ],
    coins: [
      { x: 200, y: 560 },
      // Conveyor 1 trail
      { x: 350, y: 490 }, { x: 410, y: 490 }, { x: 470, y: 490 },
      { x: 700, y: 440 }, { x: 990, y: 410 },
      { x: 1280, y: 420 }, { x: 1540, y: 420 },
      // Bounce Pad 1 Launch Arc
      { x: 1800, y: 420 }, { x: 1880, y: 300 }, { x: 1960, y: 220 },
      { x: 2080, y: 220 },
      // Conveyor 2 trail
      { x: 2280, y: 290 }, { x: 2340, y: 290 }, { x: 2400, y: 290 },
      // Bounce Pad 2 Launch Arc
      { x: 2600, y: 380 }, { x: 2680, y: 300 },
      { x: 2750, y: 400 }, { x: 2900, y: 390 }, { x: 3200, y: 360 },
      // Royal Zero-G Hall Star Float Arc
      { x: 3350, y: 280 }, { x: 3440, y: 220 }, { x: 3530, y: 280 },
      { x: 3680, y: 400 }
    ],
    crystals: [
      { x: 700, y: 350 },
      { x: 1280, y: 250 },
      { x: 2080, y: 120 }, // Sky-high citadel gem
      { x: 2340, y: 220 },
      { x: 3440, y: 160 }  // Floating in Zero-G Throne Hall apex
    ],
    powerups: [
      { x: 520, y: 450, type: 'shield' },
      { x: 1280, y: 350, type: 'magnet' },
      { x: 2080, y: 220, type: 'score2x' },
      { x: 3200, y: 360, type: 'shield' }
    ]
  }
];

export function getLevelById(id) {
  const num = Number(id);
  return LEVELS.find(l => l.id === num) || LEVELS[0];
}
