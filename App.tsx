
import React, { useState, useEffect } from 'react';
import { GameState, Language, GameStats } from './types';
import { INITIAL_LIVES } from './constants';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import GameOver from './components/GameOver';
import { startMusic, stopMusic, resumeAudio } from './utils/audio';
import { App as CapApp } from '@capacitor/app';
import { isNative } from './utils/platform';
import { adMobService, AdRewardType } from './utils/admob';
import { AdMobRewardItem } from '@capacitor-community/admob';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [highScore, setHighScore] = useState(0);
  const [language, setLanguage] = useState<Language>('en');
  const [lastStats, setLastStats] = useState<GameStats | null>(null);
  const [isAppActive, setIsAppActive] = useState(true);

  // Ad-related state
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [hasUsedRevive, setHasUsedRevive] = useState(false);
  const [watchedRewardedAd, setWatchedRewardedAd] = useState(false);
  const [savedGameState, setSavedGameState] = useState<{ score: number; lives: number } | null>(null);

  // Load high score and language from local storage
  useEffect(() => {
    const storedScore = localStorage.getItem('taptaptap-highscore');
    if (storedScore) {
      setHighScore(parseInt(storedScore, 10));
    }

    const storedLang = localStorage.getItem('taptaptap-language');
    if (storedLang) {
      setLanguage(storedLang as Language);
    } else {
      // Detect browser language
      const browserLang = navigator.language.split('-')[0];
      if (['es', 'pt', 'fr', 'de', 'jp', 'kr'].includes(browserLang)) {
        setLanguage(browserLang as Language);
      }
    }
  }, []);

  // App lifecycle management for native apps
  useEffect(() => {
    if (!isNative()) return;

    let cleanup: (() => void) | undefined;

    const setupListener = async () => {
      const appStateListener = await CapApp.addListener('appStateChange', ({ isActive }) => {
        setIsAppActive(isActive);

        if (isActive) {
          // App resumed - resume audio context
          resumeAudio();
        } else {
          // App went to background - pause music
          stopMusic();
        }
      });

      cleanup = () => appStateListener.remove();
    };

    setupListener();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Initialize AdMob
  useEffect(() => {
    adMobService.initialize();
  }, []);

  // Music State Manager
  useEffect(() => {
    stopMusic(); // Stop current track before switching
    if (gameState === 'MENU') {
      startMusic('MENU');
    } else if (gameState === 'PLAYING') {
      // GameScreen handles its own music start to sync with pause
    } else {
      // GAME_OVER - silence or sad music is handled by playSound('gameover')
      stopMusic();
    }

    return () => stopMusic();
  }, [gameState]);

  const updateLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('taptaptap-language', lang);
  }

  // Update high score when game ends
  const handleGameOver = (stats: GameStats) => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('taptaptap-highscore', score.toString());
    }
    setLastStats(stats);
    setGamesPlayed(prev => prev + 1);
    setGameState('GAME_OVER');
  };

  const handleStartGame = () => {
    setScore(0);
    setLives(INITIAL_LIVES);
    setHasUsedRevive(false);
    setWatchedRewardedAd(false);
    setSavedGameState(null);
    setGameState('PLAYING');
  };

  const handleLoseLife = () => {
    setLives((prev) => prev - 1);
  };

  const handleHome = () => {
    // Show interstitial ad every 3 games (if no rewarded ad was watched)
    const shouldShowInterstitial = gamesPlayed > 0 && gamesPlayed % 3 === 0 && !watchedRewardedAd;

    if (shouldShowInterstitial) {
      adMobService.showInterstitialAd(() => {
        setGameState('MENU');
      });
    } else {
      setGameState('MENU');
    }
  };

  // Rewarded ad callback for revive
  const handleReviveAd = () => {
    // Save current game state before showing ad
    // setSavedGameState({ score, lives }); // Not strictly needed as we keep state in App

    adMobService.showRewardedAd('revive', (success, type) => {
      if (success) {
        setWatchedRewardedAd(true);
        setHasUsedRevive(true);

        // CRITICAL: Restore lives before resuming!
        setLives(1);

        // Resume game with saved state
        setGameState('PLAYING');
      }
    });
  };

  // Rewarded ad callback for 2x stars
  const handleDoubleStarsAd = () => {
    if (!lastStats) return;

    adMobService.showRewardedAd('double_stars', (success, type) => {
      if (success) {
        setWatchedRewardedAd(true);
        // Double the stars earned
        const updatedStats = {
          ...lastStats,
          starsEarned: lastStats.starsEarned * 2
        };
        setLastStats(updatedStats);
      }
    });
  };

  const handleRestart = () => {
    // Show interstitial ad every 3 games (if no rewarded ad was watched)
    const shouldShowInterstitial = gamesPlayed > 0 && gamesPlayed % 3 === 0 && !watchedRewardedAd;

    if (shouldShowInterstitial) {
      adMobService.showInterstitialAd(() => {
        handleStartGame();
      });
    } else {
      handleStartGame();
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-900 overflow-hidden relative">
      {gameState === 'MENU' && (
        <MainMenu
          onStart={handleStartGame}
          highScore={highScore}
          language={language}
          setLanguage={updateLanguage}
        />
      )}

      {gameState === 'PLAYING' && (
        <GameScreen
          lives={lives}
          score={score}
          setScore={setScore}
          setLives={setLives}
          onGameOver={handleGameOver}
          onLoseLife={handleLoseLife}
          onHome={handleHome}
          language={language}
          isResuming={hasUsedRevive}
        />
      )}

      {gameState === 'GAME_OVER' && (
        <GameOver
          score={score}
          highScore={highScore}
          stats={lastStats}
          onRestart={handleRestart}
          onHome={handleHome}
          language={language}
          hasUsedRevive={hasUsedRevive}
          onReviveAd={handleReviveAd}
          onDoubleStarsAd={handleDoubleStarsAd}
        />
      )}
    </div>
  );
};

export default App;