import React from 'react';
import { RotateCcw, Home, Award, Target, Zap, MousePointer, Layers } from 'lucide-react';
import { playSound } from '../utils/audio';
import { Language, GameStats } from '../types';
import { getTranslation } from '../utils/i18n';

interface GameOverProps {
    score: number;
    highScore: number;
    stats: GameStats | null;
    onRestart: () => void;
    onHome: () => void;
    language: Language;
    hasUsedRevive: boolean;
    onReviveAd: () => void;
    onDoubleStarsAd: () => void;
}

const GameOver: React.FC<GameOverProps> = ({
    score,
    highScore,
    stats,
    onRestart,
    onHome,
    language,
    hasUsedRevive,
    onReviveAd,
    onDoubleStarsAd
}) => {
    const isNewRecord = score > highScore;
    const t = getTranslation(language);

    const handleHome = () => {
        playSound('ui', 0);
        onHome();
    }

    const handleRestart = () => {
        playSound('start', 0);
        onRestart();
    }

    // Calculate accuracy safely
    const accuracy = stats && stats.totalClicks > 0
        ? Math.round((stats.totalHits / stats.totalClicks) * 100)
        : 0;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm text-white p-6 z-50 animate-in fade-in duration-300 overflow-y-auto">
            <div className="max-w-md w-full text-center space-y-6">

                <div>
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight glitch-effect">{t.gameOver}</h2>
                    <p className="text-slate-400">{t.gameOverDesc}</p>
                </div>

                <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 shadow-2xl relative overflow-hidden">
                    {isNewRecord && (
                        <div className="absolute top-0 left-0 w-full bg-yellow-500 text-yellow-900 text-xs font-bold py-1 uppercase tracking-widest">
                            {t.newRecord}
                        </div>
                    )}

                    <div className="flex flex-col gap-1 mt-2 mb-4">
                        <span className="text-slate-400 text-sm font-bold uppercase">{t.score}</span>
                        <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                            {score}
                        </span>
                    </div>

                    {/* Level Badge */}
                    {stats && (
                        <div className="flex justify-center mb-4">
                            <div className="bg-slate-700/50 px-4 py-1 rounded-full flex items-center gap-2 border border-slate-600">
                                <Layers size={14} className="text-purple-400" />
                                <span className="text-sm font-bold text-purple-200">{t.level} {stats.level}</span>
                            </div>
                        </div>
                    )}

                    {/* Stats Grid */}
                    {stats && (
                        <div className="grid grid-cols-3 gap-2 border-t border-slate-700/50 pt-4 mt-2">
                            <div className="flex flex-col items-center">
                                <Target size={16} className="text-purple-400 mb-1" />
                                <span className="text-lg font-bold text-white">{accuracy}%</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wide">{t.accuracy}</span>
                            </div>
                            <div className="flex flex-col items-center border-l border-slate-700/50">
                                <Zap size={16} className="text-yellow-400 mb-1" />
                                <span className="text-lg font-bold text-white">{stats.maxCombo}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wide">{t.maxCombo}</span>
                            </div>
                            <div className="flex flex-col items-center border-l border-slate-700/50">
                                <MousePointer size={16} className="text-blue-400 mb-1" />
                                <span className="text-lg font-bold text-white">{stats.totalHits}</span>
                                <span className="text-[10px] text-slate-500 uppercase tracking-wide">{t.totalHits}</span>
                            </div>
                        </div>
                    )}

                    {isNewRecord && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-yellow-400 animate-pulse">
                            <Award size={20} />
                            <span className="font-bold">{t.newHighScore}</span>
                        </div>
                    )}
                </div>

                {/* Rewarded Ad Buttons */}
                {!hasUsedRevive && (
                    <button
                        onClick={onReviveAd}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 p-4 rounded-2xl transition-all shadow-lg shadow-green-500/30 active:scale-95 mb-4 animate-pulse"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-3xl">📺</span>
                            <div className="text-left">
                                <div className="text-white font-bold text-lg">Devam Et!</div>
                                <div className="text-green-100 text-sm">Reklam izle ve oyuna dön</div>
                            </div>
                        </div>
                    </button>
                )}

                {hasUsedRevive && stats && stats.starsEarned > 0 && (
                    <button
                        onClick={onDoubleStarsAd}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 p-4 rounded-2xl transition-all shadow-lg shadow-yellow-500/30 active:scale-95 mb-4"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-3xl">📺</span>
                            <div className="text-left">
                                <div className="text-white font-bold text-lg">2x Yıldız Kazan!</div>
                                <div className="text-yellow-100 text-sm">{stats.starsEarned} → {stats.starsEarned * 2} yıldız</div>
                            </div>
                        </div>
                    </button>
                )}

                <div className="grid grid-cols-2 gap-4 w-full">
                    <button
                        onClick={handleHome}
                        className="flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl transition-colors border border-slate-700 active:scale-95"
                    >
                        <Home size={24} className="text-slate-400" />
                        <span className="font-semibold text-slate-200">{t.home}</span>
                    </button>

                    <button
                        onClick={handleRestart}
                        className="flex flex-col items-center justify-center gap-2 bg-white hover:bg-slate-200 p-4 rounded-2xl transition-colors shadow-lg shadow-white/10 active:scale-95"
                    >
                        <RotateCcw size={24} className="text-slate-900" />
                        <span className="font-bold text-slate-900">{t.retry}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameOver;