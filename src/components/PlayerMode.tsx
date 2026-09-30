import { useState, useEffect, useCallback } from 'react';
import { usePlayerPeer, PeerMessage } from '../hooks/usePeer';
import GameScreen from './GameScreen';

interface PlayerModeProps {
  roomId: string;
  playerName: string;
  onBack: () => void;
}

export default function PlayerMode({ roomId, playerName, onBack }: PlayerModeProps) {
  const { isConnected, isReady, lastMessage, sendMessage, error } = usePlayerPeer(roomId, playerName);
  const [gameMode, setGameMode] = useState<'tap' | 'hold'>('tap');
  const [isActive, setIsActive] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Handle messages from master
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'activate':
        setIsActive(true);
        if (lastMessage.payload?.mode) {
          setGameMode(lastMessage.payload.mode);
        }
        break;
      case 'set-mode':
        if (lastMessage.payload?.mode) {
          setGameMode(lastMessage.payload.mode);
        }
        break;
      case 'game-state':
        if (lastMessage.payload?.active === false) {
          setIsActive(false);
        }
        break;
      case 'player-list':
        // Could display player list info if needed
        break;
    }
  }, [lastMessage]);

  // Handle peer errors
  useEffect(() => {
    if (error) {
      setConnectionError(true);
    }
  }, [error]);

  // Connection timeout
  useEffect(() => {
    if (!isReady) return;
    
    const timeout = setTimeout(() => {
      if (!isConnected) {
        setConnectionError(true);
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [isReady, isConnected]);

  const handleGameComplete = useCallback(() => {
    setIsActive(false);
    const message: PeerMessage = {
      type: 'completed',
      payload: { player: playerName }
    };
    sendMessage(message);
  }, [sendMessage, playerName]);

  // Loading state
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
        <div className="relative">
          <div className="animate-spin w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full" />
          <div className="absolute inset-0 animate-ping w-14 h-14 border-4 border-purple-500/30 rounded-full" />
        </div>
        <p className="text-gray-300 mt-8 text-lg">Conectando...</p>
        <p className="text-gray-600 text-sm mt-2 font-mono">Sala: {roomId}</p>
      </div>
    );
  }

  // Connection error
  if (connectionError && !isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-6">
        <div className="text-6xl mb-6">😕</div>
        <h2 className="text-2xl font-bold mb-3 text-center">Conexão Falhou</h2>
        <p className="text-gray-400 text-center mb-2 max-w-sm">
          {error || 'Não foi possível conectar ao mestre. Verifique se o código da sala está correto e se o mestre já criou a sala.'}
        </p>
        <div className="bg-gray-800 rounded-lg px-4 py-2 mt-4 mb-8">
          <span className="text-gray-500 text-sm">Código: </span>
          <span className="text-purple-400 font-mono font-bold">{roomId}</span>
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={onBack}
            className="flex-1 px-6 py-4 bg-gray-700 rounded-xl font-medium hover:bg-gray-600 transition-colors text-center"
          >
            ← Voltar
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-6 py-4 bg-purple-600 rounded-xl font-medium hover:bg-purple-500 transition-colors text-center"
          >
            Tentar de Novo
          </button>
        </div>
      </div>
    );
  }

  // Game screen (full screen experience)
  return (
    <div className="relative">
      {/* Back button overlay - only when not active */}
      {!isActive && (
        <button
          onClick={onBack}
          className="fixed top-4 left-4 z-50 text-white/40 hover:text-white/80 transition-colors bg-black/20 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center"
        >
          <i className="fas fa-arrow-left text-sm" />
        </button>
      )}
      
      <GameScreen
        mode={gameMode}
        isActive={isActive}
        onComplete={handleGameComplete}
        playerName={playerName}
      />
    </div>
  );
}
