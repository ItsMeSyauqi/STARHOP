/**
 * STARHOP - Character definitions
 * Contains metadata, unlock prices, visual styling, and signature accessory synergies.
 * Each robot features unique pixel anatomy, personality, and signature synergy match.
 */

export const CHARACTERS = [
  {
    id: 'nova',
    name: 'NOVA',
    title: 'The Stellar Scout',
    description: 'The agile prototype robot engineered for deep space island hopping with aerodynamic side fins and stellar reactor.',
    price: 0,
    isFree: true,
    signatureAccessory: 'wings_photon',
    signatureAccName: 'Photon Wings',
    synergyName: 'Stellar Archangel',
    synergyDesc: 'Radiates glowing cyan photon stardust trails during dashes and high jumps.',
    colors: {
      primary: '#2a75ff',    // Electric Blue
      secondary: '#00f0ff',  // Bright Cyan
      visor: '#00ffff',      // Cyan Visor
      accent: '#ffd700',     // Golden antenna star
      bodyDark: '#123b82'
    },
    stats: {
      speed: 215,
      jump: -480,
      weight: 'Medium'
    }
  },
  {
    id: 'byte',
    name: 'BYTE',
    title: 'Cyber Specialist',
    description: 'A digitized explorer built with twin cyber radar horns, nanotech optics, and hyper-reactive cyber shielding.',
    price: 45,
    isFree: false,
    signatureAccessory: 'jetpack_thruster',
    signatureAccName: 'Cyber Jetpack',
    synergyName: 'Cyber Infiltrator',
    synergyDesc: 'Supercharges twin ion thrusters with roaring overdrive plasma flames.',
    colors: {
      primary: '#00e676',    // Neon Emerald Green
      secondary: '#00b0ff',  // Light Blue
      visor: '#ffeb3b',      // Amber cyber optics
      accent: '#76ff03',     // Lime glow horns
      bodyDark: '#00695c'
    },
    stats: {
      speed: 225,
      jump: -470,
      weight: 'Light'
    }
  },
  {
    id: 'comet',
    name: 'COMET',
    title: 'Astral Voyager',
    description: 'Forged in stellar nebula dust, equipped with a sweeping celestial crest and starlight nebula heart gem.',
    price: 90,
    isFree: false,
    signatureAccessory: 'cape_nebula',
    signatureAccName: 'Nebula Cape',
    synergyName: 'Astral Knight',
    synergyDesc: 'Billows with living stardust constellations and celestial dust particles.',
    colors: {
      primary: '#9c27b0',    // Cosmic Violet
      secondary: '#ff007a',  // Neon Magenta
      visor: '#00e5ff',      // Cyan visor
      accent: '#ffd700',     // Stardust Gold
      bodyDark: '#4a148c'
    },
    stats: {
      speed: 215,
      jump: -495,
      weight: 'Astral'
    }
  },
  {
    id: 'vortex',
    name: 'VORTEX',
    title: 'Quantum Champion',
    description: 'An elite cosmic android awarded for conquering Level 3. Equipped with twin golden battle horns and quantum core.',
    price: 0,
    isFree: false,
    isReward: true,
    signatureAccessory: 'crown_plasma',
    signatureAccName: 'Plasma Crown',
    synergyName: 'Quantum Warlord',
    synergyDesc: 'Channels royal quantum lightning sparks from the pulsing plasma crest.',
    colors: {
      primary: '#ffd700',    // Radiant Gold
      secondary: '#ff0055',  // Hyper Neon Rose
      visor: '#00f0ff',      // Cyan Visor
      accent: '#7928ca',     // Cosmic Void Purple
      bodyDark: '#35084f'
    },
    stats: {
      speed: 230,
      jump: -485,
      weight: 'Champion'
    }
  },
  {
    id: 'solaris',
    name: 'SOLARIS',
    title: 'Cosmic Emperor',
    description: 'The ultimate ascended android rewarded for conquering all 10 levels of STARHOP! Crowned with a radiant solar corona.',
    price: 0,
    isFree: false,
    isReward: true,
    rewardLevel: 10,
    signatureAccessory: 'halo_cosmic',
    signatureAccName: 'Cosmic Halo',
    synergyName: 'Ascended Solar Deity',
    synergyDesc: 'Radiates divine celestial solar corona sparkles and revolving starlight gems.',
    colors: {
      primary: '#ffaa00',    // Solar Amber Gold
      secondary: '#ff2200',  // Solar Flare Red
      visor: '#ffffff',      // Diamond White Visor
      accent: '#00f0ff',     // Cyan Corona
      bodyDark: '#2a0d00'
    },
    stats: {
      speed: 235,
      jump: -490,
      weight: 'Emperor'
    }
  }
];

export function getCharacterById(id) {
  return CHARACTERS.find(c => c.id === id) || CHARACTERS[0];
}
