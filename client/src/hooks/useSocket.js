import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.MODE === "production" ? "" : (import.meta.env.VITE_SOCKET_URL || "http://localhost:5001");

let socket;

export const useSocket = (userId) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    if (!socket) {
      socket = io(SOCKET_URL);
    }

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('register', userId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      // We keep the socket alive globally but can remove listeners if needed
    };
  }, [userId]);

  return { socket, isConnected };
};
