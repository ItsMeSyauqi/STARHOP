/**
 * STARHOP - UIManager
 * Manages HTML/CSS UI overlay state, menus, HUD updates, modals, and screen transitions.
 *
 * FIXED:
 * - startLevel: safely stops MenuScene only if it's currently active.
 * - Restart from pause: correctly gets current levelId from scene.
 * - All modalComplete / modalGameOver hide touch controls properly.
 * - Game over and level complete modals close all other open modals first.
 * - Button click listeners no longer double-register (buttons are never cloned
 *   except for the confirm dialog OK button which correctly uses cloneNode).
 */

import { saveManager, formatTime } from '../systems/SaveManager.js';
import { audioManager } from '../systems/AudioManager.js';
import { CHARACTERS } from '../data/characters.js';
import { ACCESSORIES } from '../data/accessories.js';
import { LEVELS } from '../data/levels.js';

export class UIManager {
  constructor(game, touchControls) {
    this.game = game;
    this.touchControls = touchControls;

    // --- Screen references ---
    this.screenMainMenu    = document.getElementById('screen-main-menu');
    this.screenLevelSelect = document.getElementById('screen-level-select');
    this.screenCollection  = document.getElementById('screen-collection');
    this.screenSettings    = document.getElementById('screen-settings');
    this.screenHud         = document.getElementById('screen-hud');

    // --- Hangar tab references ---
    this._activeHangarTab       = 'robots';
    this.tabHangarRobots        = document.getElementById('tab-hangar-robots');
    this.tabHangarAccessories   = document.getElementById('tab-hangar-accessories');
    this.gridRobots             = document.getElementById('collection-grid');
    this.gridAccessories        = document.getElementById('accessories-grid');

    // --- Modal references ---
    this.modalPause    = document.getElementById('modal-pause');
    this.modalComplete = document.getElementById('modal-complete');
    this.modalGameOver = document.getElementById('modal-game-over');
    this.modalConfirm  = document.getElementById('modal-confirm');

    // --- HUD element references ---
    this.hudLevelName        = document.getElementById('hud-level-name');
    this.hudTimer            = document.getElementById('hud-timer');
    this.hudScore            = document.getElementById('hud-score');
    this.hudCoins            = document.getElementById('hud-coins');
    this.hudCrystals         = document.getElementById('hud-crystals');
    this.hudCoinsBox         = this.hudCoins?.closest('.hud-metric');
    this.hudCrystalsBox      = this.hudCrystals?.closest('.hud-metric');
    this.hudLivesContainer   = document.getElementById('hud-lives');
    this.hudPowerupsContainer = document.getElementById('hud-powerups');
    this.hudAbilityBar        = document.getElementById('hud-ability-bar');
    this.hudAbilityLabel      = document.getElementById('hud-ability-label');
    this.hudAbilityFill       = document.getElementById('hud-ability-fill');
    this.btnTouchAbility      = document.getElementById('btn-touch-ability');
    this._abilityCooldownTimer= null;

    // State
    this.currentCompletedLevel = null;
    this.nextLevelToLoad = null;
    this.failedLevelId = null;
    this._lastScore = 0;
    this._lastCoins = 0;
    this._lastCrystals = 0;
    this._totalCoins = 0;
    this._totalCrystals = 0;
    this._lastLives = 3;

    this._bindButtons();
    this._setupGameListeners();
    this._checkOrientation();
    window.addEventListener('resize', () => this._checkOrientation());
    window.addEventListener('orientationchange', () => this._checkOrientation());
    this._updatePOVButtons(saveManager.getPOVPreference());
  }

  // ==========================================================================
  // Screen Management
  // ==========================================================================

  showScreen(targetScreen) {
    this._hideAllModals();
    const allScreens = [
      this.screenMainMenu,
      this.screenLevelSelect,
      this.screenCollection,
      this.screenSettings,
      this.screenHud
    ];
    allScreens.forEach(s => {
      if (s) {
        s.classList.add('hidden');
        s.classList.remove('screen-active');
      }
    });
    if (targetScreen) {
      targetScreen.classList.remove('hidden');
      void targetScreen.offsetWidth;
      targetScreen.classList.add('screen-active');
    }

    // Touch controls only visible during gameplay HUD
    if (targetScreen === this.screenHud) {
      this.touchControls.show();
    } else {
      this.touchControls.hide();
    }
  }

  _hideAllModals() {
    [this.modalPause, this.modalComplete, this.modalGameOver].forEach(m => {
      if (m) m.classList.add('hidden');
    });
  }

  // ==========================================================================
  // Button Binding
  // ==========================================================================

