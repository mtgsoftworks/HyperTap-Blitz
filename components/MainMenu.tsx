
import React, { useState, useRef, useEffect } from 'react';
import { Play, Trophy, Volume2, VolumeX, Globe } from 'lucide-react';
import { playSound, setMuted, getMuted, resumeAudio } from '../utils/audio';
import { Language } from '../types';
import { LANGUAGES, getTranslation } from '../utils/i18n';

interface MainMenuProps {
  onStart: () => void;
  highScore: number;
  language: Language;
  setLanguage: (lang: Language) => void;
}

// Inline SVG Icon Component to ensure reliable rendering
const AppIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2e1065" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>

      <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22d3ee" />
        <stop offset="50%" stopColor="#e879f9" />
        <stop offset="100%" stopColor="#d946ef" />
      </linearGradient>

      <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
        <stop offset="40%" stopColor="rgba(255,255,255,0.1)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
      </linearGradient>

      <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Base Shape (iOS Squircle style) */}
    <rect width="512" height="512" rx="120" fill="url(#bgGrad)" />

    {/* Circuit Pattern Background */}
    <g stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" strokeLinecap="round">
      <path d="M60 120 L100 120 L120 140" />
      <circle cx="60" cy="120" r="4" fill="rgba(255,255,255,0.1)" stroke="none" />
      <path d="M40 200 L80 200 L100 220 L160 220" />
      <path d="M60 350 L100 350 L130 320" />
      <circle cx="60" cy="350" r="4" fill="rgba(255,255,255,0.1)" stroke="none" />
      <path d="M100 450 L140 410 L140 380" />

      <path d="M450 100 L400 100 L380 120" />
      <circle cx="450" cy="100" r="4" fill="rgba(255,255,255,0.1)" stroke="none" />
      <path d="M470 250 L420 250 L380 290 L340 290" />
      <path d="M440 380 L400 380 L370 350" />
      <circle cx="440" cy="380" r="4" fill="rgba(255,255,255,0.1)" stroke="none" />

      <path d="M200 40 L200 80 L220 100" />
      <path d="M300 470 L300 430 L280 410" />
    </g>

    {/* Glass Reflection Overlay on BG */}
    <path d="M0 200 Q 256 300 512 200 V 0 H 0 Z" fill="rgba(255,255,255,0.03)" />

    {/* Main Lightning Bolt */}
    <g filter="url(#neonGlow)" transform="translate(0, 10)">
      <path d="M280 50 
               L150 270 
               L240 270 
               L200 450 
               L370 210 
               L280 210 
               L300 50 Z"
        fill="url(#boltGrad)"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="4"
        strokeLinejoin="round" />

      {/* Glossy Shine on Bolt */}
      <path d="M280 50 
               L150 270 
               L240 270 
               L220 350 
               L300 210 
               L280 210 
               L290 90 Z"
        fill="url(#glassShine)"
        opacity="0.8"
        style={{ mixBlendMode: 'overlay' }} />
    </g>

    {/* Border Ring */}
    <rect width="512" height="512" rx="120" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
  </svg>
);

