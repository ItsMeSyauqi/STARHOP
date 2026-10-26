/**
 * STARHOP - SaveManager
 * Handles persistence to localStorage with schema versioning, validation,
 * and graceful fallback for private browsing or corrupt data.
 */

const STORAGE_KEY = 'STARHOP_SAVE_V1';
const CURRENT_SCHEMA_VERSION = 1;

const DEFAULT_STATE = {
  version: CURRENT_SCHEMA_VERSION,
  coins: 0,
  crystals: 0,
  equippedCharacter: 'nova',
  ownedCharacters: ['nova'],
  equippedAccessory: 'none',
  ownedAccessories: ['none'],
  unlockedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  levelRecords: {
    1: { completed: false, highscore: 0, crystals: 0, bestTimeMs: null },
    2: { completed: false, highscore: 0, crystals: 0, bestTimeMs: null },
    3: { completed: false, highscore: 0, crystals: 0, bestTimeMs: null },
    4: { completed: false, highscore: 0, crystals: 0, bestTimeMs: null },
    5: { completed: false, highscore: 0, crystals: 0, bestTimeMs: null },
    6: { completed: false, highscore: 0, crystals: 0, bestTimeMs: null },
    7: { completed: false, highscore: 0, crystals: 0, bestTimeMs: null },
    8: { completed: false, highscore: 0, crystals: 0, bestTimeMs: null },
    9: { completed: false, highscore: 0, crystals: 0, bestTimeMs: null },
    10: { completed: false, highscore: 0, crystals: 0, bestTimeMs: null }
  },
  settings: {
    music: true,
    sfx: true,
    povZoom: 'close' // 'close' (1.35x - optimal for mobile) or 'normal' (1.0x)
  },
  stats: {
    totalLevelsCompleted: 0,
    totalCoinsCollected: 0,
    totalPlayTimeSec: 0
  }
};

class SaveManager {
  constructor() {
    this.state = this.load();
  }

