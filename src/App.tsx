import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Timer, Trophy, RotateCcw, Play, Volume2, VolumeX, BarChart3, ChevronLeft, Target, Activity } from 'lucide-react';
import { soundManager } from './services/soundManager';

enum GameState {
  IDLE = 'IDLE',
  WAITING = 'WAITING',
  REVEALED = 'REVEALED',
  FAIL = 'FAIL',
  RESULT = 'RESULT',
  STATS = 'STATS'
}

interface GameStats {
  totalGames: number;
  successfulGames: number;
  averageTime: number;
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('best_reaction_time');
    return saved ? parseFloat(saved) : null;
  });

  const [stats, setStats] = useState<GameStats>(() => {
    const saved = localStorage.getItem('game_stats');
    return saved ? JSON.parse(saved) : { totalGames: 0, successfulGames: 0, averageTime: 0 };
  });
  
  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);

  const toggleMute = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  }, []);

  const startGame = useCallback(() => {
    soundManager.resumeContext();
    soundManager.playStart();
    soundManager.startMusic();
    
    setGameState(GameState.WAITING);
    setReactionTime(null);
    
    // Random delay between 1.5 and 5 seconds
    const delay = Math.random() * 3500 + 1500;
    
    timeoutRef.current = window.setTimeout(() => {
      soundManager.playTrigger();
      setGameState(GameState.REVEALED);
      startTimeRef.current = performance.now();
    }, delay);
  }, []);

  const updateStats = useCallback((isSuccess: boolean, time: number = 0) => {
    setStats(prev => {
      const newTotal = prev.totalGames + 1;
      const newSuccessful = prev.successfulGames + (isSuccess ? 1 : 0);
      let newAverage = prev.averageTime;

      if (isSuccess) {
        // Calculate running average: (avg * count + new) / newCount
        newAverage = (prev.averageTime * prev.successfulGames + time) / newSuccessful;
      }

      const nextStats = {
        totalGames: newTotal,
        successfulGames: newSuccessful,
        averageTime: newAverage
      };

      localStorage.setItem('game_stats', JSON.stringify(nextStats));
      return nextStats;
    });
  }, []);

  const handleInteraction = useCallback(() => {
    soundManager.resumeContext();
    
    if (gameState === GameState.WAITING) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      soundManager.playFail();
      updateStats(false);
      setGameState(GameState.FAIL);
    } else if (gameState === GameState.REVEALED) {
      const endTime = performance.now();
      const time = endTime - startTimeRef.current;
      soundManager.playSuccess();
      setReactionTime(time);
      updateStats(true, time);
      setGameState(GameState.RESULT);

      if (bestTime === null || time < bestTime) {
        setBestTime(time);
        localStorage.setItem('best_reaction_time', time.toString());
      }
    } else {
      soundManager.playClick();
    }
  }, [gameState, bestTime, updateStats]);

  const getNeuralRank = (ms: number) => {
    if (ms < 150) return { label: 'GOD-LIKE', color: 'text-neon-green', sub: 'Absolute Precision' };
    if (ms < 200) return { label: 'CYBORG', color: 'text-blue-400', sub: 'Highly Optimized' };
    if (ms < 250) return { label: 'ELITE', color: 'text-purple-400', sub: 'Top Tier Reflexes' };
    if (ms < 300) return { label: 'PRO', color: 'text-yellow-400', sub: 'Superior Latency' };
    return { label: 'STANDARD', color: 'text-white/60', sub: 'Human Average' };
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div 
      id="game-viewport"
      className="min-h-screen flex flex-col items-center justify-center p-6 select-none"
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
    >
      <div className="max-w-md w-full space-y-12 relative">
        <div className="absolute -top-4 -right-4 flex gap-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setGameState(gameState === GameState.STATS ? GameState.IDLE : GameState.STATS);
              soundManager.playClick();
            }}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
            title="Statistics"
          >
            {gameState === GameState.STATS ? <ChevronLeft size={18} /> : <BarChart3 size={18} />}
          </button>
          
          <button
            onClick={toggleMute}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        <header className="text-center space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-neon-red font-mono text-xs tracking-[0.2em] uppercase font-bold"
          >
            <Zap size={14} className="fill-neon-red" />
            Performance Neural Link
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-5xl font-bold tracking-tighter text-white"
          >
            SPEED <span className="text-neon-red italic">REFLEX</span>
          </motion.h1>
        </header>

        <main className="relative aspect-square flex items-center justify-center">
          <AnimatePresence mode="wait">
            {gameState === GameState.IDLE && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center space-y-8"
              >
                <p className="text-gray-400 font-medium max-w-[280px] mx-auto text-sm leading-relaxed">
                  Test your neural processing speed. Wait for the screen to turn red, then tap as fast as you can.
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="group relative px-10 py-4 bg-white text-black font-bold text-sm tracking-widest uppercase transition-all hover:pr-12 hover:bg-neon-red hover:text-white"
                >
                  Init Challenge
                  <Play size={16} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                </button>
              </motion.div>
            )}

            {gameState === GameState.WAITING && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-12 h-12 rounded-full bg-white/20"
                  />
                </div>
                <p className="font-mono text-xs text-white/40 uppercase tracking-widest">Wait for visual trigger...</p>
              </motion.div>
            )}

            {gameState === GameState.REVEALED && (
              <motion.div
                key="revealed"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-64 h-64 bg-neon-red flex items-center justify-center rounded-2xl neon-glow-red animate-pulse">
                  <span className="font-bold text-4xl tracking-tighter">TAP!</span>
                </div>
              </motion.div>
            )}

            {gameState === GameState.FAIL && (
              <motion.div
                key="fail"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center space-y-6"
              >
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold text-neon-red tracking-tight">TOO EARLY</h2>
                  <p className="text-white/40 font-mono text-xs uppercase">Neural sync broken</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="flex items-center gap-2 mx-auto text-sm font-bold hover:text-neon-red transition-colors"
                >
                  <RotateCcw size={16} />
                  RETRAIN
                </button>
              </motion.div>
            )}

            {gameState === GameState.RESULT && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8 w-full"
              >
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="font-mono text-xs text-white/40 uppercase tracking-widest flex items-center justify-center gap-2">
                      <Timer size={12} />
                      Latency Detected
                    </div>
                    <div className="text-7xl font-bold tracking-tighter tabular-nums">
                      {reactionTime?.toFixed(0)}<span className="text-2xl text-white/40 font-medium ml-1">ms</span>
                    </div>
                  </div>

                  {reactionTime && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-block px-4 py-1.5 rounded bg-white/5 border border-white/10"
                    >
                      <div className={`text-xs font-bold font-mono tracking-tighter ${getNeuralRank(reactionTime).color}`}>
                        {getNeuralRank(reactionTime).label}
                      </div>
                      <div className="text-[9px] uppercase tracking-widest text-white/40 font-medium">
                        {getNeuralRank(reactionTime).sub}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neon-red/10 flex items-center justify-center text-neon-red">
                      <Trophy size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] text-white/40 uppercase font-mono tracking-wider font-bold">Personal Best</div>
                      <div className="font-bold tabular-nums">{bestTime?.toFixed(0)}ms</div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startGame();
                    }}
                    className="px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-tight hover:bg-neon-red hover:text-white transition-colors rounded"
                  >
                    Next Phase
                  </button>
                </div>
              </motion.div>
            )}

            {gameState === GameState.STATS && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full space-y-8"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight">NEURAL ANALYTICS</h2>
                  <p className="text-white/40 font-mono text-[10px] uppercase tracking-[0.2em]">Session & Lifetime History</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Activity size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-mono font-bold tracking-wider">Total Attempts</div>
                        <div className="text-xl font-bold">{stats.totalGames}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green">
                        <Target size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-mono font-bold tracking-wider">Neural Accuracy</div>
                        <div className="text-xl font-bold">
                          {stats.totalGames > 0 ? ((stats.successfulGames / stats.totalGames) * 100).toFixed(1) : 0}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Timer size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] text-white/40 uppercase font-mono font-bold tracking-wider">Lifetime Average</div>
                        <div className="text-xl font-bold tabular-nums">
                          {stats.averageTime > 0 ? stats.averageTime.toFixed(1) : '--'}
                          <span className="text-sm font-normal text-white/40 ml-1">ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setGameState(GameState.IDLE);
                    soundManager.playClick();
                  }}
                  className="w-full py-4 brutal-border rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  Return to Link
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="grid grid-cols-2 gap-4">
          <div className="brutal-border p-4 rounded-lg bg-white/[0.02] space-y-1">
            <div className="text-[10px] text-white/40 uppercase font-mono font-bold tracking-widest">Protocol</div>
            <div className="text-sm font-medium">Visual Trigger</div>
          </div>
          <div className="brutal-border p-4 rounded-lg bg-white/[0.02] space-y-1 text-right">
            <div className="text-[10px] text-white/40 uppercase font-mono font-bold tracking-widest">Efficiency</div>
            <div className="text-sm font-medium text-neon-green">Ready</div>
          </div>
        </footer>
      </div>

      {/* Global Background Visuals */}
      <div className="fixed inset-0 pointer-events-none z-[-1]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,20,1)_0%,rgba(0,0,0,1)_100%)]" />
        <div className="absolute inset-0 opacity-[0.03] grayscale bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        
        <AnimatePresence>
          {gameState === GameState.REVEALED && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neon-red"
            />
          )}
        </AnimatePresence>
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute top-1/4 left-0 w-full h-[1px] bg-white/20" />
          <div className="absolute top-3/4 left-0 w-full h-[1px] bg-white/20" />
          <div className="absolute left-1/4 top-0 h-full w-[1px] bg-white/20" />
          <div className="absolute left-3/4 top-0 h-full w-[1px] bg-white/20" />
        </div>
      </div>
    </div>
  );
}
