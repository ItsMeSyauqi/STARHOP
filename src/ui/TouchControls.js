/**
 * STARHOP - TouchControls
 * Ultra-responsive touch and pointer event system for mobile and tablet browsers.
 * Features:
 * - Fluid sliding D-Pad: smoothly switch between Left and Right without lifting your thumb.
 * - Robust Pointer Capture: thumb roll and minor slippage will never drop your inputs.
 * - Dedicated jump queue: guaranteed one-shot jump trigger without frame-timing race conditions.
 * - Tactile micro-vibration feedback (haptic feedback) on devices that support it.
 * - Instant visual active state (.active) for zero perceived input latency.
 */

export class TouchControls {
  constructor(game) {
    this.game = game;
    this.state = {
      left: false,
      right: false,
      jump: false,
      jumpPressed: false
    };

    this.container = document.getElementById('touch-controls');
    this.dpad = document.querySelector('.touch-dpad');
    this.btnLeft = document.getElementById('btn-touch-left');
    this.btnRight = document.getElementById('btn-touch-right');
    this.btnJump = document.getElementById('btn-touch-jump');
    this.btnAbility = document.getElementById('btn-touch-ability');

    this._dpadPointerId = null;
    this._jumpPointerId = null;
    this._abilityPointerId = null;

    this.bindEvents();
  }

  bindEvents() {
    if (!this.container) return;

    // =========================================================================
    // 1. SMART SLIDING D-PAD (Left / Right Movement)
    // =========================================================================
    const handleDpadPointer = (e) => {
      if (!this.dpad) return;

      const rect = this.dpad.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const clientX = e.clientX;

      const prevLeft = this.state.left;
      const prevRight = this.state.right;

      if (clientX < midX - 6) {
        this.state.left = true;
        this.state.right = false;
      } else if (clientX > midX + 6) {
        this.state.right = true;
        this.state.left = false;
      } else {
        // Deadzone in the center
        this.state.left = false;
        this.state.right = false;
      }

      // Haptic tick when changing direction
      if ((this.state.left !== prevLeft || this.state.right !== prevRight) && 'vibrate' in navigator) {
        try { navigator.vibrate(8); } catch (err) {}
      }

      this._updateDpadVisuals();
      this.emitState();
    };

    // Universal D-pad release handler
    const releaseDpad = (e) => {
      if (e && this._dpadPointerId !== null && e.pointerId !== undefined && e.pointerId !== this._dpadPointerId) {
        return;
      }
      this._dpadPointerId = null;
      this.state.left = false;
      this.state.right = false;
      this._updateDpadVisuals();
      this.emitState();
    };

    if (this.dpad) {
      // Start moving on touch
      this.dpad.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this._dpadPointerId = e.pointerId;
        try {
          this.dpad.setPointerCapture(e.pointerId);
        } catch (err) {}
        handleDpadPointer(e);
      }, { passive: false });

      // Continuous tracking while sliding thumb across the D-Pad
      const onPointerMove = (e) => {
        if (this._dpadPointerId === e.pointerId) {
          e.preventDefault();
          handleDpadPointer(e);
        }
      };

      this.dpad.addEventListener('pointermove', onPointerMove, { passive: false });
      this.dpad.addEventListener('pointerup', releaseDpad, { passive: false });
      this.dpad.addEventListener('pointercancel', releaseDpad, { passive: false });
      this.dpad.addEventListener('lostpointercapture', releaseDpad, { passive: false });

