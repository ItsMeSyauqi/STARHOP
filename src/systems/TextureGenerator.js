/**
 * STARHOP - TextureGenerator
 * Generates all pixel art sprites, tiles, collectibles, hazards, and VFX
 * procedurally on HTML5 Canvases and registers them into Phaser TextureManager.
 * Zero external asset dependencies, 100% offline and crisp nearest-neighbor rendering.
 */

export class TextureGenerator {
  /**
   * Generates and registers all textures into the given Phaser Scene.
   * @param {Phaser.Scene} scene
   */
  static generateAll(scene) {
    this.generateCharacterFrames(scene, 'nova', {
      body: '#2a75ff',
      bodyDark: '#103d8f',
      visor: '#00ffff',
      antenna: '#ffd700',
      flame: '#ff9100'
    });

    this.generateCharacterFrames(scene, 'byte', {
      body: '#00e676',
      bodyDark: '#00695c',
      visor: '#ffeb3b',
      antenna: '#76ff03',
      flame: '#00e5ff'
    });

    this.generateCharacterFrames(scene, 'comet', {
      body: '#9c27b0',
      bodyDark: '#4a148c',
      visor: '#00e5ff',
      antenna: '#ffd700',
      flame: '#ff007a'
    });

    this.generateCharacterFrames(scene, 'vortex', {
      body: '#ffd700',
      bodyDark: '#35084f',
      visor: '#00ffff',
      antenna: '#ff0055',
      flame: '#00f0ff'
    });

    this.generateCharacterFrames(scene, 'solaris', {
      body: '#ffaa00',
      bodyDark: '#2a0d00',
      visor: '#ffffff',
      antenna: '#ff2200',
      flame: '#00f0ff'
    });

    this.generateTiles(scene);
    this.generateCollectibles(scene);
    this.generateHazards(scene);
    this.generatePortal(scene);
    this.generateVFX(scene);
  }

