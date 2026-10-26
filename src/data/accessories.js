/**
 * STARHOP - Accessory Definitions
 * Cosmetic items that can be purchased and equipped to customize the player robot.
 * Each accessory has custom animated sprites, particle behaviors, visual effects,
 * and a canonical synergy match with one of the 5 robots.
 */

export const ACCESSORIES = [
  {
    id: 'none',
    name: 'None',
    title: 'STANDALONE FRAME',
    description: 'Clean robot frame without extra cosmetic attachments.',
    price: 0,
    currency: 'coins',
    type: 'none',
    isFree: true,
    color: '#8899aa',
    previewIcon: '🚫',
    signatureChar: null
  },
  {
    id: 'wings_photon',
    name: 'Photon Wings',
    title: 'ANIMATED CYBER WINGS 🪽',
    description: 'Twin holographic wings that flap rhythmically and emit glowing cyan photon particles as you jump!',
    price: 65,
    currency: 'coins',
    type: 'wings',
    color: '#00f0ff',
    previewIcon: '🪽',
    signatureChar: 'nova',
    signatureCharName: 'NOVA',
    synergyName: 'Stellar Archangel',
    synergyEffect: 'Perfect Match with NOVA! Emits radiant photon stardust trails during dashes & jumps.'
  },
  {
    id: 'halo_cosmic',
    name: 'Cosmic Halo',
    title: 'ORBITING CELESTIAL RING ✨',
    description: 'A radiant golden halo hovering gently above the robot\'s head with shimmering starlight sparkles.',
    price: 45,
    currency: 'coins',
    type: 'halo',
    color: '#ffd700',
    previewIcon: '✨',
    signatureChar: 'solaris',
    signatureCharName: 'SOLARIS',
    synergyName: 'Ascended Solar Deity',
    synergyEffect: 'Perfect Match with SOLARIS! Radiates divine celestial solar corona aura & orbiting gems.'
  },
  {
    id: 'jetpack_thruster',
    name: 'Cyber Jetpack',
    title: 'TWIN ION THRUSTER 🔥',
    description: 'High-octane rocket thruster on the back with animated fiery exhaust puffs during jump and flight.',
    price: 80,
    currency: 'coins',
    type: 'jetpack',
    color: '#ff4400',
    previewIcon: '🔥',
    signatureChar: 'byte',
    signatureCharName: 'BYTE',
    synergyName: 'Cyber Infiltrator',
    synergyEffect: 'Perfect Match with BYTE! Supercharges overdrive ion thruster flames & boost sparks.'
  },
  {
    id: 'crown_plasma',
    name: 'Plasma Crown',
    title: 'ROYAL STELLAR CREST 👑',
    description: 'Regal crystalline crown with a pulsating purple plasma gem, crafted for space champions.',
    price: 6,
    currency: 'crystals',
    type: 'crown',
    color: '#9b51e0',
    previewIcon: '👑',
    signatureChar: 'vortex',
    signatureCharName: 'VORTEX',
    synergyName: 'Quantum Warlord',
    synergyEffect: 'Perfect Match with VORTEX! Channels royal quantum lightning sparks & plasma crest glow.'
  },
  {
    id: 'cape_nebula',
    name: 'Nebula Cape',
    title: 'FLOWING ASTRAL CLOAK 🌌',
    description: 'An ethereal starry cape that flows, billows, and waves dynamically in the cosmic vacuum as you run!',
    price: 10,
    currency: 'crystals',
    type: 'cape',
    color: '#7928ca',
    previewIcon: '🌌',
    signatureChar: 'comet',
    signatureCharName: 'COMET',
    synergyName: 'Astral Knight',
    synergyEffect: 'Perfect Match with COMET! Drifts living stardust constellations & nebula dust particles.'
  }
];

export function getAccessoryById(id) {
  return ACCESSORIES.find(a => a.id === id) || ACCESSORIES[0];
}
