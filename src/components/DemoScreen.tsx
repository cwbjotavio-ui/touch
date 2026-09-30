import { useState, useEffect, useRef, useCallback } from 'react';
import { playAlertSound, playSuccessSound, playUrgentBeep, resumeAudioContext } from '../utils/sound';

interface DemoScreenProps {
  mode: 'tap' | 'hold';
  onBack: () => void;
}

function vibrate(pattern: number | number[]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

export default function DemoScreen({ mode, onBack }: DemoScreenProps) {
  const [isActive, setIsActive] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const activateTimeRef = useRef<number>(0);
  const holdIntervalRef = useRef<number | null>(null);
  const flashIntervalRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number>(0);
  const beepIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const HOLD_DURATION = 2000;

  // Random activation
  const scheduleActivation = useCallback(() => {
    const delay = 2000 + Math.random() * 4000; // 2-6 seconds
    timeoutRef.current = window.setTimeout(() => {
      setIsActive(true);
      setCompleted(false);
      activateTimeRef.current = Date.now();
    }, delay);
  }, []);

  useEffect(() => {
    scheduleActivation();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [scheduleActivation]);

  // Flash effect
  useEffect(() => {
    if (isActive && !completed) {
      resumeAudioContext();
      playAlertSound();
      vibrate([200, 100, 200, 100, 400]);

      flashIntervalRef.current = window.setInterval(() => {
        setFlashOn(prev => !prev);
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
    const time = Date.now() - activateTimeRef.current;
    setReactionTime(time);
    setBestTime(prev => prev === null ? time : Math.min(prev, time));
    setScore(prev => prev + 1);
    setCompleted(true);
    setIsActive(false);
    setIsHolding(false);
    setHoldProgress(0);
    if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
    if (beepIntervalRef.current) clearInterval(beepIntervalRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    playSuccessSound();
    vibrate([100, 50, 100, 50, 200]);

    // Schedule next activation
    setTimeout(() => {
      setCompleted(false);
      scheduleActivation();
    }, 2000);
  }, [scheduleActivation]);

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

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center select-none transition-colors duration-75 ${
        completed
          ? 'bg-green-700'
          : isActive
          ? flashOn
            ? 'bg-red-600'
            : 'bg-gray-900'
          : 'bg-gray-900'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="fixed top-4 right-4 z-50 text-white/40 hover:text-white/80 transition-colors bg-black/20 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center"
      >
        <i className="fas fa-times text-sm" />
      </button>

      {/* Score */}
      <div className="absolute top-4 left-4 z-50 bg-black/30 backdrop-blur-sm rounded-xl px-3 py-2">
        <div className="text-yellow-400 font-bold text-lg">🏆 {score}</div>
      </div>

      {/* Background glow */}
      {isActive && !completed && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-75"
          style={{
            background: flashOn
              ? 'radial-gradient(circle at center, rgba(239,68,68,0.6) 0%, transparent 70%)'
              : 'none'
          }}
        />
      )}

      {/* Rings */}
      {isActive && !completed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-64 h-64 rounded-full border-2 ${
            flashOn ? 'border-red-300/60 scale-100' : 'border-transparent scale-75'
          } transition-all duration-150`} />
          <div className={`absolute w-80 h-80 rounded-full border ${
            flashOn ? 'border-red-400/30' : 'border-transparent'
          } transition-all duration-200`} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8">
        {!isActive && !completed && (
          <>
            <div className="text-7xl">💤</div>
            <h2 className="text-white text-2xl font-bold text-center">
              Aguardando...
            </h2>
            <p className="text-gray-400 text-center">
              Prepare-se! A luz vai acender a qualquer momento
            </p>
            <div className="mt-4 bg-gray-800 px-4 py-2 rounded-full">
              <span className="text-gray-400 text-sm">Modo: {mode === 'tap' ? '👆 Toque' : '👇 Segurar'}</span>
            </div>
          </>
        )}

        {isActive && !completed && (
          <>
            <div className={`text-8xl transition-transform duration-75 ${
              flashOn ? 'scale-125' : 'scale-100'
            }`}>
              {mode === 'tap' ? '👆' : '👇'}
            </div>
            <h2 className={`text-3xl font-black text-center ${
              flashOn ? 'text-white' : 'text-red-200'
            } transition-colors duration-75`}>
              {mode === 'tap' ? 'TOQUE!' : 'SEGURE!'}
            </h2>
            
            {mode === 'hold' && (
              <div className="w-72 mt-4">
                <div className="w-full h-5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                  <div
                    className="h-full rounded-full transition-all duration-75"
                    style={{
                      width: `${holdProgress * 100}%`,
                      background: 'linear-gradient(90deg, #f59e0b, #22c55e)',
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {completed && (
          <>
            <div className="text-7xl animate-bounce">✅</div>
            <h2 className="text-white text-3xl font-black">COMPLETO!</h2>
            {reactionTime && (
              <div className="text-center">
                <p className="text-green-200 text-xl font-mono">
                  {mode === 'tap' ? `${reactionTime}ms` : `${(reactionTime / 1000).toFixed(1)}s`}
                </p>
                {bestTime && (
                  <p className="text-green-300/60 text-sm mt-1">
                    Melhor: {mode === 'tap' ? `${bestTime}ms` : `${(bestTime / 1000).toFixed(1)}s`}
                  </p>
                )}
              </div>
            )}
            <p className="text-green-200/60 text-sm">Próximo em 2s...</p>
          </>
        )}
      </div>
    </div>
  );
}
