import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkAABBCollision,
  updatePlayerPhysics,
  updateMovingPlatforms,
  formatTimer,
  PlayerPhysicsState,
  PHYSICS_CONSTANTS,
} from './physics';
import { Platform } from './types';
import {
  QUESTIONS_BANK,
  selectQuestionForSector,
  checkQuestionAnswer,
} from './questionsData';

test('AABB collision correctly detects overlap and separation', () => {
  const boxA = { x: 0, y: 0, width: 30, height: 30 };
  const boxB = { x: 20, y: 20, width: 30, height: 30 };
  const boxC = { x: 100, y: 100, width: 30, height: 30 };

  assert.equal(checkAABBCollision(boxA, boxB), true);
  assert.equal(checkAABBCollision(boxA, boxC), false);
});

test('Landing on top of a solid platform sets isGrounded and stops downward velocity', () => {
  const initialPlayer: PlayerPhysicsState = {
    x: 50,
    y: 64, // bottom at 96, platform at 100
    vx: 0,
    vy: 300,
    width: 24,
    height: 32,
    isGrounded: false,
    facing: 'right',
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    isJumping: false,
    isDead: false,
    scaleX: 1,
    scaleY: 1,
  };

  const platforms = [
    {
      x: 0,
      y: 100,
      width: 200,
      height: 40,
      type: 'solid' as const,
    },
  ];

  const result = updatePlayerPhysics(
    initialPlayer,
    platforms,
    { left: false, right: false, jumpJustPressed: false, jumpHeld: false },
    0.016
  );

  assert.equal(result.player.isGrounded, true);
  assert.equal(result.player.vy, 0);
  assert.equal(result.player.y, 100 - 32); // Snapped right on top
});

test('Hitting a block from underneath triggers onBlockHit and halts upward velocity', () => {
  const jumpingPlayer: PlayerPhysicsState = {
    x: 50,
    y: 108, // top at 108, will move up to ~100
    vx: 0,
    vy: -400, // moving upwards
    width: 24,
    height: 32,
    isGrounded: false,
    facing: 'right',
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    isJumping: true,
    isDead: false,
    scaleX: 1,
    scaleY: 1,
  };

  const blockPlatform: Platform = {
    x: 40,
    y: 70, // bottom at 70 + 36 = 106
    width: 36,
    height: 36,
    type: 'e-block',
  };

  let wasHit = false;
  const result = updatePlayerPhysics(
    jumpingPlayer,
    [blockPlatform],
    { left: false, right: false, jumpJustPressed: false, jumpHeld: true },
    0.02,
    (hitPlat) => {
      wasHit = true;
      assert.equal(hitPlat.type, 'e-block');
    }
  );

  assert.equal(wasHit, true);
  assert.equal(result.player.vy, 0);
  assert.equal(result.player.y, 70 + 36); // Snapped right below the block bottom
});

test('Destroyed platforms are ignored in collision detection', () => {
  const jumpingPlayer: PlayerPhysicsState = {
    x: 50,
    y: 108,
    vx: 0,
    vy: -400,
    width: 24,
    height: 32,
    isGrounded: false,
    facing: 'right',
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    isJumping: true,
    isDead: false,
    scaleX: 1,
    scaleY: 1,
  };

  const destroyedBrick: Platform = {
    x: 40,
    y: 70,
    width: 36,
    height: 36,
    type: 'brick',
    destroyed: true, // Marked as destroyed
  };

  let wasHit = false;
  const result = updatePlayerPhysics(
    jumpingPlayer,
    [destroyedBrick],
    { left: false, right: false, jumpJustPressed: false, jumpHeld: true },
    0.02,
    () => {
      wasHit = true;
    }
  );

  assert.equal(wasHit, false);
  // Player moves right through the destroyed brick without stopping
  assert.ok(result.player.vy < 0);
});

