import React, { useEffect, useRef } from 'react';
import { CharacterId, DifficultyId } from '../game/types';
import { FLOOR_Y, generateLevel, getSectorForX, LevelData } from '../game/levelMap';
import {
  checkAABBCollision,
  PlayerPhysicsState,
  updateMovingPlatforms,
  updatePlayerPhysics,
} from '../game/physics';
import { GameRenderer } from '../game/renderer';
import { sound } from '../game/sound';

const DESIGN_HEIGHT = 600;
const MIN_VIEW_WIDTH = 480;
const HUD_REFRESH_SECONDS = 0.1;

interface GameCanvasProps {
  characterId: CharacterId;
  difficultyId: DifficultyId;
  isPaused: boolean;
  onUpdateHUD: (data: {
    score: number;
    chips: number;
    remainingTime: number;
    sector: number;
    lastCheckpoint: number;
  }) => void;
  onTriggerCheckpoint: (sector: number) => void;
  onVictory: (stats: { score: number; chips: number; timeSpent: number }) => void;
  onGameOver: (reason: string) => void;
  initialTime: number;
  touchInput: { left: boolean; right: boolean; jump: boolean };
}

interface CanvasState {
  level: LevelData;
  player: PlayerPhysicsState;
  renderer: GameRenderer;
  cameraX: number;
  cameraInstant: boolean;
  gameTime: number;
  totalPlayTime: number;
  remainingTime: number;
  score: number;
  chipsCount: number;
  lastCheckpointSector: number;
  checkpointRespawnX: number;
  checkpointRespawnY: number;
  invincibleTimer: number;
  flagSequence: boolean;
  inVictory: boolean;
  inGameOver: boolean;
  jumpBuffered: boolean;
  jumpHeld: boolean;
  leftHeld: boolean;
  rightHeld: boolean;
  waitingForCheckpointAnswer: boolean;
  prevTouchJump: boolean;
  lastHudUpdate: number;
}

const createInitialState = (initialTime: number): CanvasState => {
  const level = generateLevel();
  const spawnY = FLOOR_Y - 32;

  return {
    level,
    player: {
      x: 60,
      y: spawnY,
      vx: 0,
      vy: 0,
      width: 24,
      height: 32,
      isGrounded: true,
      facing: 'right',
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      isJumping: false,
      isDead: false,
      scaleX: 1,
      scaleY: 1,
    },
    renderer: new GameRenderer(),
    cameraX: 0,
    cameraInstant: false,
    gameTime: 0,
    totalPlayTime: 0,
    remainingTime: initialTime,
    score: 0,
    chipsCount: 0,
    lastCheckpointSector: 0,
    checkpointRespawnX: 60,
    checkpointRespawnY: spawnY,
    invincibleTimer: 0,
    flagSequence: false,
    inVictory: false,
    inGameOver: false,
    jumpBuffered: false,
    jumpHeld: false,
    leftHeld: false,
    rightHeld: false,
    waitingForCheckpointAnswer: false,
    prevTouchJump: false,
    lastHudUpdate: 0,
  };
};

