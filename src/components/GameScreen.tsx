import { useState, useEffect, useRef, useCallback } from 'react';
import { playAlertSound, playSuccessSound, playUrgentBeep, resumeAudioContext } from '../utils/sound';

interface GameScreenProps {
  mode: 'tap' | 'hold';
  isActive: boolean;
  onComplete: () => void;
  playerName?: string;
}

function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export default function GameScreen({ mode, isActive, onComplete, playerName }: GameScreenProps) {
  const [flashOn, setFlashOn] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [waiting, setWaiting] = useState(!isActive);
  const [flashCount, setFlashCount] = useState(0);
  const holdIntervalRef = useRef<number | null>(null);
  const flashIntervalRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number>(0);
  const beepIntervalRef = useRef<number | null>(null);

  const HOLD_DURATION = 2000; // 2 seconds to hold

  // Flash effect when active
  useEffect(() => {
    if (isActive && !completed) {
      setWaiting(false);
      resumeAudioContext();
      playAlertSound();
      vibrate([200, 100, 200, 100, 400]);
      
      flashIntervalRef.current = window.setInterval(() => {
        setFlashOn(prev => !prev);
        setFlashCount(prev => prev + 1);
      }, 300);

      beepIntervalRef.current = window.setInterval(() => {
        playUrgentBeep();
        vibrate(50);
      }, 600);

      return () => {
        if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
        if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
      };
    } else {
      setFlashOn(false);
      if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
      if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
    }
  }, [isActive, completed]);

  const handleComplete = useCallback(() => {
    setCompleted(true);
    setFlashOn(false);
    setIsHolding(false);
    if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
    if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    playSuccessSound();
    vibrate([100, 50, 100, 50, 200]);
    onComplete();
  }, [onComplete]);

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!isActive || completed) return;
    
    resumeAudioContext();

    if (mode === 'tap') {
      handleComplete();
    } else if (mode === 'hold') {
      setIsHolding(true);
      holdStartTimeRef.current = Date.now();
      vibrate(30);
      
      holdIntervalRef.current = window.setInterval(() => {
        const elapsed = Date.now() - holdStartTimeRef.current;
        const progress = Math.min(elapsed / HOLD_DURATION, 1);
        setHoldProgress(progress);
        
        if (progress >= 1) {
          handleComplete();
        }
      }, 50);
    }
  }, [isActive, completed, mode, handleComplete]);

  const handleTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (mode === 'hold' && isHolding && holdProgress < 1) {
      setIsHolding(false);
      setHoldProgress(0);
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    }
  }, [mode, isHolding, holdProgress]);

  // Reset when deactivated
  useEffect(() => {
    if (!isActive) {
      setCompleted(false);
      setWaiting(true);
      setHoldProgress(0);
      setIsHolding(false);
      setFlashCount(0);
    }
  }, [isActive]);

  const bgGlow = flashOn && isActive && !completed
    ? 'radial-gradient(circle at center, rgba(239,68,68,0.6) 0%, rgba(239,68,68,0.2) 40%, transparent 70%)'
    : completed
    ? 'radial-gradient(circle at center, rgba(34,197,94,0.4) 0%, transparent 60%)'
    : 'none';

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center select-none transition-colors duration-75 ${
        waiting
          ? 'bg-gray-900'
          : completed
          ? 'bg-green-700'
          : flashOn
          ? 'bg-red-600'
          : 'bg-gray-900'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-75"
        style={{ background: bgGlow }}
      />

      {/* Animated rings when active */}
      {isActive && !completed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-64 h-64 rounded-full border-2 ${
            flashOn ? 'border-red-300/60 scale-100' : 'border-transparent scale-75'
          } transition-all duration-150`} />
          <div className={`absolute w-80 h-80 rounded-full border ${
            flashOn ? 'border-red-400/30 scale-100' : 'border-transparent scale-75'
          } transition-all duration-200`} />
          <div className={`absolute w-96 h-96 rounded-full border ${
            flashOn ? 'border-red-500/15 scale-100' : 'border-transparent scale-75'
          } transition-all duration-300`} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8">
        {waiting && (
          <>
            <div className="relative">
              <div className="text-7xl mb-2">📱</div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-gray-900" />
            </div>
            <h2 className="text-white text-2xl font-bold text-center">
              {playerName || 'Jogador'}
            </h2>
            <p className="text-gray-400 text-lg text-center max-w-xs">
              Aguardando o mestre ativar este dispositivo
            </p>
            <div className="mt-6 flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-sm font-medium">Conectado</span>
            </div>
            
            <div className="mt-8 text-gray-600 text-sm text-center">
              <p>Modo: <span className="text-gray-400">{mode === 'tap' ? '👆 Toque' : '👇 Segurar'}</span></p>
            </div>
          </>
        )}

        {isActive && !completed && (
          <>
            <div className={`text-8xl transition-transform duration-75 ${
              flashOn ? 'scale-130 rotate-3' : 'scale-100 rotate-0'
            }`}>
              {mode === 'tap' ? '👆' : '👇'}
            </div>
            <h2 className={`text-3xl font-black text-center ${
              flashOn ? 'text-white' : 'text-red-200'
            } transition-colors duration-75`}>
              {mode === 'tap' ? 'TOQUE!' : 'SEGURE!'}
            </h2>
            <p className="text-white/70 text-base text-center">
              {mode === 'tap' ? 'Toque na tela para parar' : `Segure por ${HOLD_DURATION / 1000} segundos`}
            </p>
            
            {/* Hold progress bar */}
            {mode === 'hold' && (
              <div className="w-72 mt-4">
                <div className="w-full h-5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                  <div
                    className="h-full rounded-full transition-all duration-75 ease-linear"
                    style={{
                      width: `${holdProgress * 100}%`,
                      background: `linear-gradient(90deg, #f59e0b ${0}%, #22c55e ${100}%)`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-500 text-xs">0s</span>
                  <span className="text-gray-400 text-xs font-mono">{(holdProgress * 2).toFixed(1)}s</span>
                  <span className="text-gray-500 text-xs">2s</span>
                </div>
              </div>
            )}
          </>
        )}

        {completed && (
          <>
            <div className="text-8xl animate-bounce">✅</div>
            <h2 className="text-white text-3xl font-black text-center">
              COMPLETO!
            </h2>
            <p className="text-green-200 text-lg text-center">
              Aguardando próximo round...
            </p>
          </>
        )}
      </div>

      {/* Bottom info bar */}
      <div className="absolute bottom-8 left-6 right-6 flex justify-between items-center">
        <span className="text-gray-600 text-xs uppercase tracking-widest">
          {mode === 'tap' ? '👆 Toque' : '👇 Segurar'}
        </span>
        {playerName && (
          <span className="text-gray-600 text-xs">{playerName}</span>
        )}
      </div>
    </div>
  );
}