test('Jump initiation applies negative vertical force', () => {
  const groundedPlayer: PlayerPhysicsState = {
    x: 50,
    y: 68,
    vx: 0,
    vy: 0,
    width: 24,
    height: 32,
    isGrounded: true,
    facing: 'right',
    coyoteTimer: 0.1,
    jumpBufferTimer: 0,
    isJumping: false,
    isDead: false,
    scaleX: 1,
    scaleY: 1,
  };

  const platforms = [
    {
      x: 0,
      y: 100,
      width: 200,
      height: 40,
      type: 'solid' as const,
    },
  ];

  const result = updatePlayerPhysics(
    groundedPlayer,
    platforms,
    { left: false, right: false, jumpJustPressed: true, jumpHeld: true },
    0.016
  );

  assert.ok(result.player.vy < 0);
  assert.equal(result.player.isGrounded, false);
});

test('Moving platform carries a player standing on top of it', () => {
  const platform: Platform = {
    x: 100,
    y: 300,
    width: 70,
    height: 22,
    type: 'moving',
    movingProps: {
      axis: 'x',
      range: 50,
      speed: 1,
      originX: 100,
      originY: 300,
    },
  };

  const player: PlayerPhysicsState = {
    x: 110,
    y: 268, // feet exactly on the platform top (268 + 32 = 300)
    vx: 0,
    vy: 0,
    width: 24,
    height: 32,
    isGrounded: true,
    facing: 'right',
    coyoteTimer: 0.1,
    jumpBufferTimer: 0,
    isJumping: false,
    isDead: false,
    scaleX: 1,
    scaleY: 1,
  };

  updateMovingPlatforms([platform], Math.PI / 2, player);

  assert.equal(platform.x, 150);
  assert.equal(player.x, 160);
});

test('Moving platform does not drag a player standing elsewhere', () => {
  const platform: Platform = {
    x: 100,
    y: 300,
    width: 70,
    height: 22,
    type: 'moving',
    movingProps: {
      axis: 'y',
      range: 40,
      speed: 1,
      originX: 100,
      originY: 300,
    },
  };

  const player: PlayerPhysicsState = {
    x: 500,
    y: 100,
    vx: 0,
    vy: 0,
    width: 24,
    height: 32,
    isGrounded: false,
    facing: 'right',
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    isJumping: false,
    isDead: false,
    scaleX: 1,
    scaleY: 1,
  };

  updateMovingPlatforms([platform], Math.PI / 2, player);

  assert.equal(player.x, 500);
  assert.equal(player.y, 100);
  assert.equal(platform.y, 340);
});

test('formatTimer correctly formats seconds to MM:SS', () => {
  assert.equal(formatTimer(240), '04:00');
  assert.equal(formatTimer(120), '02:00');
  assert.equal(formatTimer(30), '00:30');
  assert.equal(formatTimer(5), '00:05');
  assert.equal(formatTimer(0), '00:00');
});

test('Questions bank contains all 10 verified questions with valid answers', () => {
  assert.equal(QUESTIONS_BANK.length, 10);
  for (const q of QUESTIONS_BANK) {
    assert.ok(q.id >= 1 && q.id <= 10);
    assert.equal(q.options.length, 3);
    assert.ok(['A', 'B', 'C'].includes(q.correctAnswer));
    assert.ok(q.question.length > 10);
  }
});

test('checkQuestionAnswer returns correct result for Question 1', () => {
  const correctCheck = checkQuestionAnswer(1, 'A');
  assert.equal(correctCheck.isCorrect, true);

  const wrongCheck = checkQuestionAnswer(1, 'B');
  assert.equal(wrongCheck.isCorrect, false);
});

test('selectQuestionForSector selects questions based on difficulty', () => {
  const qEasy = selectQuestionForSector('facil');
  assert.ok(qEasy.id >= 1 && qEasy.id <= 10);

  const qHard = selectQuestionForSector('dificil');
  assert.ok(qHard.id >= 1 && qHard.id <= 10);
});