  _bindButtons() {
    const onClick = (id, cb) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        audioManager.playClick();
        cb();
      });
    };

    // --- Main Menu ---
    onClick('btn-menu-play', () => {
      this.showScreen(this.screenLevelSelect);
      this._renderLevelSelect();
    });
    onClick('btn-menu-levels', () => {
      this.showScreen(this.screenLevelSelect);
      this._renderLevelSelect();
    });
    onClick('btn-menu-collection', () => {
      this.showScreen(this.screenCollection);
      this._switchHangarTab(this._activeHangarTab || 'robots');
    });

    // --- Hangar Tab Switchers ---
    if (this.tabHangarRobots) {
      this.tabHangarRobots.addEventListener('click', (e) => {
        e.preventDefault();
        audioManager.playClick();
        this._switchHangarTab('robots');
      });
    }
    if (this.tabHangarAccessories) {
      this.tabHangarAccessories.addEventListener('click', (e) => {
        e.preventDefault();
        audioManager.playClick();
        this._switchHangarTab('accessories');
      });
    }
    onClick('btn-menu-settings', () => {
      this.showScreen(this.screenSettings);
      this._renderSettings();
    });

    // --- Back buttons ---
    onClick('btn-levels-back', () => {
      this.showScreen(this.screenMainMenu);
      this._updateWalletDisplays();
    });
    onClick('btn-collection-back', () => {
      this.showScreen(this.screenMainMenu);
      this._updateWalletDisplays();
    });
    onClick('btn-settings-back', () => {
      this.showScreen(this.screenMainMenu);
    });

    // --- Pause Modal ---
    onClick('btn-pause-resume', () => {
      if (this.modalPause) this.modalPause.classList.add('hidden');
      const gs = this._getGameScene();
      if (gs) gs.resumeGame();
    });
    onClick('btn-pause-restart', () => {
      if (this.modalPause) this.modalPause.classList.add('hidden');
      const gs = this._getGameScene();
      const lvl = gs ? gs.levelId : 1;
      this._stopGameScene();
      this._startLevel(lvl);
    });
    onClick('btn-pause-quit', () => {
      this._hideAllModals();
      this._stopGameScene();
      this._startMenuScene();
      this.showScreen(this.screenMainMenu);
      this._updateWalletDisplays();
    });

    // --- Level Complete Modal ---
    onClick('btn-complete-next', () => {
      this._hideAllModals();
      const nextLvl = this.nextLevelToLoad || 1;
      this._stopGameScene();
      this._startLevel(nextLvl);
    });
    onClick('btn-complete-replay', () => {
      this._hideAllModals();
      const lvl = this.currentCompletedLevel || 1;
      this._stopGameScene();
      this._startLevel(lvl);
    });
    onClick('btn-complete-menu', () => {
      this._hideAllModals();
      this._stopGameScene();
      this._startMenuScene();
      this.showScreen(this.screenMainMenu);
      this._updateWalletDisplays();
    });

    // --- Game Over Modal ---
    onClick('btn-gameover-retry', () => {
      this._hideAllModals();
      const lvl = this.failedLevelId || 1;
      this._stopGameScene();
      this._startLevel(lvl);
    });
    onClick('btn-gameover-menu', () => {
      this._hideAllModals();
      this._stopGameScene();
      this._startMenuScene();
      this.showScreen(this.screenMainMenu);
      this._updateWalletDisplays();
    });

    // --- HUD Pause Button ---
    onClick('btn-hud-pause', () => {
      const gs = this._getGameScene();
      if (gs) gs.togglePause();
    });

    // --- HUD POV Toggle Button ---
    onClick('btn-hud-pov', () => {
      const gs = this._getGameScene();
      if (gs && typeof gs.togglePOV === 'function') {
        const newZoom = gs.togglePOV();
        this._updatePOVButtons(newZoom);
      } else {
        const newPref = saveManager.togglePOVPreference();
        this._updatePOVButtons(newPref);
      }
    });

    // --- Settings POV Toggle Button ---
    onClick('btn-settings-pov', () => {
      const newPref = saveManager.togglePOVPreference();
      const zoom = (newPref === 'close') ? 1.35 : 1.0;
      const gs = this._getGameScene();
      if (gs && typeof gs.setPOV === 'function') {
        gs.setPOV(zoom);
      }
      this._updatePOVButtons(zoom);
    });

    // --- Orientation Hint Dismiss ---
    onClick('btn-dismiss-orientation', () => {
      const el = document.getElementById('orientation-hint');
      if (el) el.classList.add('hidden');
      try { sessionStorage.setItem('dismiss_orientation_hint', 'true'); } catch (e) {}
    });

    // --- Settings ---
    const toggleMusic = document.getElementById('toggle-music');
    if (toggleMusic) {
      toggleMusic.addEventListener('change', (e) => {
        saveManager.setSetting('music', e.target.checked);
        audioManager.updateSettings();
      });
    }
    const toggleSfx = document.getElementById('toggle-sfx');
    if (toggleSfx) {
      toggleSfx.addEventListener('change', (e) => {
        saveManager.setSetting('sfx', e.target.checked);
      });
    }

    // --- Reset progress ---
    onClick('btn-settings-reset', () => {
      this._showConfirmDialog(
        'RESET ALL PROGRESS?',
        'This will erase all coins, high scores, unlocked levels, and purchased characters. This cannot be undone.',
        () => {
          saveManager.reset();
          this._renderSettings();
          this._updateWalletDisplays();
        }
      );
    });
    onClick('btn-confirm-cancel', () => {
      if (this.modalConfirm) this.modalConfirm.classList.add('hidden');
    });
  }

  // ==========================================================================
  // Game Event Listeners
  // ==========================================================================

  _setupGameListeners() {
    this.game.events.on('menu-ready', () => {
      this.showScreen(this.screenMainMenu);
      this._updateWalletDisplays();
    });

    this.game.events.on('hud-init', (data) => {
      this._hideAllModals();
      this.showScreen(this.screenHud);
      this._lastScore = data.score || 0;
      this._lastCoins = data.coins || 0;
      this._lastCrystals = data.crystals || 0;
      this._lastLives = data.lives;
      this._totalCoins = data.totalCoins || 0;
      this._totalCrystals = data.totalCrystals || 0;

      if (this.hudLevelName) this.hudLevelName.textContent = `LVL ${data.levelId}: ${data.levelName}`;
      if (this.hudTimer)    this.hudTimer.textContent    = '00:00.0';
      if (this.hudScore)    this.hudScore.textContent    = `${data.score}`;
      if (this.hudCoins) {
        this.hudCoins.textContent = this._totalCoins > 0 ? `${data.coins}/${this._totalCoins}` : `${data.coins}`;
        if (this.hudCoinsBox) this.hudCoinsBox.classList.remove('completed');
      }
      if (this.hudCrystals) {
        this.hudCrystals.textContent = this._totalCrystals > 0 ? `${data.crystals}/${this._totalCrystals}` : `${data.crystals}`;
        if (this.hudCrystalsBox) this.hudCrystalsBox.classList.remove('completed');
      }
      this._maxLives = data.maxLives || 3;
      this._renderLives(data.lives, this._maxLives);
      if (this.hudPowerupsContainer) this.hudPowerupsContainer.innerHTML = '';
      this._updateAbilityHUDOnLevelStart();
    });

    this.game.events.on('hud-update-timer', (data) => {
      if (this.hudTimer) {
        this.hudTimer.textContent = formatTime(data.timeMs);
      }
    });

    this.game.events.on('hud-update-score', (data) => {
      if (data.totalCoins !== undefined) this._totalCoins = data.totalCoins;
      if (data.totalCrystals !== undefined) this._totalCrystals = data.totalCrystals;

      if (this.hudScore) {
        if (data.score !== this._lastScore) {
          this._triggerScorePop();
          this.hudScore.textContent = `${data.score}`;
          this._lastScore = data.score;
        }
      }
      if (this.hudCoins) {
        if (data.coins !== this._lastCoins) {
          this._triggerCoinSpin();
          this.hudCoins.textContent = this._totalCoins > 0 ? `${data.coins}/${this._totalCoins}` : `${data.coins}`;
          this._lastCoins = data.coins;
          if (this.hudCoinsBox && this._totalCoins > 0) {
            this.hudCoinsBox.classList.toggle('completed', data.coins >= this._totalCoins);
          }
        }
      }
      if (this.hudCrystals) {
        if (data.crystals !== this._lastCrystals) {
          this._triggerGemSparkle();
          this.hudCrystals.textContent = this._totalCrystals > 0 ? `${data.crystals}/${this._totalCrystals}` : `${data.crystals}`;
          this._lastCrystals = data.crystals;
          if (this.hudCrystalsBox && this._totalCrystals > 0) {
            this.hudCrystalsBox.classList.toggle('completed', data.crystals >= this._totalCrystals);
          }
        }
      }
    });

    this.game.events.on('hud-update-lives', (lives) => {
      this._renderLives(lives, this._maxLives || 3, this._lastLives);
      this._lastLives = lives;
    });

    this.game.events.on('hud-powerup-update', (powerups) => {
      if (!this.hudPowerupsContainer) return;
      let html = '';
      if (powerups.shield)  html += '<span class="powerup-badge badge-shield">SHIELD</span>';
      if (powerups.magnet)  html += '<span class="powerup-badge badge-magnet">MAGNET</span>';
      if (powerups.score2x) html += '<span class="powerup-badge badge-score">2X SCORE</span>';
      this.hudPowerupsContainer.innerHTML = html;
    });

    this.game.events.on('game-paused', (isPaused) => {
      if (!this.modalPause) return;
      if (isPaused) {
        this.modalPause.classList.remove('hidden');
        this.touchControls.hide();
      } else {
        this.modalPause.classList.add('hidden');
        this.touchControls.show();
      }
    });

    this.game.events.on('pov-updated', (zoom) => {
      this._updatePOVButtons(zoom);
    });

    this.game.events.on('level-completed', (data) => {
      this.currentCompletedLevel = data.levelId;
      // next level is the unlocked one, or same level if already last
      this.nextLevelToLoad = data.nextLevelUnlocked
        ? data.nextLevelUnlocked
        : data.levelId;

      const timeEl    = document.getElementById('complete-time');
      const scoreEl   = document.getElementById('complete-score');
      const bonusEl   = document.getElementById('complete-bonus');
      const coinsEl   = document.getElementById('complete-coins');
      const crystalEl = document.getElementById('complete-crystals');
      const badgeEl   = document.getElementById('complete-record-badge');
      const nextBtn   = document.getElementById('btn-complete-next');

      if (timeEl) {
        timeEl.textContent = formatTime(data.timeMs);
      }

      // Animated number roll-up for rewarding arcade feel
      this._animateCounter(scoreEl, 0, data.finalScore, 750);
      this._animateCounter(bonusEl, 0, data.bonus, 600, '+');
      this._animateCounter(coinsEl, 0, data.coins, 600, '+');
      this._animateCounter(crystalEl, 0, data.crystals, 600, '+');

      // Re-trigger star burst animation
      const stars = document.querySelectorAll('.victory-star');
      stars.forEach(s => {
        s.style.animation = 'none';
        void s.offsetWidth;
        s.style.animation = '';
      });

      if (badgeEl) {
        if (data.levelId === 10) {
          badgeEl.textContent = '👑 COSMIC EMPEROR! ALL 10 LEVELS CONQUERED! UNLOCKED SOLARIS!';
          badgeEl.style.display = 'inline-block';
          badgeEl.style.background = 'linear-gradient(90deg, #ffaa00, #ff0055, #00f0ff)';
          badgeEl.style.color = '#ffffff';
        } else if (data.levelId === 3) {
          badgeEl.textContent = '🏆 LEVEL 3 CONQUERED! UNLOCKED LVL 4 & VORTEX!';
          badgeEl.style.display = 'inline-block';
          badgeEl.style.background = 'linear-gradient(90deg, #ffd700, #ff0055)';
          badgeEl.style.color = '#060714';
        } else if (data.isNewBestTime && data.isNewRecord) {
          badgeEl.textContent = '⚡ NEW SPEED RECORD & HIGH SCORE!';
          badgeEl.style.background = 'linear-gradient(90deg, #00f0ff, #ffd700)';
          badgeEl.style.color = '#060714';
          badgeEl.style.display = 'inline-block';
        } else if (data.isNewBestTime) {
          badgeEl.textContent = '⚡ NEW SPEEDRUN RECORD!';
          badgeEl.style.background = 'linear-gradient(90deg, #00f0ff, #7928ca)';
          badgeEl.style.color = '#ffffff';
          badgeEl.style.display = 'inline-block';
        } else {
          badgeEl.textContent = 'NEW HIGH SCORE!';
          badgeEl.style.background = '';
          badgeEl.style.color = '';
          badgeEl.style.display = data.isNewRecord ? 'inline-block' : 'none';
        }
      }

      if (nextBtn) {
        if (data.levelId < LEVELS.length && data.nextLevelUnlocked) {
          nextBtn.style.display = 'block';
          nextBtn.textContent   = data.levelId === 3
            ? 'PLAY MASTER LEVEL 4 ▶'
            : (data.levelId === 9 ? 'PLAY GRAND FINALE: LEVEL 10 👑 ▶' : `NEXT: LEVEL ${data.levelId + 1} ▶`);
        } else {
          nextBtn.style.display = 'none';
        }
      }

      if (this.modalComplete) this.modalComplete.classList.remove('hidden');
      this.touchControls.hide();
      this._resetAbilityHUD();
    });

    this.game.events.on('level-failed', (data) => {
      this.failedLevelId = data.levelId;
      const el = document.getElementById('gameover-score');
      if (el) {
        this._animateCounter(el, 0, data.finalScore, 550);
      }

      if (this.modalGameOver) {
        this.modalGameOver.classList.remove('hidden');
        const failBox = this.modalGameOver.querySelector('.fail-box');
        if (failBox) {
          failBox.classList.remove('shake');
          void failBox.offsetWidth;
          failBox.classList.add('shake');
        }
      }
      this.touchControls.hide();
      this._resetAbilityHUD();
    });

    this.game.events.on('ability-activated', (data) => {
      this._handleAbilityActivated(data);
    });

    this.game.events.on('accessory-changed', () => {
      this._updateAbilityHUDOnLevelStart();
    });
  }

  // ==========================================================================
  // Navigation Helpers
  // ==========================================================================

  _getGameScene() {
    try {
      return this.game.scene.getScene('GameScene');
    } catch (e) {
      return null;
    }
  }

  _stopGameScene() {
    try {
      if (this.game.scene.isActive('GameScene')) {
        this.game.scene.stop('GameScene');
      }
    } catch (e) { /* safe */ }
  }

  _startMenuScene() {
    try {
      if (!this.game.scene.isActive('MenuScene')) {
        this.game.scene.start('MenuScene');
      }
    } catch (e) { /* safe */ }
  }

  _startLevel(levelId) {
    this._hideAllModals();
    this._stopGameScene();

    // Stop menu scene if running
    try {
      if (this.game.scene.isActive('MenuScene')) {
        this.game.scene.stop('MenuScene');
      }
    } catch (e) { /* safe */ }

    try {
      this.game.scene.start('GameScene', { levelId: Number(levelId) });
    } catch (err) {
      console.error('Failed to start GameScene:', err);
    }
    this.showScreen(this.screenHud);

    // Release any stale HTML button focus and ensure window receives keyboard input
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      try { document.activeElement.blur(); } catch (e) {}
    }
    window.focus();
    if (this.game && this.game.canvas) {
      try { this.game.canvas.focus(); } catch (e) {}
    }
  }

  // Public alias used by level select cards
  startLevel(levelId) {
    this._startLevel(levelId);
  }

  // ==========================================================================
  // HUD Rendering & Animation Helpers
  // ==========================================================================

  _renderLives(lives, maxLives = 3, prevLives) {
    if (!this.hudLivesContainer) return;
    let html = '';
    for (let i = 0; i < maxLives; i++) {
      if (i < lives) {
        html += '<span class="heart filled">♥</span>';
      } else if (prevLives !== undefined && prevLives > lives && i === lives) {
        // This specific heart was just lost - play shatter animation!
        html += '<span class="heart empty heart-lost">♥</span>';
      } else {
        html += '<span class="heart empty">♡</span>';
      }
    }
    this.hudLivesContainer.innerHTML = html;
  }

  _animateCounter(el, start, end, duration = 650, prefix = '') {
    if (!el) return;
    const startTime = performance.now();
    const diff = end - start;
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out exponential for snappy arcade deceleration
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = Math.round(start + diff * ease);
      el.textContent = `${prefix}${currentVal}`;
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = `${prefix}${end}`;
      }
    };
    requestAnimationFrame(update);
  }

  _triggerScorePop() {
    if (!this.hudScore) return;
    this.hudScore.classList.remove('hud-val-pop');
    void this.hudScore.offsetWidth;
    this.hudScore.classList.add('hud-val-pop');
  }

  _triggerCoinSpin() {
    const coinEl = document.querySelector('.hud-metric .coin-icon');
    if (!coinEl) return;
    coinEl.classList.remove('coin-spin');
    void coinEl.offsetWidth;
    coinEl.classList.add('coin-spin');
  }

  _triggerGemSparkle() {
    const gemEl = document.querySelector('.crystal-metric .gem-icon');
    if (!gemEl) return;
    gemEl.classList.remove('gem-spin');
    void gemEl.offsetWidth;
    gemEl.classList.add('gem-spin');
  }

  _updateWalletDisplays() {
    const coins    = saveManager.getCoins();
    const crystals = saveManager.getCrystals();
    document.querySelectorAll('.wallet-coins-val').forEach(el    => { el.textContent = `${coins}`; });
    document.querySelectorAll('.wallet-crystals-val').forEach(el => { el.textContent = `${crystals}`; });
  }

  // ==========================================================================
  // Level Select Screen
  // ==========================================================================

  _renderLevelSelect() {
    const container = document.getElementById('levels-grid');
    if (!container) return;

    this._updateWalletDisplays();
    container.innerHTML = '';

    LEVELS.forEach((lvl, index) => {
      const isUnlocked = saveManager.isLevelUnlocked(lvl.id);
      const record     = saveManager.getLevelRecord(lvl.id);
      const isFinale   = lvl.id === 10;
      const isMaster   = lvl.id === 4;

      let cardClass = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      if (isFinale) cardClass += ' level-card-grand-finale';
      else if (isMaster) cardClass += ' level-card-master';

      let badgeText = `LVL ${lvl.id}`;
      if (isFinale) badgeText = 'LVL 10: FINALE 👑';
      else if (isMaster) badgeText = 'LVL 4: MASTER';

      let statusText = isUnlocked
        ? (record.completed ? '★ COMPLETED' : (isFinale ? '👑 FINAL CHALLENGE' : (isMaster ? '★ MASTER READY' : 'READY')))
        : (isFinale ? '🔒 BEAT LVL 9 TO UNLOCK' : (isMaster ? '🔒 BEAT LVL 3 TO UNLOCK' : '🔒 LOCKED'));

      const buttonLabel = isUnlocked
        ? (isFinale ? 'ENTER THRONE 👑' : (isMaster ? 'ENTER CITADEL' : 'LAUNCH MISSION'))
        : 'LOCKED';

      const card = document.createElement('div');
      card.className = cardClass;
      card.style.setProperty('--card-index', index);
      if (isUnlocked) {
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Play Level ${lvl.id}: ${lvl.name}`);
      }

      card.innerHTML = `
        <div class="level-card-header">
          <span class="level-badge">${badgeText}</span>
          <span class="level-status">${statusText}</span>
        </div>
        <h3 class="level-card-title">${lvl.name}</h3>
        <p class="level-card-sub">${lvl.subtitle}</p>
        <div class="level-card-stats">
          <div>HIGH SCORE: <span>${record.highscore}</span></div>
          <div>BEST TIME: <span>${formatTime(record.bestTimeMs)}</span></div>
          <div>GEMS FOUND: <span>${record.crystals} / ${lvl.crystals.length}</span></div>
        </div>
        <button class="pixel-btn ${isUnlocked ? (isFinale || isMaster ? 'btn-gold' : 'btn-cyan') : 'btn-disabled'}" ${isUnlocked ? '' : 'disabled'}>
          ${buttonLabel}
        </button>
      `;

      if (isUnlocked) {
        let isLaunching = false;
        const launchLevel = (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          if (isLaunching) return;
          isLaunching = true;

          try {
            audioManager.playClick();
          } catch (err) { /* safe */ }

          this._startLevel(lvl.id);
        };

        // Allow clicking anywhere on the card
        card.addEventListener('click', launchLevel);

        // Also allow clicking the explicit button
        const btn = card.querySelector('button');
        if (btn) {
          btn.addEventListener('click', launchLevel);
        }

        // Keyboard support (Enter or Space)
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            launchLevel(e);
          }
        });
      }

      container.appendChild(card);
    });
  }

  // ==========================================================================
  // Character Collection Screen
  // ==========================================================================

  _renderCollection() {
    const container = document.getElementById('collection-grid');
    if (!container) return;

    this._updateWalletDisplays();
    container.innerHTML = '';

    const currentCoins = saveManager.getCoins();
    const equipped     = saveManager.getEquippedCharacter();
    const equippedAcc  = saveManager.getEquippedAccessory();

    CHARACTERS.forEach((char, index) => {
      const isOwned    = saveManager.isCharacterOwned(char.id);
      const isEquipped = equipped === char.id;
      const canAfford  = currentCoins >= char.price;
      const isSynergyActive = isEquipped && equippedAcc === char.signatureAccessory;

      const card = document.createElement('div');
      card.className = `character-card ${isEquipped ? 'equipped' : ''} ${isSynergyActive ? 'synergy-matched' : ''}`;
      card.style.setProperty('--card-index', index);

      let actionBtnHtml;
      if (isEquipped) {
        actionBtnHtml = `<button class="pixel-btn btn-equipped" disabled>EQUIPPED</button>`;
      } else if (isOwned) {
        actionBtnHtml = `<button class="pixel-btn ${char.isReward ? 'btn-gold' : 'btn-cyan'} btn-equip">EQUIP</button>`;
      } else if (char.id === 'solaris') {
        actionBtnHtml = `<button class="pixel-btn btn-disabled" disabled>BEAT LVL 10 TO UNLOCK</button>`;
      } else if (char.id === 'vortex') {
        actionBtnHtml = `<button class="pixel-btn btn-disabled" disabled>BEAT LVL 3 TO UNLOCK</button>`;
      } else {
        actionBtnHtml = `<button class="pixel-btn ${canAfford ? 'btn-gold' : 'btn-disabled'} btn-buy" ${canAfford ? '' : 'disabled'}>BUY (${char.price} COINS)</button>`;
      }

      let rewardBadgeHtml = '';
      if (char.id === 'solaris') {
        rewardBadgeHtml = '<span class="char-badge-reward char-badge-finale">EMPEROR REWARD 👑</span>';
      } else if (char.id === 'vortex') {
        rewardBadgeHtml = '<span class="char-badge-reward">CHAMPION REWARD</span>';
      }

      let synergyBadgeHtml = '';
      if (isSynergyActive) {
        synergyBadgeHtml = `<div class="synergy-status-tag active"><span class="pulse-dot"></span>⚡ SYNERGY ACTIVE: ${char.synergyName}</div>`;
      } else {
        synergyBadgeHtml = `
          <div class="synergy-status-tag">
            <span class="gear-icon">💎</span> Signature: <strong>${char.signatureAccName}</strong>
            <span class="perk-desc">(${char.synergyDesc})</span>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="char-preview">
          <div class="char-sprite-placeholder char-avatar-${char.id}"></div>
        </div>
        <div class="char-info">
          <div class="char-header">
            <h3 class="char-name">${char.name}</h3>
            <span class="char-type">${char.title}</span>
            ${rewardBadgeHtml}
          </div>
          <p class="char-desc">${char.description}</p>
          <div class="char-stats">
            <div>SPD: <span>${char.stats.speed}</span></div>
            <div>JUMP: <span>${Math.abs(char.stats.jump)}</span></div>
            <div>CLASS: <span>${char.stats.weight}</span></div>
          </div>
          ${synergyBadgeHtml}
          <div class="char-action-wrap">
            ${actionBtnHtml}
          </div>
        </div>
      `;

      const equipBtn = card.querySelector('.btn-equip');
      if (equipBtn) {
        equipBtn.addEventListener('click', () => {
          audioManager.playClick();
          saveManager.equipCharacter(char.id);
          this._renderCollection();
        });
      }

      const buyBtn = card.querySelector('.btn-buy');
      if (buyBtn && !buyBtn.disabled) {
        buyBtn.addEventListener('click', () => {
          const res = saveManager.buyCharacter(char.id, char.price);
          if (res.success) {
            audioManager.playPowerup();
            this._renderCollection();
            this._updateWalletDisplays();
          } else {
            audioManager.playHurt();
          }
        });
      }

      container.appendChild(card);
    });
  }

  _switchHangarTab(tab) {
    this._activeHangarTab = tab;
    if (tab === 'robots') {
      this.tabHangarRobots?.classList.add('active');
      this.tabHangarAccessories?.classList.remove('active');
      this.gridRobots?.classList.remove('hidden');
      this.gridAccessories?.classList.add('hidden');
      this._renderCollection();
    } else {
      this.tabHangarAccessories?.classList.add('active');
      this.tabHangarRobots?.classList.remove('active');
      this.gridAccessories?.classList.remove('hidden');
      this.gridRobots?.classList.add('hidden');
      this._renderAccessories();
    }
  }

  // ==========================================================================
  // Accessory Collection Screen
  // ==========================================================================

  _renderAccessories() {
    const container = document.getElementById('accessories-grid');
    if (!container) return;

    this._updateWalletDisplays();
    container.innerHTML = '';

    const currentCoins = saveManager.getCoins();
    const currentCrystals = saveManager.getCrystals();
    const equipped = saveManager.getEquippedAccessory();
    const equippedChar = saveManager.getEquippedCharacter();

    ACCESSORIES.forEach((acc, index) => {
      const isOwned = saveManager.isAccessoryOwned(acc.id);
      const isEquipped = equipped === acc.id;
      const canAfford = acc.currency === 'crystals'
        ? currentCrystals >= acc.price
        : currentCoins >= acc.price;
      const isSynergyActive = isEquipped && acc.signatureChar && (equippedChar === acc.signatureChar);

      const card = document.createElement('div');
      card.className = `character-card accessory-card ${isEquipped ? 'equipped' : ''} ${isSynergyActive ? 'synergy-matched' : ''}`;
      card.style.setProperty('--card-index', index);

      let actionBtnHtml;
      if (isEquipped) {
        actionBtnHtml = `<button class="pixel-btn btn-equipped" disabled>EQUIPPED</button>`;
      } else if (isOwned) {
        actionBtnHtml = `<button class="pixel-btn btn-cyan btn-equip-acc">EQUIP</button>`;
      } else {
        const priceLabel = acc.currency === 'crystals' ? `${acc.price} GEMS ◆` : `${acc.price} COINS ●`;
        const btnClass = canAfford ? (acc.currency === 'crystals' ? 'btn-purple' : 'btn-gold') : 'btn-disabled';
        actionBtnHtml = `<button class="pixel-btn ${btnClass} btn-buy-acc" ${canAfford ? '' : 'disabled'}>BUY (${priceLabel})</button>`;
      }

      let synergyBadgeHtml = '';
      if (acc.id !== 'none' && acc.signatureChar) {
        if (isSynergyActive) {
          synergyBadgeHtml = `<div class="synergy-status-tag active"><span class="pulse-dot"></span>⚡ SYNERGY ACTIVE: ${acc.synergyName}</div>`;
        } else {
          synergyBadgeHtml = `
            <div class="synergy-status-tag">
              <span class="gear-icon">🤖</span> Best For: <strong>${acc.signatureCharName}</strong>
              <span class="perk-desc">(${acc.synergyEffect})</span>
            </div>
          `;
        }
      }

      card.innerHTML = `
        <div class="char-preview accessory-preview">
          <div class="accessory-icon-avatar acc-icon-${acc.id}">${acc.previewIcon || '✨'}</div>
        </div>
        <div class="char-info">
          <div class="char-header">
            <h3 class="char-name">${acc.name}</h3>
            <span class="char-type">${acc.title}</span>
          </div>
          <p class="char-desc">${acc.description}</p>
          ${synergyBadgeHtml}
          <div class="char-action-wrap">
            ${actionBtnHtml}
          </div>
        </div>
      `;

      const equipBtn = card.querySelector('.btn-equip-acc');
      if (equipBtn) {
        equipBtn.addEventListener('click', () => {
          audioManager.playClick();
          saveManager.equipAccessory(acc.id);
          this.game.events.emit('accessory-changed', acc.id);
          this._renderAccessories();
        });
      }

      const buyBtn = card.querySelector('.btn-buy-acc');
      if (buyBtn && !buyBtn.disabled) {
        buyBtn.addEventListener('click', () => {
          const res = saveManager.buyAccessory(acc.id, acc.price, acc.currency);
          if (res.success) {
            audioManager.playPowerup();
            this.game.events.emit('accessory-changed', acc.id);
            this._renderAccessories();
            this._updateWalletDisplays();
          } else {
            audioManager.playHurt();
          }
        });
      }

      container.appendChild(card);
    });
  }

  // ==========================================================================
  // Settings Screen
  // ==========================================================================

  _renderSettings() {
    const settings = saveManager.getSettings();
    const toggleMusic = document.getElementById('toggle-music');
    const toggleSfx   = document.getElementById('toggle-sfx');

    if (toggleMusic) toggleMusic.checked = settings.music;
    if (toggleSfx)   toggleSfx.checked   = settings.sfx;

    const stats = saveManager.state.stats;
    const statsEl = document.getElementById('settings-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div>Levels Cleared: <span>${stats.totalLevelsCompleted}</span></div>
        <div>Coins Harvested: <span>${stats.totalCoinsCollected}</span></div>
      `;
    }

    this._updatePOVButtons(saveManager.getPOVPreference());
  }

  _updatePOVButtons(zoom) {
    const isClose = (typeof zoom === 'number') ? (zoom >= 1.25) : (zoom === 'close');
    const btnHud = document.getElementById('btn-hud-pov');
    if (btnHud) {
      btnHud.textContent = isClose ? '🔍 DEKAT' : '🔍 NORMAL';
      btnHud.title = isClose ? 'Mode Kamera Dekat (1.35x) - Klik untuk Normal' : 'Mode Kamera Normal (1.0x) - Klik untuk Dekat';
      btnHud.classList.toggle('active', isClose);
    }
    const btnSettings = document.getElementById('btn-settings-pov');
    if (btnSettings) {
      btnSettings.textContent = isClose ? '🔍 ZOOM DEKAT (1.35x)' : '🔍 NORMAL (1.0x)';
      btnSettings.className = isClose ? 'pixel-btn btn-cyan btn-small' : 'pixel-btn btn-subtle btn-small';
    }
  }

  _checkOrientation() {
    const el = document.getElementById('orientation-hint');
    if (!el) return;
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem('dismiss_orientation_hint') === 'true';
    } catch (e) {}

    if (dismissed) {
      el.classList.add('hidden');
      return;
    }

    const isMobile = ('ontouchstart' in window) ||
                     (navigator.maxTouchPoints > 0) ||
                     (window.innerWidth <= 768);
    const isPortrait = window.innerHeight > window.innerWidth;

    if (isMobile && isPortrait) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  // ==========================================================================
  // Confirm Dialog
  // ==========================================================================

  _showConfirmDialog(title, message, onConfirm) {
    const titleEl = document.getElementById('confirm-title');
    const msgEl   = document.getElementById('confirm-msg');
    const okBtn   = document.getElementById('btn-confirm-ok');
    if (!okBtn) return;

    if (titleEl) titleEl.textContent = title;
    if (msgEl)   msgEl.textContent   = message;

    // Replace OK button with fresh clone to avoid stale listener accumulation
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);

    newOkBtn.addEventListener('click', () => {
      audioManager.playClick();
      if (this.modalConfirm) this.modalConfirm.classList.add('hidden');
      onConfirm();
    });

    if (this.modalConfirm) this.modalConfirm.classList.remove('hidden');
  }

  // ==========================================================================
  // Ability HUD & Touch Button Controls
  // ==========================================================================

  _resetAbilityHUD() {
    if (this._abilityCooldownTimer) {
      clearInterval(this._abilityCooldownTimer);
      this._abilityCooldownTimer = null;
    }
    if (this.hudAbilityBar) this.hudAbilityBar.classList.add('hidden');
    if (this.btnTouchAbility) {
      this.btnTouchAbility.classList.remove('cooldown');
    }
  }

  _updateAbilityHUDOnLevelStart() {
    this._resetAbilityHUD();
    const acc = saveManager.getEquippedAccessory();
    if (this.btnTouchAbility) {
      if (!acc || acc === 'none') {
        this.btnTouchAbility.style.display = 'none';
      } else {
        this.btnTouchAbility.style.display = '';
        const icons = {
          wings_photon: '⚡',
          halo_cosmic: '✨',
          jetpack_thruster: '🔥',
          crown_plasma: '👑',
          cape_nebula: '🌌'
        };
        this.btnTouchAbility.textContent = icons[acc] || '⚡';
      }
    }
  }

  _handleAbilityActivated({ id, cooldownMs }) {
    if (!this.hudAbilityBar || !this.hudAbilityFill) return;

    const info = {
      wings_photon:    { name: '⚡ PHASE DASH',   color: '#00f0ff' },
      halo_cosmic:     { name: '✨ HALO BARRIER', color: '#ffd700' },
      jetpack_thruster:{ name: '🔥 JETPACK HOVER', color: '#ff6600' },
      crown_plasma:    { name: '👑 PLASMA BLAST', color: '#9b51e0' },
      cape_nebula:     { name: '🌌 COMET GLIDE',  color: '#b347eb' }
    }[id] || { name: '⚡ ABILITY', color: '#00f0ff' };

    if (this.hudAbilityLabel) {
      this.hudAbilityLabel.textContent = info.name;
      this.hudAbilityLabel.style.color = info.color;
    }
    this.hudAbilityFill.style.background = `linear-gradient(90deg, ${info.color}, #ffffff)`;
    this.hudAbilityFill.style.width = '100%';
    this.hudAbilityBar.classList.remove('hidden');

    if (this.btnTouchAbility) {
      this.btnTouchAbility.classList.add('cooldown');
    }

    if (this._abilityCooldownTimer) {
      clearInterval(this._abilityCooldownTimer);
    }

    const startTime = Date.now();
    this._abilityCooldownTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / cooldownMs);
      const remainingPercent = (1 - progress) * 100;

      if (this.hudAbilityFill) {
        this.hudAbilityFill.style.width = `${remainingPercent}%`;
      }

      if (progress >= 1) {
        clearInterval(this._abilityCooldownTimer);
        this._abilityCooldownTimer = null;
        if (this.hudAbilityLabel) {
          this.hudAbilityLabel.textContent = 'READY! ⚡';
          this.hudAbilityLabel.style.color = '#39ff14';
        }
        if (this.btnTouchAbility) {
          this.btnTouchAbility.classList.remove('cooldown');
        }
        setTimeout(() => {
          if (!this._abilityCooldownTimer && this.hudAbilityBar) {
            this.hudAbilityBar.classList.add('hidden');
          }
        }, 650);
      }
    }, 50);
  }
}

