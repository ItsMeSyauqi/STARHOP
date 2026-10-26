/**
 * STARHOP - MenuScene
 * Handles menu background space ambience, parallax starfield, and UI communication.
 */

import Phaser from 'phaser';
import { audioManager } from '../systems/AudioManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Deep space gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060714, 0x0a0c24, 0x121638, 0x181c44, 1);
    bg.fillRect(0, 0, width, height);

    // Multi-layer starfield
    this.starLayers = [];

    // Distant stars (slow)
    const distantStars = this.add.graphics();
    distantStars.fillStyle(0x7982c4, 0.6);
    for (let i = 0; i < 70; i++) {
      distantStars.fillPoint(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 1);
    }
    this.starLayers.push({ gfx: distantStars, speed: 0.15 });

    // Mid stars (medium, cyan)
    const midStars = this.add.graphics();
    midStars.fillStyle(0x00f0ff, 0.8);
    for (let i = 0; i < 40; i++) {
      midStars.fillPoint(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 2);
    }
    this.starLayers.push({ gfx: midStars, speed: 0.35 });

    // Close bright stars (fast, twinkling)
    const closeStars = this.add.graphics();
    closeStars.fillStyle(0xffffff, 1.0);
    for (let i = 0; i < 20; i++) {
      closeStars.fillCircle(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), 1.5);
    }
    this.starLayers.push({ gfx: closeStars, speed: 0.6 });

    // Floating robotic scout showcase in background
    const showcaseBot = this.add.sprite(width / 2, height / 2 - 20, 'nova_idle_0')
      .setScale(2.5)
      .setAlpha(0.85);

    this.tweens.add({
      targets: showcaseBot,
      y: height / 2 - 35,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Notify UI that MenuScene is ready
    this.game.events.emit('menu-ready');

    // Try starting BGM upon user interaction
    this.input.once('pointerdown', () => {
      audioManager.init();
      audioManager.startBGM();
    });
  }

  update(time, delta) {
    // Subtle starfield parallax drift
    this.starLayers.forEach(layer => {
      layer.gfx.x -= layer.speed;
      if (layer.gfx.x < -this.scale.width) {
        layer.gfx.x = 0;
      }
    });
  }
}
