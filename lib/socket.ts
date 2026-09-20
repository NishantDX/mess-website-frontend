import { io, Socket } from "socket.io-client";

// Singleton so every component that asks for the socket shares one real
// connection instead of opening a new one each time.
let socket: Socket | null = null;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null; // never connect during SSR
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return null;

  if (!socket) {
    socket = io(url, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
  }
  return socket;
}
