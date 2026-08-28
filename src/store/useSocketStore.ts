"use client";

import { create } from "zustand";
import type { Socket } from "socket.io-client";

export interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  setSocket: (socket: Socket | null) => void;
  setIsConnected: (connected: boolean) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  setSocket: (socket: Socket | null) => set({ socket }),
  setIsConnected: (connected: boolean) => set({ isConnected: connected }),
  disconnect: () => {
    const socket = get().socket;

    if (socket) {
      socket.disconnect();
    }

    set({ socket: null, isConnected: false });
  },
}));
