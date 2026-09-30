import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { DataConnection } from 'peerjs';

export interface PeerMessage {
  type: 'activate' | 'completed' | 'register' | 'player-list' | 'set-mode' | 'next-player' | 'game-state';
  payload?: any;
}

export interface PlayerInfo {
  id: string;
  name: string;
  connected: boolean;
}

export function useMasterPeer(roomId: string) {
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [isReady, setIsReady] = useState(false);
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map());
  const playersRef = useRef<PlayerInfo[]>([]);

  // Keep ref in sync
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const broadcastPlayerList = useCallback(() => {
    const msg: PeerMessage = {
      type: 'player-list',
      payload: { players: playersRef.current }
    };
    connectionsRef.current.forEach(conn => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }, []);

  useEffect(() => {
    const p = new Peer(`touch-master-${roomId}`, {
      debug: 1,
    });

    p.on('open', (id) => {
      console.log('Master peer open:', id);
      setIsReady(true);
    });

    p.on('connection', (conn) => {
      console.log('New connection:', conn.peer);
      
      conn.on('open', () => {
        connectionsRef.current.set(conn.peer, conn);
        
        conn.on('data', (data) => {
          const msg = data as PeerMessage;
          
          if (msg.type === 'register') {
            const playerName = msg.payload?.name || `Player ${connectionsRef.current.size}`;
            setPlayers(prev => {
              const exists = prev.find(p => p.id === conn.peer);
              let newList: PlayerInfo[];
              if (exists) {
                newList = prev.map(p => p.id === conn.peer ? { ...p, name: playerName, connected: true } : p);
              } else {
                newList = [...prev, { id: conn.peer, name: playerName, connected: true }];
              }
              playersRef.current = newList;
              // Broadcast after state update
              setTimeout(() => broadcastPlayerList(), 50);
              return newList;
            });
          }
          
          if (msg.type === 'completed') {
            console.log('Player completed:', conn.peer);
          }
        });

        conn.on('close', () => {
          connectionsRef.current.delete(conn.peer);
          setPlayers(prev => {
            const newList = prev.map(p => p.id === conn.peer ? { ...p, connected: false } : p);
            playersRef.current = newList;
            setTimeout(() => broadcastPlayerList(), 50);
            return newList;
          });
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
          connectionsRef.current.delete(conn.peer);
        });
      });
    });

    p.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type === 'unavailable-id') {
        // Room ID already taken, try with suffix
        console.log('Room ID taken, trying alternative...');
      }
    });

    return () => {
      p.destroy();
    };
  }, [roomId, broadcastPlayerList]);

  const sendToPlayer = useCallback((playerId: string, message: PeerMessage) => {
    const conn = connectionsRef.current.get(playerId);
    if (conn && conn.open) {
      conn.send(message);
      return true;
    }
    return false;
  }, []);

  const sendToAll = useCallback((message: PeerMessage) => {
    connectionsRef.current.forEach(conn => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }, []);

  return { players, isReady, sendToPlayer, sendToAll, connectionsRef };
}

export function usePlayerPeer(roomId: string, playerName: string) {
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [lastMessage, setLastMessage] = useState<PeerMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const playerId = `touch-player-${roomId}-${Math.random().toString(36).substr(2, 6)}`;
    const p = new Peer(playerId, {
      debug: 1,
    });

    p.on('open', () => {
      setIsReady(true);
      // Connect to master
      const conn = p.connect(`touch-master-${roomId}`, { reliable: true });
      
      conn.on('open', () => {
        setConnection(conn);
        setIsConnected(true);
        setError(null);
        
        // Register with master
        conn.send({
          type: 'register',
          payload: { name: playerName }
        } as PeerMessage);

        conn.on('data', (data) => {
          const msg = data as PeerMessage;
          setLastMessage(msg);
        });

        conn.on('close', () => {
          setIsConnected(false);
        });

        conn.on('error', (err) => {
          console.error('Connection data error:', err);
        });
      });

      conn.on('error', (err) => {
        console.error('Connection error:', err);
        setError('Não foi possível conectar ao mestre');
      });
    });

    p.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type === 'peer-unavailable') {
        setError('Mestre não encontrado. Verifique o código da sala.');
      }
    });

    return () => {
      p.destroy();
    };
  }, [roomId, playerName]);

  const sendMessage = useCallback((message: PeerMessage) => {
    if (connection && connection.open) {
      connection.send(message);
    }
  }, [connection]);

  return { connection, isConnected, isReady, lastMessage, sendMessage, error };
}
