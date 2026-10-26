/**
 * STARHOP - Platforms & Hazards Entities
 * Manages static platforms, kinematic moving platforms, crumbling/collapsing platforms,
 * dangerous hazards (spikes, plasma orbs, timed laser gates, patrol sentry drones),
 * and dynamic interactive entities (kinetic bounce pads, maglev conveyors, gravity distortion rifts).
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager.js';

export class PlatformManager {
  constructor(scene) {
    this.scene = scene;

    // Static immovable tiles (arcade static group)
    this.staticGroup = scene.physics.add.staticGroup();

    // Moving platforms stored with metadata
    this.movingPlatforms = [];

    // Crumbling platforms stored with metadata
    this.crumblingPlatforms = [];

    // Spike hazards (static group, never move)
    this.spikesGroup = scene.physics.add.staticGroup();

    // Plasma hazards (dynamic physics sprites that move via tween/velocity)
    this.plasmaGroup = scene.physics.add.group({ allowGravity: false, immovable: true });

    // --- NEW ADVANCED ENTITIES & TRAPS ---

    // 1. Kinetic Bounce Pads
    this.bouncePadsGroup = scene.physics.add.staticGroup();

    // 2. Timed Laser Gates
    this.laserGates = [];
    this.activeLaserGroup = scene.physics.add.group({ allowGravity: false, immovable: true });

    // 3. Patrol Sentry Drones
    this.patrolDrones = [];
    this.dronesGroup = scene.physics.add.group({ allowGravity: false, immovable: true });

    // 4. Maglev Conveyors
    this.conveyorsGroup = scene.physics.add.staticGroup();
    this.conveyors = [];

    // 5. Gravity Distortion Rifts
    this.gravityRifts = [];
  }

  /**
   * Unified hazard overlap targets for GameScene.
   * Returns array of groups that cause damage to player on overlap.
   */
  getHazardTargets() {
    return [this.spikesGroup, this.plasmaGroup, this.activeLaserGroup, this.dronesGroup];
  }

  /**
   * Builds all level platforms according to level definition
   */
  buildLevel(levelData) {
    // ----------------------------------------------------------------
    // 1. Static Platforms – tile the surface texture across width
    // ----------------------------------------------------------------
    (levelData.staticPlatforms || []).forEach(p => {
      const tileW = 32;
      const count = Math.max(1, Math.round(p.w / tileW));
      const totalW = count * tileW;
      const leftEdge = p.x - totalW / 2;

      for (let i = 0; i < count; i++) {
        const tileX = leftEdge + tileW / 2 + i * tileW;
        const tile = this.staticGroup.create(tileX, p.y, 'tile_surface');
        tile.setDisplaySize(tileW, 32);
        tile.refreshBody();
      }
    });

    // ----------------------------------------------------------------
    // 2. Moving Platforms
    // ----------------------------------------------------------------
    (levelData.movingPlatforms || []).forEach(mp => {
      const platform = this.scene.physics.add.image(mp.x, mp.y, 'platform_moving');
      platform.setImmovable(true);
      platform.body.allowGravity = false;
      platform.setDisplaySize(mp.w || 90, mp.h || 24);
      platform.body.setSize(mp.w || 90, mp.h || 24);

      const startX = mp.x;
      const startY = mp.y;
      const rangeX = mp.rangeX || 0;
      const rangeY = mp.rangeY || 0;
      const speedX = mp.speedX || 50;
      const speedY = mp.speedY || 50;

      this.movingPlatforms.push({
        sprite: platform,
        startX,
        startY,
        rangeX,
        rangeY,
        speedX,
        speedY,
        dirX: 1,
        dirY: 1,
        prevX: startX,
        prevY: startY
      });
    });

    // ----------------------------------------------------------------
    // 3. Crumbling Platforms
    // ----------------------------------------------------------------
    (levelData.crumblingPlatforms || []).forEach(cp => {
      const platform = this.scene.physics.add.image(cp.x, cp.y, 'platform_crumbling');
      platform.setImmovable(true);
      platform.body.allowGravity = false;
      platform.setDisplaySize(cp.w || 80, cp.h || 22);
      platform.body.setSize(cp.w || 80, cp.h || 22);

      this.crumblingPlatforms.push({
        sprite: platform,
        origX: cp.x,
        origY: cp.y,
        isTriggered: false
      });
    });

    // ----------------------------------------------------------------
    // 4. Hazards (Spikes = static, Plasma = dynamic)
    // ----------------------------------------------------------------
    (levelData.hazards || []).forEach(h => {
      if (h.type === 'spikes') {
        const spike = this.spikesGroup.create(h.x, h.y, 'hazard_spikes');
        const hw = (h.w || 36);
        const hh = (h.h || 18);
        spike.setDisplaySize(hw, hh);
        spike.body.setSize(hw - 6, hh - 4);
        spike.body.setOffset(3, 4);
        spike.refreshBody();

      } else if (h.type === 'plasma') {
        const plasma = this.scene.physics.add.image(h.x, h.y, 'hazard_plasma_0');
        plasma.setImmovable(true);
        plasma.body.allowGravity = false;
        const radius = 9;
        plasma.body.setCircle(radius, (plasma.width / 2) - radius, (plasma.height / 2) - radius);

        const baseY = h.y;
        this.scene.tweens.add({
          targets: plasma,
          y: baseY - 14,
          duration: 1500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });

        this.scene.time.addEvent({
          delay: 220,
          loop: true,
          callback: () => {
            if (plasma.active && plasma.texture) {
              const nextKey = plasma.texture.key === 'hazard_plasma_0' ? 'hazard_plasma_1' : 'hazard_plasma_0';
              plasma.setTexture(nextKey);
            }
          }
        });

        this.plasmaGroup.add(plasma);
      }
    });

    // ----------------------------------------------------------------
    // 5. Kinetic Bounce Pads (Catapults player high into the air)
    // ----------------------------------------------------------------
    (levelData.bouncePads || []).forEach(bp => {
      const pad = this.bouncePadsGroup.create(bp.x, bp.y, 'bounce_pad_idle');
      pad.setDisplaySize(32, 16);
      pad.body.setSize(28, 12);
      pad.body.setOffset(2, 4);
      pad.refreshBody();
      pad.setDepth(10);
    });

    // ----------------------------------------------------------------
    // 6. Timed Laser Gates (Pulsing deadly energy barrier)
    // ----------------------------------------------------------------
    (levelData.laserGates || []).forEach(lg => {
      const gateH = lg.h || 64;
      const topY = lg.y - gateH / 2 - 8;
      const botY = lg.y + gateH / 2 + 8;

      // Pylons
      const topPylon = this.scene.add.sprite(lg.x, topY, 'laser_pylon').setDepth(11);
      const botPylon = this.scene.add.sprite(lg.x, botY, 'laser_pylon').setDepth(11);

      // Laser Beam sprite
      const beam = this.scene.physics.add.image(lg.x, lg.y, 'laser_beam_active');
      beam.setImmovable(true);
      beam.body.allowGravity = false;
      beam.setDisplaySize(14, gateH);
      beam.body.setSize(10, gateH - 4);
      beam.setDepth(10);
      this.activeLaserGroup.add(beam);

      this.laserGates.push({
        beam,
        topPylon,
        botPylon,
        periodMs: lg.periodMs || 3000,
        activeMs: lg.activeMs || 1500,
        offsetMs: lg.offsetMs || 0,
        state: 'active'
      });
    });

    // ----------------------------------------------------------------
    // 7. Patrol Sentry Drones (Mobile robotic aerial hazards)
    // ----------------------------------------------------------------
    (levelData.patrolDrones || []).forEach(pd => {
      const drone = this.scene.physics.add.image(pd.x, pd.y, 'drone_fly_0');
      drone.setImmovable(true);
      drone.body.allowGravity = false;
      drone.setDisplaySize(24, 22);
      drone.body.setSize(20, 18);
      drone.setDepth(12);
      this.dronesGroup.add(drone);

      this.patrolDrones.push({
        sprite: drone,
        startX: pd.x,
        rangeX: pd.rangeX || 100,
        speedX: pd.speedX || 65,
        dirX: 1,
        animTimer: 0,
        frame: 0
      });
    });

    // ----------------------------------------------------------------
    // 8. Maglev Conveyors (Horizontal acceleration tracks)
    // ----------------------------------------------------------------
    (levelData.conveyors || []).forEach(cv => {
      const tileW = 32;
      const count = Math.max(1, Math.round(cv.w / tileW));
      const totalW = count * tileW;
      const leftEdge = cv.x - totalW / 2;
      const sprites = [];

      for (let i = 0; i < count; i++) {
        const tileX = leftEdge + tileW / 2 + i * tileW;
        const tile = this.conveyorsGroup.create(tileX, cv.y, 'conveyor_0');
        tile.setDisplaySize(tileW, 24);
        tile.refreshBody();
        sprites.push(tile);
      }

      this.conveyors.push({
        sprites,
        x: cv.x,
        y: cv.y,
        w: totalW,
        dir: cv.dir || 1, // 1 = right, -1 = left
        speed: cv.speed || 120,
        animTimer: 0,
        frame: 0
      });
    });

    // ----------------------------------------------------------------
    // 9. Gravity Distortion Rifts (Low-gravity warp areas)
    // ----------------------------------------------------------------
    (levelData.gravityRifts || []).forEach(gr => {
      const riftW = gr.w || 240;
      const riftH = gr.h || 180;

      // Visual aura box in background
      const gfx = this.scene.add.graphics().setDepth(-4);
      gfx.fillStyle(0x4c1d95, 0.22);
      gfx.fillRoundedRect(gr.x - riftW / 2, gr.y - riftH / 2, riftW, riftH, 12);
      gfx.lineStyle(2, 0xa855f7, 0.6);
      gfx.strokeRoundedRect(gr.x - riftW / 2, gr.y - riftH / 2, riftW, riftH, 12);

      // Glowing icon tag
      this.scene.add.text(gr.x, gr.y - riftH / 2 + 12, 'ZERO-G ZONE 🌀', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '8px',
        color: '#c084fc',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(-3);

      this.gravityRifts.push({
        x: gr.x,
        y: gr.y,
        w: riftW,
        h: riftH,
        sparkTimer: 0
      });
    });
  }

  update(time, delta, player) {
    // ----------------------------------------------------------------
    // 1. Kinematic Moving Platforms + carry player
    // ----------------------------------------------------------------
    this.movingPlatforms.forEach(p => {
      const spr = p.sprite;
      if (!spr.active) return;

      if (p.rangeX > 0) {
        if (spr.x >= p.startX + p.rangeX) {
          p.dirX = -1;
        } else if (spr.x <= p.startX - p.rangeX) {
          p.dirX = 1;
        }
        spr.setVelocityX(p.speedX * p.dirX);
      } else {
        spr.setVelocityX(0);
      }

      if (p.rangeY > 0) {
        if (spr.y >= p.startY + p.rangeY) {
          p.dirY = -1;
        } else if (spr.y <= p.startY - p.rangeY) {
          p.dirY = 1;
        }
        spr.setVelocityY(p.speedY * p.dirY);
      } else {
        spr.setVelocityY(0);
      }

      // Carry player if standing on top of moving platform
      if (p.prevX !== undefined && player && player.body && !player.isFallingFromTrap && !player.isDead) {
        const onGround = player.body.blocked.down || player.body.touching.down;
        if (onGround) {
          const halfW = (spr.body ? spr.body.width : (spr.width || 90)) / 2;
          const platTop = spr.y - (spr.body ? spr.body.height : (spr.height || 24)) / 2;
          const playerBottom = player.y + (player.body.height / 2);
          if (
            player.x >= spr.x - halfW - 8 &&
            player.x <= spr.x + halfW + 8 &&
            Math.abs(playerBottom - platTop) < 18
          ) {
            const dx = spr.x - p.prevX;
            const dy = spr.y - p.prevY;
            player.x += dx;
            if (dy !== 0) player.y += dy;
          }
        }
      }

      p.prevX = spr.x;
      p.prevY = spr.y;
    });

    // ----------------------------------------------------------------
    // 2. Timed Laser Gates Cycling
    // ----------------------------------------------------------------
    this.laserGates.forEach(lg => {
      if (!lg.beam.active) return;
      const cycle = (time + lg.offsetMs) % lg.periodMs;

      if (cycle < lg.activeMs) {
        // ACTIVE LETHAL BEAM
        if (lg.state !== 'active') {
          lg.state = 'active';
          lg.beam.setTexture('laser_beam_active');
          lg.beam.setVisible(true);
          lg.beam.body.enable = true;
          lg.beam.setAlpha(1);
          audioManager.playLaserHum();
        }
      } else if (cycle < lg.activeMs + 650) {
        // WARNING CHARGING PHASE
        lg.state = 'warn';
        lg.beam.setTexture('laser_beam_warn');
        lg.beam.setVisible(true);
        lg.beam.body.enable = false; // not lethal yet
        lg.beam.setAlpha(0.35 + 0.5 * Math.sin(time * 0.035));
      } else {
        // INACTIVE / OFF
        lg.state = 'off';
        lg.beam.setVisible(false);
        lg.beam.body.enable = false;
      }
    });

    // ----------------------------------------------------------------
    // 3. Patrol Sentry Drones Movement & Animation
    // ----------------------------------------------------------------
    this.patrolDrones.forEach(pd => {
      const spr = pd.sprite;
      if (!spr.active) return;

      if (spr.x >= pd.startX + pd.rangeX) {
        pd.dirX = -1;
        spr.setFlipX(true);
      } else if (spr.x <= pd.startX - pd.rangeX) {
        pd.dirX = 1;
        spr.setFlipX(false);
      }

      spr.setVelocityX(pd.speedX * pd.dirX);
      spr.setVelocityY(Math.sin(time * 0.006) * 18);

      pd.animTimer += delta;
      if (pd.animTimer > 130) {
        pd.animTimer = 0;
        pd.frame = 1 - pd.frame;
        spr.setTexture(pd.frame === 0 ? 'drone_fly_0' : 'drone_fly_1');
      }
    });

    // ----------------------------------------------------------------
    // 4. Maglev Conveyors Animation & Horizontal Player Push
    // ----------------------------------------------------------------
    this.conveyors.forEach(cv => {
      cv.animTimer += delta;
      if (cv.animTimer > 110) {
        cv.animTimer = 0;
        cv.frame = (cv.frame + 1) % 3;
        cv.sprites.forEach(s => {
          if (s.active) s.setTexture(`conveyor_${cv.frame}`);
        });
      }

      // Check if player is standing on this conveyor
      // Surface top of conveyor is at cv.y - 12 (half of 24px displaySize height)
      if (player && player.body && (player.body.blocked.down || player.body.touching.down) && !player.isFallingFromTrap) {
        const halfW = cv.w / 2;
        const conveyorSurfaceY = cv.y - 12;
        if (
          player.x >= cv.x - halfW - 4 &&
          player.x <= cv.x + halfW + 4 &&
          Math.abs(player.y - conveyorSurfaceY) < 20
        ) {
          player.x += (cv.speed * cv.dir * (delta / 1000));
        }
      }
    });

    // ----------------------------------------------------------------
    // 5. Gravity Distortion Rifts (Zero-G Float Physics)
    // ----------------------------------------------------------------
    let playerInsideAnyRift = false;
    this.gravityRifts.forEach(gr => {
      gr.sparkTimer += delta;
      if (gr.sparkTimer > 350) {
        gr.sparkTimer = 0;
        const rx = gr.x + (Math.random() - 0.5) * (gr.w - 20);
        const ry = gr.y + (Math.random() - 0.5) * (gr.h - 20);
        if (this.scene.add) {
          const spark = this.scene.add.sprite(rx, ry, 'particle_gravity_spark').setDepth(-2).setAlpha(0.8);
          this.scene.tweens.add({
            targets: spark,
            y: ry - 18,
            alpha: 0,
            duration: 700,
            onComplete: () => spark.destroy()
          });
        }
      }

      if (player && player.body) {
        const halfW = gr.w / 2;
        const halfH = gr.h / 2;
        if (
          player.x >= gr.x - halfW &&
          player.x <= gr.x + halfW &&
          player.y >= gr.y - halfH &&
          player.y <= gr.y + halfH
        ) {
          playerInsideAnyRift = true;
        }
      }
    });

    if (player && player.body) {
      if (playerInsideAnyRift) {
        // Low-G: Cut gravity by 60%
        player.body.gravity.y = -520;
      } else {
        // Normal Gravity
        player.body.gravity.y = 0;
      }
    }
  }

  /**
   * Catapult player when stepping on a Kinetic Bounce Pad
   */
  handleBouncePad(player, pad) {
    if (player.body.velocity.y < -50) return; // already ascending
    player.setVelocityY(-690);
    audioManager.playBouncePad();

    // Floating text
    try {
      const txt = this.scene.add.text(pad.x, pad.y - 12, 'BOOST! ▲', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '9px',
        color: '#00f0ff',
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(25);

      this.scene.tweens.add({
        targets: txt,
        y: pad.y - 36,
        alpha: 0,
        duration: 650,
        ease: 'Power1',
        onComplete: () => txt.destroy()
      });
    } catch (e) {}

    // Pad compression animation
    pad.setTexture('bounce_pad_compressed');
    this.scene.time.delayedCall(160, () => {
      if (pad.active) pad.setTexture('bounce_pad_idle');
    });

    // Shockwave ring
    try {
      const ring = this.scene.add.sprite(pad.x, pad.y, 'vortex_shockwave')
        .setScale(0.2)
        .setAlpha(0.9)
        .setDepth(15);
      this.scene.tweens.add({
        targets: ring,
        scaleX: 1.3,
        scaleY: 0.6,
        alpha: 0,
        duration: 250,
        onComplete: () => ring.destroy()
      });
    } catch (e) {}
  }

  /**
   * Handle when player steps on a crumbling platform.
   */
  handleCrumbleTouch(player, platformSprite) {
    const record = this.crumblingPlatforms.find(c => c.sprite === platformSprite);
    if (!record || record.isTriggered) return;
    if (!player.body.blocked.down && !player.body.touching.down) return;

    record.isTriggered = true;

    // Shake the platform before it falls
    this.scene.tweens.add({
      targets: platformSprite,
      x: record.origX + 4,
      duration: 45,
      yoyo: true,
      repeat: 9,
      onComplete: () => {
        if (!platformSprite.active) return;
        this.scene.tweens.add({
          targets: platformSprite,
          y: record.origY + 60,
          alpha: 0,
          duration: 380,
          ease: 'Power2',
          onComplete: () => {
            if (!platformSprite.active) return;
            platformSprite.body.enable = false;
            platformSprite.setVisible(false);

            // Respawn after 4 seconds
            this.scene.time.delayedCall(4000, () => {
              if (!platformSprite.active) return;
              platformSprite.setPosition(record.origX, record.origY);
              platformSprite.setAlpha(1);
              platformSprite.setVisible(true);
              platformSprite.body.enable = true;
              record.isTriggered = false;
            });
          }
        });
      }
    });
  }

  getMovingSprites() {
    return this.movingPlatforms.map(m => m.sprite);
  }

  getCrumblingSprites() {
    return this.crumblingPlatforms.map(c => c.sprite);
  }

  removeDrone(drone) {
    const idx = this.patrolDrones.findIndex(pd => pd.sprite === drone);
    if (idx !== -1) {
      this.patrolDrones.splice(idx, 1);
    }
    if (this.dronesGroup && this.dronesGroup.contains(drone)) {
      this.dronesGroup.remove(drone);
    }
  }
}

