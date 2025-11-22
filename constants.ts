
import { GameLevel } from './types';

// Electric/Neon Color Palette
export const TARGET_COLORS = [
  'bg-fuchsia-500 text-fuchsia-500',  // Neon Pink
  'bg-cyan-400 text-cyan-400',        // Neon Blue
  'bg-lime-400 text-lime-400',        // Neon Green
  'bg-violet-500 text-violet-500',    // Neon Purple
  'bg-rose-500 text-rose-500',        // Neon Red
  'bg-amber-400 text-amber-400',      // Neon Orange
];

export const INITIAL_LIVES = 3;

// Probability Config (Base rates)
export const BOMB_SPAWN_RATE = 0.15; 
export const BONUS_SPAWN_RATE = 0.08; 
export const FREEZE_SPAWN_RATE = 0.04; 
export const NUKE_SPAWN_RATE = 0.02;
export const JACKPOT_SPAWN_RATE = 0.008; 
export const HEART_SPAWN_RATE = 0.005; // Rare life recovery

// Generate 50 Levels (Compressed & Faster Progression)
const generateLevels = (): GameLevel[] => {
  const levels: GameLevel[] = [];
  let currentScoreThreshold = 0;

  for (let i = 1; i <= 50; i++) {
    // Score Curve:
    // Levels need less points early on to progress faster
    const pointsNeededForNext = Math.floor(10 + (i * 5)); 
    
    // Difficulty Curves (0 to 50 scaling)
    
    // Spawn Rate: Starts faster (850ms) to avoid boredom
    // Drops to 250ms at Level 50 (Insane speed)
    const spawnRate = Math.max(250, Math.floor(850 - (i * 12)));
    
    // Duration: Starts at 2200ms, drops to 600ms
    const duration = Math.max(600, Math.floor(2200 - (i * 32)));
    
    // Size: Starts at 95px, drops to 50px
    const size = Math.max(50, Math.floor(95 - (i * 0.9)));

    levels.push({
      level: i,
      minScore: currentScoreThreshold,
      spawnRate,
      duration,
      size,
      features: {
        // AGGRESSIVE UNLOCKS - NO BORING START
        bonus: i >= 2,    // Level 2: Stars (Instant reward)
        bombs: i >= 5,    // Level 5: Bombs (Risk starts early)
        freeze: i >= 8,   // Level 8: Freeze (Help needed)
        moving: i >= 12,  // Level 12: Drift (Skill check)
        nuke: i >= 18,    // Level 18: Nuke (Chaos management)
        ghost: i >= 25,   // Level 25: Ghost Mode (Mid-game twist)
        jackpot: i >= 30  // Level 30: Jackpot (High level rewards)
      }
    });

    currentScoreThreshold += pointsNeededForNext;
  }
  return levels;
};

export const GAME_PROGRESSION: GameLevel[] = generateLevels();