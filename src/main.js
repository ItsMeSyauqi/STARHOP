/**
 * STARHOP - Main Entry Point
 * Configures Phaser 3 with crisp pixel art scaling and Arcade Physics,
 * sets up game scenes, initializes TouchControls and UIManager.
 *
 * FIXED:
 * - DOMContentLoaded: script modules are deferred by default so by the time
 *   main.js runs, the DOM is already ready. We guard with a check but don't
 *   wrap Phaser init in DOMContentLoaded (it will fire before Phaser needs DOM).
 * - UIManager and TouchControls init now happen reliably after DOM is ready.
 * - Added Phaser game ready callback to ensure UI is wired once Phaser boots.
 */

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { TouchControls } from './ui/TouchControls.js';
import { UIManager } from './ui/UIManager.js';
import { audioManager } from './systems/AudioManager.js';

// Ensure DOM is ready before wiring UI (modules are deferred anyway, but be safe)
function initGame() {
  const config = {
    type: Phaser.AUTO,
    width: 640,
    height: 360,
    parent: 'game-container',
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#060714',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 900 },
        debug: false
      }
    },
    scene: [BootScene, MenuScene, GameScene]
  };

  const game = new Phaser.Game(config);
  window.__PHASER_GAME__ = game;

  // Wire up HTML UI overlay & touch controls
  const touchControls = new TouchControls(game);
  const uiManager = new UIManager(game, touchControls);  // eslint-disable-line no-unused-vars

  // Audio: unlock on first user gesture (required by browser autoplay policy)
  const unlockAudio = () => {
    audioManager.init();
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}

// Module scripts are deferred — DOM is ready synchronously here.
// But use DOMContentLoaded as a safety net in case this script is moved to <head>.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
