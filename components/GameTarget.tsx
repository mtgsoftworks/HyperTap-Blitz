
import React, { memo } from 'react';
import { Target } from '../types';
import { Skull, Star, Snowflake, Radiation, Gem, Heart } from 'lucide-react';

interface GameTargetProps {
  target: Target;
  isFrozen?: boolean;
  onHit: (id: number, x: number, y: number, color: string, type: string, isPerfect: boolean) => void;
  onMiss: (id: number, type: string) => void;
}

const GameTarget: React.FC<GameTargetProps> = ({ target, isFrozen = false, onHit, onMiss }) => {
  const handleAnimationEnd = (e: React.AnimationEvent) => {
    if (e.animationName === 'shrink') {
      onMiss(target.id, target.type);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate accuracy based on center distance
    const rect = e.currentTarget.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const centerX = rect.left + rect.width / 2;
    
    const dist = Math.sqrt(
        Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
    );
    
    const radius = target.size / 2;
    const isPerfect = dist < (radius * 0.35);

    // Extract bg color for particle effect
    const colorClass = target.color.split(' ')[0]; 
    onHit(target.id, target.x, target.y, colorClass, target.type, isPerfect);
  };

  // --- STYLE LOGIC ---
  
  // All targets are now rounded (Balls/Orbs)
  let shapeClass = 'rounded-full'; 
  let innerIcon = null;
  let containerClass = target.color; 
  let shadowClass = 'neon-glow'; 
  let animationClass = 'animate-shrink';
  let movementClass = target.isMoving ? 'animate-drift' : '';
  let ghostClass = target.isGhost ? 'animate-ghost' : '';
  
  // Default styles
  const baseStyle: React.CSSProperties = {
    left: `${target.x}%`,
    top: `${target.y}%`,
    width: `${target.size}px`,
    height: `${target.size}px`,
    marginLeft: `-${target.size / 2}px`, 
    marginTop: `-${target.size / 2}px`, 
    animationDuration: `${target.duration}ms`,
    touchAction: 'none',
    zIndex: 10,
    animationPlayState: isFrozen ? 'paused' : 'running'
  };

  // --- TYPE SPECIFIC RENDERING ---

  if (target.type === 'NORMAL') {
      // NEON RING (Reference Style)
      // Outer Ring: Sharp border with strong glow
      // We use border-[3px] for a crisp ring
      containerClass = `${target.color.split(' ')[1]} border-[3px] border-current bg-transparent`;
      
      // Add specific strong glow to the ring
      shadowClass = 'shadow-[0_0_15px_currentColor,inset_0_0_10px_currentColor]';
      
      // Extract BG color class for the inner dot
      const bgClass = target.color.split(' ')[0]; 
      
      innerIcon = (
          // Inner Dot: Solid, glowing, centered
          <div className={`w-[30%] h-[30%] rounded-full ${bgClass} shadow-[0_0_10px_currentColor]`}></div>
      );
  } 
  else if (target.type === 'BOMB') {
    // DANGER ORB (Red, Dashed Border, Pulsing)
    containerClass = 'text-red-500 border-4 border-red-600 border-dashed bg-red-950/50';
    shadowClass = 'shadow-[0_0_30px_rgba(220,38,38,0.6)]';
    baseStyle.zIndex = 20;
    
    innerIcon = (
        <div className="w-full h-full flex items-center justify-center animate-pulse">
            <Skull className="w-3/5 h-3/5 text-red-500 drop-shadow-md" strokeWidth={2.5} />
        </div>
    );
  } 
  else if (target.type === 'BONUS') {
    // GOLDEN ORB (Spinning Star Inside)
    containerClass = 'text-yellow-300 border-4 border-yellow-400 bg-yellow-900/30';
    
    innerIcon = (
         <div className="w-full h-full flex items-center justify-center animate-spin-slow">
             <Star className="w-3/5 h-3/5 fill-yellow-400 text-yellow-400 drop-shadow-lg" />
         </div>
    );
  } 
  else if (target.type === 'HEART') {
    // LIFE ORB
    containerClass = 'text-pink-500 border-4 border-pink-500 bg-pink-950/50';
    
    innerIcon = (
         <div className="w-full h-full flex items-center justify-center animate-pulse">
             <Heart className="w-3/5 h-3/5 fill-pink-500 text-pink-500 drop-shadow-lg" />
         </div>
    );
  }
  else if (target.type === 'FREEZE') {
    // ICE SPHERE
    containerClass = 'text-cyan-200 border-2 border-cyan-300 bg-cyan-400/30 backdrop-blur-sm';
    shadowClass = 'shadow-[0_0_20px_rgba(34,211,238,0.6)]';
    
    innerIcon = (
         <div className="w-full h-full flex items-center justify-center">
             <Snowflake className="w-3/5 h-3/5 text-white animate-spin-slow" />
         </div>
    );
  } 
  else if (target.type === 'NUKE') {
    // RADIOACTIVE CORE
    containerClass = 'text-orange-500 border-4 border-orange-500 bg-orange-950/80';
    
    innerIcon = (
        <div className="w-full h-full flex items-center justify-center">
             <Radiation className="w-3/5 h-3/5 text-orange-500 animate-spin" style={{animationDuration: '3s'}} />
        </div>
    );
  } 
  else if (target.type === 'JACKPOT') {
    // PURE ENERGY ORB
    containerClass = 'text-white border-2 border-white bg-gradient-to-br from-fuchsia-500 to-cyan-500';
    shadowClass = 'shadow-[0_0_40px_rgba(255,255,255,0.8)] animate-pulse-ring';
    ghostClass = ''; 
    
    innerIcon = (
        <div className="w-full h-full flex items-center justify-center">
             <Gem className="w-1/2 h-1/2 text-white fill-white animate-pulse" />
        </div>
    );
  }

  return (
    <div
      className={`absolute cursor-pointer flex items-center justify-center overflow-hidden select-none
        ${containerClass} ${shapeClass} ${shadowClass} 
        ${animationClass} ${movementClass} ${ghostClass}`}
      style={baseStyle}
      onAnimationEnd={handleAnimationEnd}
      onPointerDown={handlePointerDown}
    >
      {innerIcon}
    </div>
  );
};

export default memo(GameTarget);