  /**
   * Safely loads state from localStorage
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return JSON.parse(JSON.stringify(DEFAULT_STATE));
      }
      const parsed = JSON.parse(raw);

      // Validate schema version
      if (!parsed || parsed.version !== CURRENT_SCHEMA_VERSION) {
        console.warn('[SaveManager] Schema mismatch or corrupt save. Resetting to defaults.');
        return JSON.parse(JSON.stringify(DEFAULT_STATE));
      }

      // Merge defaults for any missing fields (safety check)
      const merged = {
        ...DEFAULT_STATE,
        ...parsed,
        levelRecords: {
          ...DEFAULT_STATE.levelRecords,
          ...(parsed.levelRecords || {})
        },
        settings: {
          ...DEFAULT_STATE.settings,
          ...(parsed.settings || {})
        },
        stats: {
          ...DEFAULT_STATE.stats,
          ...(parsed.stats || {})
        }
      };

      // Ensure accessory arrays exist
      if (!Array.isArray(merged.ownedAccessories)) {
        merged.ownedAccessories = ['none'];
      }
      if (!merged.ownedAccessories.includes('none')) {
        merged.ownedAccessories.unshift('none');
      }
      if (!merged.equippedAccessory) {
        merged.equippedAccessory = 'none';
      }

      // Ensure all levels 1 to 10 are unlocked so all players can immediately try any challenge
      if (!Array.isArray(merged.unlockedLevels)) {
        merged.unlockedLevels = [];
      }
      for (let i = 1; i <= 10; i++) {
        if (!merged.unlockedLevels.includes(i)) {
          merged.unlockedLevels.push(i);
        }
      }
      merged.unlockedLevels.sort((a, b) => a - b);

      // Retroactive upgrade: If player already conquered Level 3 in their browser save,
      // unlock Level 4 and grant the VORTEX champion robot immediately!
      if (merged.levelRecords[3] && merged.levelRecords[3].completed) {
        if (!merged.ownedCharacters.includes('vortex')) {
          merged.ownedCharacters.push('vortex');
        }
      }

      // If player conquered Level 10, grant SOLARIS
      if (merged.levelRecords[10] && merged.levelRecords[10].completed) {
        if (!merged.ownedCharacters.includes('solaris')) {
          merged.ownedCharacters.push('solaris');
        }
      }

      return merged;
    } catch (err) {
      console.warn('[SaveManager] Failed to read localStorage, using fallback state:', err);
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
  }

  /**
   * Persists state to localStorage
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      return true;
    } catch (err) {
      console.warn('[SaveManager] Failed to write localStorage:', err);
      return false;
    }
  }

  /**
   * Reset all progress back to defaults
   */
  reset() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    this.save();
    return this.state;
  }

  getCoins() {
    return this.state.coins;
  }

  addCoins(amount) {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return;
    this.state.coins += Math.floor(amount);
    this.state.stats.totalCoinsCollected += Math.floor(amount);
    this.save();
  }

  spendCoins(amount) {
    if (this.state.coins >= amount) {
      this.state.coins -= amount;
      this.save();
      return true;
    }
    return false;
  }

  getCrystals() {
    return this.state.crystals;
  }

  addCrystals(amount) {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return;
    this.state.crystals += Math.floor(amount);
    this.save();
  }

  isLevelUnlocked(levelId) {
    const num = Number(levelId);
    return num >= 1 && num <= 10;
  }

  unlockLevel(levelId) {
    const num = Number(levelId);
    if (!this.state.unlockedLevels.includes(num)) {
      this.state.unlockedLevels.push(num);
      this.state.unlockedLevels.sort((a, b) => a - b);
      this.save();
    }
  }

  getLevelRecord(levelId) {
    const rec = this.state.levelRecords[levelId] || { completed: false, highscore: 0, crystals: 0, bestTimeMs: null };
    if (rec.bestTimeMs === undefined) rec.bestTimeMs = null;
    return rec;
  }

  /**
   * Record level completion and update high score, best speedrun time, unlocked levels, and stats
   */
  recordLevelCompletion(levelId, score, coinsEarned, crystalsEarned, timeMs = null) {
    const num = Number(levelId);
    const existing = this.getLevelRecord(num);
    const isFirstTime = !existing.completed;

    const newHighScore = Math.max(existing.highscore, score);
    const isNewRecord = score > existing.highscore;

    // Track fastest completion time (lower is better)
    const existingTime = existing.bestTimeMs ?? null;
    let isNewBestTime = false;
    let bestTimeMs = existingTime;

    if (typeof timeMs === 'number' && timeMs > 0) {
      if (existingTime == null || timeMs < existingTime) {
        isNewBestTime = true;
        bestTimeMs = Math.round(timeMs);
      }
    }

    this.state.levelRecords[num] = {
      completed: true,
      highscore: newHighScore,
      crystals: Math.max(existing.crystals, crystalsEarned),
      bestTimeMs
    };

    if (isFirstTime) {
      this.state.stats.totalLevelsCompleted += 1;
    }

    // Unlock next level (up to 10)
    const nextLevel = num + 1;
    if (nextLevel <= 10) {
      this.unlockLevel(nextLevel);
    }

    // Grand achievement 1: Conquering Level 3 unlocks Level 4 and grants VORTEX champion robot!
    let championUnlocked = false;
    if (num >= 3 && !this.isCharacterOwned('vortex')) {
      this.state.ownedCharacters.push('vortex');
      championUnlocked = true;
    }

    // Grand achievement 2: Conquering Level 10 (Grand Finale) grants SOLARIS Cosmic Emperor!
    let emperorUnlocked = false;
    if (num >= 10 && !this.isCharacterOwned('solaris')) {
      this.state.ownedCharacters.push('solaris');
      emperorUnlocked = true;
    }

    // Add collected coins and crystals to player wallet
    this.addCoins(coinsEarned);
    this.addCrystals(crystalsEarned);

    this.save();

    return {
      isFirstTime,
      isNewRecord,
      highscore: newHighScore,
      timeMs: typeof timeMs === 'number' ? Math.round(timeMs) : null,
      isNewBestTime,
      bestTimeMs,
      nextLevelUnlocked: nextLevel <= 10 ? nextLevel : null,
      championUnlocked,
      emperorUnlocked
    };
  }

  getEquippedCharacter() {
    return this.state.equippedCharacter || 'nova';
  }

  equipCharacter(characterId) {
    if (this.state.ownedCharacters.includes(characterId)) {
      this.state.equippedCharacter = characterId;
      this.save();
      return true;
    }
    return false;
  }

  isCharacterOwned(characterId) {
    return this.state.ownedCharacters.includes(characterId);
  }

  buyCharacter(characterId, price) {
    if (this.isCharacterOwned(characterId)) {
      return { success: false, reason: 'ALREADY_OWNED' };
    }
    if (this.state.coins < price) {
      return { success: false, reason: 'INSUFFICIENT_COINS' };
    }

    this.state.coins -= price;
    this.state.ownedCharacters.push(characterId);
    this.state.equippedCharacter = characterId;
    this.save();
    return { success: true };
  }

  // ==========================================================================
  // Accessory Management
  // ==========================================================================

  getEquippedAccessory() {
    return this.state.equippedAccessory || 'none';
  }

  equipAccessory(accessoryId) {
    if (this.state.ownedAccessories.includes(accessoryId)) {
      this.state.equippedAccessory = accessoryId;
      this.save();
      return true;
    }
    return false;
  }

  isAccessoryOwned(accessoryId) {
    return this.state.ownedAccessories.includes(accessoryId);
  }

  buyAccessory(accessoryId, price, currency = 'coins') {
    if (this.isAccessoryOwned(accessoryId)) {
      return { success: false, reason: 'ALREADY_OWNED' };
    }

    if (currency === 'crystals') {
      if (this.state.crystals < price) {
        return { success: false, reason: 'INSUFFICIENT_CRYSTALS' };
      }
      this.state.crystals -= price;
    } else {
      if (this.state.coins < price) {
        return { success: false, reason: 'INSUFFICIENT_COINS' };
      }
      this.state.coins -= price;
    }

    this.state.ownedAccessories.push(accessoryId);
    this.state.equippedAccessory = accessoryId;
    this.save();
    return { success: true };
  }

  getSettings() {
    return { ...this.state.settings };
  }

  setSetting(key, value) {
    if (this.state.settings.hasOwnProperty(key)) {
      this.state.settings[key] = (key === 'povZoom') ? String(value) : Boolean(value);
      this.save();
    }
  }

  getPOVPreference() {
    return this.state.settings.povZoom || 'close';
  }

  setPOVPreference(val) {
    this.state.settings.povZoom = (val === 'normal') ? 'normal' : 'close';
    this.save();
    return this.state.settings.povZoom;
  }

  togglePOVPreference() {
    const current = this.getPOVPreference();
    const next = (current === 'normal') ? 'close' : 'normal';
    return this.setPOVPreference(next);
  }
}

export const saveManager = new SaveManager();

/**
 * Format milliseconds into standard retro speedrun time format MM:SS.ms (e.g. 00:24.3)
 */
export function formatTime(ms) {
  if (typeof ms !== 'number' || isNaN(ms) || ms <= 0) return '--:--.-';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;
}
