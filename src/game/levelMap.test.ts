import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FLOOR_Y,
  generateLevel,
  getSectorForX,
  SECTOR_STARTS,
} from './levelMap';

test('getSectorForX maps every world boundary to the correct sector', () => {
  assert.equal(getSectorForX(0).id, 1);
  assert.equal(getSectorForX(SECTOR_STARTS[1] - 1).id, 1);
  assert.equal(getSectorForX(SECTOR_STARTS[1]).id, 2);
  assert.equal(getSectorForX(SECTOR_STARTS[2] - 1).id, 2);
  assert.equal(getSectorForX(SECTOR_STARTS[2]).id, 3);
  assert.equal(getSectorForX(SECTOR_STARTS[3] - 1).id, 3);
  assert.equal(getSectorForX(SECTOR_STARTS[3]).id, 4);
  assert.equal(getSectorForX(10300).id, 4);
});

test('The level contains four ordered checkpoints and a reachable flagpole', () => {
  const level = generateLevel();

  assert.equal(level.checkpoints.length, 4);
  assert.deepEqual(
    level.checkpoints.map((checkpoint) => checkpoint.sector),
    [1, 2, 3, 4]
  );

  for (let index = 1; index < level.checkpoints.length; index++) {
    assert.ok(
      level.checkpoints[index].x > level.checkpoints[index - 1].x,
      'checkpoints must be ordered from left to right'
    );
  }

  const lastCheckpoint = level.checkpoints[level.checkpoints.length - 1];
  assert.ok(level.flagpole.x > lastCheckpoint.x);
  assert.ok(level.worldWidth > level.flagpole.x + 200);
});

test('Start, checkpoints and flagpole all stand on solid ground', () => {
  const level = generateLevel();
  const floorSegments = level.platforms.filter(
    (platform) => platform.type === 'solid' && platform.y === FLOOR_Y
  );

  const hasFloorAt = (x: number) =>
    floorSegments.some(
      (segment) => x >= segment.x && x <= segment.x + segment.width
    );

  assert.ok(hasFloorAt(60), 'spawn point must be on a floor');
  for (const checkpoint of level.checkpoints) {
    assert.ok(
      hasFloorAt(checkpoint.x + checkpoint.width / 2),
      `checkpoint ${checkpoint.sector} must be on a floor`
    );
  }
  assert.ok(hasFloorAt(level.flagpole.x + level.flagpole.width / 2));
});

test('Every gap between floor segments is covered by a hazard pit', () => {
  const level = generateLevel();
  const floors = level.platforms
    .filter((platform) => platform.type === 'solid' && platform.y === FLOOR_Y)
    .sort((a, b) => a.x - b.x);
  const hazards = level.platforms.filter((platform) => platform.type === 'hazard');

  for (let index = 1; index < floors.length; index++) {
    const previous = floors[index - 1];
    const next = floors[index];
    const gapStart = previous.x + previous.width;
    const gapEnd = next.x;
    if (gapEnd <= gapStart) continue;

    const covered = hazards.some(
      (hazard) =>
        hazard.x <= gapStart + 1 && hazard.x + hazard.width >= gapEnd - 1
    );
    assert.ok(
      covered,
      `gap between x=${gapStart} and x=${gapEnd} has no hazard or floor`
    );
  }
});

test('All moving platforms have valid movement configuration', () => {
  const level = generateLevel();
  const movingPlatforms = level.platforms.filter(
    (platform) => platform.type === 'moving'
  );

  assert.ok(movingPlatforms.length >= 3);
  for (const platform of movingPlatforms) {
    assert.ok(platform.movingProps, 'moving platform needs movingProps');
    assert.ok(platform.movingProps!.range > 0);
    assert.notEqual(platform.movingProps!.speed, 0);
    assert.equal(platform.x, platform.movingProps!.originX);
    assert.equal(platform.y, platform.movingProps!.originY);
  }
});

test('The level contains collectibles and breakable/gift blocks', () => {
  const level = generateLevel();
  assert.ok(level.collectibles.length > 0);
  assert.ok(level.platforms.some((platform) => platform.type === 'brick'));
  assert.ok(level.platforms.some((platform) => platform.type === 'e-block'));
});

test('Every collectible is low enough to be reached with a normal jump', () => {
  const level = generateLevel();
  // The jump apex is ~117px; 160px leaves room for the player's 24px chip
  // hitbox while rejecting chips floating over tall decorative rows.
  const lowestReachableY = FLOOR_Y - 160;

  for (const item of level.collectibles) {
    assert.ok(
      item.y >= lowestReachableY,
      `collectible ${item.id} at y=${item.y} is above the normal jump range`
    );
  }
});
