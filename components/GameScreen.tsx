
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, Particle, FloatingText, TargetType, Language, GameStats, GameLevel } from '../types';
import { TARGET_COLORS, GAME_PROGRESSION, BOMB_SPAWN_RATE, BONUS_SPAWN_RATE, FREEZE_SPAWN_RATE, NUKE_SPAWN_RATE, JACKPOT_SPAWN_RATE, HEART_SPAWN_RATE } from '../constants';
import GameTarget from './GameTarget';
import { Heart, Pause, Play, Zap, Snowflake, LogOut, Layers } from 'lucide-react';
import { playSound, startMusic, stopMusic } from '../utils/audio';
import { getTranslation } from '../utils/i18n';
import { triggerHaptic } from '../utils/haptics';

interface GameScreenProps {
  lives: number;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setLives: React.Dispatch<React.SetStateAction<number>>;
  onGameOver: (stats: GameStats) => void;
  onLoseLife: () => void;
  onHome: () => void;
  language: Language;
  isResuming?: boolean; // New prop
}

const GameScreen: React.FC<GameScreenProps> = ({
  lives,
  score,
  setScore,
  setLives,
  onGameOver,
  onLoseLife,
  onHome,
  language,
  isResuming = false
}) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isLevelUpAnim, setIsLevelUpAnim] = useState(false);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);

  // Countdown state for resuming - Start at 4 to allow "Ready" phase
  const [countdown, setCountdown] = useState(isResuming ? 4 : 0);

  const t = getTranslation(language);

  // Stats refs
  const totalHitsRef = useRef(0);
  const totalClicksRef = useRef(0);
  const maxComboRef = useRef(0);

  // Refs for game loop logic
  const scoreRef = useRef(score);
  const isPausedRef = useRef(isPaused);
  const isFrozenRef = useRef(isFrozen);
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const freezeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelRef = useRef(1);

  // Manage Music
  useEffect(() => {
    if (countdown === 0) {
      startMusic('GAME');
    }
    return () => stopMusic();
  }, [countdown]);

  // Countdown Timer Logic
  useEffect(() => {
    if (countdown > 0) {
      // Play sound immediately
      if (countdown <= 3) playSound('ui', 0);

      // First step (4 -> 3) can be faster to just show "Ready" briefly
      const delay = countdown === 4 ? 500 : 1000;

      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, delay);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isResuming) {
      playSound('start', 0); // GO!
    }
  }, [countdown, isResuming]);

  useEffect(() => {
    scoreRef.current = score;
    checkLevelUp(score);
  }, [score]);

  useEffect(() => {
    if (combo > maxComboRef.current) {
      maxComboRef.current = combo;
    }
  }, [combo]);

  useEffect(() => {
    isPausedRef.current = isPaused;
    // If paused, clear spawn timer and stop music
    if (isPaused) {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
      stopMusic();
    } else {
      // If unpaused, restart music and spawning (ONLY IF NOT COUNTING DOWN)
      if (countdown === 0) {
        startMusic('GAME');
        if (!isFrozenRef.current && !isLevelUpAnim) {
          startSpawning();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, isLevelUpAnim, countdown]);

  // Effect to handle Freeze Logic
  useEffect(() => {
    isFrozenRef.current = isFrozen;
    if (isFrozen) {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      freezeTimerRef.current = setTimeout(() => {
        setIsFrozen(false);
        playSound('ui', 0);
        if (!isPausedRef.current && !isLevelUpAnim && countdown === 0) startSpawning();
      }, 3000);
    }
    return () => {
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFrozen, countdown]);

  const getCurrentLevelConfig = () => {
    // Safe access for infinite scaling caps at max level config
    const configIndex = Math.min(levelRef.current - 1, GAME_PROGRESSION.length - 1);
    return GAME_PROGRESSION[configIndex];
  };

  const checkLevelUp = (currentScore: number) => {
    const nextLevelConfig = GAME_PROGRESSION.find(l => l.level === levelRef.current + 1);

    if (nextLevelConfig && currentScore >= nextLevelConfig.minScore) {
      // LEVEL UP!
      levelRef.current = nextLevelConfig.level;
      setLevel(nextLevelConfig.level);
      setIsLevelUpAnim(true);
      playSound('start', 0);
      triggerHaptic('heavy');

      // Pause spawning briefly
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);

      setTimeout(() => {
        setIsLevelUpAnim(false);
        if (!isPausedRef.current && !isFrozenRef.current && countdown === 0) startSpawning();
      }, 1500); // Reduced delay to keep flow going
    }
  };

  const spawnTarget = useCallback(() => {
    if (isPausedRef.current || isFrozenRef.current || isLevelUpAnim || countdown > 0) return;

    const config = getCurrentLevelConfig();

    const id = Date.now() + Math.random();
    const x = 10 + Math.random() * 80;
    const y = 15 + Math.random() * 70;

    // Determine Type based on Level Features
    let type: TargetType = 'NORMAL';
    let color = TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)];

    const r = Math.random();
    const f = config.features;

    // Check for Jackpot first (rarest)
    if (f.jackpot && r < JACKPOT_SPAWN_RATE) {
      type = 'JACKPOT';
      color = 'bg-white'; // Overridden in component
    } else if (f.nuke && r < JACKPOT_SPAWN_RATE + NUKE_SPAWN_RATE) {
      type = 'NUKE';
      color = 'bg-orange-600';
    } else if (r < JACKPOT_SPAWN_RATE + NUKE_SPAWN_RATE + HEART_SPAWN_RATE) {
      // Heart (Healing)
      type = 'HEART';
      color = 'bg-pink-600';
    } else if (f.freeze && r < JACKPOT_SPAWN_RATE + NUKE_SPAWN_RATE + HEART_SPAWN_RATE + FREEZE_SPAWN_RATE) {
      type = 'FREEZE';
      color = 'bg-cyan-500';
    } else if (f.bombs && r < JACKPOT_SPAWN_RATE + NUKE_SPAWN_RATE + HEART_SPAWN_RATE + FREEZE_SPAWN_RATE + BOMB_SPAWN_RATE) {
      type = 'BOMB';
      color = 'bg-slate-900';
    } else if (f.bonus && r < JACKPOT_SPAWN_RATE + NUKE_SPAWN_RATE + HEART_SPAWN_RATE + FREEZE_SPAWN_RATE + BOMB_SPAWN_RATE + BONUS_SPAWN_RATE) {
      type = 'BONUS';
      color = 'bg-yellow-400';
    }

    // Jackpot should be tiny
    let finalSize = config.size;
    if (type === 'JACKPOT') finalSize = Math.max(30, config.size * 0.7);

    const newTarget: Target = {
      id,
      x,
      y,
      color,
      type,
      duration: type === 'JACKPOT' ? Math.min(config.duration, 800) : config.duration,
      size: finalSize,
      isMoving: f.moving && type !== 'BOMB', // Only normal/good stuff moves
      isGhost: f.ghost && type === 'NORMAL' // Only normal targets ghost to confuse
    };

    setTargets(prev => [...prev, newTarget]);
  }, [isLevelUpAnim, countdown]);

  const startSpawning = useCallback(() => {
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (countdown > 0) return; // Don't spawn if counting down

    const config = getCurrentLevelConfig();

    spawnTimerRef.current = setInterval(() => {
      spawnTarget();
      if (!isPausedRef.current && !isFrozenRef.current && !isLevelUpAnim && countdown === 0) {
        startSpawning(); // Reschedule to handle potential rate changes dynamically
      }
    }, config.spawnRate);
  }, [spawnTarget, isLevelUpAnim, countdown]);

  useEffect(() => {
    if (countdown === 0) {
      startSpawning();
    }
    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [startSpawning, countdown]);

  const addFloatingText = (x: number, y: number, text: string, color: string = 'text-white', isGlitch: boolean = false) => {
    const id = Date.now() + Math.random();
    setFloatingTexts(prev => [...prev, { id, x, y, text, color, isGlitch }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 800);
  };

  const handleHit = useCallback((id: number, x: number, y: number, color: string, type: string, isPerfect: boolean) => {
    totalClicksRef.current += 1;
    setTargets(prev => prev.filter(t => t.id !== id));

    if (type === 'BOMB') {
      playSound('bomb', 0);
      triggerHaptic('failure');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setCombo(0);
      addFloatingText(x, y, "BOOM!", "text-red-500", true);
      onLoseLife();
      return;
    }

    totalHitsRef.current += 1;

    if (type === 'FREEZE') {
      playSound('freeze', 0);
      triggerHaptic('medium');
      setIsFrozen(true);
      addFloatingText(x, y, t.frozen, "text-cyan-300 font-bold text-2xl");
    } else if (type === 'HEART') {
      playSound('heart', 0);
      triggerHaptic('success');
      setLives(prev => Math.min(prev + 1, 3));
      addFloatingText(x, y, "+1 ❤️", "text-pink-500 font-bold text-2xl");
    } else if (type === 'NUKE') {
      playSound('nuke', 0);
      triggerHaptic('heavy');
      setTargets((current) => {
        const count = current.length;
        setScore(prev => prev + (count * 2));
        addFloatingText(50, 50, "NUKE!!", "text-orange-500 font-black text-4xl", true);
        return [];
      });
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 800);
    } else if (type === 'BONUS') {
      playSound('bonus', 0);
      triggerHaptic('success');
      setScore(prev => prev + 5);
      addFloatingText(x, y, "+5", "text-yellow-400 font-bold text-2xl");
    } else if (type === 'JACKPOT') {
      playSound('jackpot', 0);
      triggerHaptic('heavy');
      setScore(prev => prev + 50);
      setCombo(prev => Math.max(prev, 50)); // Instant max combo state
      addFloatingText(x, y, "JACKPOT!", "text-fuchsia-400 font-black text-3xl", true);
    } else {
      const currentCombo = combo + 1;
      playSound('hit', currentCombo);

      if (isPerfect) {
        triggerHaptic('success');
        setScore(prev => prev + 2);
        addFloatingText(x, y, t.perfect, "text-purple-300 font-black text-xl", true);
      } else {
        triggerHaptic('light');
        setScore(prev => prev + 1);
        addFloatingText(x, y, "+1");
      }
    }

    if (type !== 'BOMB') {
      setCombo(prev => prev + 1);
    }

    const particleCount = isPerfect ? 12 : 8;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = 60 + Math.random() * 40;

      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        color: isPerfect ? 'bg-white' : color,
        tx: `${Math.cos(angle) * distance}px`,
        ty: `${Math.sin(angle) * distance}px`,
        size: 10 + Math.random() * 15
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 500);

  }, [setScore, onLoseLife, t.frozen, t.perfect, combo, spawnTarget, setLives]);

  const handleMiss = useCallback((id: number, type: string) => {
    if (isFrozenRef.current) return;

    setTargets(prev => prev.filter(t => t.id !== id));

    if (type === 'BOMB' || type === 'FREEZE' || type === 'NUKE' || type === 'HEART') return;

    if (type === 'BONUS' || type === 'JACKPOT') {
      addFloatingText(targets.find(t => t.id === id)?.x || 50, targets.find(t => t.id === id)?.y || 50, "Missed!", "text-yellow-600");
      return;
    }

    playSound('miss', 0);
    triggerHaptic('medium');
    setCombo(0);
    addFloatingText(targets.find(t => t.id === id)?.x || 50, targets.find(t => t.id === id)?.y || 50, "MISS", "text-red-400");

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 300);

    onLoseLife();
  }, [onLoseLife, targets]);

  const handleBackgroundClick = () => {
    totalClicksRef.current += 1;
  }

  useEffect(() => {
    if (lives <= 0) {
      stopMusic();
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      playSound('gameover', 0);
      triggerHaptic('failure');

      onGameOver({
        score: score,
        level: level,
        totalHits: totalHitsRef.current,
        totalClicks: totalClicksRef.current,
        maxCombo: maxComboRef.current
      });
    }
  }, [lives, onGameOver, score, level]);

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('ui', 0);
    setIsPaused(!isPaused);
  }

  const handleQuit = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('ui', 0);
    stopMusic();
    onHome();
  }

  // Calculate dynamic visual props based on 50 levels (Adjusted scaling)
  const gridSpeed = Math.max(0.2, 6 - (level * 0.1));

  let bgGradient = 'from-slate-900 via-slate-900 to-indigo-950';
  if (level > 5) bgGradient = 'from-slate-900 via-indigo-900 to-purple-900';
  if (level > 12) bgGradient = 'from-indigo-950 via-purple-900 to-pink-900';
  if (level > 25) bgGradient = 'from-purple-950 via-pink-900 to-orange-900';
  if (level > 35) bgGradient = 'from-red-950 via-orange-900 to-yellow-900';
  if (level > 45) bgGradient = 'from-black via-slate-950 to-slate-900'; // Void Theme

  // Combo Bar Width
  const comboBarWidth = Math.min(100, combo * 2);

  return (
    <div
      onPointerDown={handleBackgroundClick}
      className={`relative w-full h-full touch-none select-none overflow-hidden bg-gradient-to-br ${bgGradient} transition-colors duration-1000 ${isShaking ? 'animate-shake' : ''}`}
    >

      {/* Dynamic Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <div
          className="w-[200%] h-[200%] absolute -left-1/2 -top-1/2"
          style={{
            backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg)',
            animation: `gridMove ${gridSpeed}s linear infinite`,
            animationPlayState: isFrozen ? 'paused' : 'running',
            opacity: level > 45 ? 0.05 : 0.1 // Fade grid in void mode
          }}
        ></div>
        <style>{`
            @keyframes gridMove {
                0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
                100% { transform: perspective(500px) rotateX(60deg) translateY(40px); }
            }
          `}</style>
      </div>

      {/* Level Up Overlay */}
      {isLevelUpAnim && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-2xl glitch-effect text-center">
            {t.levelUp}
            <div className="text-4xl md:text-5xl text-white mt-2 drop-shadow-none font-bold tracking-wider">
              {level}
            </div>
          </h1>
        </div>
      )}

      {/* Frozen Overlay */}
      {isFrozen && (
        <div className="absolute inset-0 pointer-events-none z-30 bg-cyan-500/10 animate-pulse border-4 border-cyan-400/30 rounded-lg"></div>
      )}

      {/* Glitch Overlay (High Combo) */}
      {combo > 25 && (
        <div className="absolute inset-0 pointer-events-none z-30 opacity-30 mix-blend-overlay bg-noise animate-pulse"></div>
      )}

      {/* RESUME COUNTDOWN OVERLAY */}
      {countdown > 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-9xl font-black text-white animate-ping">
            {countdown > 3 ? "READY" : countdown}
          </div>
        </div>
      )}

      {/* HUD Layer */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none safe-top">
        <div className="flex flex-col items-start">
          <h2 className={`text-4xl font-black text-white drop-shadow-lg tracking-tighter ${combo > 20 ? 'glitch-effect' : ''}`}>
            {score}
          </h2>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{t.score}</span>

          {/* Level Indicator */}
          <div className="mt-1 flex items-center gap-1 text-purple-300">
            <Layers size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">{t.level} {level}</span>
          </div>

          {/* Combo Meter */}
          {combo > 2 && (
            <div className={`mt-2 flex items-center gap-1 animate-pulse ${combo > 15 ? 'text-yellow-400' : 'text-blue-400'}`}>
              <Zap size={16} fill="currentColor" />
              <span className="font-black italic text-lg">{combo} {t.combo}</span>
            </div>
          )}

          {/* Frozen Indicator */}
          {isFrozen && (
            <div className="mt-2 flex items-center gap-1 text-cyan-400 animate-bounce">
              <Snowflake size={16} fill="currentColor" />
              <span className="font-black text-lg">{t.frozen}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className="pointer-events-auto p-2 rounded-full bg-slate-800/50 backdrop-blur text-white hover:bg-slate-700 transition active:scale-90"
          >
            {isPaused ? <Play size={24} fill="currentColor" /> : <Pause size={24} fill="currentColor" />}
          </button>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
            <Heart key={i} className="text-red-500 fill-red-500 animate-pulse" size={28} />
          ))}
          {Array.from({ length: Math.max(0, 3 - lives) }).map((_, i) => (
            <Heart key={`lost-${i}`} className="text-slate-800 fill-slate-800" size={28} />
          ))}
        </div>
      </div>

      {/* COMBO ENERGY BAR (Bottom) */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-slate-900 z-50">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-200 ease-out shadow-[0_0_10px_currentColor]"
          style={{ width: `${comboBarWidth}%` }}
        ></div>
      </div>

      {/* Pause Menu Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto gap-6">
          <div className="text-center animate-bounce">
            <h3 className="text-4xl font-black text-white tracking-tight">{t.paused}</h3>
          </div>

          <div className="flex flex-col gap-4 w-64">
            <button
              onClick={togglePause}
              className="w-full bg-white text-slate-900 py-4 rounded-xl font-bold text-xl hover:bg-slate-200 transition flex items-center justify-center gap-2"
            >
              <Play size={24} />
              {t.resume}
            </button>

            <button
              onClick={handleQuit}
              className="w-full bg-slate-800 text-red-400 border border-slate-700 py-4 rounded-xl font-bold text-xl hover:bg-slate-700 transition flex items-center justify-center gap-2"
            >
              <LogOut size={24} />
              {t.quit}
            </button>
          </div>
        </div>
      )}

      {/* Gameplay Area */}
      <div className="absolute inset-0 z-10">
        {targets.map(target => (
          !isPaused && (
            <GameTarget
              key={target.id}
              target={target}
              isFrozen={isFrozen}
              onHit={handleHit}
              onMiss={handleMiss}
            />
          )
        ))}
      </div>

      {/* Particle Effects Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className={`absolute rounded-full ${p.color} animate-particle shadow-lg`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              marginLeft: `-${p.size / 2}px`,
              marginTop: `-${p.size / 2}px`,
              '--tx': p.tx,
              '--ty': p.ty,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Floating Text Layer */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {floatingTexts.map(ft => (
          <div
            key={ft.id}
            className={`absolute font-black text-2xl animate-float ${ft.color} drop-shadow-md ${ft.isGlitch ? 'glitch-effect' : ''}`}
            style={{
              left: `${ft.x}%`,
              top: `${ft.y}%`,
            }}
          >
            {ft.text}
          </div>
        ))}
      </div>

    </div>
  );
};

export default GameScreen;