"use client";

import { io, type Socket } from "socket.io-client";

export interface RiderMovedPayload {
  lat: number;
  lng: number;
}

export interface OrderStatusChangedPayload {
  orderId: string;
  status: string;
}

const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

export const socket: Socket = io(socketServerUrl ?? "", {
  autoConnect: false,
});

export function joinOrderRoom(orderId: string): void {
  socket.emit("join_order", { orderId });
}

export function joinMerchantRoom(branchId: string): void {
  socket.emit("join_merchant", { branchId });
}

export function joinRiderRoom(riderId: string): void {
  socket.emit("join_rider", { riderId });
}