  /**
   * Helper to create a canvas texture in Phaser
   */
  static createCanvasTexture(scene, key, width, height, drawFn) {
    if (scene.textures.exists(key)) return;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, width, height);
    scene.textures.addCanvas(key, canvas);
  }

  /**
   * Generates Idle, Run, and Jump frames for each distinct robot character
   */
  static generateCharacterFrames(scene, charId, colors) {
    const w = 24;
    const h = 26;

    // Helper to draw unique robot anatomy per character
    const drawRobot = (ctx, animType, frameIdx) => {
      let bobY = 0;
      let legOffset1 = 0;
      let legOffset2 = 0;
      let showThruster = false;

      if (animType === 'idle') {
        bobY = frameIdx === 1 ? 1 : 0;
      } else if (animType === 'run') {
        bobY = (frameIdx % 2 === 1) ? -1 : 0;
        if (frameIdx === 0) { legOffset1 = -3; legOffset2 = 3; }
        else if (frameIdx === 1) { legOffset1 = 0; legOffset2 = 0; }
        else if (frameIdx === 2) { legOffset1 = 3; legOffset2 = -3; }
        else if (frameIdx === 3) { legOffset1 = 0; legOffset2 = 0; }
      } else if (animType === 'jump') {
        bobY = -1;
        showThruster = true;
      }

      const by = bobY;

      if (charId === 'nova') {
        // --- NOVA: The Stellar Scout ---
        // Side fin antennae
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(3, 4 + by, 2, 4);
        ctx.fillRect(19, 4 + by, 2, 4);
        ctx.fillStyle = '#103d8f';
        ctx.fillRect(4, 5 + by, 1, 3);
        ctx.fillRect(19, 5 + by, 1, 3);

        // Center gold star comm beacon
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(11, 1 + by, 2, 4);
        ctx.fillRect(10, 0 + by, 4, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(11, 0 + by, 2, 1);

        // Rounded scout helmet
        ctx.fillStyle = '#103d8f';
        ctx.fillRect(5, 5 + by, 14, 10);
        ctx.fillStyle = '#2a75ff';
        ctx.fillRect(6, 6 + by, 12, 8);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(7, 5 + by, 10, 2);

        // Curved high-tech cyan visor
        ctx.fillStyle = '#060919';
        ctx.fillRect(7, 8 + by, 10, 4);
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(8, 9 + by, 8, 2);
        // Dual eye glints
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(9, 9 + by, 2, 1);
        ctx.fillRect(13, 9 + by, 2, 1);

        // Torso & Star Core
        ctx.fillStyle = '#103d8f';
        ctx.fillRect(7, 15 + by, 10, 6);
        ctx.fillStyle = '#2a75ff';
        ctx.fillRect(8, 16 + by, 8, 4);
        // Shoulder pauldrons
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(5, 15 + by, 2, 4);
        ctx.fillRect(17, 15 + by, 2, 4);
        // Stellar Star Core
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(11, 17 + by, 2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(11, 17 + by, 1, 1);

        // Boots / Thrusters
        if (showThruster) {
          ctx.fillStyle = '#103d8f';
          ctx.fillRect(8, 21, 3, 2);
          ctx.fillRect(13, 21, 3, 2);
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(8, 23, 3, 3);
          ctx.fillRect(13, 23, 3, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(9, 23, 1, 2);
          ctx.fillRect(14, 23, 1, 2);
        } else {
          ctx.fillStyle = '#103d8f';
          ctx.fillRect(7 + legOffset1, 21, 4, 3);
          ctx.fillRect(13 + legOffset2, 21, 4, 3);
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(7 + legOffset1, 23, 4, 1);
          ctx.fillRect(13 + legOffset2, 23, 4, 1);
        }

      } else if (charId === 'byte') {
        // --- BYTE: The Cyber Specialist ---
        // Dual cyber radar horns
        ctx.fillStyle = '#76ff03';
        ctx.fillRect(5, 0 + by, 2, 5);
        ctx.fillRect(4, 0 + by, 2, 2);
        ctx.fillRect(17, 0 + by, 2, 5);
        ctx.fillRect(18, 0 + by, 2, 2);

        // Angular cyber head
        ctx.fillStyle = '#004d40';
        ctx.fillRect(5, 5 + by, 14, 10);
        ctx.fillStyle = '#00e676';
        ctx.fillRect(6, 6 + by, 12, 8);
        // Cheek ventilation grill vents
        ctx.fillStyle = '#004d40';
        ctx.fillRect(6, 11 + by, 2, 2);
        ctx.fillRect(16, 11 + by, 2, 2);

        // Cyber matrix amber digital visor
        ctx.fillStyle = '#051b14';
        ctx.fillRect(7, 8 + by, 10, 4);
        ctx.fillStyle = '#ffeb3b';
        ctx.fillRect(8, 9 + by, 8, 2);
        // Digital pixel optics
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(9, 9 + by, 2, 1);
        ctx.fillRect(13, 9 + by, 2, 1);
        ctx.fillStyle = '#76ff03';
        ctx.fillRect(7, 7 + by, 10, 1);

        // Torso & Nanotech Battery Core
        ctx.fillStyle = '#004d40';
        ctx.fillRect(6, 15 + by, 12, 6);
        ctx.fillStyle = '#00e676';
        ctx.fillRect(7, 16 + by, 10, 4);
        // Nanotech power bar
        ctx.fillStyle = '#00b0ff';
        ctx.fillRect(9, 17 + by, 6, 2);
        ctx.fillStyle = '#76ff03';
        ctx.fillRect(10, 17 + by, 2, 2);

        // Boots / Thrusters
        if (showThruster) {
          ctx.fillStyle = '#004d40';
          ctx.fillRect(8, 21, 3, 2);
          ctx.fillRect(13, 21, 3, 2);
          ctx.fillStyle = '#00e5ff';
          ctx.fillRect(8, 23, 3, 3);
          ctx.fillRect(13, 23, 3, 3);
          ctx.fillStyle = '#76ff03';
          ctx.fillRect(9, 23, 1, 2);
          ctx.fillRect(14, 23, 1, 2);
        } else {
          ctx.fillStyle = '#004d40';
          ctx.fillRect(6 + legOffset1, 21, 5, 3);
          ctx.fillRect(13 + legOffset2, 21, 5, 3);
          ctx.fillStyle = '#76ff03';
          ctx.fillRect(7 + legOffset1, 22, 3, 2);
          ctx.fillRect(14 + legOffset2, 22, 3, 2);
        }

      } else if (charId === 'comet') {
        // --- COMET: The Astral Voyager ---
        // Sweeping celestial astral crest horn
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(10, 0 + by, 4, 3);
        ctx.fillRect(12, 2 + by, 3, 3);
        ctx.fillStyle = '#ff007a';
        ctx.fillRect(11, 1 + by, 2, 2);

        // Cosmic violet helmet with stardust magenta flares
        ctx.fillStyle = '#3b0d66';
        ctx.fillRect(5, 5 + by, 14, 10);
        ctx.fillStyle = '#9c27b0';
        ctx.fillRect(6, 6 + by, 12, 8);
        ctx.fillStyle = '#ff007a';
        ctx.fillRect(5, 9 + by, 2, 4);
        ctx.fillRect(17, 9 + by, 2, 4);

        // Slanted aerodynamic cyan visor
        ctx.fillStyle = '#100324';
        ctx.fillRect(7, 8 + by, 10, 4);
        ctx.fillStyle = '#00e5ff';
        ctx.fillRect(8, 9 + by, 8, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, 9 + by, 3, 1);

        // Torso & Astral Heart Gem
        ctx.fillStyle = '#3b0d66';
        ctx.fillRect(7, 15 + by, 10, 6);
        ctx.fillStyle = '#9c27b0';
        ctx.fillRect(8, 16 + by, 8, 4);
        // Stardust Heart Gem
        ctx.fillStyle = '#ff007a';
        ctx.fillRect(10, 17 + by, 4, 2);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(11, 17 + by, 2, 1);

        // Boots / Thrusters
        if (showThruster) {
          ctx.fillStyle = '#3b0d66';
          ctx.fillRect(8, 21, 3, 2);
          ctx.fillRect(13, 21, 3, 2);
          ctx.fillStyle = '#ff007a';
          ctx.fillRect(8, 23, 3, 3);
          ctx.fillRect(13, 23, 3, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(9, 23, 1, 2);
          ctx.fillRect(14, 23, 1, 2);
        } else {
          ctx.fillStyle = '#3b0d66';
          ctx.fillRect(7 + legOffset1, 21, 4, 3);
          ctx.fillRect(13 + legOffset2, 21, 4, 3);
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(8 + legOffset1, 22, 2, 2);
          ctx.fillRect(14 + legOffset2, 22, 2, 2);
        }

      } else if (charId === 'vortex') {
        // --- VORTEX: The Quantum Champion ---
        // Twin spiked golden battle horns
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(4, 0 + by, 3, 5);
        ctx.fillRect(17, 0 + by, 3, 5);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(5, 0 + by, 1, 2);
        ctx.fillRect(18, 0 + by, 1, 2);

        // Void purple & crimson warrior battle helm
        ctx.fillStyle = '#220436';
        ctx.fillRect(5, 5 + by, 14, 10);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(7, 4 + by, 10, 2);
        ctx.fillStyle = '#35084f';
        ctx.fillRect(6, 6 + by, 12, 8);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(6, 8 + by, 2, 5);
        ctx.fillRect(16, 8 + by, 2, 5);

        // Dual combat slit visors
        ctx.fillStyle = '#06000d';
        ctx.fillRect(7, 8 + by, 10, 4);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(8, 9 + by, 3, 2);
        ctx.fillRect(13, 9 + by, 3, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(9, 9 + by, 1, 1);
        ctx.fillRect(14, 9 + by, 1, 1);

        // Torso with Golden Pauldrons & Quantum Singularity Core
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(4, 14 + by, 3, 5);
        ctx.fillRect(17, 14 + by, 3, 5);
        ctx.fillStyle = '#220436';
        ctx.fillRect(6, 15 + by, 12, 6);
        ctx.fillStyle = '#35084f';
        ctx.fillRect(7, 16 + by, 10, 4);
        // Quantum Singularity Core
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(10, 16 + by, 4, 3);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(11, 17 + by, 2, 1);

        // Boots / Thrusters
        if (showThruster) {
          ctx.fillStyle = '#220436';
          ctx.fillRect(8, 21, 3, 2);
          ctx.fillRect(13, 21, 3, 2);
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(8, 23, 3, 4);
          ctx.fillRect(13, 23, 3, 4);
          ctx.fillStyle = '#ff0055';
          ctx.fillRect(9, 24, 1, 2);
          ctx.fillRect(14, 24, 1, 2);
        } else {
          ctx.fillStyle = '#ffd700';
          ctx.fillRect(6 + legOffset1, 21, 5, 3);
          ctx.fillRect(13 + legOffset2, 21, 5, 3);
          ctx.fillStyle = '#ff0055';
          ctx.fillRect(7 + legOffset1, 21, 3, 1);
          ctx.fillRect(14 + legOffset2, 21, 3, 1);
        }

      } else if (charId === 'solaris') {
        // --- SOLARIS: The Cosmic Emperor ---
        // Radiant 5-point Sun Emperor Corona / Solar Crown
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(6, 1 + by, 2, 4);
        ctx.fillRect(9, 0 + by, 2, 5);
        ctx.fillRect(11, 0 + by, 2, 6);
        ctx.fillRect(13, 0 + by, 2, 5);
        ctx.fillRect(16, 1 + by, 2, 4);
        // Solar flare tips
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(6, 0 + by, 2, 1);
        ctx.fillRect(16, 0 + by, 2, 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(11, 0 + by, 2, 2);

        // Imperial Sun God helmet
        ctx.fillStyle = '#2a0d00';
        ctx.fillRect(5, 5 + by, 14, 10);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(6, 6 + by, 12, 8);
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(5, 8 + by, 2, 5);
        ctx.fillRect(17, 8 + by, 2, 5);

        // Radiant diamond-white visor
        ctx.fillStyle = '#1a0500';
        ctx.fillRect(7, 8 + by, 10, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 9 + by, 8, 2);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(7, 9 + by, 1, 2);
        ctx.fillRect(16, 9 + by, 1, 2);

        // Torso with Imperial Mantle & Solar Star Reactor
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(5, 14 + by, 14, 3);
        ctx.fillStyle = '#2a0d00';
        ctx.fillRect(6, 15 + by, 12, 6);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(7, 16 + by, 10, 4);
        // Solar Star Reactor
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, 16 + by, 4, 3);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(11, 17 + by, 2, 1);

        // Boots / Thrusters
        if (showThruster) {
          ctx.fillStyle = '#2a0d00';
          ctx.fillRect(8, 21, 3, 2);
          ctx.fillRect(13, 21, 3, 2);
          ctx.fillStyle = '#ffaa00';
          ctx.fillRect(8, 23, 3, 4);
          ctx.fillRect(13, 23, 3, 4);
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(9, 24, 1, 2);
          ctx.fillRect(14, 24, 1, 2);
        } else {
          ctx.fillStyle = '#ffaa00';
          ctx.fillRect(6 + legOffset1, 21, 5, 3);
          ctx.fillRect(13 + legOffset2, 21, 5, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(8 + legOffset1, 22, 2, 1);
          ctx.fillRect(14 + legOffset2, 22, 2, 1);
        }
      }
    };

    // Idle 0 and 1
    this.createCanvasTexture(scene, `${charId}_idle_0`, w, h, (ctx) => drawRobot(ctx, 'idle', 0));
    this.createCanvasTexture(scene, `${charId}_idle_1`, w, h, (ctx) => drawRobot(ctx, 'idle', 1));

    // Run 0, 1, 2, 3
    for (let i = 0; i < 4; i++) {
      this.createCanvasTexture(scene, `${charId}_run_${i}`, w, h, (ctx) => drawRobot(ctx, 'run', i));
    }

    // Jump
    this.createCanvasTexture(scene, `${charId}_jump`, w, h, (ctx) => drawRobot(ctx, 'jump', 0));
  }

  /**
   * Generates platforms & tiles
   */
  static generateTiles(scene) {
    // Platform block (32x32)
    this.createCanvasTexture(scene, 'tile_surface', 32, 32, (ctx) => {
      // Base dark cosmic rock
      ctx.fillStyle = '#141838';
      ctx.fillRect(0, 0, 32, 32);

      // Inner rock shading
      ctx.fillStyle = '#1d234d';
      ctx.fillRect(2, 6, 28, 24);

      // Crystalline neon grass top
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(0, 0, 32, 3);
      ctx.fillStyle = '#7928ca';
      ctx.fillRect(0, 3, 32, 2);

      // Glow flecks
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(4, 1, 3, 1);
      ctx.fillRect(14, 1, 4, 1);
      ctx.fillRect(24, 1, 2, 1);

      // Mineral flecks in stone
      ctx.fillStyle = '#5c67a3';
      ctx.fillRect(6, 12, 3, 2);
      ctx.fillRect(18, 18, 2, 3);
      ctx.fillRect(10, 24, 4, 2);
      ctx.fillRect(22, 10, 2, 2);

      // Bottom shadow
      ctx.fillStyle = '#0a0c1c';
      ctx.fillRect(0, 30, 32, 2);
    });

    // Moving Platform (90x24)
    this.createCanvasTexture(scene, 'platform_moving', 90, 24, (ctx) => {
      // Tech platform body
      ctx.fillStyle = '#0f142e';
      ctx.fillRect(0, 0, 90, 20);

      // Outer metal bezel
      ctx.fillStyle = '#2f3b73';
      ctx.fillRect(2, 2, 86, 16);

      // Top energy runway
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(4, 3, 82, 3);

      // Side grips
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(4, 8, 4, 8);
      ctx.fillRect(82, 8, 4, 8);

      // Center tech pattern
      ctx.fillStyle = '#161c3d';
      ctx.fillRect(14, 8, 62, 8);
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(20, 11, 12, 2);
      ctx.fillRect(38, 11, 14, 2);
      ctx.fillRect(58, 11, 12, 2);

      // Dual thrusters at bottom
      ctx.fillStyle = '#101530';
      ctx.fillRect(18, 19, 14, 3);
      ctx.fillRect(58, 19, 14, 3);

      // Thruster plasma glow
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(21, 22, 8, 2);
      ctx.fillRect(61, 22, 8, 2);
    });

    // Crumbling Platform (80x22)
    this.createCanvasTexture(scene, 'platform_crumbling', 80, 22, (ctx) => {
      // Unstable crystalline rock
      ctx.fillStyle = '#3a1e4a';
      ctx.fillRect(0, 0, 80, 20);

      ctx.fillStyle = '#562f6b';
      ctx.fillRect(2, 2, 76, 16);

      // Glowing cracks
      ctx.fillStyle = '#ff007a';
      ctx.fillRect(0, 0, 80, 3);

      // Cracks in rock
      ctx.fillStyle = '#ff7700';
      ctx.fillRect(18, 4, 2, 6);
      ctx.fillRect(20, 9, 4, 2);
      ctx.fillRect(24, 11, 2, 5);

      ctx.fillRect(45, 3, 2, 7);
      ctx.fillRect(47, 10, 5, 2);
      ctx.fillRect(52, 12, 2, 6);

      ctx.fillRect(66, 6, 2, 8);

      // Dark underside
      ctx.fillStyle = '#1b0924';
      ctx.fillRect(0, 20, 80, 2);
    });
  }

  /**
   * Generates Coins, Crystals, and Power-ups
   */
  static generateCollectibles(scene) {
    // 4 Animated frames of spinning gold coin
    const coinFrames = [
      (ctx) => { // Frame 0: Full circle
        ctx.fillStyle = '#d48800';
        ctx.beginPath(); ctx.arc(9, 9, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.arc(9, 9, 6.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff48f';
        ctx.fillRect(7, 5, 4, 8);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 6, 2, 3);
      },
      (ctx) => { // Frame 1: 3/4 oval
        ctx.fillStyle = '#d48800';
        ctx.beginPath(); ctx.ellipse(9, 9, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.ellipse(9, 9, 4.5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 6, 2, 3);
      },
      (ctx) => { // Frame 2: Side edge
        ctx.fillStyle = '#d48800';
        ctx.beginPath(); ctx.ellipse(9, 9, 2.5, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(8, 2, 2, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 6, 2, 3);
      },
      (ctx) => { // Frame 3: 3/4 oval back
        ctx.fillStyle = '#d48800';
        ctx.beginPath(); ctx.ellipse(9, 9, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath(); ctx.ellipse(9, 9, 4.5, 6.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffe033';
        ctx.fillRect(8, 7, 2, 4);
      }
    ];

    coinFrames.forEach((draw, i) => {
      this.createCanvasTexture(scene, `coin_${i}`, 18, 18, draw);
    });

    // 4 Animated frames of sparkling crystal
    const crystalFrames = [
      (ctx) => { // Frame 0
        ctx.fillStyle = '#4a154b';
        ctx.beginPath(); ctx.moveTo(10, 1); ctx.lineTo(19, 8); ctx.lineTo(10, 23); ctx.lineTo(1, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath(); ctx.moveTo(10, 3); ctx.lineTo(17, 8); ctx.lineTo(10, 21); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff007a';
        ctx.beginPath(); ctx.moveTo(10, 3); ctx.lineTo(3, 8); ctx.lineTo(10, 21); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(9, 4, 2, 4);
      },
      (ctx) => { // Frame 1
        ctx.fillStyle = '#4a154b';
        ctx.beginPath(); ctx.moveTo(10, 1); ctx.lineTo(19, 8); ctx.lineTo(10, 23); ctx.lineTo(1, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#00ffff';
        ctx.beginPath(); ctx.moveTo(10, 3); ctx.lineTo(17, 8); ctx.lineTo(10, 21); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e040fb';
        ctx.beginPath(); ctx.moveTo(10, 3); ctx.lineTo(3, 8); ctx.lineTo(10, 21); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(11, 6, 3, 3);
      },
      (ctx) => { // Frame 2
        ctx.fillStyle = '#4a154b';
        ctx.beginPath(); ctx.moveTo(10, 1); ctx.lineTo(19, 8); ctx.lineTo(10, 23); ctx.lineTo(1, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#7c4dff';
        ctx.beginPath(); ctx.moveTo(10, 3); ctx.lineTo(17, 8); ctx.lineTo(10, 21); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath(); ctx.moveTo(10, 3); ctx.lineTo(3, 8); ctx.lineTo(10, 21); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(8, 10, 4, 4);
      },
      (ctx) => { // Frame 3
        ctx.fillStyle = '#4a154b';
        ctx.beginPath(); ctx.moveTo(10, 1); ctx.lineTo(19, 8); ctx.lineTo(10, 23); ctx.lineTo(1, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff4081';
        ctx.beginPath(); ctx.moveTo(10, 3); ctx.lineTo(17, 8); ctx.lineTo(10, 21); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#64ffda';
        ctx.beginPath(); ctx.moveTo(10, 3); ctx.lineTo(3, 8); ctx.lineTo(10, 21); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(9, 5, 2, 3);
      }
    ];

    crystalFrames.forEach((draw, i) => {
      this.createCanvasTexture(scene, `crystal_${i}`, 20, 24, draw);
    });

    // Powerup: Magnet (24x24)
    this.createCanvasTexture(scene, 'powerup_magnet', 24, 24, (ctx) => {
      // Glow background badge
      ctx.fillStyle = 'rgba(42, 117, 255, 0.3)';
      ctx.beginPath(); ctx.arc(12, 12, 11, 0, Math.PI * 2); ctx.fill();

      // Horseshoe shape
      ctx.fillStyle = '#ff3366';
      ctx.fillRect(5, 5, 4, 14);
      ctx.fillRect(15, 5, 4, 14);
      ctx.fillRect(5, 14, 14, 5);

      // Silver tips
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(5, 5, 4, 4);
      ctx.fillRect(15, 5, 4, 4);

      // Electric arc
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(9, 6, 6, 2);
    });

    // Powerup: Shield (24x24)
    this.createCanvasTexture(scene, 'powerup_shield', 24, 24, (ctx) => {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.beginPath(); ctx.arc(12, 12, 11, 0, Math.PI * 2); ctx.fill();

      // Shield crest
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(12, 3);
      ctx.lineTo(20, 6);
      ctx.lineTo(18, 17);
      ctx.lineTo(12, 21);
      ctx.lineTo(6, 17);
      ctx.lineTo(4, 6);
      ctx.closePath();
      ctx.fill();

      // Inner emblem
      ctx.fillStyle = '#0a1945';
      ctx.beginPath();
      ctx.moveTo(12, 6);
      ctx.lineTo(17, 8);
      ctx.lineTo(15, 16);
      ctx.lineTo(12, 18);
      ctx.lineTo(9, 16);
      ctx.lineTo(7, 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, 9, 2, 5);
      ctx.fillRect(10, 11, 4, 2);
    });

    // Powerup: Score 2X (24x24)
    this.createCanvasTexture(scene, 'powerup_score2x', 24, 24, (ctx) => {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.beginPath(); ctx.arc(12, 12, 11, 0, Math.PI * 2); ctx.fill();

      // Gold badge
      ctx.fillStyle = '#ffd700';
      ctx.beginPath(); ctx.arc(12, 12, 9, 0, Math.PI * 2); ctx.fill();

      // 2X text
      ctx.fillStyle = '#0a0b1e';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('2X', 12, 13);
    });
  }

  /**
   * Generates Hazards (spikes & plasma orbs)
   */
  static generateHazards(scene) {
    // Spikes (36x18)
    this.createCanvasTexture(scene, 'hazard_spikes', 36, 18, (ctx) => {
      // 3 spikes in a row
      const drawSpike = (startX) => {
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.moveTo(startX, 18);
        ctx.lineTo(startX + 6, 2);
        ctx.lineTo(startX + 12, 18);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#ff8a80';
        ctx.beginPath();
        ctx.moveTo(startX + 6, 3);
        ctx.lineTo(startX + 9, 18);
        ctx.lineTo(startX + 6, 18);
        ctx.closePath();
        ctx.fill();

        // Sharp point
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(startX + 5, 2, 2, 2);
      };

      drawSpike(0);
      drawSpike(12);
      drawSpike(24);

      // Base mount
      ctx.fillStyle = '#5c1020';
      ctx.fillRect(0, 16, 36, 2);
    });

    // Plasma Hazard (24x24, 2 frames)
    this.createCanvasTexture(scene, 'hazard_plasma_0', 24, 24, (ctx) => {
      ctx.fillStyle = 'rgba(255, 0, 100, 0.3)';
      ctx.beginPath(); ctx.arc(12, 12, 11, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#ff0055';
      ctx.beginPath(); ctx.arc(12, 12, 8, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#ff77aa';
      ctx.beginPath(); ctx.arc(12, 12, 4, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, 11, 2, 2);
    });

    this.createCanvasTexture(scene, 'hazard_plasma_1', 24, 24, (ctx) => {
      ctx.fillStyle = 'rgba(255, 100, 0, 0.35)';
      ctx.beginPath(); ctx.arc(12, 12, 11.5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#ff3300';
      ctx.beginPath(); ctx.arc(12, 12, 7.5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#ffaa33';
      ctx.beginPath(); ctx.arc(12, 12, 5, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, 11, 2, 2);
    });
  }

  /**
   * Generates End Portal (48x64, 8 animated vortex frames + beam & shockwave VFX)
   */
  static generatePortal(scene) {
    const angles = [0, 25, 50, 75, 100, 125, 150, 175];
    angles.forEach((angleDeg, frameIdx) => {
      this.createCanvasTexture(scene, `portal_${frameIdx}`, 48, 64, (ctx) => {
        const cx = 24;
        const cy = 32;

        // Outer cosmic aura pulse
        const pulse = Math.sin((frameIdx / 8) * Math.PI * 2) * 2;
        const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 25 + pulse);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.9)');
        grad.addColorStop(0.45, 'rgba(121, 40, 202, 0.65)');
        grad.addColorStop(0.8, 'rgba(255, 0, 122, 0.35)');
        grad.addColorStop(1, 'rgba(10, 11, 30, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 25 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Gateway cosmic obsidian pillars
        ctx.fillStyle = '#0f1430';
        ctx.fillRect(cx - 19, cy - 28, 6, 56);
        ctx.fillRect(cx + 13, cy - 28, 6, 56);
        ctx.fillRect(cx - 15, cy - 30, 30, 6);
        ctx.fillRect(cx - 15, cy + 24, 30, 6);

        // Tech pillar accents
        ctx.fillStyle = '#1c2452';
        ctx.fillRect(cx - 17, cy - 26, 2, 52);
        ctx.fillRect(cx + 15, cy - 26, 2, 52);

        // Pulsing Neon Rune circuit inlays
        const runeGlow = frameIdx % 2 === 0 ? '#00f0ff' : '#ffffff';
        ctx.fillStyle = runeGlow;
        ctx.fillRect(cx - 18, cy - 18, 2, 36);
        ctx.fillRect(cx + 16, cy - 18, 2, 36);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(cx - 18, cy - 26, 4, 3);
        ctx.fillRect(cx + 14, cy - 26, 4, 3);

        // Dual Swirling vortex center
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((angleDeg * Math.PI) / 180);

        // Outer cyan spiral arm
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 1.55);
        ctx.stroke();

        // Inner magenta spiral arm (counter flow)
        ctx.strokeStyle = '#ff007a';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, Math.PI * 0.45, Math.PI * 1.95);
        ctx.stroke();

        // Radiant white-gold core star
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -2, 4, 4);
        ctx.fillStyle = '#ffea00';
        ctx.fillRect(-1, -1, 2, 2);

        ctx.restore();
      });
    });

    // Vertical Starlight Pillar Beacon (36x140)
    this.createCanvasTexture(scene, 'portal_beam', 36, 140, (ctx) => {
      const grad = ctx.createLinearGradient(0, 140, 0, 0);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0.7)');
      grad.addColorStop(0.25, 'rgba(121, 40, 202, 0.5)');
      grad.addColorStop(0.7, 'rgba(0, 240, 255, 0.25)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(6, 0, 24, 140);

      // Core concentrated light laser line
      const coreGrad = ctx.createLinearGradient(0, 140, 0, 0);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, '#00f0ff');
      coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(16, 0, 4, 140);
    });

    // Expanding Cosmic Warp Shockwave Ring (72x72)
    this.createCanvasTexture(scene, 'portal_shockwave', 72, 72, (ctx) => {
      ctx.save();
      ctx.translate(36, 36);

      // Outer wave crest
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 31, 0, Math.PI * 2);
      ctx.stroke();

      // Inner refraction ring
      ctx.strokeStyle = '#ff007a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.stroke();

      // Soft radiant filler
      const grad = ctx.createRadialGradient(0, 0, 12, 0, 0, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
      grad.addColorStop(0.5, 'rgba(0, 240, 255, 0.35)');
      grad.addColorStop(1, 'rgba(121, 40, 202, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 31, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // Floating Gateway Tech Rune (16x16)
    this.createCanvasTexture(scene, 'portal_rune', 16, 16, (ctx) => {
      ctx.save();
      ctx.translate(8, 8);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-5, -5, 10, 10);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();
    });
  }

  /**
   * Generates Particle & Overlay VFX textures
   */
  static generateVFX(scene) {
    // Sparkle particle (8x8)
    this.createCanvasTexture(scene, 'particle_sparkle', 8, 8, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, 0, 2, 8);
      ctx.fillRect(0, 3, 8, 2);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(2, 2, 4, 4);
    });

    // Dust particle (8x8)
    this.createCanvasTexture(scene, 'particle_dust', 8, 8, (ctx) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath(); ctx.arc(4, 4, 3, 0, Math.PI * 2); ctx.fill();
    });

    // Shield Aura Overlay (36x36)
    this.createCanvasTexture(scene, 'shield_aura', 36, 36, (ctx) => {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(18, 18, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.beginPath(); ctx.arc(18, 18, 15, 0, Math.PI * 2); ctx.fill();
    });

    // Magnet Aura Ring (36x36)
    this.createCanvasTexture(scene, 'magnet_aura', 36, 36, (ctx) => {
      ctx.strokeStyle = '#2a75ff';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(18, 18, 16, 0, Math.PI * 2); ctx.stroke();
    });

    // Kamui / Black Hole Vortex Spiral (96x96)
    this.createCanvasTexture(scene, 'vortex_kamui', 96, 96, (ctx) => {
      const cx = 48, cy = 48;
      ctx.translate(cx, cy);

      // Outer event horizon glow
      const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, 46);
      grad.addColorStop(0, 'rgba(5, 2, 18, 0.95)');
      grad.addColorStop(0.35, 'rgba(121, 40, 202, 0.75)');
      grad.addColorStop(0.7, 'rgba(0, 240, 255, 0.45)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 46, 0, Math.PI * 2);
      ctx.fill();

      // Spiral Kamui arms (4 spiral curves curving inward toward the singularity)
      const colors = ['#00f0ff', '#7928ca', '#ff007a', '#2a75ff'];
      for (let arm = 0; arm < 4; arm++) {
        const baseAngle = (arm * Math.PI) / 2;
        ctx.strokeStyle = colors[arm];
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let r = 8; r < 44; r += 2) {
          const theta = baseAngle + Math.pow(r / 10, 1.35);
          const x = r * Math.cos(theta);
          const y = r * Math.sin(theta);
          if (r === 8) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Dark Singularity Core (Black Hole eye)
      ctx.fillStyle = '#030108';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Glowing singularity rim
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.stroke();

      ctx.translate(-cx, -cy);
    });

    // Singularity Shockwave Ring (64x64)
    this.createCanvasTexture(scene, 'vortex_shockwave', 64, 64, (ctx) => {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(32, 32, 28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#ff007a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(32, 32, 22, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Singularity Energy Particle (8x8)
    this.createCanvasTexture(scene, 'particle_singularity', 8, 8, (ctx) => {
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(2, 0, 4, 8);
      ctx.fillRect(0, 2, 8, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 2, 4, 4);
    });

    // ========================================================================
    // ACCESSORY TEXTURES (Crafted to Match & Synergize with Robots)
    // ========================================================================

    // 1. Photon Wings - 4 Animated Flap Frames (38x26)
    // Signature match for NOVA (The Stellar Scout) -> Stellar Archangel
    for (let f = 0; f < 4; f++) {
      this.createCanvasTexture(scene, `acc_wings_${f}`, 38, 26, (ctx) => {
        const wingYOffset = f === 0 ? 0 : (f === 1 ? 3 : (f === 2 ? 6 : 2));
        const wingAngle = f === 0 ? -0.22 : (f === 1 ? 0 : (f === 2 ? 0.28 : -0.1));

        // Center High-Tech Cyber Mount (clamps onto robot's upper back)
        ctx.fillStyle = '#0a1026';
        ctx.fillRect(17, 10, 4, 6);
        ctx.fillStyle = '#1e3a8a';
        ctx.fillRect(18, 11, 2, 4);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(18, 12, 2, 2);

        // Left Wing
        ctx.save();
        ctx.translate(18, 12);
        ctx.rotate(wingAngle);
        // Energy feather glow aura
        ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-16, -10 + wingYOffset); ctx.lineTo(-12, 4); ctx.closePath();
        ctx.fill();
        // Tier 1 Upper Plume (Electric Cyan)
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(-16, -10 + wingYOffset, 6, 3);
        ctx.fillRect(-12, -8 + wingYOffset, 6, 4);
        ctx.fillRect(-8, -5 + wingYOffset, 5, 4);
        // Tier 2 Mid Plume (Deep Neon Azure)
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(-14, -6 + wingYOffset, 5, 3);
        ctx.fillRect(-10, -4 + wingYOffset, 5, 4);
        // Tier 3 Lower Plume
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(-11, -2 + wingYOffset, 4, 3);
        // Pure White Core Energy Line
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-14, -9 + wingYOffset, 4, 2);
        ctx.fillRect(-10, -7 + wingYOffset, 4, 2);
        ctx.fillRect(-7, -4 + wingYOffset, 3, 2);
        ctx.restore();

        // Right Wing
        ctx.save();
        ctx.translate(20, 12);
        ctx.rotate(-wingAngle);
        // Energy glow
        ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(16, -10 + wingYOffset); ctx.lineTo(12, 4); ctx.closePath();
        ctx.fill();
        // Tier 1 Upper Plume
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(10, -10 + wingYOffset, 6, 3);
        ctx.fillRect(6, -8 + wingYOffset, 6, 4);
        ctx.fillRect(3, -5 + wingYOffset, 5, 4);
        // Tier 2 Mid Plume
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(9, -6 + wingYOffset, 5, 3);
        ctx.fillRect(5, -4 + wingYOffset, 5, 4);
        // Tier 3 Lower Plume
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(7, -2 + wingYOffset, 4, 3);
        // Pure White Core Energy Line
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, -9 + wingYOffset, 4, 2);
        ctx.fillRect(6, -7 + wingYOffset, 4, 2);
        ctx.fillRect(4, -4 + wingYOffset, 3, 2);
        ctx.restore();
      });
    }

    // 2. Cosmic Halo - 4 Animated Orbit Frames (30x16)
    // Signature match for SOLARIS (The Cosmic Emperor) -> Ascended Solar Deity
    const haloGlintPositions = [
      { gemX: 6, gemY: 10, gemDepth: 1, glintX: 20, glintY: 4 },
      { gemX: 15, gemY: 12, gemDepth: 2, glintX: 22, glintY: 5 },
      { gemX: 24, gemY: 8, gemDepth: 1, glintX: 10, glintY: 4 },
      { gemX: 15, gemY: 4, gemDepth: 0, glintX: 8, glintY: 5 }
    ];

    haloGlintPositions.forEach((pos, f) => {
      this.createCanvasTexture(scene, `acc_halo_${f}`, 30, 16, (ctx) => {
        // Celestial Starlight Aura
        ctx.fillStyle = 'rgba(255, 215, 0, 0.16)';
        ctx.beginPath();
        ctx.ellipse(15, 8, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rear orbit gem (if behind ring)
        if (pos.gemDepth === 0) {
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(pos.gemX - 1, pos.gemY - 1, 3, 3);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(pos.gemX, pos.gemY, 1, 1);
        }

        // Radiant Golden Ring (Primary Halo)
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(15, 8, 12, 5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Inner Luminescent White Corona Ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(15, 8, 11, 4, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Solar Emperor Accent Jewels on Ring Rim
        ctx.fillStyle = '#ff2200';
        ctx.fillRect(4, 7, 2, 2);
        ctx.fillRect(24, 7, 2, 2);

        // Front orbit celestial gem (revolving around ring in 3D perspective)
        if (pos.gemDepth > 0) {
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(pos.gemX - 2, pos.gemY - 2, 4, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(pos.gemX - 1, pos.gemY - 1, 2, 2);
        }

        // Four-point Twinkling Glint
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pos.glintX - 1, pos.glintY - 1, 3, 3);
        ctx.fillRect(pos.glintX, pos.glintY - 2, 1, 5);
        ctx.fillRect(pos.glintX - 2, pos.glintY, 5, 1);
      });
    });
    // Static alias fallback
    this.createCanvasTexture(scene, 'acc_halo', 30, 16, (ctx) => {
      const cvs = scene.textures.get('acc_halo_0').getSourceImage();
      ctx.drawImage(cvs, 0, 0);
    });

    // 3. Cyber Jetpack - 2 Frames (Idle / Overdrive Boost, 24x28)
    // Signature match for BYTE (The Cyber Specialist) -> Cyber Infiltrator
    this.createCanvasTexture(scene, 'acc_jetpack_0', 24, 28, (ctx) => {
      // Alloy chassis frame (brushed titanium)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(5, 2, 14, 15);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 3, 12, 13);
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 4, 10, 11);

      // Nanotech Cyber Circuit Trace (matching BYTE's emerald and lime colors)
      ctx.fillStyle = '#00e676';
      ctx.fillRect(8, 6, 8, 2);
      ctx.fillStyle = '#76ff03';
      ctx.fillRect(11, 8, 2, 5);

      // Status Power LED bar (3 vertical pips)
      ctx.fillStyle = '#00e5ff';
      ctx.fillRect(8, 10, 2, 2);
      ctx.fillRect(8, 13, 2, 1);

      // Chrome Exhaust Nozzles
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(5, 17, 5, 3);
      ctx.fillRect(14, 17, 5, 3);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(6, 17, 3, 1);
      ctx.fillRect(15, 17, 3, 1);

      // Idle pilot plasma sparks
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(6, 20, 3, 3);
      ctx.fillRect(15, 20, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 20, 1, 2);
      ctx.fillRect(16, 20, 1, 2);
    });

    this.createCanvasTexture(scene, 'acc_jetpack_1', 24, 28, (ctx) => {
      // Alloy chassis (overdrive glowing status)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(5, 2, 14, 15);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(6, 3, 12, 13);
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(7, 4, 10, 11);

      // Overdrive circuit glow
      ctx.fillStyle = '#ffeb3b';
      ctx.fillRect(8, 6, 8, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, 8, 2, 5);

      // Chrome Exhaust Nozzles
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(5, 17, 5, 3);
      ctx.fillRect(14, 17, 5, 3);

      // Roaring Overdrive Plasma Flames (Dual Nozzles)
      // Left flame cone
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(4, 20, 7, 7);
      ctx.fillStyle = '#ff5500';
      ctx.fillRect(5, 21, 5, 6);
      ctx.fillStyle = '#ffea00';
      ctx.fillRect(6, 21, 3, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 21, 1, 3);

      // Right flame cone
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(13, 20, 7, 7);
      ctx.fillStyle = '#ff5500';
      ctx.fillRect(14, 21, 5, 6);
      ctx.fillStyle = '#ffea00';
      ctx.fillRect(15, 21, 3, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, 21, 1, 3);
    });

    // 4. Plasma Crown - 4 Animated Frames (24x16)
    // Signature match for VORTEX (The Quantum Champion) -> Quantum Warlord
    const crownGemColors = ['#a855f7', '#d946ef', '#f43f5e', '#c084fc'];
    crownGemColors.forEach((gemColor, f) => {
      this.createCanvasTexture(scene, `acc_crown_${f}`, 24, 16, (ctx) => {
        // Royal Champion Gold Base
        ctx.fillStyle = '#92400e';
        ctx.fillRect(3, 10, 18, 4);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(4, 9, 16, 3);

        // Regal Filigree trim (matching VORTEX void purple accents)
        ctx.fillStyle = '#35084f';
        ctx.fillRect(5, 11, 14, 1);

        // 5 Imperial Spikes
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(4, 4, 2, 5);    // Far Left
        ctx.fillRect(8, 2, 2, 7);    // Mid Left
        ctx.fillRect(11, 0, 2, 9);   // Center Apex
        ctx.fillRect(14, 2, 2, 7);   // Mid Right
        ctx.fillRect(18, 4, 2, 5);   // Far Right

        // Diamond-Tipped Peak Highlights
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, 3, 2, 2);
        ctx.fillRect(8, 1, 2, 2);
        ctx.fillRect(11, 0, 2, 2);
        ctx.fillRect(14, 1, 2, 2);
        ctx.fillRect(18, 3, 2, 2);

        // Pulsating Center Quantum Plasma Gemstone
        ctx.fillStyle = gemColor;
        ctx.fillRect(10, 6, 4, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(11, 6, 2, 1);
        ctx.fillRect(12, 7, 1, 1);

        // Side micro-rubies
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(6, 9, 2, 2);
        ctx.fillRect(16, 9, 2, 2);
      });
    });
    // Static alias
    this.createCanvasTexture(scene, 'acc_crown', 24, 16, (ctx) => {
      const cvs = scene.textures.get('acc_crown_0').getSourceImage();
      ctx.drawImage(cvs, 0, 0);
    });

    // 5. Nebula Cape - 4 Animated Billowing Frames (22x26)
    // Signature match for COMET (The Astral Voyager) -> Astral Knight
    const capeShifts = [
      { shiftX: 0, hemFringe: [0, 1, 0], starX1: 8, starY1: 9, starX2: 13, starY2: 15 },
      { shiftX: -1, hemFringe: [1, 0, 1], starX1: 7, starY1: 10, starX2: 12, starY2: 16 },
      { shiftX: 1, hemFringe: [0, 0, 1], starX1: 9, starY1: 8, starX2: 14, starY2: 14 },
      { shiftX: 0, hemFringe: [1, 1, 0], starX1: 8, starY1: 9, starX2: 13, starY2: 15 }
    ];

    capeShifts.forEach((shift, f) => {
      this.createCanvasTexture(scene, `acc_cape_${f}`, 22, 26, (ctx) => {
        const sx = shift.shiftX;

        // Twin Golden Brooch Clasp at robot's collar
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(7, 1, 8, 3);
        ctx.fillStyle = '#ff007a';
        ctx.fillRect(10, 2, 2, 1);

        // Outer Dark Void Shade (Deep Astral Violet)
        ctx.fillStyle = '#310d54';
        ctx.fillRect(5 + sx, 3, 12, 18);

        // Cosmic Nebula Fabric Body (Vibrant Violet / Purple)
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(6 + sx, 4, 10, 17);

        // Luminous Astral Heart Gradient Band (matching COMET's magenta)
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(7 + sx, 6, 8, 13);
        ctx.fillStyle = '#ff007a';
        ctx.fillRect(9 + sx, 8, 4, 8);

        // Twinkling Star Constellations in the fabric
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(shift.starX1 + sx, shift.starY1, 2, 2);
        ctx.fillRect(shift.starX2 + sx, shift.starY2, 2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(shift.starX1 + sx, shift.starY1, 1, 1);
        ctx.fillRect(shift.starX2 + sx, shift.starY2, 1, 1);

        // Fringed Celestial Hem
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(5 + sx, 21 + shift.hemFringe[0], 3, 3);
        ctx.fillRect(9 + sx, 21 + shift.hemFringe[1], 4, 3);
        ctx.fillRect(14 + sx, 21 + shift.hemFringe[2], 3, 3);
      });
    });

    // ========================================================================
    // ANGEL RESCUE WINGS & PARTICLES (Guard Void Fall Rescue)
    // ========================================================================

    // 1. Angel Wings - Frame 0 (Upstroke / Majestic High Arch, 56x36)
    this.createCanvasTexture(scene, 'angel_wings_0', 56, 36, (ctx) => {
      // Celestial Glow Halo
      const grad = ctx.createRadialGradient(28, 18, 2, 28, 18, 26);
      grad.addColorStop(0, 'rgba(255, 240, 180, 0.6)');
      grad.addColorStop(0.6, 'rgba(255, 215, 0, 0.25)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(28, 18, 26, 0, Math.PI * 2); ctx.fill();

      // Left Wing (Upward Curve)
      ctx.fillStyle = '#fffdf0';
      ctx.beginPath();
      ctx.moveTo(25, 22); ctx.lineTo(8, 4); ctx.lineTo(14, 2); ctx.lineTo(26, 16); ctx.closePath();
      ctx.fill();

      // Feathers layer 1 (Outer brilliant white)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, 3, 5, 5);
      ctx.fillRect(10, 6, 6, 6);
      ctx.fillRect(14, 10, 7, 7);
      ctx.fillRect(18, 15, 6, 6);

      // Feather layer 2 (Golden radiant tips)
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(5, 2, 3, 3);
      ctx.fillRect(8, 1, 3, 3);
      ctx.fillRect(12, 0, 3, 3);
      ctx.fillRect(16, 12, 2, 3);

      // Right Wing (Upward Curve)
      ctx.fillStyle = '#fffdf0';
      ctx.beginPath();
      ctx.moveTo(31, 22); ctx.lineTo(48, 4); ctx.lineTo(42, 2); ctx.lineTo(30, 16); ctx.closePath();
      ctx.fill();

      // Feathers layer 1
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(45, 3, 5, 5);
      ctx.fillRect(40, 6, 6, 6);
      ctx.fillRect(35, 10, 7, 7);
      ctx.fillRect(32, 15, 6, 6);

      // Feather layer 2 (Golden radiant tips)
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(48, 2, 3, 3);
      ctx.fillRect(45, 1, 3, 3);
      ctx.fillRect(41, 0, 3, 3);
      ctx.fillRect(38, 12, 2, 3);

      // Central Divine Brooch / Heart
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(26, 17, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(27, 18, 2, 2);
    });

    // 2. Angel Wings - Frame 1 (Wide Spread / Powerful Lift, 60x36)
    this.createCanvasTexture(scene, 'angel_wings_1', 60, 36, (ctx) => {
      // Glow
      const grad = ctx.createRadialGradient(30, 18, 4, 30, 18, 28);
      grad.addColorStop(0, 'rgba(255, 245, 200, 0.7)');
      grad.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(30, 18, 28, 0, Math.PI * 2); ctx.fill();

      // Left Wing (Wide Spread)
      ctx.fillStyle = '#fffdf0';
      ctx.beginPath();
      ctx.moveTo(27, 20); ctx.lineTo(2, 8); ctx.lineTo(14, 22); ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 7, 7, 6);
      ctx.fillRect(8, 10, 8, 7);
      ctx.fillRect(16, 14, 8, 7);

      ctx.fillStyle = '#ffd700';
      ctx.fillRect(1, 6, 4, 3);
      ctx.fillRect(6, 8, 4, 3);
      ctx.fillRect(12, 11, 4, 3);

      // Right Wing (Wide Spread)
      ctx.fillStyle = '#fffdf0';
      ctx.beginPath();
      ctx.moveTo(33, 20); ctx.lineTo(58, 8); ctx.lineTo(46, 22); ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(51, 7, 7, 6);
      ctx.fillRect(44, 10, 8, 7);
      ctx.fillRect(36, 14, 8, 7);

      ctx.fillStyle = '#ffd700';
      ctx.fillRect(55, 6, 4, 3);
      ctx.fillRect(50, 8, 4, 3);
      ctx.fillRect(44, 11, 4, 3);

      // Central Brooch
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(28, 17, 4, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(29, 18, 2, 3);
    });

    // 3. Angel Wings - Frame 2 (Downstroke Hover, 56x36)
    this.createCanvasTexture(scene, 'angel_wings_2', 56, 36, (ctx) => {
      // Left Wing (Swept Down)
      ctx.fillStyle = '#fffdf0';
      ctx.beginPath();
      ctx.moveTo(26, 15); ctx.lineTo(8, 28); ctx.lineTo(18, 12); ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 24, 7, 6);
      ctx.fillRect(12, 19, 7, 7);
      ctx.fillRect(17, 14, 7, 6);

      ctx.fillStyle = '#ffd700';
      ctx.fillRect(6, 26, 4, 3);
      ctx.fillRect(11, 21, 4, 3);

      // Right Wing (Swept Down)
      ctx.fillStyle = '#fffdf0';
      ctx.beginPath();
      ctx.moveTo(30, 15); ctx.lineTo(48, 28); ctx.lineTo(38, 12); ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(42, 24, 7, 6);
      ctx.fillRect(37, 19, 7, 7);
      ctx.fillRect(32, 14, 7, 6);

      ctx.fillStyle = '#ffd700';
      ctx.fillRect(46, 26, 4, 3);
      ctx.fillRect(41, 21, 4, 3);

      // Central Brooch
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(26, 16, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(27, 17, 2, 2);
    });

    // 4. Angel Feather Particle (8x8)
    this.createCanvasTexture(scene, 'angel_feather', 8, 8, (ctx) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 0, 4, 3);
      ctx.fillRect(1, 2, 5, 4);
      ctx.fillRect(2, 5, 3, 2);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(3, 1, 1, 5); // Golden quill
    });

    // 5. Divine Halo Aura Burst (48x48)
    this.createCanvasTexture(scene, 'angel_halo_aura', 48, 48, (ctx) => {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(24, 24, 18, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(24, 24, 15, 0, Math.PI * 2);
      ctx.stroke();

      // Radiant 8-point sunburst sparks
      ctx.fillStyle = '#ffffff';
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];
      angles.forEach(deg => {
        const rad = (deg * Math.PI) / 180;
        const x = 24 + Math.cos(rad) * 21;
        const y = 24 + Math.sin(rad) * 21;
        ctx.fillRect(x - 1, y - 1, 3, 3);
      });
    });

    // ========================================================================
    // ADVANCED LEVEL ENTITIES & TRAPS
    // ========================================================================

    // 1. Kinetic Bounce Pad - Idle (32x16)
    this.createCanvasTexture(scene, 'bounce_pad_idle', 32, 16, (ctx) => {
      // Base plate
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 10, 28, 6);
      ctx.fillStyle = '#334155';
      ctx.fillRect(4, 11, 24, 4);

      // Springs
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(8, 6, 4, 5);
      ctx.fillRect(20, 6, 4, 5);

      // Top Launch Plate
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(2, 2, 28, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(4, 3, 24, 3);

      // Glowing Upward Chevrons (▲ ▲)
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(10, 3, 2, 2);
      ctx.fillRect(14, 2, 4, 2);
      ctx.fillRect(20, 3, 2, 2);
    });

    // Kinetic Bounce Pad - Compressed (32x10)
    this.createCanvasTexture(scene, 'bounce_pad_compressed', 32, 10, (ctx) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, 5, 28, 5);
      // Compressed Plate
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(2, 1, 28, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 2, 24, 3);
    });

    // 2. Laser Pylon Emitter Node (20x20)
    this.createCanvasTexture(scene, 'laser_pylon', 20, 20, (ctx) => {
      // Metal casing
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(2, 2, 16, 16);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 4, 12, 12);
      // Emitter crystal lens
      ctx.fillStyle = '#ff0055';
      ctx.beginPath(); ctx.arc(10, 10, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(9, 9, 2, 0, Math.PI * 2); ctx.fill();
    });

    // Laser Beam - Warning Charging (16x16)
    this.createCanvasTexture(scene, 'laser_beam_warn', 16, 16, (ctx) => {
      ctx.fillStyle = 'rgba(255, 170, 0, 0.35)';
      ctx.fillRect(6, 0, 4, 16);
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(7, 2, 2, 4);
      ctx.fillRect(7, 10, 2, 4);
    });

    // Laser Beam - Active Lethal (16x16)
    this.createCanvasTexture(scene, 'laser_beam_active', 16, 16, (ctx) => {
      // Outer intense cyan-magenta glow
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.fillRect(2, 0, 12, 16);
      // Inner electric core
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(5, 0, 6, 16);
      // Searing white center line
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 0, 2, 16);
    });

    // 3. Patrol Sentry Drone - Frame 0 (24x22)
    this.createCanvasTexture(scene, 'drone_fly_0', 24, 22, (ctx) => {
      // Propeller / thruster rings
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(2, 2, 6, 2);
      ctx.fillRect(16, 2, 6, 2);

      // Chassis body
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.arc(12, 11, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.beginPath(); ctx.arc(12, 11, 6, 0, Math.PI * 2); ctx.fill();

      // Cyclops Red Scanner Eye
      ctx.fillStyle = '#ff0055';
      ctx.beginPath(); ctx.arc(12, 11, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, 10, 2, 2);

      // Bottom sensor antenna
      ctx.fillStyle = '#64748b';
      ctx.fillRect(11, 19, 2, 3);
    });

    // Patrol Sentry Drone - Frame 1 (Rotors tilted, 24x22)
    this.createCanvasTexture(scene, 'drone_fly_1', 24, 22, (ctx) => {
      // Propeller alternate
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(3, 1, 5, 2);
      ctx.fillRect(16, 3, 5, 2);

      // Body
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.arc(12, 11, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.beginPath(); ctx.arc(12, 11, 6, 0, Math.PI * 2); ctx.fill();

      // Cyclops Eye flared
      ctx.fillStyle = '#ff0033';
      ctx.beginPath(); ctx.arc(12, 11, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, 9, 2, 2);

      // Antenna
      ctx.fillStyle = '#64748b';
      ctx.fillRect(11, 19, 2, 3);
    });

    // 4. Maglev Conveyor Surface - Frames 0, 1, 2 (32x24)
    [0, 1, 2].forEach(frame => {
      this.createCanvasTexture(scene, `conveyor_${frame}`, 32, 24, (ctx) => {
        // Platform base
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 32, 24);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 4, 32, 20);

        // Conveyor belt track
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, 32, 6);

        // Animated Speed Chevrons (» » »)
        ctx.fillStyle = '#f59e0b';
        const offset = (frame * 6) % 18;
        for (let x = -6 + offset; x < 36; x += 12) {
          ctx.beginPath();
          ctx.moveTo(x, 1);
          ctx.lineTo(x + 4, 3);
          ctx.lineTo(x, 5);
          ctx.lineTo(x + 2, 5);
          ctx.lineTo(x + 6, 3);
          ctx.lineTo(x + 2, 1);
          ctx.closePath();
          ctx.fill();
        }
      });
    });

    // 5. Gravity Distortion Sparkle (8x8)
    this.createCanvasTexture(scene, 'particle_gravity_spark', 8, 8, (ctx) => {
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(3, 0, 2, 8);
      ctx.fillRect(0, 3, 8, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(2, 2, 4, 4);
    });

    // ========================================================================
    // COMICAL LEVEL ENTRANCE: SPACESHIP & DROPSHIP ASSETS
    // ========================================================================

    // 1. Retro Sci-Fi Dropship Shuttle (64x32)
    this.createCanvasTexture(scene, 'spaceship_dropship', 64, 32, (ctx) => {
      // Main Aerodynamic Hull
      ctx.fillStyle = '#1e293b'; // slate dark navy
      ctx.beginPath();
      ctx.moveTo(8, 12);
      ctx.lineTo(24, 6);
      ctx.lineTo(52, 10);
      ctx.lineTo(60, 16);
      ctx.lineTo(52, 24);
      ctx.lineTo(24, 26);
      ctx.lineTo(8, 22);
      ctx.closePath();
      ctx.fill();

      // Upper Hull Light Trim
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(14, 12);
      ctx.lineTo(26, 8);
      ctx.lineTo(48, 12);
      ctx.lineTo(44, 16);
      ctx.lineTo(14, 16);
      ctx.closePath();
      ctx.fill();

      // Lower Chassis Shading
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(16, 20, 32, 6);

      // Delta Winglet & Warning Stripe
      ctx.fillStyle = '#475569';
      ctx.fillRect(4, 14, 10, 6);
      ctx.fillStyle = '#f59e0b'; // amber stripe
      ctx.fillRect(8, 14, 3, 6);

      // Bubble Cockpit Visor Canopy (Front Right)
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.ellipse(48, 15, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Cockpit glare
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(47, 12, 4, 2);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(52, 14, 2, 2);

      // Dual Rear Thruster Engines
      ctx.fillStyle = '#475569';
      ctx.fillRect(2, 8, 8, 6);
      ctx.fillRect(2, 20, 8, 6);
      // Exhaust Nozzles (cyan glow inside)
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(1, 9, 2, 4);
      ctx.fillRect(1, 21, 2, 4);

      // Top Red Beacon Light
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(28, 4, 3, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(29, 4, 1, 1);

      // Ventral Cargo Hatch outline on bottom
      ctx.fillStyle = '#090d16';
      ctx.fillRect(22, 25, 20, 3);
    });

    // 2. Spaceship Cargo Bay Hatch Door (22x6)
    this.createCanvasTexture(scene, 'spaceship_hatch_door', 22, 6, (ctx) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 22, 6);
      // Hazard diagonal yellow stripes
      ctx.fillStyle = '#eab308';
      for (let x = 2; x < 20; x += 5) {
        ctx.fillRect(x, 1, 2, 4);
      }
    });

    // 3. Ion Thruster Exhaust Flame (18x12)
    this.createCanvasTexture(scene, 'spaceship_thruster_flame', 18, 12, (ctx) => {
      // Outer cyan-blue plasma
      ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.beginPath();
      ctx.moveTo(18, 1);
      ctx.lineTo(0, 6);
      ctx.lineTo(18, 11);
      ctx.closePath();
      ctx.fill();

      // Mid bright cyan
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(18, 3);
      ctx.lineTo(4, 6);
      ctx.lineTo(18, 9);
      ctx.closePath();
      ctx.fill();

      // White-hot core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(18, 4);
      ctx.lineTo(9, 6);
      ctx.lineTo(18, 8);
      ctx.closePath();
      ctx.fill();
    });

    // 4. Cartoon Dizzy Star (12x12)
    this.createCanvasTexture(scene, 'cartoon_dizzy_star', 12, 12, (ctx) => {
      // 4-point comic star
      ctx.fillStyle = '#ffd700'; // gold
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(7.5, 4.5);
      ctx.lineTo(12, 6);
      ctx.lineTo(7.5, 7.5);
      ctx.lineTo(6, 12);
      ctx.lineTo(4.5, 7.5);
      ctx.lineTo(0, 6);
      ctx.lineTo(4.5, 4.5);
      ctx.closePath();
      ctx.fill();

      // Sparkle white center
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5, 5, 2, 2);
    });
  }
}


