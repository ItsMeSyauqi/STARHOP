/**
 * STARHOP - Player Entity
 * Handles player physics, responsive platformer controls (variable jump, coyote time, jump buffer),
 * character animations, powerup states (Shield, Magnet, Score 2X), safe respawn,
 * and Active Accessory Abilities (E key / touch button).
 *
 * FIXED:
 * - Gravity check: uses body.blocked.down (more reliable than body.touching.down for static groups).
 * - Particle emitter: Phaser 3.60+ API uses add.particles(x, y, texture, config).
 * - Safe point only updates when fully stopped (no Y velocity too, prevents mid-air captures).
 * - invulnerableTimer now correctly stops the blink tween AND resets alpha.
 * - handleGameOver: emits 'game-over' via scene events (not physics.add.overlap re-entry).
 * - destroy() is now guarded to not crash if scene was already torn down.
 * - Coyote timer now resets to 0 after jumping (prevents double-jump on edge).
 * - Animation transitions guarded with try/catch for restart safety.
 *
 * ADDED:
 * - Active Ability system: each accessory grants a unique active power (E key).
 *   wings_photon  → Phase Dash  (immune dash in run direction)
 *   halo_cosmic   → Halo Barrier (temporary invulnerable aura shield)
 *   jetpack_thruster → Jetpack Hover (hold jump in air to float)
 *   crown_plasma  → Plasma Blast (destroy all drones within 120px)
 *   cape_nebula   → Comet Glide  (slow fall + coin magnet burst)
 * - Landing-from-height screen shake when falling speed > 420 px/s.
 */