export const GameCanvas: React.FC<GameCanvasProps> = ({
  characterId,
  difficultyId,
  isPaused,
  onUpdateHUD,
  onTriggerCheckpoint,
  onVictory,
  onGameOver,
  initialTime,
  touchInput,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CanvasState | null>(null);
  const dprRef = useRef(1);

  // Latest props for the 60 Hz loop. Keeping them in refs prevents the loop
  // from being torn down and recreated every time React re-renders.
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const touchInputRef = useRef(touchInput);
  touchInputRef.current = touchInput;

  const characterIdRef = useRef(characterId);
  characterIdRef.current = characterId;

  const initialTimeRef = useRef(initialTime);
  initialTimeRef.current = initialTime;

  const onUpdateHUDRef = useRef(onUpdateHUD);
  onUpdateHUDRef.current = onUpdateHUD;

  const onTriggerCheckpointRef = useRef(onTriggerCheckpoint);
  onTriggerCheckpointRef.current = onTriggerCheckpoint;

  const onVictoryRef = useRef(onVictory);
  onVictoryRef.current = onVictory;

  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  // Initialize / reset the level.
  useEffect(() => {
    stateRef.current = createInitialState(initialTime);
  }, [characterId, difficultyId, initialTime]);

  // Clear held keys when the game is paused so the player does not keep moving.
  useEffect(() => {
    if (!isPaused) return;
    const state = stateRef.current;
    if (!state) return;
    state.leftHeld = false;
    state.rightHeld = false;
    state.jumpHeld = false;
    state.jumpBuffered = false;
    state.prevTouchJump = false;
  }, [isPaused]);

  // Keyboard controls.
  useEffect(() => {
    const isInteractiveTarget = (target: EventTarget | null): boolean => {
      const element = target as HTMLElement | null;
      if (!element) return false;
      return (
        element.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(element.tagName)
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const state = stateRef.current;
      if (
        !state ||
        isPausedRef.current ||
        state.waitingForCheckpointAnswer ||
        state.inVictory ||
        state.inGameOver
      ) {
        return;
      }

      // Let buttons/inputs handle Space and Enter natively.
      if (
        (event.code === 'Space' || event.code === 'Enter') &&
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      let handled = true;
      switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
          state.leftHeld = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          state.rightHeld = true;
          break;
        case 'Space':
        case 'ArrowUp':
        case 'KeyW':
          if (!state.jumpHeld) state.jumpBuffered = true;
          state.jumpHeld = true;
          break;
        default:
          handled = false;
      }

      if (handled) event.preventDefault();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const state = stateRef.current;
      if (!state) return;

      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        state.leftHeld = false;
      } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        state.rightHeld = false;
      } else if (
        event.code === 'Space' ||
        event.code === 'ArrowUp' ||
        event.code === 'KeyW'
      ) {
        state.jumpHeld = false;
      }
    };

    const handleBlur = () => {
      const state = stateRef.current;
      if (!state) return;
      state.leftHeld = false;
      state.rightHeld = false;
      state.jumpHeld = false;
      state.jumpBuffered = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Responsive canvas with device-pixel-ratio support.
  useEffect(() => {
    const resizeCanvas = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssWidth = Math.max(1, container.clientWidth);
      const cssHeight = Math.max(1, container.clientHeight);

      dprRef.current = dpr;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Main game loop.
  useEffect(() => {
    let animationId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      animationId = requestAnimationFrame(loop);

      const rawDelta = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDelta, 0.05);

      const state = stateRef.current;
      const canvas = canvasRef.current;
      if (!state || !canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const dpr = dprRef.current || 1;
      const cssWidth = canvas.width / dpr;
      const cssHeight = canvas.height / dpr;
      if (cssWidth < 1 || cssHeight < 1) return;

      // Never crop the level vertically. On narrow/portrait screens the view
      // keeps at least MIN_VIEW_WIDTH world units visible.
      const viewScale = Math.min(
        cssHeight / DESIGN_HEIGHT,
        cssWidth / MIN_VIEW_WIDTH
      );
      const viewWidth = cssWidth / viewScale;
      const viewHeight = cssHeight / viewScale;
      const cameraY = (DESIGN_HEIGHT - viewHeight) / 2;
      const physicalScale = viewScale * dpr;

      const renderScene = () => {
        context.imageSmoothingEnabled = false;
        state.renderer.render(
          context,
          viewWidth,
          viewHeight,
          state.cameraX,
          cameraY,
          physicalScale,
          state.player,
          characterIdRef.current,
          state.level.platforms,
          state.level.collectibles,
          state.level.checkpoints,
          state.level.flagpole,
          state.gameTime,
          state.invincibleTimer
        );
      };

      // Frozen states: pause, checkpoint question, victory and game over.
      if (
        isPausedRef.current ||
        state.waitingForCheckpointAnswer ||
        state.inVictory ||
        state.inGameOver
      ) {
        renderScene();
        return;
      }

      state.gameTime += dt;
      state.totalPlayTime += dt;

      if (state.invincibleTimer > 0) {
        state.invincibleTimer = Math.max(0, state.invincibleTimer - dt);
      }

      // Per-sector countdown. It does not run during the flag sequence.
      if (!state.flagSequence) {
        state.remainingTime -= dt;
        if (state.remainingTime <= 0) {
          state.remainingTime = 0;
          state.inGameOver = true;
          sound.playGameOver();
          onUpdateHUDRef.current({
            score: state.score,
            chips: state.chipsCount,
            remainingTime: 0,
            sector: getSectorForX(state.player.x).id,
            lastCheckpoint: state.lastCheckpointSector,
          });
          onGameOverRef.current('¡Se agotó el tiempo del sector!');
          renderScene();
          return;
        }
      }

      // Move platforms before physics so the player can ride them.
      updateMovingPlatforms(state.level.platforms, state.gameTime, state.player);

      // Checkpoint gates.
      for (const checkpoint of state.level.checkpoints) {
        if (!checkpoint.unlocked && checkAABBCollision(state.player, checkpoint)) {
          state.player.x = checkpoint.x - state.player.width - 2;
          state.player.vx = 0;
          state.leftHeld = false;
          state.rightHeld = false;
          state.jumpHeld = false;
          state.jumpBuffered = false;
          state.waitingForCheckpointAnswer = true;
          onTriggerCheckpointRef.current(checkpoint.sector);
          renderScene();
          return;
        }
      }

      // Flagpole sequence.
      if (
        !state.flagSequence &&
        checkAABBCollision(state.player, state.level.flagpole)
      ) {
        state.flagSequence = true;
        state.player.x = state.level.flagpole.x - 14;
        state.player.vx = 0;
        state.player.vy = 0;
        sound.playFlagSlide();
      }

      if (state.flagSequence) {
        const flagpole = state.level.flagpole;
        if (flagpole.flagY < flagpole.targetFlagY) {
          flagpole.flagY += 160 * dt;
          state.player.y = flagpole.flagY + 10;
        } else {
          flagpole.flagY = flagpole.targetFlagY;
          state.player.facing = 'right';
          state.player.x += 120 * dt;

          if (state.player.x >= flagpole.x + 130) {
            state.inVictory = true;
            sound.playVictoryFanfare();
            onVictoryRef.current({
              score: state.score + 1000,
              chips: state.chipsCount,
              timeSpent: Math.max(1, state.totalPlayTime),
            });
            renderScene();
            return;
          }
        }
      } else {
        // Normal gameplay.
        const touch = touchInputRef.current;
        const touchJumpPressed = touch.jump && !state.prevTouchJump;
        state.prevTouchJump = touch.jump;

        const left = state.leftHeld || touch.left;
        const right = state.rightHeld || touch.right;
        const jumpHeld = state.jumpHeld || touch.jump;
        const jumpJustPressed = state.jumpBuffered || touchJumpPressed;
        state.jumpBuffered = false;

        const result = updatePlayerPhysics(
          state.player,
          state.level.platforms,
          { left, right, jumpJustPressed, jumpHeld },
          dt,
          (hitBlock) => {
            if (hitBlock.type === 'brick') {
              hitBlock.destroyed = true;
              sound.playBrickBreak();
              state.renderer.spawnBrickDebris(hitBlock.x, hitBlock.y);
              state.score += 50;
              state.renderer.spawnFloatingText(
                hitBlock.x + 18,
                hitBlock.y - 12,
                '+50',
                '#f59e0b'
              );
            } else if (hitBlock.type === 'e-block') {
              if (hitBlock.hit) {
                hitBlock.bumpOffsetY = -4;
                sound.playBlockBump();
                state.renderer.spawnParticles(
                  hitBlock.x + 18,
                  hitBlock.y,
                  '#94a3b8',
                  4
                );
              } else {
                hitBlock.hit = true;
                hitBlock.bumpOffsetY = -12;
                state.renderer.spawnPoppingPhone(hitBlock.x, hitBlock.y);
                sound.playPhonePop();
                state.score += 250;
                state.chipsCount += 1;
              }
            } else {
              hitBlock.bumpOffsetY = -6;
              sound.playBlockBump();
            }
          }
        );

        state.player = result.player;
        // There is no wall at the start of the world; keep the player on the
        // level instead of letting them walk off the left edge.
        state.player.x = Math.max(0, state.player.x);

        if (result.jumped) {
          sound.playJump();
        }

        if (result.hitSpring) {
          sound.playSpring();
          state.renderer.spawnParticles(
            state.player.x + 12,
            state.player.y + 32,
            '#facc15',
            8
          );
        }

        // Hazard or fall out of the world.
        if (
          (result.hitHazard || state.player.y > state.level.worldHeight + 100) &&
          state.invincibleTimer <= 0
        ) {
          sound.playHurt();
          state.renderer.spawnParticles(
            state.player.x + 12,
            state.player.y + 16,
            '#ef4444',
            16
          );
          state.renderer.spawnFloatingText(
            state.player.x + 12,
            state.player.y - 10,
            '¡CUIDADO!',
            '#ef4444'
          );

          state.player.x = state.checkpointRespawnX;
          state.player.y = state.checkpointRespawnY;
          state.player.vx = 0;
          state.player.vy = 0;
          state.player.isGrounded = false;
          state.invincibleTimer = 1.6;
          state.cameraInstant = true;
        }

        // Collectibles.
        for (const item of state.level.collectibles) {
          if (!item.collected && checkAABBCollision(state.player, item)) {
            item.collected = true;
            state.chipsCount += 1;
            state.score += item.value;
            sound.playChipCollect();
            state.renderer.spawnParticles(
              item.x + 10,
              item.y + 10,
              '#34d399',
              8
            );
            state.renderer.spawnFloatingText(
              item.x + 10,
              item.y - 8,
              `+${item.value}`,
              '#4ade80'
            );
          }
        }
      }

      // Camera follow, clamped to the world.
      const maxCameraX = Math.max(0, state.level.worldWidth - viewWidth);
      if (state.cameraInstant) {
        state.cameraX = Math.max(
          0,
          Math.min(state.player.x - viewWidth * 0.35, maxCameraX)
        );
        state.cameraInstant = false;
      } else {
        const targetCameraX = state.player.x - viewWidth * 0.35;
        state.cameraX += (targetCameraX - state.cameraX) * 8 * dt;
        state.cameraX = Math.max(0, Math.min(state.cameraX, maxCameraX));
      }

      state.renderer.updateEffects(dt, state.level.platforms);

      // HUD refresh is throttled so React does not re-render at 60 fps.
      if (state.gameTime - state.lastHudUpdate >= HUD_REFRESH_SECONDS) {
        state.lastHudUpdate = state.gameTime;
        onUpdateHUDRef.current({
          score: state.score,
          chips: state.chipsCount,
          remainingTime: state.remainingTime,
          sector: getSectorForX(state.player.x).id,
          lastCheckpoint: state.lastCheckpointSector,
        });
      }

      renderScene();
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Checkpoint / respawn events from the React question modal.
  useEffect(() => {
    const unlockHandler = (event: Event) => {
      const state = stateRef.current;
      if (!state) return;

      const { sector } = (event as CustomEvent<{ sector: number }>).detail;
      const checkpoint = state.level.checkpoints.find((item) => item.sector === sector);
      if (!checkpoint) return;

      checkpoint.unlocked = true;
      checkpoint.passed = true;
      state.lastCheckpointSector = sector;
      state.checkpointRespawnX = checkpoint.x + checkpoint.width + 30;
      state.checkpointRespawnY = checkpoint.y + checkpoint.height - state.player.height;
      state.player.x = checkpoint.x + checkpoint.width + 20;
      state.player.vx = 0;
      state.player.vy = 0;
      state.waitingForCheckpointAnswer = false;

      // Each sector gets a fresh time budget when its checkpoint is cleared.
      state.remainingTime = initialTimeRef.current;

      state.score += 500;
      state.renderer.spawnFloatingText(
        checkpoint.x + 20,
        checkpoint.y - 20,
        '+500 CHECKPOINT!',
        '#4ade80'
      );
      state.renderer.spawnParticles(
        checkpoint.x + 20,
        checkpoint.y + 40,
        '#22c55e',
        20
      );
    };

    const resetHandler = () => {
      const state = stateRef.current;
      if (!state) return;

      state.player.x = state.checkpointRespawnX;
      state.player.y = state.checkpointRespawnY;
      state.player.vx = 0;
      state.player.vy = 0;
      state.player.isGrounded = false;
      state.waitingForCheckpointAnswer = false;
      state.invincibleTimer = 1.6;
      state.cameraInstant = true;

      // Retrying a checkpoint restores the sector time budget.
      state.remainingTime = initialTimeRef.current;

      state.renderer.spawnFloatingText(
        state.player.x + 40,
        state.player.y - 30,
        '¡VUELVE AL CHECKPOINT!',
        '#ef4444'
      );
      state.renderer.spawnParticles(
        state.player.x + 12,
        state.player.y + 16,
        '#ef4444',
        20
      );
    };

    window.addEventListener('unlock_checkpoint', unlockHandler);
    window.addEventListener('reset_to_checkpoint', resetHandler);

    return () => {
      window.removeEventListener('unlock_checkpoint', unlockHandler);
      window.removeEventListener('reset_to_checkpoint', resetHandler);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-slate-950"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block focus:outline-none"
        tabIndex={0}
        aria-label="Área de juego de Super Eco Bros"
      />
      <div className="portrait-hint pointer-events-none absolute inset-x-4 top-24 z-20 rounded-lg border border-amber-400/60 bg-slate-950/85 px-3 py-2 text-center font-pixel text-[10px] leading-relaxed text-amber-300">
        GIRA TU DISPOSITIVO
        <br />
        <span className="text-[9px] text-slate-300">
          Se juega mejor en horizontal
        </span>
      </div>
    </div>
  );
};
