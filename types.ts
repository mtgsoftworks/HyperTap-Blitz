export type GameState = 'MENU' | 'PLAYING' | 'GAME_OVER' | 'COUNTDOWN';
export type TargetType = 'NORMAL' | 'BOMB' | 'BONUS' | 'FREEZE' | 'NUKE' | 'JACKPOT' | 'HEART';
export type Language = 'en' | 'es' | 'pt' | 'fr' | 'de' | 'jp' | 'kr';

export interface Target {
  id: number;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  color: string;
  duration: number; // Time in ms before it disappears
  size: number; // Size in px
  type: TargetType;
  isMoving?: boolean; // New: Does the target drift?
  isGhost?: boolean; // New: Does the target flicker?
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  tx: string; // Translation X CSS value (e.g. "100px")
  ty: string; // Translation Y CSS value
  size: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  isGlitch?: boolean;
}

// New Level System Interface
export interface GameLevel {
  level: number;
  minScore: number;
  spawnRate: number;
  duration: number;
  size: number;
  features: {
    bombs: boolean;
    bonus: boolean;
    moving: boolean; // Targets drift around
    ghost: boolean; // Targets flicker opacity
    freeze: boolean;
    nuke: boolean;
    jackpot: boolean; // Ultra rare high score target
  };
}

export interface GameStats {
  totalHits: number;
  totalMisses: number;
  totalClicks: number;
  maxCombo: number;
  perfectHits: number;
  level: number;
  starsEarned: number; // Stars collected during this game session
}