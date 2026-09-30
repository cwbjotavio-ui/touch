import { useState, useEffect } from 'react';
import MasterMode from './components/MasterMode';
import PlayerMode from './components/PlayerMode';
import DemoScreen from './components/DemoScreen';

type Screen = 'home' | 'master' | 'player' | 'join' | 'demo';

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [demoMode, setDemoMode] = useState<'tap' | 'hold'>('tap');

  useEffect(() => {
    const savedName = localStorage.getItem('touch-player-name');
    if (savedName) setPlayerName(savedName);
  }, []);

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setScreen('master');
  };

  const handleJoinRoom = () => {
    if (inputRoomId.trim()) {
      setRoomId(inputRoomId.trim().toUpperCase());
      setScreen('player');
    }
  };

  const handleSaveName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('touch-player-name', name);
  };

  const handleStartDemo = (mode: 'tap' | 'hold') => {
    setDemoMode(mode);
    setScreen('demo');
  };

  // Home Screen
  if (screen === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950/30 to-gray-900 flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="relative inline-block">
            <div className="text-7xl mb-2">👆</div>
            <div className="absolute -inset-6 bg-purple-500/10 rounded-full blur-2xl" />
          </div>
          <h1 className="text-6xl font-black text-white mt-2 tracking-tight">
            TOUCH
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-8 bg-purple-500/50" />
            <p className="text-purple-300/80 text-sm uppercase tracking-widest">Reflexo Multiplayer</p>
            <div className="h-px w-8 bg-purple-500/50" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleCreateRoom}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all active:scale-[0.97] flex items-center justify-center gap-3"
          >
            <span className="text-2xl">👑</span>
            <span>Criar Sala (Mestre)</span>
          </button>

          <button
            onClick={() => setScreen('join')}
            className="w-full bg-gray-800/80 border-2 border-gray-700/80 text-white py-5 rounded-2xl font-bold text-lg hover:border-purple-500/50 hover:bg-gray-800 transition-all active:scale-[0.97] flex items-center justify-center gap-3"
          >
            <span className="text-2xl">📱</span>
            <span>Entrar como Jogador</span>
          </button>

          <div className="pt-2">
            <p className="text-gray-500 text-xs text-center mb-2 uppercase tracking-wider">Ou teste sozinho</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleStartDemo('tap')}
                className="bg-gray-800/50 border border-gray-700/50 text-gray-300 py-3 rounded-xl text-sm font-medium hover:bg-gray-700/50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>👆</span> Demo: Toque
              </button>
              <button
                onClick={() => handleStartDemo('hold')}
                className="bg-gray-800/50 border border-gray-700/50 text-gray-300 py-3 rounded-xl text-sm font-medium hover:bg-gray-700/50 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>👇</span> Demo: Segurar
              </button>
            </div>
          </div>
        </div>

        {/* Player Name */}
        <div className="w-full max-w-sm mt-8">
          <label className="text-gray-500 text-xs mb-2 block uppercase tracking-wider">Seu nome</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => handleSaveName(e.target.value)}
            placeholder="Digite seu nome..."
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        {/* How to play */}
        <div className="w-full max-w-sm mt-8 bg-gray-800/30 rounded-2xl p-5 border border-gray-700/30">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span>📖</span>
            <span>Como Jogar</span>
          </h3>
          <div className="space-y-2.5 text-gray-400 text-sm">
            <p className="flex items-start gap-3">
              <span className="bg-purple-500/20 text-purple-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
              <span>Um dispositivo é o <strong className="text-white">Mestre</strong> que controla o jogo</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="bg-purple-500/20 text-purple-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
              <span>Os outros são <strong className="text-white">Jogadores</strong> que entram com o código</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="bg-purple-500/20 text-purple-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
              <span>O Mestre ativa: <strong className="text-red-300">luz pisca</strong> + <strong className="text-yellow-300">som toca</strong> + vibração</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="bg-purple-500/20 text-purple-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
              <span><strong className="text-white">Toque:</strong> toque na tela para parar a luz</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="bg-purple-500/20 text-purple-300 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">5</span>
              <span><strong className="text-white">Segurar:</strong> segure por 2 segundos para parar</span>
            </p>
          </div>
        </div>

        <p className="text-gray-700 text-xs mt-6">
          Peer-to-peer via PeerJS • Sem servidor necessário
        </p>
      </div>
    );
  }

  // Join Screen
  if (screen === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950/20 to-gray-900 flex flex-col items-center justify-center p-6">
        <button
          onClick={() => setScreen('home')}
          className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors w-10 h-10 flex items-center justify-center"
        >
          <i className="fas fa-arrow-left text-xl" />
        </button>

        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📱</div>
          <h2 className="text-2xl font-bold text-white mb-2">Entrar na Sala</h2>
          <p className="text-gray-400 mb-8">
            Peça o código para o Mestre
          </p>

          <input
            type="text"
            value={inputRoomId}
            onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
            placeholder="CÓDIGO"
            maxLength={6}
            className="w-full bg-gray-800 border-2 border-gray-700 rounded-2xl px-4 py-5 text-white text-center text-3xl font-mono tracking-[0.4em] placeholder-gray-700 focus:outline-none focus:border-purple-500 transition-colors mb-6"
            onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            autoFocus
          />

          <button
            onClick={handleJoinRoom}
            disabled={!inputRoomId.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:from-blue-500 hover:to-purple-500 transition-all active:scale-[0.97]"
          >
            Entrar na Sala
          </button>

          {playerName && (
            <div className="mt-6 bg-gray-800/50 rounded-xl px-4 py-3 inline-flex items-center gap-2">
              <span className="text-gray-500 text-sm">Jogando como:</span>
              <span className="text-purple-400 font-medium">{playerName}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Master Mode
  if (screen === 'master') {
    return <MasterMode roomId={roomId} onBack={() => setScreen('home')} />;
  }

  // Player Mode
  if (screen === 'player') {
    return (
      <PlayerMode
        roomId={roomId}
        playerName={playerName || 'Jogador'}
        onBack={() => setScreen('home')}
      />
    );
  }

  // Demo Mode
  if (screen === 'demo') {
    return <DemoScreen mode={demoMode} onBack={() => setScreen('home')} />;
  }

  return null;
}
