import { CheckpointGate, CollectibleItem, Flagpole, Platform, SectorConfig } from './types';

export const SECTORS: SectorConfig[] = [
  {
    id: 1,
    name: 'Sector 1',
    subtitle: 'La Ciudad y el Consumo Desmedido',
    description: 'Calles inundadas de publicidad de teléfonos desechables y puntos de venta de un solo uso.',
    skyColor: '#60a5fa', // Bright blue sky
    groundColor: '#78350f', // Warm brick earth
    blockColor: '#b45309', // Classic Mario brick
    pipeColor: '#16a34a',
    hazardName: 'Pozo de Asfalto',
  },
  {
    id: 2,
    name: 'Sector 2',
    subtitle: 'El Vertedero Clandestino de E-Waste',
    description: 'Montañas de chatarra electrónica, baterías infladas y vapores tóxicos de cadmio.',
    skyColor: '#475569', // Smoggy slate sky
    groundColor: '#334155', // Scrap ground
    blockColor: '#64748b', // Rusty metallic blocks
    pipeColor: '#65a30d',
    hazardName: 'Lixiviados Ácidos de Baterías',
  },
  {
    id: 3,
    name: 'Sector 3',
    subtitle: 'Tuberías y Pozos de Lixiviados',
    description: 'Conductos industriales subterráneos donde fluyen metales pesados disueltos.',
    skyColor: '#1e1b4b', // Deep underground indigo
    groundColor: '#0f172a', // Obsidian industrial floor
    blockColor: '#4338ca', // Reinforced steel blocks
    pipeColor: '#10b981',
    hazardName: 'Pozo de Ácido Corrosivo',
  },
  {
    id: 4,
    name: 'Sector 4',
    subtitle: 'La Planta de Reciclaje y Recuperación',
    description: 'Complejo tecnológico ecológico. ¡Alcanza la cima de la escalera y baja la bandera!',
    skyColor: '#0284c7', // Radiant azure eco sky
    groundColor: '#15803d', // Clean lush green
    blockColor: '#0d9488', // Solar crystal blocks
    pipeColor: '#059669',
    hazardName: 'Foso de Desmantelamiento',
  },
];

export interface LevelData {
  platforms: Platform[];
  collectibles: CollectibleItem[];
  checkpoints: CheckpointGate[];
  flagpole: Flagpole;
  worldWidth: number;
  worldHeight: number;
}

/** Sector boundaries shared by the HUD, the camera background and the renderer. */
export const SECTOR_STARTS = [0, 2400, 5000, 7600] as const;
export const FLOOR_Y = 460;

/**
 * Maximum height of a block row that can still have a chip floating above it.
 * Taller rows are only meant to be hit from below, so a chip there would be
 * impossible to collect with a normal jump.
 */
const MAX_CHIP_ROW_RISE = 130;

export function getSectorForX(x: number): SectorConfig {
  if (x >= SECTOR_STARTS[3]) return SECTORS[3];
  if (x >= SECTOR_STARTS[2]) return SECTORS[2];
  if (x >= SECTOR_STARTS[1]) return SECTORS[1];
  return SECTORS[0];
}

