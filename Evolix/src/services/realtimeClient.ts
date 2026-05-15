import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './apiConfig';
import { getAuthSession } from './authApi';

export function createRealtimeSocket(): Socket | null {
  const session = getAuthSession();

  if (!session?.user.id) {
    return null;
  }

  const baseUrl = API_BASE_URL || window.location.origin;

  return io(baseUrl, {
    transports: ['websocket'],
    auth: {
      token: session.token,
    },
  });
}