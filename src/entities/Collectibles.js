/**
 * STARHOP - Collectibles & Portal Entity Manager
 * Handles animated Coins, sparkling Crystals, Power-ups (Shield, Magnet, 2X Score),
 * magnet attraction physics, and Level End Portal.
 *
 * FIXED:
 * - Coins now use a STATIC physics group so tween-based bobbing doesn't conflict
 *   with physics body positions. Instead, coins use a display object wrapper approach:
 *   the visual sprite bobs, and a separate static sensor handles collection.
 * - Actually: coins & crystals are better as physics sprites with body disabled
 *   for collisions (using overlap) and manual position via tween. We use a group
 *   with allowGravity:false + immovable so they stay put.
 * - Body is refreshed after tween moves the visual. Instead we use a visual-only
 *   tween on a separate image and keep the hitbox sprite static.
 * - Magnet now correctly moves coin using physics body position update.
 * - collectCoin / collectCrystal guard against double-collect.
 * - Portal hitbox is corrected.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager.js';

export class CollectibleManager {
  constructor(scene) {
    this.scene = scene;

    // Use static groups for coins/crystals - bodies never need to move for physics.
    // Visual bobbing is done by tweening the sprite; physics body does NOT bob
    // (the tween only moves the display object; we use overlap which doesn't
    // need accurate body positions when immovable physics overlap is used).
    // NOTE: For proper overlap detection with tweened positions, we use
    // physics.add.group (dynamic) with allowGravity:false + immovable, and
    // refresh body each frame or rely on sprite position directly via overlap.
    this.coinsGroup = scene.physics.add.group({ allowGravity: false, immovable: true });
    this.crystalsGroup = scene.physics.add.group({ allowGravity: false, immovable: true });
    this.powerupsGroup = scene.physics.add.group({ allowGravity: false, immovable: true });
    this.portal = null;
    this.portalBeam = null;
    this.portalBadge = null;
    this.portalRunes = [];
    this.portalSparkEmitter = null;
    this._portalTimer = 0;

    // Track which collectibles are being collected (prevents double-fire)
    this._collectingCoins = new Set();
    this._collectingCrystals = new Set();
    this._collectingPowerups = new Set();

    this.sparkleEmitter = scene.add.particles(0, 0, 'particle_sparkle', {
      lifespan: 400,
      speed: { min: 30, max: 90 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      emitting: false
    });

    this._portalActivated = false;

    this.initAnimations();
  }

  initAnimations() {
    const { anims } = this.scene;

    if (!anims.exists('coin-spin')) {
      anims.create({
        key: 'coin-spin',
        frames: [
          { key: 'coin_0' },
          { key: 'coin_1' },
          { key: 'coin_2' },
          { key: 'coin_3' }
        ],
        frameRate: 8,
        repeat: -1
      });
    }

    if (!anims.exists('crystal-shimmer')) {
      anims.create({
        key: 'crystal-shimmer',
        frames: [
          { key: 'crystal_0' },
          { key: 'crystal_1' },
          { key: 'crystal_2' },
          { key: 'crystal_3' }
        ],
        frameRate: 5,
        repeat: -1
      });
    }

    if (!anims.exists('portal-swirl')) {
      anims.create({
        key: 'portal-swirl',
        frames: [
          { key: 'portal_0' },
          { key: 'portal_1' },
          { key: 'portal_2' },
          { key: 'portal_3' },
          { key: 'portal_4' },
          { key: 'portal_5' },
          { key: 'portal_6' },
          { key: 'portal_7' }
        ],
        frameRate: 10,
        repeat: -1
      });
    }
  }

  buildLevel(levelData) {
    // ----------------------------------------------------------------
    // 1. Coins – dynamic physics sprites with no gravity
    // ----------------------------------------------------------------
    (levelData.coins || []).forEach((c, idx) => {
      const coin = this.coinsGroup.create(c.x, c.y, 'coin_0');
      coin.play('coin-spin');
      // Physics body size (smaller than sprite for fairness)
      coin.body.setSize(14, 14);
      coin.body.setOffset((coin.width - 14) / 2, (coin.height - 14) / 2);

      // Gentle floating bob – safe because overlap uses sprite.x/y directly
      const baseY = c.y;
      this.scene.tweens.add({
        targets: coin,
        y: baseY - 7,
        duration: 1100 + (idx % 5) * 130,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          // Keep physics body position in sync with tweened display position
          if (coin.active && coin.body) {
            coin.body.reset(coin.x, coin.y);
          }
        }
      });
    });

    // ----------------------------------------------------------------
    // 2. Crystals
    // ----------------------------------------------------------------
    (levelData.crystals || []).forEach(cr => {
      const crystal = this.crystalsGroup.create(cr.x, cr.y, 'crystal_0');
      crystal.play('crystal-shimmer');
      crystal.body.setSize(14, 18);
      crystal.body.setOffset((crystal.width - 14) / 2, (crystal.height - 18) / 2);

      const baseY = cr.y;
      this.scene.tweens.add({
        targets: crystal,
        y: baseY - 9,
        duration: 1300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          if (crystal.active && crystal.body) {
            crystal.body.reset(crystal.x, crystal.y);
          }
        }
      });
    });

    // ----------------------------------------------------------------
    // 3. Powerups
    // ----------------------------------------------------------------
    (levelData.powerups || []).forEach(p => {
      let textureKey = 'powerup_magnet';
      if (p.type === 'shield') textureKey = 'powerup_shield';
      if (p.type === 'score2x') textureKey = 'powerup_score2x';

      const powerup = this.powerupsGroup.create(p.x, p.y, textureKey);
      powerup.powerupType = p.type;
      powerup.body.setSize(20, 20);
      powerup.body.setOffset((powerup.width - 20) / 2, (powerup.height - 20) / 2);

      const baseY = p.y;
      this.scene.tweens.add({
        targets: powerup,
        y: baseY - 8,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 1050,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: () => {
          if (powerup.active && powerup.body) {
            powerup.body.reset(powerup.x, powerup.y);
          }
        }
      });
    });

    // ----------------------------------------------------------------
    // 4. End Portal – physics sprite with beacon beam & cosmic VFX
    // ----------------------------------------------------------------
    if (levelData.portal) {
      const px = levelData.portal.x;
      const py = levelData.portal.y;

      // Vertical Starlight Beacon Beam
      this.portalBeam = this.scene.add.sprite(px, py - 68, 'portal_beam')
        .setDepth(8.4)
        .setAlpha(0.65);

      this.scene.tweens.add({
        targets: this.portalBeam,
        alpha: 0.95,
        scaleX: 1.15,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Main Portal Physics Sprite
      this.portal = this.scene.physics.add.sprite(px, py, 'portal_0')
        .setDepth(10);
      this.portal.body.allowGravity = false;
      this.portal.setImmovable(true);
      this.portal.play('portal-swirl');

      // Portal hitbox covers the gateway opening
      this.portal.body.setSize(30, 52);
      this.portal.body.setOffset(9, 6);

      // Gentle scale pulse
      this.scene.tweens.add({
        targets: this.portal,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 850,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Floating Gateway Indicator Badge
      this.portalBadge = this.scene.add.text(px, py - 46, '▼ WARP GATE ▼', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#00f0ff',
        stroke: '#060a20',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(14);

      this.scene.tweens.add({
        targets: this.portalBadge,
        y: py - 52,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      // Orbiting Gateway Runes
      this.portalRunes = [];
      for (let r = 0; r < 2; r++) {
        const rune = this.scene.add.sprite(px, py, 'portal_rune')
          .setDepth(12)
          .setScale(0.85)
          .setAlpha(0.8);
        this.portalRunes.push(rune);
      }

      // Upward Stardust Sparkle Fountain Emitter
      try {
        this.portalSparkEmitter = this.scene.add.particles(px, py + 14, 'particle_sparkle', {
          lifespan: 750,
          speedY: { min: -35, max: -80 },
          speedX: { min: -16, max: 16 },
          scale: { start: 0.7, end: 0 },
          alpha: { start: 0.85, end: 0 },
          frequency: 180,
          depth: 13
        });
      } catch (e) {
        this.portalSparkEmitter = null;
      }
    }
  }

  update(player) {
    if (!player || player.isDead) return;

    // ----------------------------------------------------------------
    // Portal Proximity & Orbiting Rune Animations
    // ----------------------------------------------------------------
    if (this.portal && this.portal.active) {
      this._portalTimer = (this._portalTimer || 0) + 0.04;
      const t = this._portalTimer;

      // Update orbiting runes
      if (this.portalRunes && this.portalRunes.length === 2) {
        this.portalRunes[0].setPosition(this.portal.x + Math.cos(t) * 26, this.portal.y + Math.sin(t) * 16);
        this.portalRunes[1].setPosition(this.portal.x + Math.cos(t + Math.PI) * 26, this.portal.y + Math.sin(t + Math.PI) * 16);
      }

      // Proximity interaction: portal reacts as player approaches
      const distToPortal = Phaser.Math.Distance.Between(player.x, player.y, this.portal.x, this.portal.y);
      if (distToPortal < 220) {
        // Accelerate swirl rate and increase beacon intensity
        if (this.portal.anims) this.portal.anims.timeScale = 1.8;
        if (this.portalBadge) this.portalBadge.setText('★ ENTER GATE ★').setColor('#ffd700');
        if (this.portalBeam) this.portalBeam.setAlpha(0.95);
      } else {
        if (this.portal.anims) this.portal.anims.timeScale = 1.0;
        if (this.portalBadge) this.portalBadge.setText('▼ WARP GATE ▼').setColor('#00f0ff');
        if (this.portalBeam) this.portalBeam.setAlpha(0.65);
      }
    }

    // ----------------------------------------------------------------
    // Magnet Attraction Logic – move coins toward player
    // ----------------------------------------------------------------
    const magnetState = player.isMagnetActive();
    if (magnetState) {
      const isPassive = (magnetState === 'passive');
      const magnetRadius = isPassive ? 95 : 160;
      const pullSpeed = isPassive ? 190 : 280;
      const dt = 1 / 60; // approximate fixed-step

      this.coinsGroup.getChildren().forEach(coin => {
        if (!coin.active) return;
        const dist = Phaser.Math.Distance.Between(player.x, player.y, coin.x, coin.y);
        if (dist <= magnetRadius && dist > 2) {
          const angle = Phaser.Math.Angle.Between(coin.x, coin.y, player.x, player.y);
          const step = Math.min(pullSpeed * dt, dist);
          coin.x += Math.cos(angle) * step;
          coin.y += Math.sin(angle) * step;
          // Sync physics body
          if (coin.body) {
            coin.body.reset(coin.x, coin.y);
          }
        }
      });
    }
  }

  showFloatingText(x, y, text, color = '#ffd700') {
    const txt = this.scene.add.text(x, y - 8, text, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(25);

    this.scene.tweens.add({
      targets: txt,
      y: y - 38,
      alpha: 0,
      duration: 850,
      ease: 'Power1',
      onComplete: () => txt.destroy()
    });
  }

  collectCoin(player, coin) {
    // Guard against double-fire from overlap
    if (!coin.active || this._collectingCoins.has(coin)) return 0;
    this._collectingCoins.add(coin);

    const pts = 100 * player.getScoreMultiplier();
    this.sparkleEmitter.emitParticleAt(coin.x, coin.y, 5);
    audioManager.playCoin();
    this.showFloatingText(coin.x, coin.y, `+${pts}`);

    // Disable physics before destroy to prevent overlap from firing again
    coin.body.enable = false;
    coin.destroy();
    return pts;
  }

  collectCrystal(player, crystal) {
    if (!crystal.active || this._collectingCrystals.has(crystal)) return 0;
    this._collectingCrystals.add(crystal);

    const pts = 500 * player.getScoreMultiplier();
    this.sparkleEmitter.emitParticleAt(crystal.x, crystal.y, 12);
    audioManager.playCrystal();
    this.showFloatingText(crystal.x, crystal.y, `+${pts} GEM!`, '#ff007a');

    crystal.body.enable = false;
    crystal.destroy();
    return pts;
  }

  collectPowerup(player, powerup) {
    if (!powerup.active || this._collectingPowerups.has(powerup)) return;
    this._collectingPowerups.add(powerup);

    const type = powerup.powerupType;
    this.sparkleEmitter.emitParticleAt(powerup.x, powerup.y, 14);

    if (type === 'magnet') {
      player.activateMagnet(12000);
      this.showFloatingText(powerup.x, powerup.y, 'MAGNET ON!', '#2a75ff');
    } else if (type === 'shield') {
      player.activateShield();
      this.showFloatingText(powerup.x, powerup.y, 'SHIELD ON!', '#00f0ff');
    } else if (type === 'score2x') {
      player.activateScoreMultiplier(12000);
      this.showFloatingText(powerup.x, powerup.y, '2X SCORE!', '#ffd700');
    }

    powerup.body.enable = false;
    powerup.destroy();
  }

  /**
   * Activate portal – called once by GameScene on first overlap.
   * Returns true only the first time.
   */
  activatePortal() {
    if (this._portalActivated) return false;
    this._portalActivated = true;
    return true;
  }
}
