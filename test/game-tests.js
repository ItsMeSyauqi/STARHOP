import { test, describe } from 'node:test';
import assert from 'node:assert';

// Mock localStorage for Node environment
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

globalThis.localStorage = new MockLocalStorage();

// Import modules
const { saveManager, formatTime } = await import('../src/systems/SaveManager.js');
const { CHARACTERS, getCharacterById } = await import('../src/data/characters.js');
const { ACCESSORIES, getAccessoryById } = await import('../src/data/accessories.js');
const { LEVELS, getLevelById } = await import('../src/data/levels.js');

describe('STARHOP - Data & Progression Test Suite', () => {
  test('SaveManager initializes with valid schema V1 defaults', () => {
    saveManager.reset();
    assert.strictEqual(saveManager.getCoins(), 0);
    assert.strictEqual(saveManager.getCrystals(), 0);
    assert.strictEqual(saveManager.getEquippedCharacter(), 'nova');
    assert.strictEqual(saveManager.isCharacterOwned('nova'), true);
    assert.strictEqual(saveManager.getEquippedAccessory(), 'none');
    assert.strictEqual(saveManager.isAccessoryOwned('none'), true);
    for (let l = 1; l <= 10; l++) {
      assert.strictEqual(saveManager.isLevelUnlocked(l), true);
    }
  });

  test('Wallet transactions: addCoins, addCrystals, and spendCoins', () => {
    saveManager.reset();
    saveManager.addCoins(50);
    assert.strictEqual(saveManager.getCoins(), 50);

    saveManager.addCrystals(3);
    assert.strictEqual(saveManager.getCrystals(), 3);

    // Spend coins test
    const spendSuccess = saveManager.spendCoins(30);
    assert.strictEqual(spendSuccess, true);
    assert.strictEqual(saveManager.getCoins(), 20);

    const spendFail = saveManager.spendCoins(100);
    assert.strictEqual(spendFail, false);
    assert.strictEqual(saveManager.getCoins(), 20);
  });

  test('Character Collection: buying, equipping, and validation', () => {
    saveManager.reset();
    // Cannot buy BYTE without sufficient coins
    const failBuy = saveManager.buyCharacter('byte', 45);
    assert.strictEqual(failBuy.success, false);
    assert.strictEqual(failBuy.reason, 'INSUFFICIENT_COINS');
    assert.strictEqual(saveManager.isCharacterOwned('byte'), false);

    // Add coins and buy BYTE
    saveManager.addCoins(50);
    const successBuy = saveManager.buyCharacter('byte', 45);
    assert.strictEqual(successBuy.success, true);
    assert.strictEqual(saveManager.isCharacterOwned('byte'), true);
    assert.strictEqual(saveManager.getCoins(), 5);
    assert.strictEqual(saveManager.getEquippedCharacter(), 'byte');

    // Equip NOVA back
    assert.strictEqual(saveManager.equipCharacter('nova'), true);
    assert.strictEqual(saveManager.getEquippedCharacter(), 'nova');

    // Cannot buy already owned
    const duplicateBuy = saveManager.buyCharacter('byte', 45);
    assert.strictEqual(duplicateBuy.success, false);
    assert.strictEqual(duplicateBuy.reason, 'ALREADY_OWNED');
  });

  test('Level Progression & Highscore recording', () => {
    saveManager.reset();
    assert.strictEqual(saveManager.isLevelUnlocked(1), true);
    assert.strictEqual(saveManager.isLevelUnlocked(10), true);

    // Complete Level 1
    const result1 = saveManager.recordLevelCompletion(1, 1500, 10, 1);
    assert.strictEqual(result1.isFirstTime, true);
    assert.strictEqual(result1.isNewRecord, true);
    assert.strictEqual(result1.highscore, 1500);
    assert.strictEqual(result1.nextLevelUnlocked, 2);

    // Verify Level 2 is now unlocked
    assert.strictEqual(saveManager.isLevelUnlocked(2), true);
    assert.strictEqual(saveManager.getCoins(), 10);
    assert.strictEqual(saveManager.getCrystals(), 1);

    // Complete Level 2
    const result2 = saveManager.recordLevelCompletion(2, 2800, 15, 2);
    assert.strictEqual(result2.nextLevelUnlocked, 3);
    assert.strictEqual(saveManager.isLevelUnlocked(3), true);

    // Complete Level 3 - unlocks Level 4 & rewards VORTEX
    const result3 = saveManager.recordLevelCompletion(3, 4200, 20, 3);
    assert.strictEqual(result3.nextLevelUnlocked, 4);
    assert.strictEqual(saveManager.isLevelUnlocked(4), true);
    assert.strictEqual(saveManager.isCharacterOwned('vortex'), true);

    // Complete Level 4 through 9
    for (let l = 4; l <= 9; l++) {
      const res = saveManager.recordLevelCompletion(l, 5000 + l * 500, 15, 2);
      assert.strictEqual(res.nextLevelUnlocked, l + 1);
      assert.strictEqual(saveManager.isLevelUnlocked(l + 1), true);
    }

    // Complete Level 10 (Grand Finale) - rewards SOLARIS (Cosmic Emperor)
    const result10 = saveManager.recordLevelCompletion(10, 25000, 30, 5);
    assert.strictEqual(result10.nextLevelUnlocked, null); // Last level
    assert.strictEqual(saveManager.isCharacterOwned('solaris'), true);

    // Replay Level 1 with lower score
    const resultReplay = saveManager.recordLevelCompletion(1, 1200, 5, 0);
    assert.strictEqual(resultReplay.isFirstTime, false);
    assert.strictEqual(resultReplay.isNewRecord, false);
    assert.strictEqual(resultReplay.highscore, 1500); // High score preserved!
  });

  test('Corrupt localStorage recovery', () => {
    globalThis.localStorage.setItem('STARHOP_SAVE_V1', 'invalid-corrupt-json{{{');
    const recovered = saveManager.load();
    assert.strictEqual(recovered.version, 1);
    assert.strictEqual(recovered.coins, 0);
    assert.strictEqual(recovered.equippedCharacter, 'nova');
  });

  test('Level configurations integrity', () => {
    assert.strictEqual(LEVELS.length, 10);

    LEVELS.forEach(lvl => {
      assert.ok(lvl.id >= 1 && lvl.id <= 10);
      assert.ok(lvl.name.length > 0);
      assert.ok(lvl.worldWidth > 1000);
      assert.ok(lvl.worldHeight >= 600);
      assert.ok(lvl.spawn.x > 0 && lvl.spawn.y > 0);
      assert.ok(lvl.portal.x > lvl.spawn.x);
      assert.ok(lvl.staticPlatforms.length > 0);
      assert.ok(lvl.coins.length > 0);
      assert.ok(lvl.crystals.length > 0);
    });

    // Level 2 has moving platforms
    const lvl2 = getLevelById(2);
    assert.ok(lvl2.movingPlatforms.length > 0);

    // Level 3 has crumbling platforms
    const lvl3 = getLevelById(3);
    assert.ok(lvl3.crumblingPlatforms.length > 0);

    // Level 4 introduces Timed Laser Gates
    const lvl4 = getLevelById(4);
    assert.ok(lvl4.laserGates.length >= 2, 'Level 4 must introduce Laser Gates');

    // Level 5 introduces Kinetic Bounce Pads
    const lvl5 = getLevelById(5);
    assert.ok(lvl5.bouncePads.length >= 2, 'Level 5 must introduce Bounce Pads');

    // Level 6 introduces Zero-G Gravity Distortion Rifts
    const lvl6 = getLevelById(6);
    assert.ok(lvl6.gravityRifts.length >= 2, 'Level 6 must introduce Gravity Rifts');

    // Level 7 introduces Maglev Conveyor Belts
    const lvl7 = getLevelById(7);
    assert.ok(lvl7.conveyors.length >= 3, 'Level 7 must introduce Maglev Conveyors');

    // Level 8 introduces Aerial Patrol Sentry Drones
    const lvl8 = getLevelById(8);
    assert.ok(lvl8.patrolDrones.length >= 2, 'Level 8 must introduce Patrol Drones');

    // Level 9 is Master Gauntlet combining 4 distinct mechanics
    const lvl9 = getLevelById(9);
    assert.ok(lvl9.bouncePads.length > 0, 'Level 9 must feature Bounce Pads');
    assert.ok(lvl9.conveyors.length > 0, 'Level 9 must feature Conveyors');
    assert.ok(lvl9.laserGates.length > 0, 'Level 9 must feature Laser Gates');
    assert.ok(lvl9.patrolDrones.length > 0, 'Level 9 must feature Patrol Drones');

    // Level 10 is Grand Finale Apex Citadel combining all 5 advanced mechanics
    const lvl10 = getLevelById(10);
    assert.ok(lvl10.movingPlatforms.length > 0);
    assert.ok(lvl10.crumblingPlatforms.length > 0);
    assert.ok(lvl10.bouncePads.length > 0, 'Level 10 must feature Bounce Pads');
    assert.ok(lvl10.conveyors.length > 0, 'Level 10 must feature Conveyors');
    assert.ok(lvl10.laserGates.length > 0, 'Level 10 must feature Laser Gates');
    assert.ok(lvl10.patrolDrones.length > 0, 'Level 10 must feature Patrol Drones');
    assert.ok(lvl10.gravityRifts.length > 0, 'Level 10 must feature Gravity Rifts');
  });

  test('Advanced entities and traps integrity across all levels', () => {
    LEVELS.forEach(lvl => {
      // Validate bounce pads
      (lvl.bouncePads || []).forEach(bp => {
        assert.ok(bp.x > 0 && bp.x < lvl.worldWidth, `BouncePad x out of bounds in level ${lvl.id}`);
        assert.ok(bp.y > 0 && bp.y < lvl.worldHeight, `BouncePad y out of bounds in level ${lvl.id}`);
      });

      // Validate laser gates
      (lvl.laserGates || []).forEach(lg => {
        assert.ok(lg.x > 0 && lg.x < lvl.worldWidth, `LaserGate x out of bounds in level ${lvl.id}`);
        assert.ok(lg.y > 0 && lg.y < lvl.worldHeight, `LaserGate y out of bounds in level ${lvl.id}`);
        assert.ok(lg.h > 20, `LaserGate h too small in level ${lvl.id}`);
        assert.ok(lg.periodMs >= 1000, `LaserGate periodMs too short in level ${lvl.id}`);
        assert.ok(lg.activeMs > 0 && lg.activeMs < lg.periodMs, `LaserGate activeMs invalid in level ${lvl.id}`);
      });

      // Validate patrol drones
      (lvl.patrolDrones || []).forEach(pd => {
        assert.ok(pd.x > 0 && pd.x < lvl.worldWidth, `PatrolDrone x out of bounds in level ${lvl.id}`);
        assert.ok(pd.y > 0 && pd.y < lvl.worldHeight, `PatrolDrone y out of bounds in level ${lvl.id}`);
        assert.ok(pd.rangeX > 0, `PatrolDrone rangeX must be positive in level ${lvl.id}`);
        assert.ok(pd.speedX > 0, `PatrolDrone speedX must be positive in level ${lvl.id}`);
      });

      // Validate maglev conveyors
      (lvl.conveyors || []).forEach(cv => {
        assert.ok(cv.x > 0 && cv.x < lvl.worldWidth, `Conveyor x out of bounds in level ${lvl.id}`);
        assert.ok(cv.y > 0 && cv.y < lvl.worldHeight, `Conveyor y out of bounds in level ${lvl.id}`);
        assert.ok(cv.w > 0, `Conveyor width invalid in level ${lvl.id}`);
        assert.ok([1, -1].includes(cv.dir), `Conveyor dir must be 1 or -1 in level ${lvl.id}`);
        assert.ok(cv.speed > 0, `Conveyor speed must be positive in level ${lvl.id}`);
      });

      // Validate gravity rifts
      (lvl.gravityRifts || []).forEach(gr => {
        assert.ok(gr.x > 0 && gr.x < lvl.worldWidth, `GravityRift x out of bounds in level ${lvl.id}`);
        assert.ok(gr.y > 0 && gr.y < lvl.worldHeight, `GravityRift y out of bounds in level ${lvl.id}`);
        assert.ok(gr.w > 50 && gr.h > 50, `GravityRift dimensions too small in level ${lvl.id}`);
      });
    });
  });

  test('Character definitions integrity', () => {
    assert.strictEqual(CHARACTERS.length, 5);
    const nova = getCharacterById('nova');
    const byte = getCharacterById('byte');
    const comet = getCharacterById('comet');
    const vortex = getCharacterById('vortex');
    const solaris = getCharacterById('solaris');

    assert.strictEqual(nova.price, 0);
    assert.strictEqual(nova.isFree, true);
    assert.ok(byte.price > 0);
    assert.ok(comet.price > byte.price);
    assert.strictEqual(vortex.isReward, true);
    assert.strictEqual(solaris.isReward, true);

    [nova, byte, comet, vortex, solaris].forEach(c => {
      assert.ok(c.colors.primary);
      assert.ok(c.colors.visor);
      assert.ok(c.stats.speed > 100);
      assert.ok(c.stats.jump < -300);
    });
  });

  test('Hazards & Powerups integrity (Shield Guard verification)', () => {
    let totalShields = 0;
    let totalHazards = 0;

    LEVELS.forEach(lvl => {
      (lvl.powerups || []).forEach(p => {
        assert.ok(['shield', 'magnet', 'score2x'].includes(p.type), `Unknown powerup type: ${p.type} in level ${lvl.id}`);
        assert.ok(p.x > 0 && p.x < lvl.worldWidth, `Powerup x out of bounds in level ${lvl.id}`);
        assert.ok(p.y > 0 && p.y < lvl.worldHeight, `Powerup y out of bounds in level ${lvl.id}`);
        if (p.type === 'shield') totalShields++;
      });

      (lvl.hazards || []).forEach(h => {
        assert.ok(['spikes', 'plasma'].includes(h.type), `Unknown hazard type: ${h.type} in level ${lvl.id}`);
        assert.ok(h.x > 0 && h.x < lvl.worldWidth, `Hazard x out of bounds in level ${lvl.id}`);
        assert.ok(h.y > 0 && h.y < lvl.worldHeight, `Hazard y out of bounds in level ${lvl.id}`);
        totalHazards++;
      });
    });

    // Verify multiple levels have shield guards placed
    assert.ok(totalShields >= 5, `Expected at least 5 shield guards across levels, got ${totalShields}`);
    assert.ok(totalHazards >= 10, `Expected at least 10 hazards across levels, got ${totalHazards}`);
  });

  test('Accessory Collection: buying with coins, buying with crystals, equipping, and validation', () => {
    saveManager.reset();
    assert.strictEqual(saveManager.getEquippedAccessory(), 'none');
    assert.strictEqual(saveManager.isAccessoryOwned('none'), true);

    // Fail buying wings without coins
    const failBuyWings = saveManager.buyAccessory('wings_photon', 65, 'coins');
    assert.strictEqual(failBuyWings.success, false);
    assert.strictEqual(failBuyWings.reason, 'INSUFFICIENT_COINS');
    assert.strictEqual(saveManager.isAccessoryOwned('wings_photon'), false);

    // Add coins and buy Photon Wings
    saveManager.addCoins(100);
    const successBuyWings = saveManager.buyAccessory('wings_photon', 65, 'coins');
    assert.strictEqual(successBuyWings.success, true);
    assert.strictEqual(saveManager.isAccessoryOwned('wings_photon'), true);
    assert.strictEqual(saveManager.getCoins(), 35);
    assert.strictEqual(saveManager.getEquippedAccessory(), 'wings_photon');

    // Fail buying crown without crystals
    const failBuyCrown = saveManager.buyAccessory('crown_plasma', 6, 'crystals');
    assert.strictEqual(failBuyCrown.success, false);
    assert.strictEqual(failBuyCrown.reason, 'INSUFFICIENT_CRYSTALS');

    // Add crystals and buy Plasma Crown
    saveManager.addCrystals(10);
    const successBuyCrown = saveManager.buyAccessory('crown_plasma', 6, 'crystals');
    assert.strictEqual(successBuyCrown.success, true);
    assert.strictEqual(saveManager.isAccessoryOwned('crown_plasma'), true);
    assert.strictEqual(saveManager.getCrystals(), 4);
    assert.strictEqual(saveManager.getEquippedAccessory(), 'crown_plasma');

    // Equip Wings back
    assert.strictEqual(saveManager.equipAccessory('wings_photon'), true);
    assert.strictEqual(saveManager.getEquippedAccessory(), 'wings_photon');

    // Unequip to 'none'
    assert.strictEqual(saveManager.equipAccessory('none'), true);
    assert.strictEqual(saveManager.getEquippedAccessory(), 'none');

    // Cannot buy already owned accessory
    const duplicateBuy = saveManager.buyAccessory('wings_photon', 65, 'coins');
    assert.strictEqual(duplicateBuy.success, false);
    assert.strictEqual(duplicateBuy.reason, 'ALREADY_OWNED');
  });

  test('Accessory definitions integrity', () => {
    assert.strictEqual(ACCESSORIES.length, 6);

    const noneAcc = getAccessoryById('none');
    const wingsAcc = getAccessoryById('wings_photon');
    const haloAcc = getAccessoryById('halo_cosmic');
    const jetpackAcc = getAccessoryById('jetpack_thruster');
    const crownAcc = getAccessoryById('crown_plasma');
    const capeAcc = getAccessoryById('cape_nebula');

    assert.strictEqual(noneAcc.price, 0);
    assert.strictEqual(noneAcc.isFree, true);
    assert.strictEqual(wingsAcc.type, 'wings');
    assert.strictEqual(wingsAcc.currency, 'coins');
    assert.strictEqual(haloAcc.type, 'halo');
    assert.strictEqual(jetpackAcc.type, 'jetpack');
    assert.strictEqual(crownAcc.currency, 'crystals');
    assert.strictEqual(capeAcc.currency, 'crystals');

    ACCESSORIES.forEach(a => {
      assert.ok(a.id);
      assert.ok(a.name);
      assert.ok(a.title);
      assert.ok(a.description);
      assert.ok(a.color);
      assert.ok(a.previewIcon);
    });
  });

  test('All 10 levels are unlocked, valid, and immediately launchable', () => {
    assert.strictEqual(LEVELS.length, 10);
    LEVELS.forEach(lvl => {
      assert.strictEqual(saveManager.isLevelUnlocked(lvl.id), true, `Level ${lvl.id} should be unlocked`);
      const record = saveManager.getLevelRecord(lvl.id);
      assert.ok(record, `Level ${lvl.id} should have a record`);
      assert.strictEqual(typeof record.highscore, 'number');
      assert.strictEqual(typeof record.crystals, 'number');
    });
  });

  test('Speedrun Stopwatch: formatTime and best time recording', () => {
    // formatTime checks
    assert.strictEqual(formatTime(null), '--:--.-');
    assert.strictEqual(formatTime(0), '--:--.-');
    assert.strictEqual(formatTime(24300), '00:24.3');
    assert.strictEqual(formatTime(65800), '01:05.8');

    // First completion with time 35.2s (35200 ms)
    saveManager.reset();
    const res1 = saveManager.recordLevelCompletion(1, 1500, 10, 2, 35200);
    assert.strictEqual(res1.isNewBestTime, true);
    assert.strictEqual(res1.bestTimeMs, 35200);

    const record1 = saveManager.getLevelRecord(1);
    assert.strictEqual(record1.bestTimeMs, 35200);

    // Slower second completion (42000 ms) should NOT overwrite best time
    const res2 = saveManager.recordLevelCompletion(1, 1600, 5, 1, 42000);
    assert.strictEqual(res2.isNewBestTime, false);
    assert.strictEqual(res2.bestTimeMs, 35200);

    // Faster third completion (22500 ms) should establish new best time
    const res3 = saveManager.recordLevelCompletion(1, 2000, 12, 3, 22500);
    assert.strictEqual(res3.isNewBestTime, true);
    assert.strictEqual(res3.bestTimeMs, 22500);

    const recordUpdated = saveManager.getLevelRecord(1);
    assert.strictEqual(recordUpdated.bestTimeMs, 22500);
    assert.strictEqual(formatTime(recordUpdated.bestTimeMs), '00:22.5');
  });

  test('Drone patrol distribution includes early and endgame stages', () => {
    // Level 2, 4, 8, 9, 10 have patrol drones
    const lvl2 = getLevelById(2);
    const lvl4 = getLevelById(4);
    const lvl8 = getLevelById(8);
    const lvl9 = getLevelById(9);
    const lvl10 = getLevelById(10);

    assert.ok(lvl2.patrolDrones.length >= 1, 'Level 2 should have at least 1 drone');
    assert.ok(lvl4.patrolDrones.length >= 1, 'Level 4 should have at least 1 drone');
    assert.ok(lvl8.patrolDrones.length >= 1, 'Level 8 should have drones');
    assert.ok(lvl9.patrolDrones.length >= 1, 'Level 9 should have drones');
    assert.ok(lvl10.patrolDrones.length >= 1, 'Level 10 should have drones');
  });

  test('Camera POV Preference Management in SaveManager', () => {
    saveManager.reset();
    // Default should be 'close'
    assert.strictEqual(saveManager.getPOVPreference(), 'close');

    // Toggle to 'normal'
    const toggled = saveManager.togglePOVPreference();
    assert.strictEqual(toggled, 'normal');
    assert.strictEqual(saveManager.getPOVPreference(), 'normal');

    // Toggle back to 'close'
    const toggledBack = saveManager.togglePOVPreference();
    assert.strictEqual(toggledBack, 'close');
    assert.strictEqual(saveManager.getPOVPreference(), 'close');

    // Explicit set
    saveManager.setPOVPreference('normal');
    assert.strictEqual(saveManager.getPOVPreference(), 'normal');
    saveManager.setPOVPreference('close');
    assert.strictEqual(saveManager.getPOVPreference(), 'close');
  });

  test('Active Ability & Audio definitions validation', async () => {
    const { audioManager } = await import('../src/systems/AudioManager.js');
    assert.strictEqual(typeof audioManager.playCoinCombo, 'function');
    assert.strictEqual(typeof audioManager.playAbility, 'function');

    const expectedAbilities = ['wings_photon', 'halo_cosmic', 'jetpack_thruster', 'crown_plasma', 'cape_nebula'];
    expectedAbilities.forEach(id => {
      const acc = getAccessoryById(id);
      assert.ok(acc, `Accessory ${id} should exist`);
      assert.notStrictEqual(acc.id, 'none');
    });
  });

  test('Character & Accessory Synergy bidirectional integrity', () => {
    CHARACTERS.forEach(char => {
      if (char.signatureAccessory) {
        const acc = getAccessoryById(char.signatureAccessory);
        assert.ok(acc, `Accessory ${char.signatureAccessory} should exist for character ${char.id}`);
        assert.strictEqual(acc.signatureChar, char.id, `Accessory signatureChar should point back to ${char.id}`);
      }
    });
  });
});