const MainMenu: React.FC<MainMenuProps> = ({ onStart, highScore, language, setLanguage }) => {
  const [isMutedState, setIsMutedState] = useState(getMuted());
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const t = getTranslation(language);

  const handleStart = () => {
    resumeAudio(); // CRITICAL for iOS: Enable audio context on user interaction
    playSound('start');
    onStart();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    resumeAudio();
    const newState = !isMutedState;
    setIsMutedState(newState);
    setMuted(newState);
    if (!newState) playSound('ui');
  };

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-slate-900 text-white relative overflow-hidden safe-area-view">

      {/* Background Decor */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-purple-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>

      {/* Top Bar: Language & Sound */}
      <div className="w-full flex justify-end gap-3 p-6 z-20 safe-top shrink-0">
        {/* Language Toggle */}
        <div className="relative" ref={langMenuRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="p-3 bg-slate-800/60 backdrop-blur border border-slate-700 rounded-full hover:bg-slate-700 transition flex items-center justify-center shadow-lg"
          >
            <Globe size={24} className="text-slate-300" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 top-14 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLangMenu(false);
                    playSound('ui');
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-700 transition border-b border-slate-700/50 last:border-0 ${language === lang.code ? 'bg-purple-900/30 text-white font-bold' : 'text-slate-300'}`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-sm">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sound Toggle */}
        <button
          onClick={toggleMute}
          className="p-3 bg-slate-800/60 backdrop-blur border border-slate-700 rounded-full hover:bg-slate-700 transition shadow-lg"
        >
          {isMutedState ? <VolumeX size={24} className="text-red-400" /> : <Volume2 size={24} className="text-green-400" />}
        </button>
      </div>

      {/* Main Content - Centered & Spaced */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto px-6 z-10 overflow-y-auto no-scrollbar">
        <div className="w-full flex flex-col items-center space-y-6 py-4">

          {/* Title Section */}
          <div className="space-y-2 animate-in slide-in-from-top duration-700 flex flex-col items-center shrink-0">
            <div className="flex justify-center mb-4 relative">
              {/* Main App Icon */}
              <div className="relative group">
                <div className="absolute -inset-4 bg-purple-500/30 rounded-full blur-xl group-hover:bg-purple-500/50 transition duration-500"></div>
                <AppIcon className="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] shadow-[0_0_40px_rgba(168,85,247,0.6)] animate-in zoom-in duration-700 relative z-10 transform transition hover:scale-105 duration-300" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl mt-2 text-center">
              HyperTap
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 glitch-effect">Blitz</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-lg font-medium tracking-widest uppercase opacity-80 text-center">
              {t.subtitle}
            </p>
          </div>

          {/* High Score Card */}
          <div className="w-full bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-3 md:p-4 rounded-2xl flex items-center justify-between px-6 md:px-8 shadow-xl animate-in fade-in zoom-in duration-700 delay-100 shrink-0">
            <div className="flex items-center gap-3 text-yellow-400">
              <Trophy size={20} className="fill-yellow-400/20" />
              <span className="font-bold uppercase text-xs md:text-sm tracking-widest">{t.highScore}</span>
            </div>
            <span className="text-2xl md:text-3xl font-black text-white tabular-nums drop-shadow-md">
              {highScore}
            </span>
          </div>

          {/* START BUTTON - Massive CTA */}
          <div className="w-full pt-2 pb-2 animate-in fade-in zoom-in duration-700 delay-200 shrink-0">
            <button
              onClick={handleStart}
              className="group relative w-full py-5 md:py-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] active:scale-95 overflow-hidden"
            >
              {/* Shiny effect */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 pointer-events-none"></div>
              <div className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shiny"></div>

              <div className="flex items-center justify-center gap-4">
                <Play size={28} className="fill-white text-white md:w-8 md:h-8" />
                <span className="text-2xl md:text-3xl font-black text-white tracking-wider">{t.start}</span>
              </div>
            </button>
          </div>

          {/* Tutorial / Info (Modernized) */}
          <div className="mt-2 relative group animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 w-full shrink-0">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
            <div className="relative bg-slate-900/90 backdrop-blur-xl border border-white/10 px-4 py-3 md:px-6 md:py-4 rounded-xl shadow-2xl flex items-center justify-center text-center">
              <p className="text-slate-200 text-xs md:text-sm font-medium leading-relaxed tracking-wide drop-shadow-sm">
                {t.tutorial}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Version & Copyright */}
      <div className="w-full py-4 flex flex-col items-center text-center gap-1 safe-bottom shrink-0 z-10 bg-slate-900/50 backdrop-blur-sm">
        <div className="text-slate-500 text-[10px] font-medium opacity-80">
          © 2025 MTG Softworks. All Rights Reserved.
        </div>
        <div className="text-slate-700 text-[10px] font-bold tracking-widest">
          v1.0.0
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
