import { CHARACTERS } from './charactersData';
import { getSectorForX } from './levelMap';
import { CharacterId, CheckpointGate, CollectibleItem, Flagpole, Platform, PoppingPhone } from './types';
import { PlayerPhysicsState } from './physics';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export class GameRenderer {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private poppingPhones: (PoppingPhone & { rotationSpeed: number })[] = [];
  private phoneIdCounter = 1;

  public spawnParticles(x: number, y: number, color: string, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        color,
        size: 2 + Math.random() * 3,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
      });
    }
  }

  public spawnFloatingText(x: number, y: number, text: string, color = '#fbbf24') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 0.9,
    });
  }

  /**
   * Spawns 4 shattering brick debris particles flying outward
   */
  public spawnBrickDebris(x: number, y: number) {
    const debris = [
      { vx: -130, vy: -300 },
      { vx: 130, vy: -300 },
      { vx: -70, vy: -200 },
      { vx: 70, vy: -200 },
    ];
    for (const d of debris) {
      this.particles.push({
        x: x + 16,
        y: y + 16,
        vx: d.vx + (Math.random() - 0.5) * 40,
        vy: d.vy + (Math.random() - 0.5) * 40,
        color: '#b45309',
        size: 6 + Math.random() * 4,
        life: 0.65,
        maxLife: 0.65,
      });
    }
  }

  /**
   * Spawns a disposable phone that pops up from the hit block
   */
  public spawnPoppingPhone(blockX: number, blockY: number) {
    const models: ('flip' | 'candybar' | 'burner')[] = ['burner', 'candybar', 'flip'];
    const colors = ['#1e293b', '#334155', '#1e1b4b', '#475569'];
    const chosenModel = models[Math.floor(Math.random() * models.length)];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];

    this.poppingPhones.push({
      id: this.phoneIdCounter++,
      x: blockX + 18,
      y: blockY - 14,
      vx: (Math.random() - 0.5) * 50,
      vy: -370, // Launch upwards like a Mario coin
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 10,
      life: 0.85,
      maxLife: 0.85,
      collected: false,
      model: chosenModel,
      color: chosenColor,
    });

    // Little electrical / dust burst when exiting block
    this.spawnParticles(blockX + 18, blockY - 8, '#38bdf8', 10);
    this.spawnParticles(blockX + 18, blockY - 8, '#f59e0b', 8);
  }

  public updateEffects(dt: number, platforms?: Platform[]) {
    // Update platform bump animations
    if (platforms) {
      for (const plat of platforms) {
        if (plat.bumpOffsetY && plat.bumpOffsetY < 0) {
          plat.bumpOffsetY += 80 * dt;
          if (plat.bumpOffsetY > 0) plat.bumpOffsetY = 0;
        }
      }
    }

    // Update popping phones
    for (let i = this.poppingPhones.length - 1; i >= 0; i--) {
      const phone = this.poppingPhones[i];
      phone.x += phone.vx * dt;
      phone.y += phone.vy * dt;
      phone.vy += 850 * dt; // Gravity
      phone.rotation += phone.rotationSpeed * dt;
      phone.life -= dt;

      // Spawn subtle sparkles while in flight
      if (Math.random() < 0.3) {
        this.spawnParticles(phone.x, phone.y, '#fef08a', 1);
      }

      if (phone.life <= 0) {
        // Collect fanfare text when phone reaches end of arc
        this.spawnParticles(phone.x, phone.y, '#4ade80', 12);
        this.spawnFloatingText(phone.x, phone.y - 10, '📱 +250 TELÉFONO RECICLADO', '#4ade80');
        this.poppingPhones.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt; // gravity
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 45 * dt;
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  /**
   * Main render method
   */
  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraX: number,
    cameraY: number,
    scale: number,
    player: PlayerPhysicsState,
    characterId: CharacterId,
    platforms: Platform[],
    collectibles: CollectibleItem[],
    checkpoints: CheckpointGate[],
    flagpole: Flagpole,
    gameTime: number,
    invincibleTimer: number
  ) {
    // Scale the logical viewport to the physical canvas (keeps the whole level
    // visible on both desktop and short mobile screens).
    ctx.save();
    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Parallax Background based on sector
    this.drawBackground(ctx, width, height, cameraX, gameTime);

    ctx.save();
    // Apply camera translation
    ctx.translate(-Math.floor(cameraX), -Math.floor(cameraY));

    // 2. Draw Obstacles & Platforms
    for (const plat of platforms) {
      if (plat.destroyed) continue;
      // Cull offscreen platforms
      if (plat.x + plat.width < cameraX - 100 || plat.x > cameraX + width + 100) {
        continue;
      }
      this.drawPlatform(ctx, plat, gameTime);
    }

    // 3. Draw Checkpoint Gates
    for (const cp of checkpoints) {
      this.drawCheckpointGate(ctx, cp, gameTime);
    }

    // 4. Draw Flagpole and Eco-Sanctuary Castle
    this.drawFlagpoleAndCastle(ctx, flagpole, gameTime);

    // 5. Draw Collectible E-Waste Chips
    for (const item of collectibles) {
      if (item.collected) continue;
      if (item.x + item.width < cameraX - 50 || item.x > cameraX + width + 50) continue;
      this.drawCollectible(ctx, item, gameTime);
    }

    // 6. Draw Popping Disposable Phones from hit blocks
    this.drawPoppingPhones(ctx);

    // 7. Draw Player (with flicker if recently hurt/respawned)
    const shouldDrawPlayer = invincibleTimer <= 0 || Math.floor(invincibleTimer * 20) % 2 === 0;
    if (shouldDrawPlayer && !player.isDead) {
      this.drawPlayer(ctx, player, characterId, gameTime);
    }

    // 8. Draw Particles and Floating Texts
    this.drawParticles(ctx);
    this.drawFloatingTexts(ctx);

    ctx.restore();
    ctx.restore();
  }

  /**
   * Multi-layer Parallax Background with atmospheric sector shifts
   */
  private drawBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    cameraX: number,
    time: number
  ) {
    // Choose the sector visible at the centre of the viewport so the
    // transition happens when the player crosses the boundary.
    const currentSector = getSectorForX(cameraX + width / 2);

    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, currentSector.skyColor);
    skyGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Distant Clouds (Parallax 0.15)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    for (let i = 0; i < 8; i++) {
      const cx = ((i * 320 - cameraX * 0.15 + time * 12) % (width + 400)) - 100;
      const cy = 40 + (i % 3) * 35;
      this.drawPixelCloud(ctx, cx, cy);
    }

    // Distant Backdrop Silhouette (Parallax 0.3)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    const backdropOffset = -(cameraX * 0.3) % 400;
    for (let x = backdropOffset - 400; x < width + 400; x += 180) {
      if (cameraX < 2400) {
        // City skyline buildings
        ctx.fillRect(x, height - 260, 140, 180);
        // Neon tech billboard
        ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
        ctx.fillRect(x + 20, height - 230, 40, 20);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      } else if (cameraX < 5000) {
        // Junkyard mountains of tech
        ctx.beginPath();
        ctx.moveTo(x, height - 80);
        ctx.lineTo(x + 90, height - 220);
        ctx.lineTo(x + 180, height - 80);
        ctx.fill();
      } else if (cameraX < 7600) {
        // Conduit pipes
        ctx.fillRect(x, height - 240, 40, 160);
        ctx.fillRect(x + 60, height - 190, 80, 110);
      } else {
        // Modern wind turbines / clean solar facility
        ctx.fillRect(x + 40, height - 270, 12, 190);
        ctx.beginPath();
        ctx.arc(x + 46, height - 270, 36, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fill();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      }
    }
  }

  private drawPixelCloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillRect(x + 16, y, 48, 16);
    ctx.fillRect(x, y + 12, 80, 20);
    ctx.fillRect(x + 28, y + 28, 32, 8);
  }

  /**
   * Platform and Block Rendering
   */
  private drawPlatform(ctx: CanvasRenderingContext2D, plat: Platform, time: number) {
    const { x, y, width, height, type, hit } = plat;
    const renderY = plat.y + (plat.bumpOffsetY || 0);
    const sector = getSectorForX(x + width / 2);

    switch (type) {
      case 'solid':
      case 'stair': {
        // Classic stone/brick floor with pixel bevel, themed per sector
        ctx.fillStyle = sector.groundColor;
        ctx.fillRect(x, renderY, width, height);

        // Top pavement / vegetation border
        ctx.fillStyle = sector.blockColor;
        ctx.fillRect(x, renderY, width, 6);

        // Grid brick texture
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = 2;
        for (let bx = 0; bx < width; bx += 32) {
          ctx.strokeRect(x + bx, renderY + 6, 32, 26);
        }
        break;
      }

      case 'brick': {
        // Classic breakable Mario brick block
        ctx.fillStyle = hit ? sector.groundColor : sector.blockColor;
        ctx.fillRect(x, renderY, width, height);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, renderY, width, height);

        // Inner brick seam lines
        ctx.beginPath();
        ctx.moveTo(x, renderY + height / 2);
        ctx.lineTo(x + width, renderY + height / 2);
        ctx.moveTo(x + width / 2, renderY);
        ctx.lineTo(x + width / 2, renderY + height / 2);
        ctx.stroke();

        // Top highlight
        ctx.fillStyle = hit ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(x + 2, renderY + 2, width - 4, 3);
        break;
      }

      case 'e-block': {
        if (hit) {
          // Empty depleted block (like Mario empty brown block)
          ctx.fillStyle = '#78350f';
          ctx.fillRect(x, renderY, width, height);

          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, renderY, width, height);

          // 4 corner rivets
          ctx.fillStyle = '#451a03';
          ctx.fillRect(x + 4, renderY + 4, 3, 3);
          ctx.fillRect(x + width - 7, renderY + 4, 3, 3);
          ctx.fillRect(x + 4, renderY + height - 7, 3, 3);
          ctx.fillRect(x + width - 7, renderY + height - 7, 3, 3);
          break;
        }

        // Mystery E-Waste Question / Recycle Block
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x, renderY, width, height);

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, renderY, width, height);

        // 4 corner rivets
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + 4, renderY + 4, 3, 3);
        ctx.fillRect(x + width - 7, renderY + 4, 3, 3);
        ctx.fillRect(x + 4, renderY + height - 7, 3, 3);
        ctx.fillRect(x + width - 7, renderY + height - 7, 3, 3);

        // Pulsing recycling or phone icon
        const pulse = Math.sin(time * 5) * 2;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📱', x + width / 2, renderY + height / 2 + pulse);
        break;
      }

      case 'pipe': {
        // Retro themed Mario Pipe
        ctx.fillStyle = sector.pipeColor;
        ctx.fillRect(x, y, width, height);

        // Pipe rim/collar at top
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(x - 4, y, width + 8, 22);

        // Highlights and shadow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(x + 4, y, 6, height);
        ctx.fillRect(x, y, 6, 22);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + width - 8, y, 8, height);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 4, y, width + 8, 22);
        ctx.strokeRect(x, y + 22, width, height - 22);
        break;
      }

      case 'moving': {
        // Floating high-tech recycling conveyor platform
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(x, y, width, height);

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x + 2, y + 2, width - 4, 3);

        // Blinking indicator lights
        const blink = Math.floor(time * 4) % 2 === 0;
        ctx.fillStyle = blink ? '#4ade80' : '#166534';
        ctx.fillRect(x + 6, y + height - 6, 6, 4);
        ctx.fillRect(x + width - 12, y + height - 6, 6, 4);

        ctx.strokeStyle = '#0c4a6e';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        break;
      }

      case 'spring': {
        // Jump Pad / Super Spring
        ctx.fillStyle = '#ea580c';
        ctx.fillRect(x, y + 6, width, height - 6);

        // Coiled spring
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 4, y + height - 4);
        ctx.lineTo(x + width / 2, y + 2);
        ctx.lineTo(x + width - 4, y + height - 4);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + 2, y, width - 4, 6);
        break;
      }

      case 'hazard': {
        // Toxic corrosive acid sludge pool
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x, y, width, height);

        // Bubbling animated froth
        ctx.fillStyle = '#34d399';
        for (let bx = 0; bx < width; bx += 24) {
          const bubbleY = y + Math.sin(time * 6 + bx) * 6;
          ctx.beginPath();
          ctx.arc(x + bx + 12, bubbleY, 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Acid skull / hazard warning icon
        ctx.fillStyle = '#064e3b';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('☣ ACIDO ☣', x + width / 2, y + 36);
        break;
      }
    }
  }

  /**
   * Checkpoint Gate Terminal at the end of each sector
   */
  private drawCheckpointGate(ctx: CanvasRenderingContext2D, cp: CheckpointGate, time: number) {
    const { x, y, width, height, unlocked, sector } = cp;

    // Terminal side pillars
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 8, y, 16, height);
    ctx.fillRect(x + width - 8, y, 16, height);

    // Arch header
    ctx.fillStyle = unlocked ? '#10b981' : '#f59e0b';
    ctx.fillRect(x - 8, y, width + 16, 28);

    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`SECTOR ${sector}`, x + width / 2, y + 18);

    if (!unlocked) {
      // Locked laser barrier
      const laserAlpha = 0.5 + Math.sin(time * 8) * 0.35;
      ctx.fillStyle = `rgba(239, 68, 68, ${laserAlpha})`;
      ctx.fillRect(x + 8, y + 28, width - 16, height - 28);

      // Lock icon
      ctx.fillStyle = '#fef08a';
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.fillText('🔒', x + width / 2, y + height / 2 + 10);

      // Floating text prompt
      ctx.fillStyle = '#fde047';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.fillText('CHECKPOINT', x + width / 2, y - 12);
    } else {
      // Unlocked green eco-portal
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.fillRect(x + 8, y + 28, width - 16, height - 28);

      ctx.fillStyle = '#4ade80';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.fillText('✓ OK', x + width / 2, y + height / 2 + 10);
    }
  }

  /**
   * Flagpole and Eco-Sanctuary Castle
   */
  private drawFlagpoleAndCastle(ctx: CanvasRenderingContext2D, fp: Flagpole, time: number) {
    // 1. Flagpole
    ctx.fillStyle = '#e2e8f0'; // Metallic silver pole
    ctx.fillRect(fp.x, fp.y, fp.width, fp.height);

    // Golden top finial sphere
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(fp.x + fp.width / 2, fp.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // 2. The Descending Green Recycling Flag
    const flagWidth = 44;
    const flagHeight = 28;
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(fp.x + fp.width, fp.flagY);
    ctx.lineTo(fp.x + fp.width + flagWidth, fp.flagY + flagHeight / 2);
    ctx.lineTo(fp.x + fp.width, fp.flagY + flagHeight);
    ctx.closePath();
    ctx.fill();

    // Recycling triangle symbol on flag
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillText('♻', fp.x + fp.width + 12, fp.flagY + 18);

    // 3. Castle / Eco-Sanctuary Hub
    const castleX = fp.x + 100;
    const castleY = fp.y + 60;
    const castleW = 160;
    const castleH = 200;

    // Castle Base
    ctx.fillStyle = '#065f46';
    ctx.fillRect(castleX, castleY, castleW, castleH);

    // Castle crenellations (battlements)
    ctx.fillStyle = '#047857';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(castleX + i * 42, castleY - 20, 28, 20);
    }

    // Castle Roof Flag
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(castleX + 76, castleY - 60, 4, 40);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(castleX + 80, castleY - 60, 24, 16);

    // Doorway / Portal
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.roundRect(castleX + 55, castleY + 110, 50, 90, [25, 25, 0, 0]);
    ctx.fill();

    // Facility Sign
    ctx.fillStyle = '#a7f3d0';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PLANTA RECICLAJE', castleX + 80, castleY + 36);
  }

  /**
   * Collectible E-Waste Scrap Chip
   */
  private drawCollectible(ctx: CanvasRenderingContext2D, item: CollectibleItem, time: number) {
    const floatY = item.y + Math.sin(time * 6 + item.id) * 4;

    // Green PCB Chip
    ctx.fillStyle = '#15803d';
    ctx.fillRect(item.x, floatY, item.width, item.height);

    // Golden microchip contacts
    ctx.fillStyle = '#facc15';
    ctx.fillRect(item.x + 3, floatY + 3, 4, 4);
    ctx.fillRect(item.x + item.width - 7, floatY + 3, 4, 4);
    ctx.fillRect(item.x + 3, floatY + item.height - 7, 4, 4);
    ctx.fillRect(item.x + item.width - 7, floatY + item.height - 7, 4, 4);

    // Central processor die
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(item.x + 6, floatY + 7, item.width - 12, item.height - 14);

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.strokeRect(item.x, floatY, item.width, item.height);
  }

  /**
   * Authentic Pixel-Art Mario style protagonist sprite
   */
  private drawPlayer(
    ctx: CanvasRenderingContext2D,
    player: PlayerPhysicsState,
    characterId: CharacterId,
    time: number
  ) {
    const char = CHARACTERS[characterId];
    const { x, y, width, height, facing, isGrounded, vx, scaleX, scaleY } = player;

    ctx.save();
    // Center origin for squash and stretch
    ctx.translate(x + width / 2, y + height);
    ctx.scale(scaleX, scaleY);
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }
    ctx.translate(-width / 2, -height);

    const isRunning = isGrounded && Math.abs(vx) > 10;
    const runFrame = isRunning ? Math.floor(time * 10) % 3 : 0;

    // Cap / Hair
    ctx.fillStyle = char.primaryColor;
    ctx.fillRect(4, 0, 18, 7); // Cap visor & crown
    ctx.fillRect(10, 4, 14, 4); // Visor brim

    // Hair under cap
    ctx.fillStyle = '#451a03';
    ctx.fillRect(2, 6, 6, 6);

    // Face / Skin
    ctx.fillStyle = '#fcd34d'; // Retro skin tone
    ctx.fillRect(6, 6, 14, 10);

    // Eye
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(15, 8, 3, 4);

    // Mustache or smile
    ctx.fillStyle = '#451a03';
    ctx.fillRect(14, 13, 5, 2);

    // Shirt
    ctx.fillStyle = char.primaryColor;
    ctx.fillRect(4, 16, 16, 7);

    // Overalls (Secondary color)
    ctx.fillStyle = char.secondaryColor;
    ctx.fillRect(6, 20, 12, 8);

    // Suspenders / Overall buttons
    ctx.fillStyle = '#facc15';
    ctx.fillRect(7, 21, 2, 2);
    ctx.fillRect(15, 21, 2, 2);

    // Legs / Boots
    ctx.fillStyle = '#78350f'; // Boots
    if (!isGrounded) {
      // Jump Pose: Legs tucked / one extended
      ctx.fillRect(4, 28, 6, 4);
      ctx.fillRect(14, 26, 7, 5);
      // Jumping arm raised
      ctx.fillStyle = char.primaryColor;
      ctx.fillRect(2, 12, 4, 6);
    } else if (isRunning) {
      if (runFrame === 0) {
        ctx.fillRect(2, 28, 8, 4);
        ctx.fillRect(14, 28, 8, 4);
      } else if (runFrame === 1) {
        ctx.fillRect(5, 28, 6, 4);
        ctx.fillRect(12, 28, 6, 4);
      } else {
        ctx.fillRect(8, 28, 8, 4);
        ctx.fillRect(2, 28, 6, 4);
      }
    } else {
      // Idle Standing Pose
      ctx.fillRect(4, 28, 7, 4);
      ctx.fillRect(13, 28, 7, 4);
    }

    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1.0;
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D) {
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      const alpha = Math.min(1, ft.life / 0.4);
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = alpha;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1.0;
  }

  /**
   * Renders disposable phones popping up from blocks
   */
  private drawPoppingPhones(ctx: CanvasRenderingContext2D) {
    for (const phone of this.poppingPhones) {
      ctx.save();
      ctx.translate(Math.floor(phone.x), Math.floor(phone.y));
      ctx.rotate(phone.rotation);

      // Glowing aura
      ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      // Outer phone body (Chassis)
      ctx.fillStyle = phone.color;
      ctx.fillRect(-7, -13, 14, 26);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-7, -13, 14, 26);

      // Antenna on top
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-5, -19, 2.5, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-6, -20, 4.5, 2);

      // LCD Screen (retro monochrome green or cyan)
      ctx.fillStyle = '#86efac';
      ctx.fillRect(-5, -10, 10, 8);

      // LCD screen text / battery / signal bar dots
      ctx.fillStyle = '#14532d';
      ctx.fillRect(-4, -9, 3, 2);
      ctx.fillRect(1, -9, 3, 2);
      ctx.fillRect(-3, -5, 6, 1);

      // Keypad button grid (3x3 number pad)
      ctx.fillStyle = '#cbd5e1';
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillRect(-5 + col * 4, 1 + row * 3, 2, 2);
        }
      }

      // Green Call and Red End Keys
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-5, -1, 3, 1.5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(2, -1, 3, 1.5);

      ctx.restore();
    }
  }
}
