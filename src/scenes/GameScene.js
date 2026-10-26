/**
 * STARHOP - GameScene
 * Main gameplay scene handling level instantiation, camera tracking, parallax starfields,
 * physics collisions, game loop, pause states, and victory/defeat sequences.
 *
 * FIXED:
 * - Plasma hazards use a separate overlap (plasmaGroup) from static spikes.
 * - Portal activation now uses collectibleManager.activatePortal() guard.
 * - Touch listener cleanup is now correct (named function refs).
 * - game.scene.stop('MenuScene') is guarded to only stop if scene is active.
 * - Pause/resume now also pauses all tweens so moving platforms freeze.
 * - Restart clears touchPauseHandler ref properly.
 * - HUD powerup update is throttled to avoid 60fps innerHTML churn.
 */

import Phaser from 'phaser';
import { getLevelById } from '../data/levels.js';
import { saveManager } from '../systems/SaveManager.js';
import { audioManager } from '../systems/AudioManager.js';
import { Player } from '../entities/Player.js';
import { PlatformManager } from '../entities/Platforms.js';
import { CollectibleManager } from '../entities/Collectibles.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.levelId = (data && data.levelId) ? Number(data.levelId) : 1;
    this.levelData = getLevelById(this.levelId);
    this.isPaused = false;
    this.isLevelFinished = false;

    // Session statistics
    this.score = 0;
    this.coinsCollected = 0;
    this.crystalsCollected = 0;

    // Input state (merged keyboard + touch)
    this.touchState = {
      left: false,
      right: false,
      jump: false,
      jumpPressed: false,
      abilityPressed: false
    };
    this._touchJumpQueued = false;
    this._touchAbilityQueued = false;

    // Coin combo state
    this.coinComboCount = 0;
    this.coinComboTimer = 0;   // ms window remaining
    this.COIN_COMBO_WINDOW = 1800; // ms to chain coins

    // Camera POV Zoom (closer, punchy POV for mobile screens)
    const isMobileDevice = ('ontouchstart' in window) ||
                           (navigator.maxTouchPoints > 0) ||
                           (window.innerWidth <= 768) ||
                           (window.innerHeight <= 520);
    const pref = saveManager.getPOVPreference();
    this.currentZoom = (pref === 'normal') ? 1.0 : (isMobileDevice ? 1.35 : 1.25);

    // Named event handler references for proper cleanup
    this._touchInputHandler = null;
    this._touchPauseHandler = null;
    this._touchJumpDownHandler = null;
    this._povToggleHandler = null;
    this._povSetHandler = null;

    // Throttle powerup HUD updates to reduce DOM churn
    this._lastPowerupState = null;

    // Speedrun Stopwatch Timer
    this.elapsedTimeMs = 0;
    this.isTimerRunning = false;
  }

  create() {
    const { worldWidth, worldHeight } = this.levelData;

    // Start speedrun timer
    this.isTimerRunning = true;

    // Set physics world bounds (left, right, top solid; bottom open for void falls)
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.physics.world.setBoundsCollision(true, true, true, false);

    // Parallax Deep Space Background
    this.createParallaxBackground(worldWidth, worldHeight);

    // Platform and Hazard Manager
    this.platformManager = new PlatformManager(this);
    this.platformManager.buildLevel(this.levelData);

    // Player Entity (must be after platforms so z-order is correct)
    const charId = saveManager.getEquippedCharacter();
    this.player = new Player(this, this.levelData.spawn.x, this.levelData.spawn.y, charId);
    this.player.setDepth(10);

    // Collectibles & Portal Manager
    this.collectibleManager = new CollectibleManager(this);
    this.collectibleManager.buildLevel(this.levelData);

    // Setup Collisions & Overlaps
    this.setupCollisions();

    // Camera: Closer, clear POV on mobile screens with smooth follow & margin compensation
    this.cameras.main.setZoom(this.currentZoom);
    this.updateCameraBounds(this.currentZoom);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setDeadzone(40, 30);
    this.cameras.main.fadeIn(350, 10, 11, 30);
    this.game.events.emit('pov-updated', this.currentZoom);

    // Dynamic Camera Look-Ahead state
    this.currentLookAheadOffset = 0;
    this.targetLookAheadOffset = 0;

    // Count total collectibles in this level
    this.totalCoins = (this.levelData.coins || []).length;
    this.totalCrystals = (this.levelData.crystals || []).length;
    this.isRestarting = false;

    // Keyboard Inputs
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      space: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      pauseEsc: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      pauseP: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
      restartR: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R),
      ability: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    };

    this.wasd.pauseEsc.on('down', () => this.togglePause());
    this.wasd.pauseP.on('down', () => this.togglePause());
    this.wasd.restartR.on('down', () => this.restartLevel());

    // Scene events
    this.events.on('player-life-changed', (lives) => {
      this.game.events.emit('hud-update-lives', lives);
    });
    this.events.on('game-over', () => this.handleGameOver());

    // Notify HTML UI of initial HUD state
    this.game.events.emit('hud-init', {
      levelId: this.levelId,
      levelName: this.levelData.name,
      score: this.score,
      coins: this.coinsCollected,
      totalCoins: this.totalCoins,
      crystals: this.crystalsCollected,
      totalCrystals: this.totalCrystals,
      lives: this.player.lives,
      maxLives: this.player.maxLives
    });

    // Mobile touch listeners
    this.setupTouchListeners();

    // Cosmetic Accessory change listener
    this._accessoryHandler = (accId) => {
      if (this.player && this.player.applyAccessory) {
        this.player.applyAccessory(accId);
      }
    };
    this.game.events.on('accessory-changed', this._accessoryHandler);

    // Ensure physics world timeScale is normal
    if (this.physics && this.physics.world) {
      this.physics.world.timeScale = 1.0;
    }

    // Plasma Blast: clean up prior listener & destroy nearby drones on scene event from player
    this.events.off('plasma-blast');
    this.events.on('plasma-blast', (data) => {
      this.handlePlasmaBurst(data.x, data.y, data.radius);
    });

    // Start BGM
    audioManager.init();
    audioManager.startBGM();

    // Play comical spaceship drop entrance animation
    this.playSpaceshipEntranceAnimation();
  }

  createParallaxBackground(worldW, worldH) {
    // Deep space gradient (fixed to viewport)
    const bg = this.add.graphics().setScrollFactor(0).setDepth(-10);
    bg.fillGradientStyle(0x050612, 0x090b20, 0x111438, 0x181c44, 1);
    bg.fillRect(0, 0, this.scale.width, this.scale.height);

    // Far nebula / distant star layer
    const farStars = this.add.graphics().setScrollFactor(0.08).setDepth(-9);
    farStars.fillStyle(0x6b77c4, 0.45);
    for (let i = 0; i < 100; i++) {
      farStars.fillPoint(
        Phaser.Math.Between(0, worldW),
        Phaser.Math.Between(0, worldH),
        1
      );
    }

    // Mid cyan glow stars
    const midStars = this.add.graphics().setScrollFactor(0.25).setDepth(-8);
    midStars.fillStyle(0x00f0ff, 0.65);
    for (let i = 0; i < 65; i++) {
      midStars.fillPoint(
        Phaser.Math.Between(0, worldW),
        Phaser.Math.Between(0, worldH),
        2
      );
    }

    // Close bright white stars
    const closeStars = this.add.graphics().setScrollFactor(0.45).setDepth(-7);
    closeStars.fillStyle(0xffffff, 0.9);
    for (let i = 0; i < 30; i++) {
      closeStars.fillCircle(
        Phaser.Math.Between(0, worldW),
        Phaser.Math.Between(0, worldH),
        1.5
      );
    }

    // Distant floating asteroid silhouettes
    const asteroids = this.add.graphics().setScrollFactor(0.15).setDepth(-7);
    asteroids.fillStyle(0x0c0f24, 0.95);
    for (let i = 0; i < 10; i++) {
      const astX = 120 + i * 280;
      const astY = 60 + (i % 3) * 90;
      asteroids.fillCircle(astX, astY, 16 + (i % 5) * 7);
    }
  }

  setupCollisions() {
    // --- Player vs Static Platforms ---
    this.physics.add.collider(this.player, this.platformManager.staticGroup);

    // --- Player vs Moving Platforms ---
    this.platformManager.getMovingSprites().forEach(p => {
      this.physics.add.collider(this.player, p);
    });

    // --- Player vs Crumbling Platforms ---
    this.platformManager.getCrumblingSprites().forEach(cp => {
      this.physics.add.collider(this.player, cp, (playerObj, platformObj) => {
        this.platformManager.handleCrumbleTouch(playerObj, platformObj);
      });
    });

    // --- Player vs Spike Hazards (static) ---
    this.physics.add.overlap(
      this.player,
      this.platformManager.spikesGroup,
      () => { this.player.takeHazardDamage(); }
    );

    // --- Player vs Plasma Hazards (dynamic) ---
    this.physics.add.overlap(
      this.player,
      this.platformManager.plasmaGroup,
      () => { this.player.takeHazardDamage(); }
    );

    // --- Player vs Maglev Conveyor Platforms ---
    this.physics.add.collider(this.player, this.platformManager.conveyorsGroup);

    // --- Player vs Kinetic Bounce Pads ---
    this.physics.add.overlap(
      this.player,
      this.platformManager.bouncePadsGroup,
      (p, pad) => { this.platformManager.handleBouncePad(p, pad); }
    );

    // --- Player vs Active Laser Gates ---
    this.physics.add.overlap(
      this.player,
      this.platformManager.activeLaserGroup,
      () => { this.player.takeHazardDamage(); }
    );

    // --- Player vs Patrol Sentry Drones (Stompable from above!) ---
    this.physics.add.overlap(
      this.player,
      this.platformManager.dronesGroup,
      (player, drone) => {
        this.handleDroneInteraction(player, drone);
      }
    );

    // --- Player vs Coins ---
    this.physics.add.overlap(
      this.player,
      this.collectibleManager.coinsGroup,
      (p, coin) => {
        const pts = this.collectibleManager.collectCoin(this.player, coin);
        if (pts > 0) {
          this.score += pts;
          this.coinsCollected += 1;
          this.updateHUD();
          this._registerCoinCombo(coin.x, coin.y, pts);
        }
      }
    );

    // --- Player vs Crystals ---
    this.physics.add.overlap(
      this.player,
      this.collectibleManager.crystalsGroup,
      (p, crystal) => {
        const pts = this.collectibleManager.collectCrystal(this.player, crystal);
        if (pts > 0) {
          this.score += pts;
          this.crystalsCollected += 1;
          this.updateHUD();
        }
      }
    );

    // --- Player vs Powerups ---
    this.physics.add.overlap(
      this.player,
      this.collectibleManager.powerupsGroup,
      (p, powerup) => {
        this.collectibleManager.collectPowerup(this.player, powerup);
      }
    );

    // --- Player vs Portal ---
    if (this.collectibleManager.portal) {
      this.physics.add.overlap(
        this.player,
        this.collectibleManager.portal,
        () => {
          // Guard inside collectibleManager to prevent double-trigger
          if (this.collectibleManager.activatePortal()) {
            this.handleLevelComplete();
          }
        }
      );
    }
  }

  updateCameraBounds(zoom) {
    const { worldWidth, worldHeight } = this.levelData;
    const marginX = (this.scale.width * (1 - 1 / zoom)) / 2;
    const marginY = (this.scale.height * (1 - 1 / zoom)) / 2;
    this.cameras.main.setBounds(
      -marginX,
      -marginY,
      worldWidth + marginX * 2,
      worldHeight + marginY * 2
    );
  }

  togglePOV() {
    const targetZoom = (this.currentZoom >= 1.25) ? 1.0 : 1.35;
    this.setPOV(targetZoom);
    return targetZoom;
  }

  setPOV(zoom) {
    this.currentZoom = zoom;
    saveManager.setPOVPreference(zoom >= 1.25 ? 'close' : 'normal');
    this.updateCameraBounds(zoom);
    if (this.tweens) {
      this.tweens.add({
        targets: this.cameras.main,
        zoom: zoom,
        duration: 260,
        ease: 'Cubic.easeOut'
      });
    } else {
      this.cameras.main.setZoom(zoom);
    }
    this.game.events.emit('pov-updated', zoom);
  }

  setupTouchListeners() {
    // Clean up any prior listeners before adding new ones
    if (this._touchInputHandler) this.game.events.off('touch-input', this._touchInputHandler);
    if (this._touchPauseHandler) this.game.events.off('touch-pause-toggle', this._touchPauseHandler);
    if (this._touchJumpDownHandler) this.game.events.off('touch-jump-down', this._touchJumpDownHandler);
    if (this._touchAbilityHandler) this.game.events.off('touch-ability', this._touchAbilityHandler);
    if (this._povToggleHandler) this.game.events.off('toggle-pov', this._povToggleHandler);
    if (this._povSetHandler) this.game.events.off('set-pov', this._povSetHandler);
    if (this._restartHandler) this.game.events.off('request-level-restart', this._restartHandler);

    this._touchInputHandler = (state) => {
      this.touchState = state;
    };
    this._touchPauseHandler = () => this.togglePause();
    this._touchJumpDownHandler = () => {
      this._touchJumpQueued = true;
    };
    this._touchAbilityHandler = () => {
      this._touchAbilityQueued = true;
    };
    this._povToggleHandler = () => this.togglePOV();
    this._povSetHandler = (zoom) => this.setPOV(zoom);
    this._restartHandler = () => this.restartLevel();

    this.game.events.on('touch-input', this._touchInputHandler);
    this.game.events.on('touch-pause-toggle', this._touchPauseHandler);
    this.game.events.on('touch-jump-down', this._touchJumpDownHandler);
    this.game.events.on('touch-ability', this._touchAbilityHandler);
    this.game.events.on('toggle-pov', this._povToggleHandler);
    this.game.events.on('set-pov', this._povSetHandler);
    this.game.events.on('request-level-restart', this._restartHandler);
  }

  update(time, delta) {
    if (this.isPaused || this.isLevelFinished || (this.player && this.player.isIntroDropping)) return;

    // --- Keyboard input gathering ---
    const keyLeft   = this.cursors.left.isDown  || this.wasd.left.isDown;
    const keyRight  = this.cursors.right.isDown || this.wasd.right.isDown;
    const keyJump   = this.cursors.up.isDown || this.wasd.up.isDown ||
                      this.cursors.space.isDown || this.wasd.space.isDown;
    const keyJumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.space);

    // Guaranteed touch jump detection (immune to fast tap race conditions)
    const touchJump = this._touchJumpQueued || this.touchState.jumpPressed;
    this._touchJumpQueued = false;
    this.touchState.jumpPressed = false;

    // Ability input: E key or touch ability button
    const keyAbilityPressed = Phaser.Input.Keyboard.JustDown(this.wasd.ability);
    const touchAbility = this._touchAbilityQueued;
    this._touchAbilityQueued = false;

    const inputState = {
      left:           keyLeft  || this.touchState.left,
      right:          keyRight || this.touchState.right,
      jump:           keyJump  || this.touchState.jump,
      jumpPressed:    keyJumpPressed || touchJump,
      abilityPressed: keyAbilityPressed || touchAbility
    };

    // --- Coin combo timer decay ---
    if (this.coinComboTimer > 0) {
      this.coinComboTimer = Math.max(0, this.coinComboTimer - delta);
      if (this.coinComboTimer <= 0) {
        this.coinComboCount = 0;
      }
    }

    // --- Entity updates ---
    this.player.update(time, delta, inputState);
    this.platformManager.update(time, delta, this.player);
    this.collectibleManager.update(this.player);

    // --- Smooth Dynamic Camera Look-Ahead (Player Comfort) ---
    if (this.player && this.player.body) {
      const vx = this.player.body.velocity.x;
      if (vx > 35) {
        // Advancing right -> camera smoothly looks ahead to the right
        this.targetLookAheadOffset = -80;
      } else if (vx < -35) {
        // Advancing left -> camera smoothly looks ahead to the left
        this.targetLookAheadOffset = 80;
      } else {
        // Idling or stopped -> camera smoothly recenters
        this.targetLookAheadOffset = 0;
      }

      const lerpFactor = Math.min(1, (delta / 1000) * 4.2);
      this.currentLookAheadOffset = Phaser.Math.Linear(
        this.currentLookAheadOffset,
        this.targetLookAheadOffset,
        lerpFactor
      );
      this.cameras.main.setFollowOffset(this.currentLookAheadOffset, 0);
    }

    // --- Powerup HUD (throttled to avoid per-frame DOM writes) ---
    const magnet  = this.player.isMagnetActive();
    const shield  = this.player.hasShield;
    const score2x = this.player.getScoreMultiplier() > 1;
    const state   = `${magnet}-${shield}-${score2x}`;
    if (state !== this._lastPowerupState) {
      this._lastPowerupState = state;
      this.game.events.emit('hud-powerup-update', { magnet, shield, score2x });
    }

    // --- Live Stopwatch Timer ---
    if (this.isTimerRunning && !this.isPaused && !this.isLevelFinished) {
      this.elapsedTimeMs += delta;
      this.game.events.emit('hud-update-timer', { timeMs: this.elapsedTimeMs });
    }
  }

  updateHUD() {
    this.game.events.emit('hud-update-score', {
      score: this.score,
      coins: this.coinsCollected,
      totalCoins: this.totalCoins,
      crystals: this.crystalsCollected,
      totalCrystals: this.totalCrystals
    });
  }

  restartLevel() {
    if (this.isRestarting) return;
    this.isRestarting = true;
    try {
      audioManager.playClick();
    } catch (e) { /* safe */ }

    if (this.isPaused) {
      this.resumeGame();
    }
    this.game.events.emit('level-restarted', { levelId: this.levelId });
    this.scene.restart({ levelId: this.levelId });
  }

  togglePause() {
    // Don't allow pause if game is over, finished, or intro cutscene is playing
    if (this.isLevelFinished || !this.player || this.player.isDead || this.player.isIntroDropping) return;

    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this.tweens.pauseAll();
      this.game.events.emit('game-paused', true);
    } else {
      this.physics.resume();
      this.tweens.resumeAll();
      this.game.events.emit('game-paused', false);
    }
    audioManager.playClick();
  }

  resumeGame() {
    if (this.isPaused) {
      this.isPaused = false;
      this.physics.resume();
      this.tweens.resumeAll();
      this.game.events.emit('game-paused', false);
    }
  }

  handleLevelComplete() {
    if (this.isLevelFinished) return;
    this.isLevelFinished = true;
    this.isTimerRunning = false;

    // Freeze player in place & hide accessory during singularity suck
    this.player.setVelocity(0, 0);
    if (this.player.body) this.player.body.enable = false;
    if (this.player.accessorySprite) this.player.accessorySprite.setVisible(false);

    // Audio: Hyperspace warp sweep & celebratory victory fanfare
    audioManager.playPortalWarp();
    audioManager.playWin();

    // Add completion bonus to score
    const bonus = this.levelData.completionBonus || 1000;
    this.score += bonus;

    const portal = this.collectibleManager.portal;
    const portalX = portal ? portal.x : this.player.x;
    const portalY = portal ? portal.y : this.player.y;
    const finalTime = Math.round(this.elapsedTimeMs);

    // 1. Cosmic Camera Flash & subtle screen rumble
    this.cameras.main.flash(380, 0, 240, 255);
    this.cameras.main.shake(220, 0.007);

    // 1b. SLOW-MOTION FINISHER — dramatic time slow for 900ms before portal sequence
    this.physics.world.timeScale = 0.25;
    this.time.delayedCall(900, () => {
      if (this.physics && this.physics.world) this.physics.world.timeScale = 1.0;
    });

    // 2. Camera smooth zoom & focus on portal
    this.cameras.main.pan(portalX, portalY, 720, 'Cubic.easeInOut');
    this.cameras.main.zoomTo(Math.min(1.45, this.currentZoom * 1.22), 720);

    // 3. Portal Supercharge Flare
    if (portal) {
      this.tweens.add({
        targets: portal,
        scaleX: 1.45,
        scaleY: 1.45,
        duration: 380,
        yoyo: true,
        ease: 'Cubic.easeOut'
      });
    }

    // 4. Expanding Cosmic Shockwave Ring
    const shockwave = this.add.sprite(portalX, portalY, 'portal_shockwave')
      .setDepth(18)
      .setScale(0.3)
      .setAlpha(1);

    this.tweens.add({
      targets: shockwave,
      scaleX: 3.5,
      scaleY: 3.5,
      alpha: 0,
      duration: 750,
      ease: 'Cubic.easeOut',
      onComplete: () => { if (shockwave && shockwave.destroy) shockwave.destroy(); }
    });

    // 5. Starburst Particle Fireworks (24 sparkles radiating outward)
    try {
      for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * Math.PI * 2;
        const speed = 70 + Math.random() * 85;
        const p = this.add.sprite(portalX, portalY, 'particle_sparkle')
          .setDepth(20)
          .setScale(0.9)
          .setAlpha(1);
        this.tweens.add({
          targets: p,
          x: portalX + Math.cos(ang) * speed,
          y: portalY + Math.sin(ang) * speed,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 650 + Math.random() * 200,
          ease: 'Quad.easeOut',
          onComplete: () => { if (p && p.destroy) p.destroy(); }
        });
      }
    } catch (e) {}

    // 6. Floating Hyperspace Banner: "★ HYPERSPACE WARP! ★"
    const warpTxt = this.add.text(portalX, portalY - 48, '★ HYPERSPACE WARP! ★', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '11px',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(28);

    this.tweens.add({
      targets: warpTxt,
      y: portalY - 88,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => { if (warpTxt && warpTxt.destroy) warpTxt.destroy(); }
    });

    // 7. Player Hyperspace Spaghettification & Singularity Collapse
    this.tweens.add({
      targets: this.player,
      x: portalX,
      y: portalY,
      angle: 720,
      scaleX: 0.15,
      scaleY: 1.6,
      alpha: 0.5,
      duration: 460,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.player,
          scaleX: 0,
          scaleY: 0,
          alpha: 0,
          duration: 260,
          ease: 'Back.easeIn',
          onComplete: () => {
            const result = saveManager.recordLevelCompletion(
              this.levelId,
              this.score,
              this.coinsCollected,
              this.crystalsCollected,
              finalTime
            );

            this.game.events.emit('level-completed', {
              levelId: this.levelId,
              levelName: this.levelData.name,
              finalScore: this.score,
              bonus,
              coins: this.coinsCollected,
              crystals: this.crystalsCollected,
              timeMs: finalTime,
              isNewRecord: result.isNewRecord,
              isNewBestTime: result.isNewBestTime,
              bestTimeMs: result.bestTimeMs,
              highscore: result.highscore,
              nextLevelUnlocked: result.nextLevelUnlocked
            });
          }
        });
      }
    });
  }

  handleGameOver() {
    this.game.events.emit('level-failed', {
      levelId: this.levelId,
      finalScore: this.score
    });
  }

  // ==========================================================================
  // Drone Stomp & Combat Mechanics
  // ==========================================================================

  handleDroneInteraction(player, drone) {
    if (!drone.active || player.isDead) return;

    // Detect if player is descending / stomping from above
    const playerBottom = player.body ? player.body.bottom : player.y + 11;
    const droneTop = drone.body ? drone.body.top : drone.y - 9;
    const isFalling = player.body ? player.body.velocity.y > 0 : false;
    const isAbove = playerBottom <= droneTop + 14;

    if (isFalling && isAbove) {
      this.stompDrone(player, drone);
    } else {
      player.takeHazardDamage();
    }
  }

  stompDrone(player, drone) {
    if (!drone.active) return;
    drone.disableBody(true, false);

    // 1. High bouncy rebound impulse for chaining jumps!
    if (player.body) {
      player.body.setVelocityY(-440);
    }
    player._isJumping = true;

    // 2. Play crunchy retro explosion stomp SFX
    audioManager.playDroneStomp();

    const dx = drone.x;
    const dy = drone.y;

    // 3. Shockwave & explosion VFX
    const burst = this.add.circle(dx, dy, 18, 0x00f0ff, 0.75).setDepth(20);
    this.tweens.add({
      targets: burst,
      scaleX: 2.6,
      scaleY: 2.6,
      alpha: 0,
      duration: 260,
      onComplete: () => burst.destroy()
    });

    for (let i = 0; i < 8; i++) {
      const p = this.add.sprite(dx, dy, 'particle_sparkle').setDepth(21);
      const angle = (i / 8) * Math.PI * 2;
      const dist = Phaser.Math.Between(25, 55);
      this.tweens.add({
        targets: p,
        x: dx + Math.cos(angle) * dist,
        y: dy + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 380,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy()
      });
    }

    // Drone destruction squash animation
    this.tweens.add({
      targets: drone,
      scaleX: 1.5,
      scaleY: 0.15,
      alpha: 0,
      y: dy + 10,
      duration: 180,
      ease: 'Back.easeIn',
      onComplete: () => {
        drone.destroy();
      }
    });

    this.platformManager.removeDrone(drone);

    // 4. Score Bonus & Floating Combat Text
    const basePts = 300;
    const multiplier = player.getScoreMultiplier();
    const totalPts = Math.round(basePts * multiplier);
    this.score += totalPts;
    this.updateHUD();

    this.showFloatingText(dx, dy - 18, multiplier > 1 ? `+${totalPts} 2X! 💥` : `+${totalPts} 💥`, '#ffd700');

    // 5. Scatter 1-2 dropped bonus coins
    this.spawnStompDropCoins(dx, dy);
  }

  spawnStompDropCoins(x, y) {
    const coinCount = Phaser.Math.Between(1, 2);
    for (let i = 0; i < coinCount; i++) {
      const coin = this.collectibleManager.coinsGroup.create(x, y - 6, 'coin_0');
      if (coin) {
        coin.play('coin-spin');
        coin.body.allowGravity = true;
        coin.setCollideWorldBounds(true);
        coin.setBounce(0.5);
        coin.setVelocity(Phaser.Math.Between(-80, 80), Phaser.Math.Between(-180, -120));
        this.physics.add.collider(coin, this.platformManager.staticGroup);
      }
    }
  }

  showFloatingText(x, y, message, color = '#ffd700') {
    const txt = this.add.text(x, y, message, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '9px',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(26);

    this.tweens.add({
      targets: txt,
      y: y - 28,
      alpha: 0,
      scale: 1.25,
      duration: 650,
      ease: 'Quad.easeOut',
      onComplete: () => txt.destroy()
    });
  }

  /**
   * Registers a coin pickup into the combo chain.
   * Shows COMBO x2/x3/etc text when chaining 3+ coins quickly.
   */
  _registerCoinCombo(x, y, pts) {
    this.coinComboCount += 1;
    this.coinComboTimer = this.COIN_COMBO_WINDOW;

    if (this.coinComboCount >= 3) {
      // Bonus score for high combo
      const bonusMult = Math.min(this.coinComboCount, 8);
      const bonus = pts * (bonusMult - 1);
      if (bonus > 0) {
        this.score += bonus;
        this.updateHUD();
      }
      // Show juicy combo text with escalating colors
      const comboColors = ['#ffd700', '#00f0ff', '#ff00aa', '#ff4400', '#ffffff'];
      const ci = Math.min(this.coinComboCount - 3, comboColors.length - 1);
      this.showFloatingText(x, y - 10, `COMBO x${this.coinComboCount}! ✨`, comboColors[ci]);
      if (audioManager.playCoinCombo) {
        audioManager.playCoinCombo(this.coinComboCount);
      }
    }
  }

  /**
   * Handles Plasma Blast: destroy all patrol drones within given radius.
   */
  handlePlasmaBurst(bx, by, radius) {
    if (!this.platformManager || !this.platformManager.dronesGroup) return;
    const r2 = radius * radius;
    const toDestroy = [];

    this.platformManager.dronesGroup.getChildren().forEach(drone => {
      if (!drone.active) return;
      const dx = drone.x - bx;
      const dy = drone.y - by;
      if (dx * dx + dy * dy <= r2) {
        toDestroy.push(drone);
      }
    });

    toDestroy.forEach(drone => {
      if (!drone.active) return;
      drone.disableBody(true, false);
      // Burst VFX per-drone
      const burst = this.add.circle(drone.x, drone.y, 14, 0x9b51e0, 0.8).setDepth(20);
      this.tweens.add({
        targets: burst, scaleX: 2.8, scaleY: 2.8, alpha: 0, duration: 280,
        onComplete: () => burst.destroy()
      });
      this.tweens.add({
        targets: drone, scaleX: 0, scaleY: 0, alpha: 0, duration: 200,
        onComplete: () => { drone.destroy(); }
      });
      this.platformManager.removeDrone(drone);

      // Score per drone
      const pts = Math.round(200 * this.player.getScoreMultiplier());
      this.score += pts;
      this.showFloatingText(drone.x, drone.y - 14, `+${pts} 💥`, '#9b51e0');
    });

    if (toDestroy.length > 0) {
      audioManager.playDroneStomp();
      this.updateHUD();
      if (toDestroy.length >= 2) {
        this.showFloatingText(bx, by - 32, `PLASMA x${toDestroy.length}! ⚡`, '#ff00ff');
      }
    }
  }

  /**
   * Comical Spaceship Entrance Animation
   * A retro dropship swoops in, opens its hatch, and the robot comically tumbles
   * out upside down, faceplants on the ground with a pancake squish and cartoon
   * dizzy stars, pops back up with a springy boing, shakes it off, poses READY,
   * while the dropship zooms away into hyperspace!
   */
  playSpaceshipEntranceAnimation() {
    const spawnX = this.levelData.spawn.x;
    const spawnY = this.levelData.spawn.y;
    const hoverY = Math.max(70, spawnY - 170);

    // Freeze player input and hide initially
    this.player.isIntroDropping = true;
    this.player.setVisible(false);
    this.player.setPosition(spawnX, hoverY);
    if (this.player.body) {
      this.player.body.enable = false;
    }
    if (this.player.accessorySprite) {
      this.player.accessorySprite.setVisible(false);
    }

    // 1. Dropship Container (swoops in from offscreen top-left)
    const shipContainer = this.add.container(spawnX - 320, hoverY - 140).setDepth(20);

    // Ion Thruster Flame (rear left)
    const flame = this.add.sprite(-24, 0, 'spaceship_thruster_flame').setOrigin(1, 0.5);
    // Dropship Body
    const ship = this.add.sprite(0, 0, 'spaceship_dropship');
    // Cargo Bay Hatch Door (bottom center)
    const hatch = this.add.sprite(2, 14, 'spaceship_hatch_door').setOrigin(0.5, 0);

    shipContainer.add([flame, ship, hatch]);

    // Flame flicker animation
    const flameTween = this.tweens.add({
      targets: flame,
      scaleX: { from: 0.8, to: 1.3 },
      scaleY: { from: 0.85, to: 1.15 },
      alpha: { from: 0.85, to: 1 },
      duration: 70,
      yoyo: true,
      repeat: -1
    });

    // Sound: Dropship engine swoop
    audioManager.playShipEngineWhoosh();

    // Skip handler logic
    let isSkipped = false;
    let hoverBobTween = null;
    let starTimer = null;
    let stars = [];

    const skipCutscene = () => {
      if (isSkipped) return;
      isSkipped = true;

      // Clean up tweens & objects
      this.tweens.killTweensOf(shipContainer);
      this.tweens.killTweensOf(this.player);
      this.tweens.killTweensOf(hatch);
      flameTween.stop();
      if (hoverBobTween) hoverBobTween.stop();
      if (starTimer) starTimer.remove();
      stars.forEach(st => {
        if (st.sprite && st.sprite.active) st.sprite.destroy();
      });
      shipContainer.destroy();

      // Reset player directly to spawn point
      this.player.setPosition(spawnX, spawnY);
      this.player.setVisible(true);
      this.player.setRotation(0);
      this.player.setScale(1, 1);
      if (this.player.body) {
        this.player.body.enable = true;
        this.player.body.reset(spawnX, spawnY);
      }
      this.player.isIntroDropping = false;
      if (this.player.applyAccessory) {
        this.player.applyAccessory(this.player.equippedAccessory);
      }
      this.player.play(`${this.player.charId}-idle`, true);

      // Clean up skip listeners
      if (this._introSkipKeyHandler && this.input && this.input.keyboard) {
        this.input.keyboard.off('keydown', this._introSkipKeyHandler);
        this._introSkipKeyHandler = null;
      }
      if (this._introSkipPointerHandler && this.input) {
        this.input.off('pointerdown', this._introSkipPointerHandler);
        this._introSkipPointerHandler = null;
      }
    };

    // Allow explicit skip only if player presses Space, Enter, or Escape
    this._introSkipKeyHandler = (event) => {
      if (['Space', 'Enter', 'Escape'].includes(event.code)) {
        skipCutscene();
      }
    };

    if (this.input && this.input.keyboard) {
      this.input.keyboard.on('keydown', this._introSkipKeyHandler);
    }
    // Allow touch / pointer tap to skip intro cutscene on mobile
    this._introSkipPointerHandler = () => {
      skipCutscene();
    };
    if (this.input) {
      this.input.on('pointerdown', this._introSkipPointerHandler);
    }

    // Step 1: Dropship swoops into hover position above spawn
    this.tweens.add({
      targets: shipContainer,
      x: spawnX,
      y: hoverY,
      duration: 620,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (isSkipped) return;

        // Gentle hover bob
        hoverBobTween = this.tweens.add({
          targets: shipContainer,
          y: hoverY - 6,
          duration: 320,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        // Step 2: Open Hatch with mechanical pop!
        this.time.delayedCall(150, () => {
          if (isSkipped) return;

          // Hatch opens
          this.tweens.add({
            targets: hatch,
            scaleY: 0,
            duration: 140,
            ease: 'Power2'
          });

          // Ship jerks upward slightly as payload drops
          this.tweens.add({
            targets: shipContainer,
            y: hoverY - 10,
            duration: 120,
            yoyo: true,
            ease: 'Quad.easeOut'
          });

          // Floating funny warning text
          const ejectText = this.add.text(spawnX, hoverY + 22, 'WAAAA! 😱', {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '9px',
            color: '#facc15',
            stroke: '#000000',
            strokeThickness: 3
          }).setOrigin(0.5).setDepth(25);

          this.tweens.add({
            targets: ejectText,
            y: hoverY + 2,
            alpha: 0,
            duration: 550,
            onComplete: () => ejectText.destroy()
          });

          // Step 3: Player drops out head-first, flailing and tumbling!
          this.player.setPosition(spawnX, hoverY + 16);
          this.player.setVisible(true);
          this.player.setRotation(Math.PI); // upside-down
          this.player.setScale(1, 1);

          // Audio: cartoon slide drop whistle
          audioManager.playCartoonSlideDrop();

          // Rapid comical tumbling spin
          this.tweens.add({
            targets: this.player,
            rotation: Math.PI * 5,
            duration: 550,
            ease: 'Linear'
          });

          // Fall down towards ground
          this.tweens.add({
            targets: this.player,
            y: spawnY,
            duration: 550,
            ease: 'Quad.easeIn',
            onComplete: () => {
              if (isSkipped) return;

              // Step 4: THE COMICAL SPLAT / FACEPLANT!
              audioManager.playCartoonSplat();
              this.cameras.main.shake(140, 0.007);

              // Flatten player into a pancake comically!
              this.player.setRotation(0);
              this.player.setScale(1.75, 0.35);
              this.player.setY(spawnY + 8); // flush with platform

              // Dust burst left and right
              if (this.player.dustEmitter) {
                this.player.dustEmitter.emitParticleAt(spawnX - 12, spawnY + 10, 6);
                this.player.dustEmitter.emitParticleAt(spawnX + 12, spawnY + 10, 6);
              }

              // 3 Comical Dizzy Stars revolving above head
              const starRadius = 16;
              const starCenterY = spawnY - 8;
              stars = [0, 1, 2].map(i => {
                const s = this.add.sprite(spawnX, starCenterY, 'cartoon_dizzy_star')
                  .setDepth(26)
                  .setScale(0.85);
                return { sprite: s, angle: (i * (Math.PI * 2)) / 3 };
              });

              // Orbiting stars timer
              const orbitStartTime = this.time.now;
              starTimer = this.time.addEvent({
                delay: 16,
                repeat: 30, // ~480ms
                callback: () => {
                  if (isSkipped) {
                    stars.forEach(st => st.sprite.destroy());
                    return;
                  }
                  const elapsed = (this.time.now - orbitStartTime) * 0.008;
                  stars.forEach(st => {
                    if (st.sprite && st.sprite.active) {
                      const curAngle = st.angle + elapsed;
                      st.sprite.setPosition(
                        spawnX + Math.cos(curAngle) * starRadius,
                        starCenterY + Math.sin(curAngle) * (starRadius * 0.4)
                      );
                    }
                  });
                }
              });

              // Step 5: After a dazed 480ms... POP BACK UP!
              this.time.delayedCall(480, () => {
                if (isSkipped) return;

                // Pop/destroy stars with little puff
                stars.forEach(st => {
                  if (st.sprite && st.sprite.active) {
                    this.tweens.add({
                      targets: st.sprite,
                      scaleX: 1.4,
                      scaleY: 1.4,
                      alpha: 0,
                      duration: 120,
                      onComplete: () => st.sprite.destroy()
                    });
                  }
                });

                // Springy Boing Pop
                audioManager.playBoingPop();

                // Accordion spring-up tween
                this.tweens.add({
                  targets: this.player,
                  scaleX: 0.75,
                  scaleY: 1.35,
                  y: spawnY,
                  duration: 160,
                  ease: 'Quad.easeOut',
                  onComplete: () => {
                    if (isSkipped) return;
                    this.tweens.add({
                      targets: this.player,
                      scaleX: 1,
                      scaleY: 1,
                      duration: 140,
                      ease: 'Bounce.easeOut'
                    });
                  }
                });

                // Head shake / shake it off wobble
                this.tweens.add({
                  targets: this.player,
                  angle: { from: -14, to: 14 },
                  duration: 65,
                  yoyo: true,
                  repeat: 2,
                  onComplete: () => {
                    if (this.player && this.player.active) {
                      this.player.setAngle(0);
                    }
                  }
                });

                // "READY! 🚀" Pop Text
                const readyText = this.add.text(spawnX, spawnY - 26, 'READY! 🚀', {
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '9px',
                  color: '#00f0ff',
                  stroke: '#000000',
                  strokeThickness: 3
                }).setOrigin(0.5).setDepth(26);

                this.tweens.add({
                  targets: readyText,
                  y: spawnY - 48,
                  alpha: 0,
                  duration: 650,
                  onComplete: () => readyText.destroy()
                });

                // Re-enable accessory
                if (this.player.applyAccessory) {
                  this.player.applyAccessory(this.player.equippedAccessory);
                }

                // Step 6: Dropship fires hyper-drive and zooms away into space!
                if (hoverBobTween) hoverBobTween.stop();
                audioManager.playHyperspaceZoom();

                // Super-charged thruster flame
                flame.setScale(2.2, 1.4);

                this.tweens.add({
                  targets: shipContainer,
                  x: spawnX + 600,
                  y: hoverY - 320,
                  rotation: -0.22,
                  duration: 480,
                  ease: 'Quad.easeIn',
                  onComplete: () => {
                    shipContainer.destroy();
                  }
                });

                // Step 7: Restore full control to the player after bounce & wobble complete!
                this.time.delayedCall(400, () => {
                  if (isSkipped) return;
                  this.player.isIntroDropping = false;
                  this.player.setScale(1, 1);
                  this.player.setRotation(0);
                  this.player.setAngle(0);
                  this.player.setPosition(spawnX, spawnY);
                  if (this.player.body) {
                    this.player.body.enable = true;
                    this.player.body.reset(spawnX, spawnY);
                  }
                  this.player.play(`${this.player.charId}-idle`, true);

                  // Cleanup skip listeners
                  if (this._introSkipKeyHandler && this.input && this.input.keyboard) {
                    this.input.keyboard.off('keydown', this._introSkipKeyHandler);
                    this._introSkipKeyHandler = null;
                  }
                  if (this._introSkipPointerHandler && this.input) {
                    this.input.off('pointerdown', this._introSkipPointerHandler);
                    this._introSkipPointerHandler = null;
                  }
                });
              });
            }
          });
        });
      }
    });
  }

  shutdown() {
    if (this._introSkipKeyHandler && this.input && this.input.keyboard) {
      this.input.keyboard.off('keydown', this._introSkipKeyHandler);
      this._introSkipKeyHandler = null;
    }
    if (this._introSkipPointerHandler && this.input) {
      this.input.off('pointerdown', this._introSkipPointerHandler);
      this._introSkipPointerHandler = null;
    }

    // Remove named event listeners to prevent duplicates on restart
    if (this._touchInputHandler) {
      this.game.events.off('touch-input', this._touchInputHandler);
      this._touchInputHandler = null;
    }
    if (this._touchAbilityHandler) {
      this.game.events.off('touch-ability', this._touchAbilityHandler);
      this._touchAbilityHandler = null;
    }
    if (this._abilityHandler) {
      this.game.events.off('ability-activated', this._abilityHandler);
      this._abilityHandler = null;
    }
    if (this._touchPauseHandler) {
      this.game.events.off('touch-pause-toggle', this._touchPauseHandler);
      this._touchPauseHandler = null;
    }
    if (this._touchJumpDownHandler) {
      this.game.events.off('touch-jump-down', this._touchJumpDownHandler);
      this._touchJumpDownHandler = null;
    }
    if (this._povToggleHandler) {
      this.game.events.off('toggle-pov', this._povToggleHandler);
      this._povToggleHandler = null;
    }
    if (this._povSetHandler) {
      this.game.events.off('set-pov', this._povSetHandler);
      this._povSetHandler = null;
    }
    if (this._accessoryHandler) {
      this.game.events.off('accessory-changed', this._accessoryHandler);
      this._accessoryHandler = null;
    }
    if (this._restartHandler) {
      this.game.events.off('request-level-restart', this._restartHandler);
      this._restartHandler = null;
    }

    this.events.off('player-life-changed');
    this.events.off('game-over');
    this.events.off('plasma-blast');

    // Ensure physics world timeScale is restored to 1.0
    if (this.physics && this.physics.world) {
      this.physics.world.timeScale = 1.0;
    }

    // Kill all active tweens so ghost callbacks don't run on scene restart
    if (this.tweens && typeof this.tweens.killAll === 'function') {
      try { this.tweens.killAll(); } catch (e) { /* safe */ }
    }
    // Remove all pending time events
    if (this.time && typeof this.time.removeAllEvents === 'function') {
      try { this.time.removeAllEvents(); } catch (e) { /* safe */ }
    }

    // Stop BGM when leaving gameplay
    audioManager.stopBGM();
  }
}