export function generateLevel(): LevelData {
  const platforms: Platform[] = [];
  const collectibles: CollectibleItem[] = [];
  const checkpoints: CheckpointGate[] = [];

  let itemId = 1;

  // Helper to add floor segment
  const addFloor = (x: number, width: number) => {
    platforms.push({
      x,
      y: FLOOR_Y,
      width,
      height: 120,
      type: 'solid',
    });
  };

  // Helper to add floating brick/e-block
  const addBlockRow = (
    startX: number,
    y: number,
    pattern: ('brick' | 'e-block')[],
    hasChips: boolean = true
  ) => {
    pattern.forEach((type, index) => {
      const bx = startX + index * 40;
      platforms.push({
        x: bx,
        y,
        width: 36,
        height: 36,
        type,
      });
      if (
        hasChips &&
        FLOOR_Y - y <= MAX_CHIP_ROW_RISE &&
        (type === 'e-block' || index % 2 === 0)
      ) {
        collectibles.push({
          id: itemId++,
          x: bx + 8,
          y: y - 36,
          width: 20,
          height: 24,
          type: 'chip',
          collected: false,
          value: 100,
        });
      }
    });
  };

  // Helper for pipe
  const addPipe = (x: number, height: number) => {
    platforms.push({
      x,
      y: FLOOR_Y - height,
      width: 54,
      height,
      type: 'pipe',
    });
  };

  // Helper for hazard pit
  const addHazard = (x: number, width: number) => {
    platforms.push({
      x,
      y: FLOOR_Y + 40,
      width,
      height: 80,
      type: 'hazard',
    });
  };

  // ==========================================
  // SECTOR 1: La Ciudad (x: 0 -> 2400)
  // ==========================================
  addFloor(0, 750);
  addBlockRow(240, FLOOR_Y - 110, ['brick', 'e-block', 'brick', 'e-block', 'brick']);
  addPipe(480, 60);
  addPipe(640, 90);

  // Pit 1
  addHazard(750, 140);

  addFloor(890, 600);
  addBlockRow(960, FLOOR_Y - 120, ['e-block', 'brick', 'e-block']);
  addBlockRow(1120, FLOOR_Y - 180, ['brick', 'brick', 'brick']);
  addPipe(1340, 75);

  // Pit 2
  addHazard(1490, 160);

  addFloor(1650, 750);
  addBlockRow(1760, FLOOR_Y - 110, ['brick', 'e-block', 'brick', 'e-block']);
  addPipe(2050, 60);

  // Checkpoint 1 Gate at x = 2300
  checkpoints.push({
    sector: 1,
    x: 2300,
    y: FLOOR_Y - 140,
    width: 48,
    height: 140,
    unlocked: false,
    passed: false,
  });

  // ==========================================
  // SECTOR 2: El Vertedero Clandestino (x: 2400 -> 5000)
  // ==========================================
  addFloor(2400, 600);
  addBlockRow(2540, FLOOR_Y - 110, ['brick', 'e-block', 'brick']);
  
  // Spring pad to vault high over scrap heap
  platforms.push({
    x: 2840,
    y: FLOOR_Y - 18,
    width: 36,
    height: 18,
    type: 'spring',
  });

  // Pit with toxic sludge
  addHazard(3000, 200);

  // Stepping platforms over sludge
  platforms.push({
    x: 3040,
    y: FLOOR_Y - 70,
    width: 50,
    height: 24,
    type: 'solid',
  });
  platforms.push({
    x: 3120,
    y: FLOOR_Y - 110,
    width: 50,
    height: 24,
    type: 'solid',
  });

  addFloor(3200, 650);
  addBlockRow(3360, FLOOR_Y - 120, ['brick', 'brick', 'e-block', 'brick']);
  addPipe(3650, 80);

  // Toxic pit 2
  addHazard(3850, 220);
  // Moving platform over toxic pit
  platforms.push({
    x: 3900,
    y: FLOOR_Y - 80,
    width: 70,
    height: 22,
    type: 'moving',
    movingProps: {
      axis: 'y',
      range: 60,
      speed: 1.8,
      originX: 3900,
      originY: FLOOR_Y - 80,
    },
  });

  addFloor(4070, 930);
  addBlockRow(4200, FLOOR_Y - 110, ['e-block', 'e-block', 'e-block']);
  addBlockRow(4440, FLOOR_Y - 170, ['brick', 'brick', 'brick']);
  addPipe(4720, 70);

  // Checkpoint 2 Gate at x = 4900
  checkpoints.push({
    sector: 2,
    x: 4900,
    y: FLOOR_Y - 140,
    width: 48,
    height: 140,
    unlocked: false,
    passed: false,
  });

  // ==========================================
  // SECTOR 3: Tuberías y Lixiviados (x: 5000 -> 7600)
  // ==========================================
  addFloor(5000, 500);
  addPipe(5200, 90);
  addPipe(5380, 110);

  // Massive acid lake with horizontal moving platform
  addHazard(5500, 380);
  platforms.push({
    x: 5580,
    y: FLOOR_Y - 75,
    width: 75,
    height: 22,
    type: 'moving',
    movingProps: {
      axis: 'x',
      range: 120,
      speed: 1.6,
      originX: 5580,
      originY: FLOOR_Y - 75,
    },
  });

  addFloor(5880, 500);
  addBlockRow(5980, FLOOR_Y - 120, ['brick', 'e-block', 'brick']);
  addPipe(6220, 85);

  // Second hazardous conduit with precision jump
  addHazard(6380, 320);
  platforms.push({
    x: 6460,
    y: FLOOR_Y - 70,
    width: 60,
    height: 22,
    type: 'solid',
  });
  platforms.push({
    x: 6580,
    y: FLOOR_Y - 110,
    width: 60,
    height: 22,
    type: 'solid',
  });

  addFloor(6700, 900);
  addBlockRow(6820, FLOOR_Y - 120, ['e-block', 'brick', 'e-block', 'brick']);
  addBlockRow(7060, FLOOR_Y - 180, ['brick', 'brick']);
  addPipe(7320, 70);

  // Checkpoint 3 Gate at x = 7500
  checkpoints.push({
    sector: 3,
    x: 7500,
    y: FLOOR_Y - 140,
    width: 48,
    height: 140,
    unlocked: false,
    passed: false,
  });

  // ==========================================
  // SECTOR 4: La Planta de Reciclaje (x: 7600 -> 10300)
  // ==========================================
  addFloor(7600, 600);
  addBlockRow(7760, FLOOR_Y - 110, ['e-block', 'e-block', 'brick']);
  addPipe(8020, 65);

  addHazard(8200, 240);
  // Two moving platforms in rhythm
  platforms.push({
    x: 8250,
    y: FLOOR_Y - 60,
    width: 65,
    height: 22,
    type: 'moving',
    movingProps: {
      axis: 'y',
      range: 50,
      speed: 2.0,
      originX: 8250,
      originY: FLOOR_Y - 60,
    },
  });
  platforms.push({
    x: 8350,
    y: FLOOR_Y - 90,
    width: 65,
    height: 22,
    type: 'moving',
    movingProps: {
      axis: 'y',
      range: 50,
      speed: -2.0,
      originX: 8350,
      originY: FLOOR_Y - 90,
    },
  });

  addFloor(8440, 700);
  addBlockRow(8560, FLOOR_Y - 120, ['brick', 'e-block', 'brick', 'e-block']);
  addPipe(8900, 80);

  addFloor(9140, 1160);

  // ==========================================
  // THE CLASSIC SUPER MARIO STAIRCASE (x: 9540 -> 9860)
  // 8 steps ascending, each 40px wide x 30px high
  // ==========================================
  const STAIR_START_X = 9540;
  const STEP_WIDTH = 40;
  const STEP_HEIGHT = 30;
  const NUM_STEPS = 8;

  for (let i = 0; i < NUM_STEPS; i++) {
    const stepX = STAIR_START_X + i * STEP_WIDTH;
    const stepY = FLOOR_Y - (i + 1) * STEP_HEIGHT;
    const stepH = (i + 1) * STEP_HEIGHT;
    platforms.push({
      x: stepX,
      y: stepY,
      width: STEP_WIDTH,
      height: stepH,
      type: 'stair',
    });
  }

  // Checkpoint 4 (final pre-flagpole terminal checkpoint)
  checkpoints.push({
    sector: 4,
    x: 9460,
    y: FLOOR_Y - 140,
    width: 48,
    height: 140,
    unlocked: false,
    passed: false,
  });

  // ==========================================
  // THE ICONIC FLAGPOLE (x: 9960)
  // ==========================================
  const flagpole: Flagpole = {
    x: 9960,
    y: FLOOR_Y - 260,
    width: 12,
    height: 260,
    flagY: FLOOR_Y - 250,
    targetFlagY: FLOOR_Y - 40,
    reached: false,
  };

  // Final floor extends past the flagpole and into the Eco-Sanctuary Castle
  return {
    platforms,
    collectibles,
    checkpoints,
    flagpole,
    worldWidth: 10400,
    worldHeight: 600,
  };
}
