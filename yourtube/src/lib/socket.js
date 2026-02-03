import { io } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// Only create socket on client side
let socket;

if (typeof window !== 'undefined') {
  socket = io(BACKEND_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling']
  });
}

export { socket };
export default socket;