      // Direct button listeners with guaranteed pointer release
      const bindSingleDir = (btn, dirKey) => {
        if (!btn) return;
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this._dpadPointerId = e.pointerId;
          try { btn.setPointerCapture(e.pointerId); } catch (err) {}
          const prevLeft = this.state.left;
          const prevRight = this.state.right;
          this.state.left = (dirKey === 'left');
          this.state.right = (dirKey === 'right');
          if ((this.state.left !== prevLeft || this.state.right !== prevRight) && 'vibrate' in navigator) {
            try { navigator.vibrate(8); } catch (err) {}
          }
          this._updateDpadVisuals();
          this.emitState();
        }, { passive: false });

        btn.addEventListener('pointermove', onPointerMove, { passive: false });
        btn.addEventListener('pointerup', releaseDpad, { passive: false });
        btn.addEventListener('pointercancel', releaseDpad, { passive: false });
        btn.addEventListener('lostpointercapture', releaseDpad, { passive: false });
      };

      bindSingleDir(this.btnLeft, 'left');
      bindSingleDir(this.btnRight, 'right');

      // Window safety net: release if finger lifts anywhere on screen
      window.addEventListener('pointerup', releaseDpad, { passive: true });
      window.addEventListener('pointercancel', releaseDpad, { passive: true });
    }

    // =========================================================================
    // 2. ULTRA-RESPONSIVE JUMP BUTTON
    // =========================================================================
    if (this.btnJump) {
      this.btnJump.addEventListener('pointerdown', (e) => {
        e.preventDefault();

        this._jumpPointerId = e.pointerId;
        try {
          this.btnJump.setPointerCapture(e.pointerId);
        } catch (err) {}

        this.state.jump = true;
        this.state.jumpPressed = true;
        this.btnJump.classList.add('active');

        // Instant tactile haptic feedback on mobile phones
        if ('vibrate' in navigator) {
          try { navigator.vibrate(15); } catch (err) {}
        }

        // Direct queued event guarantees jump is never lost between frames
        this.game.events.emit('touch-jump-down');
        this.emitState();
      }, { passive: false });

      const releaseJump = (e) => {
        if (this._jumpPointerId !== null && (e === undefined || e.pointerId === undefined || e.pointerId === this._jumpPointerId)) {
          this._jumpPointerId = null;
          this.state.jump = false;
          this.state.jumpPressed = false;
          this.btnJump.classList.remove('active');
          this.game.events.emit('touch-jump-up');
          this.emitState();
        }
      };

      this.btnJump.addEventListener('pointerup', releaseJump, { passive: false });
      this.btnJump.addEventListener('pointercancel', releaseJump, { passive: false });
      this.btnJump.addEventListener('lostpointercapture', releaseJump, { passive: false });
      window.addEventListener('pointerup', releaseJump, { passive: true });
      window.addEventListener('pointercancel', releaseJump, { passive: true });
    }

    // =========================================================================
    // 3. ABILITY BUTTON (E key equivalent)
    // =========================================================================
    if (this.btnAbility) {
      this.btnAbility.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this._abilityPointerId = e.pointerId;
        try {
          this.btnAbility.setPointerCapture(e.pointerId);
        } catch (err) {}
        this.btnAbility.classList.add('active');
        if ('vibrate' in navigator) {
          try { navigator.vibrate(20); } catch (err) {}
        }
        // One-shot queued event — same pattern as jump
        this.game.events.emit('touch-ability');
      }, { passive: false });

      const releaseAbility = (e) => {
        if (this._abilityPointerId !== null && (e === undefined || e.pointerId === undefined || e.pointerId === this._abilityPointerId)) {
          this._abilityPointerId = null;
          this.btnAbility.classList.remove('active');
        }
      };

      this.btnAbility.addEventListener('pointerup', releaseAbility, { passive: false });
      this.btnAbility.addEventListener('pointercancel', releaseAbility, { passive: false });
      this.btnAbility.addEventListener('lostpointercapture', releaseAbility, { passive: false });
      window.addEventListener('pointerup', releaseAbility, { passive: true });
      window.addEventListener('pointercancel', releaseAbility, { passive: true });
    }

    // =========================================================================
    // 4. SAFETY: Window Blur & Visibility Reset
    // =========================================================================
    window.addEventListener('blur', () => this.resetState());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.resetState();
    });
  }

  _updateDpadVisuals() {
    if (this.btnLeft) {
      this.btnLeft.classList.toggle('active', this.state.left);
    }
    if (this.btnRight) {
      this.btnRight.classList.toggle('active', this.state.right);
    }
  }

  emitState() {
    this.game.events.emit('touch-input', { ...this.state });
  }

  resetState() {
    this._dpadPointerId = null;
    this._jumpPointerId = null;
    this._abilityPointerId = null;
    this.state.left = false;
    this.state.right = false;
    this.state.jump = false;
    this.state.jumpPressed = false;
    this._updateDpadVisuals();
    if (this.btnJump) {
      this.btnJump.classList.remove('active');
    }
    if (this.btnAbility) {
      this.btnAbility.classList.remove('active');
    }
    this.emitState();
  }

  show() {
    this.resetState();
    if (this.container) {
      this.container.classList.remove('hidden');
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.add('hidden');
    }
    this.resetState();
  }
}
