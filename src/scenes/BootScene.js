/**
 * STARHOP - BootScene
 * Generates all pixel art textures dynamically, sets up common animations,
 * and boots into MenuScene.
 */

import Phaser from 'phaser';
import { TextureGenerator } from '../systems/TextureGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    // Generate procedural pixel textures
    TextureGenerator.generateAll(this);

    // Boot into MenuScene
    this.scene.start('MenuScene');
  }
}
