import { Platform, Rect } from './types';

export interface PlayerPhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  facing: 'left' | 'right';
  coyoteTimer: number; // seconds remaining to allow jump after leaving ground
  jumpBufferTimer: number; // seconds remaining for early jump input
  isJumping: boolean;
  isDead: boolean;
  scaleX: number;
  scaleY: number;
}

export const PHYSICS_CONSTANTS = {
  GRAVITY: 1250, // pixels/s^2
  MAX_FALL_SPEED: 700,
  MOVE_SPEED: 260, // pixels/s
  ACCELERATION: 1600,
  FRICTION: 1200,
  JUMP_FORCE: -540,
  SPRING_FORCE: -780,
  COYOTE_TIME: 0.1, // seconds
  JUMP_BUFFER: 0.12, // seconds
  VARIABLE_JUMP_CUT: 0.45,
};

/**
 * Axis-Aligned Bounding Box (AABB) intersection check
 */
export function checkAABBCollision(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Updates player physics for a frame with delta time dt (clamped)
 */
export function updatePlayerPhysics(
  player: PlayerPhysicsState,
  platforms: Platform[],
  input: { left: boolean; right: boolean; jumpJustPressed: boolean; jumpHeld: boolean },
  dt: number,
  onBlockHit?: (platform: Platform) => void
): { player: PlayerPhysicsState; hitHazard: boolean; hitSpring: boolean; jumped: boolean } {
  const p = { ...player };
  let hitHazard = false;
  let hitSpring = false;
  let jumped = false;

  // 1. Handle horizontal movement input and friction
  let targetVx = 0;
  if (input.left && !input.right) {
    targetVx = -PHYSICS_CONSTANTS.MOVE_SPEED;
    p.facing = 'left';
  } else if (input.right && !input.left) {
    targetVx = PHYSICS_CONSTANTS.MOVE_SPEED;
    p.facing = 'right';
  }

  if (targetVx !== 0) {
    // Accelerate toward target speed
    if (p.vx < targetVx) {
      p.vx = Math.min(p.vx + PHYSICS_CONSTANTS.ACCELERATION * dt, targetVx);
    } else if (p.vx > targetVx) {
      p.vx = Math.max(p.vx - PHYSICS_CONSTANTS.ACCELERATION * dt, targetVx);
    }
  } else {
    // Apply friction to stop
    if (p.vx > 0) {
      p.vx = Math.max(0, p.vx - PHYSICS_CONSTANTS.FRICTION * dt);
    } else if (p.vx < 0) {
      p.vx = Math.min(0, p.vx + PHYSICS_CONSTANTS.FRICTION * dt);
    }
  }

  // 2. Coyote time & jump buffer management
  if (p.isGrounded) {
    p.coyoteTimer = PHYSICS_CONSTANTS.COYOTE_TIME;
  } else {
    p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
  }

  if (input.jumpJustPressed) {
    p.jumpBufferTimer = PHYSICS_CONSTANTS.JUMP_BUFFER;
  } else {
    p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
  }

  // 3. Initiate Jump if eligible
  const canJump = p.isGrounded || p.coyoteTimer > 0;
  if (p.jumpBufferTimer > 0 && canJump) {
    p.vy = PHYSICS_CONSTANTS.JUMP_FORCE;
    p.isGrounded = false;
    p.coyoteTimer = 0;
    p.jumpBufferTimer = 0;
    p.isJumping = true;
    p.scaleX = 0.82;
    p.scaleY = 1.22;
    jumped = true;
  }

  // Variable jump height cut
  if (!input.jumpHeld && p.vy < -100 && p.isJumping) {
    p.vy *= PHYSICS_CONSTANTS.VARIABLE_JUMP_CUT;
    p.isJumping = false;
  }

  // 4. Gravity
  p.vy = Math.min(p.vy + PHYSICS_CONSTANTS.GRAVITY * dt, PHYSICS_CONSTANTS.MAX_FALL_SPEED);

  // Damp squash and stretch
  p.scaleX += (1 - p.scaleX) * 12 * dt;
  p.scaleY += (1 - p.scaleY) * 12 * dt;

  // 5. Horizontal Integration & Collision
  p.x += p.vx * dt;
  for (const plat of platforms) {
    if (plat.destroyed || plat.type === 'hazard') continue;
    if (checkAABBCollision(p, plat)) {
      if (p.vx > 0) {
        // Collided while moving right
        p.x = plat.x - p.width;
        p.vx = 0;
      } else if (p.vx < 0) {
        // Collided while moving left
        p.x = plat.x + plat.width;
        p.vx = 0;
      }
    }
  }

  // 6. Vertical Integration & Collision
  p.y += p.vy * dt;
  let onGroundThisFrame = false;

  for (const plat of platforms) {
    if (plat.destroyed) continue;
    if (checkAABBCollision(p, plat)) {
      if (plat.type === 'hazard') {
        hitHazard = true;
        continue;
      }

      if (plat.type === 'spring' && p.vy > 0 && p.y + p.height - p.vy * dt <= plat.y + 12) {
        // Bounced on spring!
        p.y = plat.y - p.height;
        p.vy = PHYSICS_CONSTANTS.SPRING_FORCE;
        p.isGrounded = false;
        p.isJumping = true;
        p.scaleX = 0.7;
        p.scaleY = 1.35;
        hitSpring = true;
        continue;
      }

      if (p.vy > 0) {
        // Landing on top of a platform
        // Calculate previous position before vertical delta
        const prevBottom = p.y + p.height - p.vy * dt;
        // Check if player came from above or near the top surface
        if (prevBottom <= plat.y + Math.max(16, p.vy * dt + 4)) {
          p.y = plat.y - p.height;
          p.vy = 0;
          onGroundThisFrame = true;
          p.isJumping = false;
          // Squash slightly on landing if falling fast
          if (player.vy > 250) {
            p.scaleX = 1.2;
            p.scaleY = 0.8;
          }
        }
      } else if (p.vy < 0) {
        // Hitting bottom of a block
        const prevTop = p.y - p.vy * dt;
        if (prevTop >= plat.y + plat.height - 16) {
          p.y = plat.y + plat.height;
          p.vy = 0;
          if (onBlockHit) {
            onBlockHit(plat);
          }
        }
      }
    }
  }

  p.isGrounded = onGroundThisFrame;

  return { player: p, hitHazard, hitSpring, jumped };
}

/**
 * Advances every moving platform to its position for the current game time.
 * If the player is standing on top of one, it is carried along with the platform.
 */
export function updateMovingPlatforms(
  platforms: Platform[],
  gameTime: number,
  player: PlayerPhysicsState
): void {
  for (const plat of platforms) {
    const props = plat.movingProps;
    if (plat.type !== 'moving' || !props) continue;

    const previousX = plat.x;
    const previousY = plat.y;
    const offset = Math.sin(gameTime * props.speed) * props.range;

    plat.x = props.originX + (props.axis === 'x' ? offset : 0);
    plat.y = props.originY + (props.axis === 'y' ? offset : 0);

    const dx = plat.x - previousX;
    const dy = plat.y - previousY;
    if (dx === 0 && dy === 0) continue;

    const standingOnTop =
      Math.abs(player.y + player.height - previousY) <= 4 &&
      player.x + player.width > previousX &&
      player.x < previousX + plat.width;

    if (standingOnTop && player.vy >= 0) {
      player.x += dx;
      player.y += dy;
    }
  }
}

/**
 * Format remaining seconds to MM:SS string
 */
export function formatTimer(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSec / 60);
  const secs = safeSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
