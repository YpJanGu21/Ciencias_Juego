/**
 * Types and interfaces for Super Eco Bros: Odisea E-Waste
 */

export type CharacterId = 'gabriela' | 'luciel' | 'santiago' | 'angel' | 'matias';

export type DifficultyId = 'facil' | 'medio' | 'dificil';

export interface CharacterConfig {
  id: CharacterId;
  name: string;
  role: string;
  quote: string;
  description: string;
  primaryColor: string; // Used for cap/shirt
  secondaryColor: string; // Overalls
  accentColor: string;
}

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  /** Time budget for EACH sector. The timer is refilled when a checkpoint is unlocked. */
  timeSeconds: number;
  /** Human readable duration shown in the title screen. */
  timeLabel: string;
  description: string;
  badgeColor: string;
}

export type QuestionOptionKey = 'A' | 'B' | 'C';

export interface QuestionData {
  id: number;
  question: string;
  options: {
    key: QuestionOptionKey;
    text: string;
  }[];
  correctAnswer: QuestionOptionKey;
  difficulty: 'facil' | 'medio' | 'dificil';
  explanation: string;
}

export interface SectorConfig {
  id: number;
  name: string;
  subtitle: string;
  description: string;
  skyColor: string;
  groundColor: string;
  blockColor: string;
  pipeColor: string;
  hazardName: string;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Platform extends Rect {
  type: 'solid' | 'brick' | 'e-block' | 'pipe' | 'moving' | 'spring' | 'hazard' | 'stair';
  movingProps?: {
    axis: 'x' | 'y';
    /** Maximum displacement in pixels. */
    range: number;
    /** Angular speed in radians per second (negative reverses direction). */
    speed: number;
    originX: number;
    originY: number;
  };
  hit?: boolean;
  destroyed?: boolean;
  bumpOffsetY?: number;
  bumpVelocity?: number;
}

export interface PoppingPhone {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  life: number;
  maxLife: number;
  collected: boolean;
  model: 'flip' | 'candybar' | 'burner';
  color: string;
}

export interface CollectibleItem extends Rect {
  id: number;
  type: 'chip' | 'battery_eco' | 'star' | 'phone';
  collected: boolean;
  value: number;
}

export interface CheckpointGate extends Rect {
  sector: number;
  unlocked: boolean;
  passed: boolean;
}

export interface Flagpole {
  x: number;
  y: number;
  width: number;
  height: number;
  flagY: number;
  targetFlagY: number;
  reached: boolean;
}

export type GameState = 
  | 'title'
  | 'character_dialogue'
  | 'playing'
  | 'checkpoint_question'
  | 'paused'
  | 'victory'
  | 'gameover'
  | 'credits';
