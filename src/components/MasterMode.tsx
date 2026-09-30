import { useState, useCallback, useRef } from 'react';
import { useMasterPeer, PeerMessage } from '../hooks/usePeer';

interface MasterModeProps {
  roomId: string;
  onBack: () => void;
}

export default function MasterMode({ roomId, onBack }: MasterModeProps) {
  const { players, isReady, sendToPlayer, sendToAll } = useMasterPeer(roomId);
  const [mode, setMode] = useState<'tap' | 'hold'>('tap');
  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const autoIntervalRef = useRef<number | null>(null);
  const lastActivatedRef = useRef<string | null>(null);

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivatePlayer = useCallback((playerId: string) => {
    // Deactivate previous
    if (activePlayer && activePlayer !== playerId) {
      sendToPlayer(activePlayer, { type: 'game-state', payload: { active: false } });
    }
    
    setActivePlayer(playerId);
    lastActivatedRef.current = playerId;
    const message: PeerMessage = {
      type: 'activate',
      payload: { mode }
    };
    sendToPlayer(playerId, message);
  }, [mode, sendToPlayer, activePlayer]);

  const handleSetMode = (newMode: 'tap' | 'hold') => {
    setMode(newMode);
    sendToAll({ type: 'set-mode', payload: { mode: newMode } });
  };

  const handleNextRandom = () => {
    const connectedPlayers = players.filter(p => p.connected);
    if (connectedPlayers.length === 0) return;
    
    // Try to pick a different player than last time
    const available = connectedPlayers.filter(p => p.id !== lastActivatedRef.current);
    const pool = available.length > 0 ? available : connectedPlayers;
    const randomPlayer = pool[Math.floor(Math.random() * pool.length)];
    
    handleActivatePlayer(randomPlayer.id);
  };

  const handleDeactivateAll = () => {
    setActivePlayer(null);
    lastActivatedRef.current = null;
    sendToAll({ type: 'game-state', payload: { active: false } });
    // Stop auto mode
    if (autoMode) {
      setAutoMode(false);
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
    }
  };

  const handleToggleAuto = () => {
    if (autoMode) {
      setAutoMode(false);
      if (autoIntervalRef.current) {
        clearInterval(autoIntervalRef.current);
        autoIntervalRef.current = null;
      }
    } else {
      setAutoMode(true);
      // Immediately activate one
      handleNextRandom();
      // Then cycle every 4 seconds
      autoIntervalRef.current = window.setInterval(() => {
        handleNextRandom();
      }, 4000);
    }
  };

  const handleActivateAll = () => {
    sendToAll({ type: 'activate', payload: { mode } });
    setActivePlayer('all');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 safe-bottom">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors w-10 h-10 flex items-center justify-center"
        >
          <i className="fas fa-arrow-left text-xl" />
        </button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">👑</span> Mestre
        </h1>
        <div className={`w-3 h-3 rounded-full transition-colors ${isReady ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
      </div>

      {/* Room Info */}
      <div className="bg-gray-800/80 rounded-2xl p-4 mb-5 border border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Código da Sala</span>
          <button
            onClick={handleCopyRoomId}
            className={`text-sm transition-all px-3 py-1 rounded-full ${
              copied 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
            }`}
          >
            {copied ? '✓ Copiado!' : '📋 Copiar'}
          </button>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 text-center">
          <span className="text-3xl font-mono font-bold tracking-[0.3em] text-purple-300">{roomId}</span>
        </div>
        <p className="text-gray-500 text-xs mt-2 text-center">
          Compartilhe este código com os outros dispositivos
        </p>
      </div>

      {/* Mode Selection */}
      <div className="bg-gray-800/80 rounded-2xl p-4 mb-5 border border-gray-700/50">
        <h3 className="text-gray-400 text-sm mb-3 font-medium">Modo de Jogo</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSetMode('tap')}
            className={`p-4 rounded-xl border-2 transition-all active:scale-95 ${
              mode === 'tap'
                ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/10'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800'
            }`}
          >
            <div className="text-3xl mb-2">👆</div>
            <div className="font-bold text-sm">Toque</div>
            <div className="text-xs text-gray-400 mt-1">Toque para parar</div>
          </button>
          <button
            onClick={() => handleSetMode('hold')}
            className={`p-4 rounded-xl border-2 transition-all active:scale-95 ${
              mode === 'hold'
                ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/10'
                : 'border-gray-700 hover:border-gray-600 bg-gray-800'
            }`}
          >
            <div className="text-3xl mb-2">👇</div>
            <div className="font-bold text-sm">Segurar</div>
            <div className="text-xs text-gray-400 mt-1">Segure por 2s</div>
          </button>
        </div>
      </div>

      {/* Quick Controls */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <button
          onClick={handleNextRandom}
          disabled={players.filter(p => p.connected).length === 0}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:from-purple-500 hover:to-pink-500 transition-all active:scale-95 text-sm"
        >
          🎲 Aleatório
        </button>
        <button
          onClick={handleActivateAll}
          disabled={players.filter(p => p.connected).length === 0}
          className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:from-orange-500 hover:to-red-500 transition-all active:scale-95 text-sm"
        >
          🔥 Todos
        </button>
        <button
          onClick={handleDeactivateAll}
          className="bg-gray-700 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition-all active:scale-95 text-sm"
        >
          ⏹ Parar
        </button>
      </div>

      {/* Auto mode toggle */}
      <button
        onClick={handleToggleAuto}
        disabled={players.filter(p => p.connected).length === 0}
        className={`w-full py-3 rounded-xl font-bold mb-5 transition-all active:scale-98 disabled:opacity-40 ${
          autoMode
            ? 'bg-green-600 text-white animate-pulse'
            : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600'
        }`}
      >
        {autoMode ? '⚡ Auto Mode: LIGADO (toque para parar)' : '⚡ Auto Mode (ciclo automático)'}
      </button>

      {/* Player List */}
      <div className="bg-gray-800/80 rounded-2xl p-4 border border-gray-700/50">
        <h3 className="text-gray-400 text-sm mb-3 font-medium flex items-center justify-between">
          <span>Dispositivos</span>
          <span className="bg-gray-700 px-2 py-0.5 rounded-full text-xs">
            {players.filter(p => p.connected).length}/{players.length}
          </span>
        </h3>
        
        {players.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-5xl mb-4 animate-bounce">📡</div>
            <p className="text-gray-400 font-medium">Aguardando dispositivos...</p>
            <p className="text-gray-600 text-sm mt-2 max-w-xs mx-auto">
              Abra este site em outro celular e entre com o código <span className="text-purple-400 font-mono">{roomId}</span>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map((player) => (
              <button
                key={player.id}
                onClick={() => handleActivatePlayer(player.id)}
                disabled={!player.connected}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-98 ${
                  activePlayer === player.id
                    ? 'bg-red-500/20 border border-red-500/50 shadow-lg shadow-red-500/10'
                    : player.connected
                    ? 'bg-gray-700/50 hover:bg-gray-700 border border-gray-700'
                    : 'bg-gray-800/50 opacity-40 border border-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    player.connected ? 'bg-green-400' : 'bg-red-400'
                  }`} />
                  <div className="text-left">
                    <span className="font-medium block">{player.name}</span>
                    <span className="text-xs text-gray-500">
                      {player.connected ? 'Online' : 'Desconectado'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activePlayer === player.id && (
                    <span className="text-red-400 text-xs font-bold animate-pulse bg-red-500/20 px-2 py-1 rounded-full">
                      ● ATIVO
                    </span>
                  )}
                  {player.connected && (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <i className="fas fa-play text-xs text-gray-300" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 mb-4 text-center">
        <p className="text-gray-600 text-xs">
          Toque em um jogador para ativar a luz e som no dispositivo dele.
        </p>
        <p className="text-gray-600 text-xs mt-1">
          O jogador deve tocar/segurar para completar e desativar.
        </p>
      </div>
    </div>
  );
}