import Phaser from 'phaser';
import { getCharacterById } from '../data/characters.js';
import { audioManager } from '../systems/AudioManager.js';
import { saveManager } from '../systems/SaveManager.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, charId = 'nova') {
    super(scene, x, y, `${charId}_idle_0`);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.charConfig = getCharacterById(charId);
    this.charId = this.charConfig.id;

    // --- Physics body tuning ---
    this.setCollideWorldBounds(true);
    this.body.setSize(16, 22);
    this.body.setOffset(4, 4);
    this.body.setMaxVelocity(320, 750);
    this.body.setGravityY(0); // Use world gravity only

    // --- Stats from character config & Synergy bonuses ---
    this.speed = this.charConfig.stats.speed;
    this.jumpForce = this.charConfig.stats.jump; // negative value (upward)
    this.maxLives = 3;

    // --- Cosmetic Accessory & Synergy Evaluation ---
    this.equippedAccessory = saveManager.getEquippedAccessory();
    this.accessorySprite = scene.add.sprite(x, y, 'acc_wings_0')
      .setVisible(false)
      .setDepth(9.6);
    this._accTimer = 0;
    this._accFrame = 0;
    this._synergySparkTimer = 0;

    // Apply synergy stats if signature gear is equipped
    this._applySynergyPerks();
    this.lives = this.maxLives;

    // --- Platformer feel mechanics ---
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.wasOnGround = false;
    this._isJumping = false;

    // --- Respawn state ---
    this.spawnPoint = { x, y };
    this.lastSafePoint = { x, y };
    this.isInvulnerable = false;
    this._invulTimer = null;
    this._blinkTween = null;
    this.isDead = false;
    this._isHandlingVoidFall = false;
    this.isFallingFromTrap = false;
    this._isAngelRescuing = false;
    this.angelWingsSprite = null;
    this._sparkTimer = 0;
    this.isIntroDropping = false;
    this._prevVelocityY = 0; // for landing-from-height detection

    // --- Active Ability state ---
    this.abilityCooldown = 0;       // ms remaining on cooldown
    this.abilityActive = false;     // true while ability is in effect
    this.abilityTimer = 0;          // ms remaining of active effect
    this._dashActive = false;       // Phase Dash: physics immune frame
    this._dashDir = null;           // Phase Dash: locked direction
    this._hoverActive = false;      // Jetpack Hover: float frame
    this._abilityPressed = false;   // debounce

    // --- Powerup state ---
    this.hasShield = false;
    this.magnetTimer = 0;
    this.scoreMultiplierTimer = 0;

    // --- Visual attachments (created after add.existing) ---
    this.shieldSprite = scene.add.sprite(x, y, 'shield_aura')
      .setVisible(false)
      .setDepth(12);
    this.magnetSprite = scene.add.sprite(x, y, 'magnet_aura')
      .setVisible(false)
      .setDepth(11);

    this.applyAccessory(this.equippedAccessory);

    // --- Dust particle emitter ---
    try {
      this.dustEmitter = scene.add.particles(0, 0, 'particle_dust', {
        lifespan: 260,
        speed: { min: 18, max: 45 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.55, end: 0 },
        emitting: false,
        depth: 9
      });
    } catch (e) {
      this.dustEmitter = null;
    }

    // --- Cosmic Synergy Sparkle Emitter ---
    try {
      this.synergyEmitter = scene.add.particles(0, 0, 'particle_sparkle', {
        lifespan: 360,
        speed: { min: 14, max: 36 },
        scale: { start: 0.75, end: 0 },
        alpha: { start: 0.85, end: 0 },
        emitting: false,
        depth: 11
      });
    } catch (e) {
      this.synergyEmitter = null;
    }

    this.initAnimations();
  }

  initAnimations() {
    const { anims } = this.scene;
    const id = this.charId;

    // Guard: animations persist across scene restarts if scene was restarted
    if (!anims.exists(`${id}-idle`)) {
      anims.create({
        key: `${id}-idle`,
        frames: [{ key: `${id}_idle_0` }, { key: `${id}_idle_1` }],
        frameRate: 3,
        repeat: -1
      });
    }

    if (!anims.exists(`${id}-run`)) {
      anims.create({
        key: `${id}-run`,
        frames: [
          { key: `${id}_run_0` },
          { key: `${id}_run_1` },
          { key: `${id}_run_2` },
          { key: `${id}_run_3` }
        ],
        frameRate: 10,
        repeat: -1
      });
    }

    try {
      this.play(`${id}-idle`);
    } catch (e) { /* safe */ }
  }

  update(time, delta, inputState) {
    // Track previous Y velocity for landing-from-height detection
    const prevVelY = this._prevVelocityY || 0;
    if (this.isDead || !this.body || this.isIntroDropping) return;

    // --- Dramatic tumble fall sequence when hitting a trap ---
    if (this.isFallingFromTrap) {
      this._sparkTimer = (this._sparkTimer || 0) + delta;
      if (this._sparkTimer > 50) {
        this._sparkTimer = 0;
        if (this.dustEmitter) {
          this.dustEmitter.emitParticleAt(this.x, this.y, 2);
        }
      }

      const worldH = this.scene.physics.world.bounds.height;
      if (this.y > worldH - 30) {
        if (this.lives <= 0) {
          this.handleGameOver();
        } else {
          this.endTrapTumbleFallAndRespawn();
        }
      }
      return;
    }

    if (this._isAngelRescuing) {
      if (this.angelWingsSprite && this.angelWingsSprite.active) {
        this.angelWingsSprite.setPosition(this.x, this.y);
      }
      return;
    }

    const onGround = Boolean(this.body.blocked.down || this.body.touching.down);

    // --- Safe checkpoint: save when resting on platform ---
    if (onGround && Math.abs(this.body.velocity.y) < 5 && !this.isFallingFromTrap && !this._isAngelRescuing) {
      this.lastSafePoint = { x: this.x, y: this.y };
    }

    // --- Landing dust burst + screen shake from height ---
    if (onGround && !this.wasOnGround) {
      this._isJumping = false;
      if (this.dustEmitter) {
        this.dustEmitter.emitParticleAt(this.x, this.y + 10, 4);
      }
      // Heavy landing shake when falling fast (420+ px/s)
      if (prevVelY > 420 && this.scene && this.scene.cameras && this.scene.cameras.main) {
        const intensity = Math.min(0.022, 0.008 + (prevVelY - 420) / 18000);
        const duration  = prevVelY > 650 ? 220 : 130;
        this.scene.cameras.main.shake(duration, intensity);
        // Extra dust for hard slam
        if (prevVelY > 550 && this.dustEmitter) {
          this.dustEmitter.emitParticleAt(this.x - 10, this.y + 10, 4);
          this.dustEmitter.emitParticleAt(this.x + 10, this.y + 10, 4);
        }
      }
    }
    this.wasOnGround = onGround;
    this._prevVelocityY = this.body ? this.body.velocity.y : 0;

    // --- Coyote time ---
    if (onGround) {
      this.coyoteTimer = 160;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    // --- Jump buffer (tuned for ultra-responsive mobile touch) ---
    if (inputState.jumpPressed) {
      this.jumpBufferTimer = 250;
    } else if (inputState.jump && onGround && !this._isJumping) {
      // Smooth bunny-hop / landing buffer when holding jump across platforms
      this.jumpBufferTimer = 200;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);
    }

    // --- Horizontal movement ---
    if (this._dashActive) {
      const dashDir = (this._dashDir !== undefined && this._dashDir !== null) ? this._dashDir : (this.flipX ? -1 : 1);
      this.setVelocityX(dashDir * this.speed * 3.2);
    } else if (inputState.left && !inputState.right) {
      this.setVelocityX(-this.speed);
      this.setFlipX(true);
      if (onGround) this._playAnim(`${this.charId}-run`);
    } else if (inputState.right && !inputState.left) {
      this.setVelocityX(this.speed);
      this.setFlipX(false);
      if (onGround) this._playAnim(`${this.charId}-run`);
    } else {
      // Decelerate
      const vx = this.body.velocity.x * 0.72;
      this.setVelocityX(Math.abs(vx) < 8 ? 0 : vx);
      if (onGround) this._playAnim(`${this.charId}-idle`);
    }

    // Phase Dash airborne gravity dampening
    if (this._dashActive && !onGround && this.body.velocity.y > 20) {
      this.setVelocityY(20);
    }

    // --- Jump ---
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.setVelocityY(this.jumpForce);
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this._isJumping = true;
      audioManager.playJump();
      if (this.dustEmitter) this.dustEmitter.emitParticleAt(this.x, this.y + 10, 5);
      if (this.synergyEmitter && this.isSignatureSynergyActive()) {
        this.synergyEmitter.emitParticleAt(this.x, this.y + 6, 4);
      }
    }

    // --- Active Ability cooldown tick ---
    if (this.abilityCooldown > 0) {
      this.abilityCooldown = Math.max(0, this.abilityCooldown - delta);
    }
    if (this.abilityTimer > 0) {
      this.abilityTimer = Math.max(0, this.abilityTimer - delta);
      if (this.abilityTimer <= 0) {
        this._endAbilityEffect();
      }
    }

    // --- Jetpack Hover (hold jump in air) & Comet Glide Slow-Fall ---
    if (this._hoverActive && !onGround) {
      if (this._glideBoost) {
        // Comet Glide: gentle float / slow-fall glide (cap downward velocity)
        if (this.body.velocity.y > 65) {
          this.setVelocityY(65);
        }
      } else if (inputState.jump) {
        // Counteract gravity gently to hover
        const hoverForce = this.scene.physics.world.gravity.y * 0.85;
        this.body.setAccelerationY(-hoverForce);
      } else {
        this.body.setAccelerationY(0);
      }
    } else {
      if (this.body) this.body.setAccelerationY(0);
    }

    // --- Active Ability trigger (E key or touch-ability event) ---
    const abilityInput = inputState.abilityPressed;
    if (abilityInput && !this._abilityPressed) {
      this._abilityPressed = true;
      this.activateAbility();
    } else if (!abilityInput) {
      this._abilityPressed = false;
    }

    // --- Cosmic synergy aura sparkle emission during motion ---
    const isMoving = Math.abs(this.body.velocity.x) > 10;
    if (this.isSignatureSynergyActive() && (isMoving || !onGround)) {
      this._synergySparkTimer = (this._synergySparkTimer || 0) + delta;
      if (this._synergySparkTimer > 150) {
        this._synergySparkTimer = 0;
        if (this.synergyEmitter) {
          const offsetX = this.flipX ? 6 : -6;
          this.synergyEmitter.emitParticleAt(this.x + offsetX, this.y + 2, 1);
        }
      }
    }

    // --- Variable jump height (cut apex on release) ---
    if (!inputState.jump && this._isJumping && this.body.velocity.y < -60) {
      this.setVelocityY(this.body.velocity.y * 0.50);
    }

    // --- Mid-air texture ---
    if (!onGround) {
      try {
        this.setTexture(`${this.charId}_jump`);
      } catch (e) { /* safe */ }
    }

    // --- Powerup visual timers ---
    if (this.magnetTimer > 0) {
      this.magnetTimer = Math.max(0, this.magnetTimer - delta);
      this.magnetSprite.setPosition(this.x, this.y).setVisible(true);
      this.magnetSprite.rotation += 0.04;
    } else {
      this.magnetSprite.setVisible(false);
    }

    if (this.scoreMultiplierTimer > 0) {
      this.scoreMultiplierTimer = Math.max(0, this.scoreMultiplierTimer - delta);
    }

    if (this.hasShield) {
      this.shieldSprite.setPosition(this.x, this.y).setVisible(true);
      this.shieldSprite.rotation += 0.025;
    } else {
      this.shieldSprite.setVisible(false);
    }

    // --- Cosmetic Accessory Animation & Tracking ---
    if (this.equippedAccessory && this.equippedAccessory !== 'none' && this.accessorySprite && !this.isDead && !this.isFallingFromTrap) {
      this._updateAccessoryAnimation(time, delta);
    } else if (this.accessorySprite && this.accessorySprite.visible && (this.isDead || this.isFallingFromTrap)) {
      this.accessorySprite.setVisible(false);
    }

    // --- Void detection (falling towards space abyss) ---
    const worldH = this.scene.physics.world.bounds.height;

    // Angel Wings Rescue: catch player in clear view before falling off the bottom of the screen!
    if (this.hasShield && !this._isAngelRescuing && !this.isDead && this.y >= worldH - 22) {
      this.triggerAngelRescue();
      return;
    }

    if (this.y > worldH + 20) {
      this.handleVoidFall();
    }
  }

  // ============================================================
  // ACTIVE ABILITY SYSTEM
  // ============================================================

  /**
   * Triggers the active ability for the currently equipped accessory.
   * Each accessory has a unique power on a per-accessory cooldown.
   */
  activateAbility() {
    if (this.isDead || this.isFallingFromTrap || this._isAngelRescuing) return;
    if (!this.equippedAccessory || this.equippedAccessory === 'none') return;
    if (this.abilityCooldown > 0) {
      // Blocked: show tiny cooldown flash
      this._showAbilityCooldownBlock();
      return;
    }

    try {
      if (audioManager.playAbility) audioManager.playAbility(this.equippedAccessory);
    } catch (e) {}

    switch (this.equippedAccessory) {
      case 'wings_photon':   this._abilityPhaseDash();   break;
      case 'halo_cosmic':    this._abilityHaloBarrier(); break;
      case 'jetpack_thruster': this._abilityJetpackHover(); break;
      case 'crown_plasma':   this._abilityPlasmaBlast(); break;
      case 'cape_nebula':    this._abilityCometGlide(); break;
    }
  }

  /** wings_photon — Phase Dash: dash in movement direction, immune for 0.35s */
  _abilityPhaseDash() {
    const dashDir = this.flipX ? -1 : 1;
    this._dashDir = dashDir;
    const dashSpeed = this.speed * 3.2;
    this.setVelocityX(dashDir * dashSpeed);
    // Short upward arc if airborne
    if (!this.body.blocked.down) this.setVelocityY(Math.min(this.body.velocity.y, -80));

    this._dashActive = true;
    this.abilityActive = true;
    this.abilityTimer = 350;
    this.abilityCooldown = 4000;
    this.isInvulnerable = true; // immune during dash

    // Visual: cyan afterimage trail
    try {
      for (let i = 0; i < 5; i++) {
        const ghost = this.scene.add.sprite(this.x - dashDir * i * 8, this.y, this.texture.key)
          .setDepth(9)
          .setAlpha(0.55 - i * 0.09)
          .setFlipX(this.flipX)
          .setTint(0x00f0ff);
        this.scene.tweens.add({
          targets: ghost, alpha: 0, duration: 220,
          onComplete: () => { if (ghost && ghost.destroy) ghost.destroy(); }
        });
      }
      if (this.synergyEmitter) this.synergyEmitter.emitParticleAt(this.x, this.y, 8);
    } catch (e) {}

    // Camera: snap flash
    try { this.scene.cameras.main.flash(80, 0, 240, 255); } catch (e) {}

    this._showAbilityText('⚡ PHASE DASH!', '#00f0ff');
    this.scene.game.events.emit('ability-activated', { id: 'wings_photon', cooldownMs: 4000 });
  }

  /** halo_cosmic — Halo Barrier: golden invulnerable aura for 3 seconds */
  _abilityHaloBarrier() {
    this.abilityActive = true;
    this.abilityTimer = 3000;
    this.abilityCooldown = 8000;
    this.makeInvulnerable(3000);

    // Spawn golden ring aura
    try {
      const aura = this.scene.add.sprite(this.x, this.y, 'shield_aura')
        .setDepth(13).setScale(1.2).setTint(0xffd700).setAlpha(0.85);
      // Pulsate & follow player for 3s
      const followEvt = this.scene.time.addEvent({
        delay: 16, loop: true,
        callback: () => {
          if (!this.active || !aura.active) { followEvt.remove(); if (aura && aura.destroy) aura.destroy(); return; }
          aura.setPosition(this.x, this.y);
          aura.rotation += 0.03;
          aura.alpha = 0.6 + Math.sin(Date.now() * 0.008) * 0.25;
        }
      });
      this.scene.time.delayedCall(3000, () => {
        followEvt.remove();
        if (aura && aura.active) {
          this.scene.tweens.add({ targets: aura, alpha: 0, scale: 2.2, duration: 300,
            onComplete: () => { if (aura && aura.destroy) aura.destroy(); }
          });
        }
      });
    } catch (e) {}

    try { this.scene.cameras.main.flash(120, 255, 210, 0); } catch (e) {}
    this._showAbilityText('✨ HALO BARRIER!', '#ffd700');
    this.scene.game.events.emit('ability-activated', { id: 'halo_cosmic', cooldownMs: 8000 });
  }

  /** jetpack_thruster — Jetpack Hover: float in air for 2.5s while holding jump */
  _abilityJetpackHover() {
    this._hoverActive = true;
    this.abilityActive = true;
    this.abilityTimer = 2500;
    this.abilityCooldown = 6000;

    // Flame particle loop
    try {
      const hoverInterval = this.scene.time.addEvent({
        delay: 60, loop: true,
        callback: () => {
          if (!this._hoverActive || !this.active) { hoverInterval.remove(); return; }
          if (this.dustEmitter) this.dustEmitter.emitParticleAt(this.x, this.y + 10, 2);
        }
      });
      // Stop on timer end
      this.scene.time.delayedCall(2500, () => hoverInterval.remove());
    } catch (e) {}

    try { this.scene.cameras.main.flash(80, 255, 120, 0); } catch (e) {}
    this._showAbilityText('🔥 JETPACK!', '#ff6600');
    this.scene.game.events.emit('ability-activated', { id: 'jetpack_thruster', cooldownMs: 6000 });
  }

  /** crown_plasma — Plasma Blast: destroy all drones within 120px radius */
  _abilityPlasmaBlast() {
    this.abilityCooldown = 7000;
    const radius = 120;

    // Visual: expanding purple shockwave ring
    try {
      const ring = this.scene.add.circle(this.x, this.y, 12, 0x9b51e0, 0.8).setDepth(20);
      this.scene.tweens.add({
        targets: ring, scaleX: radius / 6, scaleY: radius / 6, alpha: 0, duration: 380,
        ease: 'Cubic.easeOut',
        onComplete: () => { if (ring && ring.destroy) ring.destroy(); }
      });
      if (this.synergyEmitter) this.synergyEmitter.emitParticleAt(this.x, this.y, 12);
    } catch (e) {}

    // Destroy nearby drones via scene event
    this.scene.game.events.emit('ability-activated', { id: 'crown_plasma', cooldownMs: 7000 });
    this.scene.events.emit('plasma-blast', { x: this.x, y: this.y, radius });

    try { this.scene.cameras.main.shake(140, 0.012); this.scene.cameras.main.flash(100, 155, 0, 255); } catch (e) {}
    this._showAbilityText('👑 PLASMA BLAST!', '#9b51e0');
  }

  /** cape_nebula — Comet Glide: slow-fall + coin magnet burst for 3s */
  _abilityCometGlide() {
    this._hoverActive = true; // partial gravity reduction
    this.abilityActive = true;
    this.abilityTimer = 3000;
    this.abilityCooldown = 6000;

    // Temporarily override magnet to active (re-uses existing isMagnetActive path)
    this._glideBoost = true;

    // Star trail during glide
    try {
      const trailEvt = this.scene.time.addEvent({
        delay: 80, loop: true,
        callback: () => {
          if (!this._glideBoost || !this.active) { trailEvt.remove(); return; }
          if (this.synergyEmitter) this.synergyEmitter.emitParticleAt(this.x, this.y + 4, 2);
        }
      });
      this.scene.time.delayedCall(3000, () => trailEvt.remove());
    } catch (e) {}

    try { this.scene.cameras.main.flash(80, 120, 0, 220); } catch (e) {}
    this._showAbilityText('🌌 COMET GLIDE!', '#7928ca');
    this.scene.game.events.emit('ability-activated', { id: 'cape_nebula', cooldownMs: 6000 });
  }

  /** Called when abilityTimer expires to clean up per-ability effects */
  _endAbilityEffect() {
    const wasDash = this._dashActive;
    this.abilityActive = false;
    this._dashActive = false;
    this._dashDir = null;
    this._hoverActive = false;
    this._glideBoost = false;
    if (wasDash && !this._invulTimer) {
      this.isInvulnerable = false;
    }
    if (this.body) this.body.setAccelerationY(0);
  }

  /** isMagnetActive override: also true during Comet Glide boost */
  isMagnetActive() {
    if (this.magnetTimer > 0) return true;
    if (this._glideBoost) return true; // comet glide active magnet
    if (this.charId === 'comet' && this.equippedAccessory === 'cape_nebula') {
      return 'passive';
    }
    return false;
  }

  /** Floating ability text (reuses scene's showFloatingText if available) */
  _showAbilityText(message, color) {
    try {
      if (this.scene && this.scene.showFloatingText) {
        this.scene.showFloatingText(this.x, this.y - 22, message, color);
      } else {
        const txt = this.scene.add.text(this.x, this.y - 22, message, {
          fontFamily: '"Press Start 2P", monospace', fontSize: '9px',
          color, stroke: '#000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(28);
        this.scene.tweens.add({
          targets: txt, y: this.y - 58, alpha: 0, scale: 1.2, duration: 700,
          onComplete: () => { if (txt && txt.destroy) txt.destroy(); }
        });
      }
    } catch (e) {}
  }

  /** Small flash to indicate ability is still on cooldown */
  _showAbilityCooldownBlock() {
    try {
      const remaining = Math.ceil(this.abilityCooldown / 1000);
      this._showAbilityText(`⏳ ${remaining}s`, '#888888');
    } catch (e) {}
  }

  /**
   * Updates texture and visibility of equipped cosmetic accessory
   */
  /**
   * Applies synergy perks when robot and signature accessory match
   */
  _applySynergyPerks() {
    const isSynergy = this.isSignatureSynergyActive();
    if (!isSynergy) {
      this.speed = this.charConfig.stats.speed;
      this.jumpForce = this.charConfig.stats.jump;
      this.maxLives = 3;
      return;
    }

    // Individual signature synergy bonuses:
    if (this.charId === 'solaris') {
      // Ascended Solar Deity: +1 Extra solar shield life
      this.maxLives = 4;
    } else if (this.charId === 'byte') {
      // Cyber Infiltrator: +8% Overdrive Speed
      this.speed = Math.round(this.charConfig.stats.speed * 1.08);
    } else if (this.charId === 'nova') {
      // Stellar Archangel: +6% High-altitude Gliding Jump
      // jumpForce is negative (upward), so use Math.floor to get more negative = stronger jump
      this.jumpForce = Math.floor(this.charConfig.stats.jump * 1.06);
    }
  }

  /**
   * Checks if current character is equipped with their canonical signature gear
   */
  isSignatureSynergyActive() {
    return Boolean(
      this.charConfig?.signatureAccessory &&
      this.equippedAccessory &&
      this.equippedAccessory !== 'none' &&
      this.charConfig.signatureAccessory === this.equippedAccessory
    );
  }

  /**
   * Updates texture and visibility of equipped cosmetic accessory
   */
  applyAccessory(accessoryId) {
    const prevMax = this.maxLives;
    this.equippedAccessory = accessoryId || 'none';
    this._applySynergyPerks();
    if (this.maxLives !== prevMax) {
      if (this.lives > this.maxLives) {
        this.lives = this.maxLives;
      } else if (this.maxLives > prevMax && this.lives === prevMax) {
        this.lives = this.maxLives;
      }
      if (this.scene && this.scene.events) {
        this.scene.events.emit('player-life-changed', this.lives);
      }
    }
    if (!this.accessorySprite) return;

    if (this.equippedAccessory === 'none') {
      this.accessorySprite.setVisible(false);
      return;
    }

    this.accessorySprite.setVisible(true);
    if (this.equippedAccessory === 'wings_photon') {
      this.accessorySprite.setTexture('acc_wings_0').setDepth(9.6);
    } else if (this.equippedAccessory === 'halo_cosmic') {
      this.accessorySprite.setTexture('acc_halo_0').setDepth(11.2);
    } else if (this.equippedAccessory === 'jetpack_thruster') {
      this.accessorySprite.setTexture('acc_jetpack_0').setDepth(9.6);
    } else if (this.equippedAccessory === 'crown_plasma') {
      this.accessorySprite.setTexture('acc_crown_0').setDepth(11.2);
    } else if (this.equippedAccessory === 'cape_nebula') {
      this.accessorySprite.setTexture('acc_cape_0').setDepth(9.4);
    }
  }

  /**
   * Per-frame animation and positioning for active accessory
   */
  _updateAccessoryAnimation(time, delta) {
    if (!this.accessorySprite || !this.body) return;

    if (this.isIntroDropping || this.equippedAccessory === 'none') {
      this.accessorySprite.setVisible(false);
      return;
    }

    const onFloor = Boolean(this.body.blocked.down || this.body.touching.down);
    const isJumping = !onFloor && this.body.velocity.y < -30;
    const isMoving = Math.abs(this.body.velocity.x) > 10;

    this.accessorySprite.setVisible(true);
    this.accessorySprite.setAlpha(this.alpha);

    switch (this.equippedAccessory) {
      case 'wings_photon': {
        const xOffset = this.flipX ? 4 : -4;
        this.accessorySprite.setPosition(this.x + xOffset, this.y - 2);
        this.accessorySprite.setFlipX(this.flipX);

        // Flap speed: airborne = 75ms/frame; ground = 200ms/frame
        const frameInterval = onFloor ? 200 : 75;
        this._accTimer = (this._accTimer || 0) + delta;
        if (this._accTimer > frameInterval) {
          this._accTimer = 0;
          this._accFrame = ((this._accFrame || 0) + 1) % 4;
          this.accessorySprite.setTexture(`acc_wings_${this._accFrame}`);
        }
        break;
      }

      case 'halo_cosmic': {
        const floatBob = Math.sin(time * 0.005) * 3;
        this.accessorySprite.setPosition(this.x, this.y - 21 + floatBob);
        this.accessorySprite.rotation = (this.body.velocity.x || 0) * 0.0004;

        // Revolving cosmic orbit animation
        this._accTimer = (this._accTimer || 0) + delta;
        if (this._accTimer > 150) {
          this._accTimer = 0;
          this._accFrame = ((this._accFrame || 0) + 1) % 4;
          this.accessorySprite.setTexture(`acc_halo_${this._accFrame}`);
        }
        break;
      }

      case 'jetpack_thruster': {
        const xOffset = this.flipX ? 7 : -7;
        this.accessorySprite.setPosition(this.x + xOffset, this.y + 1);
        this.accessorySprite.setFlipX(this.flipX);

        // Flame frame: airborne or moving -> active overdrive flame plume
        if (isJumping || (isMoving && !onFloor)) {
          this.accessorySprite.setTexture('acc_jetpack_1');
        } else {
          this.accessorySprite.setTexture('acc_jetpack_0');
        }
        break;
      }

      case 'crown_plasma': {
        const floatBob = Math.sin(time * 0.003) * 1;
        this.accessorySprite.setPosition(this.x, this.y - 15 + floatBob);
        this.accessorySprite.setFlipX(this.flipX);

        // Pulsating plasma energy gem animation
        this._accTimer = (this._accTimer || 0) + delta;
        if (this._accTimer > 180) {
          this._accTimer = 0;
          this._accFrame = ((this._accFrame || 0) + 1) % 4;
          this.accessorySprite.setTexture(`acc_crown_${this._accFrame}`);
        }
        break;
      }

      case 'cape_nebula': {
        const xOffset = this.flipX ? 5 : -5;
        this.accessorySprite.setPosition(this.x + xOffset, this.y + 4);
        this.accessorySprite.setFlipX(this.flipX);

        // Dynamic starlight cloth flutter
        const frameInterval = isMoving ? 100 : 200;
        this._accTimer = (this._accTimer || 0) + delta;
        if (this._accTimer > frameInterval) {
          this._accTimer = 0;
          this._accFrame = ((this._accFrame || 0) + 1) % 4;
          this.accessorySprite.setTexture(`acc_cape_${this._accFrame}`);
        }
        break;
      }
    }
  }

  /** Safe animation play that won't crash if anim doesn't exist */
  _playAnim(key) {
    try {
      if (this.anims.currentAnim?.key !== key) {
        this.play(key, true);
      }
    } catch (e) { /* safe */ }
  }

  activateShield() {
    this.hasShield = true;
    audioManager.playPowerup();
  }

  activateMagnet(durationMs = 12000) {
    this.magnetTimer = durationMs;
    audioManager.playPowerup();
  }

  activateScoreMultiplier(durationMs = 12000) {
    this.scoreMultiplierTimer = durationMs;
    audioManager.playPowerup();
  }

  // isMagnetActive() is now above in the ability section (includes glide boost)

  getScoreMultiplier() {
    const base = this.scoreMultiplierTimer > 0 ? 2 : 1;
    // Quantum Warlord synergy: +25% bonus score on gem pickups
    if (this.charId === 'vortex' && this.equippedAccessory === 'crown_plasma') {
      return base * 1.25;
    }
    return base;
  }

  handleVoidFall() {
    if (this.isDead || this._isHandlingVoidFall || this._isAngelRescuing) return;

    // If Guard (Shield) is active, Angel Wings will rescue the player!
    if (this.hasShield) {
      this.triggerAngelRescue();
      return;
    }

    this._isHandlingVoidFall = true;

    // Void fall bypasses invulnerability and breaks shield
    this.hasShield = false;
    this.shieldSprite.setVisible(false);
    if (this._blinkTween) {
      this._blinkTween.stop();
      this._blinkTween = null;
    }
    this.setAlpha(1);

    // Deduct life
    this.lives -= 1;
    audioManager.playHurt();
    this.scene.events.emit('player-life-changed', this.lives);

    if (this.lives <= 0) {
      this.handleGameOver();
    } else {
      // Respawn at the start of the level
      this.respawnAtStart();
    }

    this.scene.time.delayedCall(280, () => {
      this._isHandlingVoidFall = false;
    });
  }

  /**
   * Divine Angel Wings Rescue:
   * When falling into the void with active Guard,
   * celestial Angel Wings catch the player, lift them smoothly back to the platform,
   * and grant blinking invulnerability without losing any hearts!
   */
  triggerAngelRescue() {
    if (this._isAngelRescuing || this.isDead) return;
    this._isAngelRescuing = true;

    // 1. Break / consume the Guard (Shield)
    this.hasShield = false;
    this.shieldSprite.setVisible(false);
    if (this.scene && this.scene.game && this.scene.game.events) {
      this.scene.game.events.emit('hud-powerup-update', {
        magnet: this.isMagnetActive(),
        shield: false,
        score2x: this.getScoreMultiplier() > 1
      });
    }

    // 2. Halt falling physics & keep player visibly above the bottom of the viewport
    this.setVelocity(0, 0);
    this.setAngularVelocity(0);
    this.angle = 0;
    const worldH = this.scene.physics.world.bounds.height;
    if (this.y > worldH - 36) {
      this.y = worldH - 36;
    }

    if (this.body) {
      this.body.allowGravity = false;
      this.body.velocity.x = 0;
      this.body.velocity.y = 0;
      this.body.checkCollision.none = true;
      this.body.reset(this.x, this.y);
    }

    // 3. Audio: Celestial Angel Rescue Chime (Harp glissando + choir)
    audioManager.playAngelRescue();

    // 4. Visual: Celestial Sunburst Halo Aura & Camera Glow
    if (this.scene) {
      try {
        const halo = this.scene.add.sprite(this.x, this.y - 14, 'angel_halo_aura')
          .setDepth(18)
          .setScale(0.6)
          .setAlpha(1);

        this.scene.tweens.add({
          targets: halo,
          scale: 2.4,
          alpha: 0,
          duration: 750,
          ease: 'Cubic.easeOut',
          onComplete: () => { if (halo && halo.destroy) halo.destroy(); }
        });
      } catch (e) {}

      if (this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.flash(260, 255, 235, 140);
        this.scene.cameras.main.shake(140, 0.008);
      }
    }

    // 5. Floating text: "★ ANGEL RESCUE! ★"
    try {
      const txt = this.scene.add.text(this.x, this.y - 28, '★ ANGEL RESCUE! ★', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '11px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(26);

      this.scene.tweens.add({
        targets: txt,
        y: this.y - 68,
        alpha: 0,
        duration: 1200,
        ease: 'Power1',
        onComplete: () => { if (txt && txt.destroy) txt.destroy(); }
      });
    } catch (e) {}

    // 6. Spawn Angel Wings Sprite on player
    const wings = this.scene.add.sprite(this.x, this.y, 'angel_wings_0')
      .setDepth(16)
      .setScale(1)
      .setAlpha(1);
    this.angelWingsSprite = wings;

    // Wing flap animation cycle during ascent
    const wingFrames = ['angel_wings_0', 'angel_wings_1', 'angel_wings_2', 'angel_wings_1'];
    let frameIdx = 0;
    const flapEvent = this.scene.time.addEvent({
      delay: 110,
      loop: true,
      callback: () => {
        if (!this.angelWingsSprite || !this.angelWingsSprite.active) return;
        frameIdx = (frameIdx + 1) % wingFrames.length;
        this.angelWingsSprite.setTexture(wingFrames[frameIdx]);
      }
    });

    // 7. Calculate destination on safe platform:
    // Place player on the nearest platform if there is no platform currently stepped on
    const nearestPlat = this.findNearestSafePlatform();
    let destX = this.spawnPoint.x;
    let destY = this.spawnPoint.y;

    if (nearestPlat) {
      destX = nearestPlat.x;
      destY = nearestPlat.y;
    } else if (this.lastSafePoint && typeof this.lastSafePoint.x === 'number') {
      destX = this.lastSafePoint.x;
      destY = this.lastSafePoint.y - 8;
    }

    this.lastSafePoint = { x: destX, y: destY };

    // 8. Ascend & lift player smoothly back to the platform
    this.scene.tweens.add({
      targets: this,
      x: destX,
      y: destY,
      duration: 1100,
      ease: 'Cubic.easeInOut',
      onUpdate: () => {
        if (this.angelWingsSprite && this.angelWingsSprite.active) {
          this.angelWingsSprite.setPosition(this.x, this.y);
        }
      },
      onComplete: () => {
        // Stop flap timer
        if (flapEvent) flapEvent.remove();

        // Feather burst on landing
        try {
          for (let f = 0; f < 8; f++) {
            const angle = (f / 8) * Math.PI * 2;
            const feather = this.scene.add.sprite(this.x, this.y, 'angel_feather')
              .setDepth(15)
              .setScale(1)
              .setAlpha(1);
            this.scene.tweens.add({
              targets: feather,
              x: this.x + Math.cos(angle) * 35,
              y: this.y + Math.sin(angle) * 25 + 15,
              alpha: 0,
              angle: 360,
              duration: 600,
              ease: 'Quad.easeOut',
              onComplete: () => { if (feather && feather.destroy) feather.destroy(); }
            });
          }
        } catch (e) {}

        // Graceful wing dispersion
        if (this.angelWingsSprite && this.angelWingsSprite.active) {
          this.scene.tweens.add({
            targets: this.angelWingsSprite,
            scaleX: 1.6,
            scaleY: 1.6,
            alpha: 0,
            duration: 350,
            ease: 'Quad.easeOut',
            onComplete: () => {
              if (this.angelWingsSprite && this.angelWingsSprite.destroy) {
                this.angelWingsSprite.destroy();
                this.angelWingsSprite = null;
              }
            }
          });
        }

        // Restore physics & give blinking invulnerability ("kelap kelip")
        if (this.body) {
          this.body.allowGravity = true;
          this.body.checkCollision.none = false;
          this.body.reset(destX, destY);
          this.setVelocity(0, 0);
        }

        this._isAngelRescuing = false;
        // Blinking invulnerability for 2 seconds (safe landing)
        this.makeInvulnerable(2000);
      }
    });
  }

  /**
   * Quick Respawn:
   * Snappily recovers the player to the nearest safe ground (lastSafePoint)
   * with quantum warp effects and safe invulnerability frames.
   */
  /**
   * Finds the nearest safe platform to land on (used by Angel Rescue when falling off empty gaps)
   */
  findNearestSafePlatform() {
    let nearest = null;
    let minDist = Infinity;
    const px = this.x;
    const py = this.y;
    const worldH = (this.scene && this.scene.physics && this.scene.physics.world) 
      ? this.scene.physics.world.bounds.height 
      : 600;

    // 1. Static Platforms
    const staticPlats = (this.scene && this.scene.levelData && this.scene.levelData.staticPlatforms) || [];
    staticPlats.forEach(p => {
      if (p.y >= worldH - 50) return;
      const halfW = p.w / 2;
      const topY = p.y - 16;
      const clampedX = Math.max(p.x - halfW + 16, Math.min(p.x + halfW - 16, px));
      const dist = Math.hypot(clampedX - px, (topY - py) * 0.6);
      if (dist < minDist) {
        minDist = dist;
        nearest = { x: clampedX, y: topY - 12 };
      }
    });

    // 2. Moving Platforms (only active ones)
    const movingPlats = (this.scene && this.scene.platformManager && this.scene.platformManager.movingPlatforms) || [];
    movingPlats.forEach(p => {
      if (!p.sprite || !p.sprite.active) return;
      const spr = p.sprite;
      if (spr.y >= worldH - 50) return;
      const halfW = (spr.body ? spr.body.width : (spr.width || 90)) / 2;
      const topY = spr.y - (spr.body ? spr.body.height : (spr.height || 24)) / 2;
      const clampedX = Math.max(spr.x - halfW + 16, Math.min(spr.x + halfW - 16, px));
      const dist = Math.hypot(clampedX - px, (topY - py) * 0.6);
      if (dist < minDist) {
        minDist = dist;
        nearest = { x: clampedX, y: topY - 12 };
      }
    });

    // 3. Maglev Conveyors
    const conveyors = (this.scene && this.scene.platformManager && this.scene.platformManager.conveyors) || [];
    conveyors.forEach(cv => {
      if (cv.y >= worldH - 50) return;
      const halfW = cv.w / 2;
      const topY = cv.y - 12;
      const clampedX = Math.max(cv.x - halfW + 16, Math.min(cv.x + halfW - 16, px));
      const dist = Math.hypot(clampedX - px, (topY - py) * 0.6);
      if (dist < minDist) {
        minDist = dist;
        nearest = { x: clampedX, y: topY - 12 };
      }
    });

    return nearest;
  }

  quickRespawn() {
    this.respawnAtStart();
  }

  respawnAtStart() {
    this._endAbilityEffect();
    this.abilityTimer = 0;
    this.isFallingFromTrap = false;
    this._isHandlingVoidFall = false;

    // Restore platform collisions
    if (this.body) {
      this.body.checkCollision.down = true;
      this.body.checkCollision.up = true;
      this.body.checkCollision.left = true;
      this.body.checkCollision.right = true;
    }

    this.setVelocity(0, 0);
    this.setAngularVelocity(0);
    this.angle = 0;
    this.lastSafePoint = { ...this.spawnPoint };
    this.setPosition(this.spawnPoint.x, this.spawnPoint.y);
    if (this.body) {
      this.body.reset(this.spawnPoint.x, this.spawnPoint.y);
    }
    this.makeInvulnerable(2200);

    try {
      audioManager.playTeleport();
    } catch (e) {}

    // Flash camera red
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.flash(260, 240, 30, 40);
    }
    if (this.dustEmitter) {
      this.dustEmitter.emitParticleAt(this.x, this.y, 12);
    }
  }

  takeHazardDamage(isAbyssFall = false) {
    if (isAbyssFall) {
      this.handleVoidFall();
      return;
    }

    if (this.isInvulnerable || this.isDead || this.isFallingFromTrap) return;

    // Shield (Guard) absorbs trap impact!
    if (this.hasShield) {
      this.hasShield = false;
      this.shieldSprite.setVisible(false);
      audioManager.playShieldHit();

      // Shield shatter & deflect visual feedback
      this.playShieldDeflectEffect();

      // Give temporary invulnerability frames (1.6 seconds)
      this.makeInvulnerable(1600);

      // Deflection recoil bounce to lift player away from hazard safely
      if (this.body) {
        this.setVelocityY(-270);
        const recoilX = this.body.velocity.x > 8 ? -130 : (this.body.velocity.x < -8 ? 130 : 0);
        if (recoilX !== 0) {
          this.setVelocityX(recoilX);
        }
      }

      // Micro camera shake to convey absorbed kinetic impact
      if (this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.shake(120, 0.008);
      }

      // Notify scene / HUD of powerup state change immediately
      if (this.scene && this.scene.game && this.scene.game.events) {
        this.scene.game.events.emit('hud-powerup-update', {
          magnet: this.isMagnetActive(),
          shield: false,
          score2x: this.getScoreMultiplier() > 1
        });
      }

      // Crucial: return early so life is NOT deducted and tumble fall is NOT triggered!
      return;
    }

    this.lives -= 1;
    audioManager.playHurt();
    this.scene.events.emit('player-life-changed', this.lives);

    // Directly launch into dramatic tumble fall through platforms to void
    this.startTrapTumbleFall();
  }

  /**
   * Visual feedback when the Shield/Guard deflects a trap/hazard
   */
  playShieldDeflectEffect() {
    if (!this.scene) return;

    // 1. Expanding shield shatter ring
    try {
      const ring = this.scene.add.sprite(this.x, this.y, 'shield_aura')
        .setScale(1)
        .setAlpha(1)
        .setDepth(20);

      this.scene.tweens.add({
        targets: ring,
        scaleX: 2.6,
        scaleY: 2.6,
        alpha: 0,
        duration: 360,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          if (ring && ring.destroy) ring.destroy();
        }
      });
    } catch (e) {}

    // 2. Floating combat text: "GUARD DEFLECT!"
    try {
      const txt = this.scene.add.text(this.x, this.y - 14, 'GUARD DEFLECT!', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#00f0ff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(25);

      this.scene.tweens.add({
        targets: txt,
        y: this.y - 44,
        alpha: 0,
        duration: 850,
        ease: 'Power1',
        onComplete: () => {
          if (txt && txt.destroy) txt.destroy();
        }
      });
    } catch (e) {}

    // 3. Screen flash (cyan / barrier absorption)
    try {
      if (this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.flash(110, 0, 240, 255);
      }
    } catch (e) {}
  }

  /**
   * Dramatic trap collision reaction:
   * Upward knockback pop, wild tumble spin, short-circuit sparks, and fall through platforms into the void
   */
  startTrapTumbleFall() {
    this._endAbilityEffect();
    this.abilityTimer = 0;
    this.isFallingFromTrap = true;
    this._sparkTimer = 0;

    // Cancel blinking and restore full visibility for the tumble
    if (this._blinkTween) {
      this._blinkTween.stop();
      this._blinkTween = null;
    }
    if (this._invulTimer) {
      this.scene.time.removeEvent(this._invulTimer);
      this._invulTimer = null;
    }
    this.isInvulnerable = false;
    this.setAlpha(1);

    // Audio: trap electric zap & descending whistling fall
    audioManager.playTrapZap();
    audioManager.playFallWhistle();

    // Camera impact shake & orange/yellow flash
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.shake(160, 0.016);
      this.scene.cameras.main.flash(140, 255, 210, 40);
    }

    // Disable platform collisions so player plummets right through all platforms
    this.body.checkCollision.down = false;
    this.body.checkCollision.up = false;
    this.body.checkCollision.left = false;
    this.body.checkCollision.right = false;

    // Pop upward launch arc (classic arcade tumble)
    const popDirX = this.flipX ? 110 : -110;
    this.setVelocityY(-350);
    this.setVelocityX(popDirX);

    // Wild spinning tumble
    this.setAngularVelocity(this.flipX ? -720 : 720);

    // Set jump/shock frame
    try {
      this.setTexture(`${this.charId}_jump`);
    } catch (e) {}

    // Spark burst on impact
    if (this.dustEmitter) {
      this.dustEmitter.emitParticleAt(this.x, this.y, 8);
    }

    // Quick respawn timeout: ensure player doesn't stay stuck falling in long chasms
    if (this.scene && this.scene.time) {
      this.scene.time.delayedCall(420, () => {
        if (this.isFallingFromTrap && !this.isDead) {
          if (this.lives <= 0) {
            this.handleGameOver();
          } else {
            this.endTrapTumbleFallAndRespawn();
          }
        }
      });
    }
  }

  /**
   * Completes the tumble fall and respawns the player at level start
   */
  endTrapTumbleFallAndRespawn() {
    this.respawnAtStart();
  }

  respawnSafely() {
    this.respawnAtStart();
  }

  makeInvulnerable(durationMs) {
    this.isInvulnerable = true;

    // Stop any existing blink
    if (this._blinkTween) {
      this._blinkTween.stop();
      this._blinkTween = null;
    }
    if (this._invulTimer) {
      this.scene.time.removeEvent(this._invulTimer);
      this._invulTimer = null;
    }

    this._blinkTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.25,
      duration: 90,
      yoyo: true,
      // Add 1 extra repeat so the tween visually finishes at alpha=1 before the timer callback
      repeat: Math.floor(durationMs / 180) + 1
    });

    this._invulTimer = this.scene.time.delayedCall(durationMs, () => {
      this.isInvulnerable = false;
      this.setAlpha(1);
      if (this._blinkTween) {
        this._blinkTween.stop();
        this._blinkTween = null;
      }
    });
  }

  handleGameOver() {
    if (this.isDead) return;
    this._endAbilityEffect();
    this.abilityTimer = 0;
    this.isDead = true;
    this.isFallingFromTrap = false;
    this.setVelocity(0, 0);
    this.setAngularVelocity(0);
    this.angle = 0;
    if (this.body) this.body.enable = false;
    this.shieldSprite.setVisible(false);
    this.magnetSprite.setVisible(false);
    if (this.accessorySprite) this.accessorySprite.setVisible(false);
    this._isAngelRescuing = false;
    if (this.angelWingsSprite) {
      try { this.angelWingsSprite.destroy(); } catch (e) {}
      this.angelWingsSprite = null;
    }

    if (this._blinkTween) {
      this._blinkTween.stop();
      this._blinkTween = null;
    }
    if (this._invulTimer) {
      this.scene.time.removeEvent(this._invulTimer);
      this._invulTimer = null;
    }
    this.setAlpha(1);

    // If death happened in the void below the world, position at bottom horizon for full visibility
    if (this.scene && this.scene.physics && this.scene.physics.world) {
      const worldH = this.scene.physics.world.bounds.height;
      if (this.y > worldH - 20) {
        this.y = worldH - 35;
      }
    }

    this.playKamuiDeathAnimation();
  }

  /**
   * Kamui / Black Hole Singularity death animation
   * Swirling dimensional vortex, matter particle implosion, spaghettification & collapse
   */
  playKamuiDeathAnimation() {
    if (!this.scene) return;

    // 1. Play dimensional vortex suction SFX
    audioManager.playBlackHoleSuction();

    // 2. Camera dramatic zoom & cosmic purple flash
    if (this.scene.cameras && this.scene.cameras.main) {
      const cam = this.scene.cameras.main;
      cam.zoomTo(1.24, 700, 'Cubic.easeOut');
      cam.flash(180, 100, 20, 180);
    }

    const vortexX = this.x;
    const vortexY = this.y;

    // 3. Spawn Kamui / Black Hole Vortex Spiral
    const vortex = this.scene.add.sprite(vortexX, vortexY, 'vortex_kamui')
      .setDepth(20)
      .setScale(0)
      .setAlpha(0.95);

    // Vortex rapidly expands and accelerates its spin
    this.scene.tweens.add({
      targets: vortex,
      scale: 1.4,
      duration: 260,
      ease: 'Back.easeOut'
    });

    this.scene.tweens.add({
      targets: vortex,
      angle: 1800,
      duration: 1100,
      ease: 'Cubic.easeIn'
    });

    // 4. Inward Suction Particles (matter drawn into the singularity)
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.2, 0.2);
      const dist = Phaser.Math.Between(55, 95);
      const px = vortexX + Math.cos(angle) * dist;
      const py = vortexY + Math.sin(angle) * dist;
      const p = this.scene.add.sprite(px, py, 'particle_singularity')
        .setDepth(19)
        .setScale(Phaser.Math.FloatBetween(0.8, 1.4));

      this.scene.tweens.add({
        targets: p,
        x: vortexX,
        y: vortexY,
        scale: 0,
        alpha: { start: 1, end: 0.1 },
        duration: Phaser.Math.Between(400, 750),
        delay: Phaser.Math.Between(40, 300),
        ease: 'Cubic.easeIn',
        onComplete: () => { p.destroy(); }
      });
    }

    // 5. Robot Dimensional Warping & Spaghettification Suction
    this.scene.tweens.add({
      targets: this,
      angle: 1440,
      duration: 800,
      ease: 'Cubic.easeIn'
    });

    this.scene.tweens.add({
      targets: this,
      scaleX: 0.12,
      scaleY: 1.7,
      duration: 380,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.scene.tweens.add({
          targets: this,
          scaleX: 0,
          scaleY: 0,
          x: vortexX,
          y: vortexY,
          alpha: 0,
          duration: 380,
          ease: 'Cubic.easeIn'
        });
      }
    });

    // 6. Singularity Collapse & Shockwave Flash (at ~820ms)
    this.scene.time.delayedCall(820, () => {
      if (!this.scene) return;

      // Collapse vortex into a pinpoint
      this.scene.tweens.add({
        targets: vortex,
        scale: 0,
        alpha: 0,
        duration: 160,
        ease: 'Back.easeIn',
        onComplete: () => { vortex.destroy(); }
      });

      // Expanding Shockwave Ring
      const shockwave = this.scene.add.sprite(vortexX, vortexY, 'vortex_shockwave')
        .setDepth(22)
        .setScale(0.15)
        .setAlpha(1);

      this.scene.tweens.add({
        targets: shockwave,
        scale: 2.4,
        alpha: 0,
        duration: 300,
        ease: 'Quad.easeOut',
        onComplete: () => { shockwave.destroy(); }
      });

      // Camera collapse impulse
      if (this.scene.cameras && this.scene.cameras.main) {
        const cam = this.scene.cameras.main;
        cam.shake(160, 0.015);
        cam.flash(120, 0, 240, 255);
        cam.zoomTo(1.0, 320, 'Quad.easeOut');
      }
    });

    // 7. Emit game-over event after sequence concludes
    this.scene.time.delayedCall(1200, () => {
      if (this.scene) {
        this.scene.events.emit('game-over');
      }
    });
  }

  destroy(fromScene) {
    try {
      if (this.shieldSprite && !this.shieldSprite.destroyed) {
        this.shieldSprite.destroy();
      }
    } catch (e) {}
    try {
      if (this.magnetSprite && !this.magnetSprite.destroyed) {
        this.magnetSprite.destroy();
      }
    } catch (e) {}
    try {
      if (this.dustEmitter && !this.dustEmitter.destroyed) {
        this.dustEmitter.destroy();
      }
    } catch (e) {}
    try {
      if (this.synergyEmitter && !this.synergyEmitter.destroyed) {
        this.synergyEmitter.destroy();
      }
    } catch (e) {}
    // Clean up ability state on destroy
    this._hoverActive = false;
    this._dashActive = false;
    this._glideBoost = false;
    if (this.body) this.body.setAccelerationY(0);
    try {
      if (this.accessorySprite && !this.accessorySprite.destroyed) {
        this.accessorySprite.destroy();
      }
    } catch (e) {}
    try {
      if (this.angelWingsSprite && !this.angelWingsSprite.destroyed) {
        this.angelWingsSprite.destroy();
      }
    } catch (e) {}
    try {
      super.destroy(fromScene);
    } catch (e) {}
  }
}
