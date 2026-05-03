import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@WebSocketGateway({ cors: true })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly activeUsers = new Map<string, Set<string>>();

  constructor(private jwtService: JwtService, private usersService: UsersService) {}

  async handleConnection(client: Socket) {
    const userId = await this.extractUserId(client);

    if (!userId) {
      client.disconnect(true);
      return;
    }

    const sockets = this.activeUsers.get(userId) ?? new Set<string>();
    sockets.add(client.id);
    this.activeUsers.set(userId, sockets);

    client.data.userId = userId;
    client.emit('connected', {
      userId,
      socketId: client.id,
    });
  }

  async handleDisconnect(client: Socket) {
    const userId = (client.data.userId as string) ?? await this.extractUserId(client);

    if (!userId) {
      return;
    }

    const sockets = this.activeUsers.get(userId);
    if (!sockets) {
      return;
    }

    sockets.delete(client.id);

    if (sockets.size === 0) {
      this.activeUsers.delete(userId);
    }
  }

  emitToUser(userId: string, eventName: string, payload: unknown) {
    const sockets = this.activeUsers.get(userId);

    if (!sockets || sockets.size === 0) {
      return 0;
    }

    let deliveredCount = 0;
    for (const socketId of sockets) {
      this.server.to(socketId).emit(eventName, payload);
      deliveredCount += 1;
    }

    return deliveredCount;
  }

  sendNotificationToFollowers(followerIds: string[], tweetData: unknown) {
    let notifiedCount = 0;

    for (const followerId of followerIds) {
      notifiedCount += this.emitToUser(followerId, 'new_tweet', tweetData);
    }

    return notifiedCount;
  }

  private async extractUserId(client: Socket): Promise<string | null> {
    // Prefer a signed JWT token sent by the client
    const token = (client.handshake.auth && client.handshake.auth.token) || client.handshake.query?.token;

    if (typeof token === 'string' && token.trim()) {
      try {
        const payload: any = await this.jwtService.verifyAsync(token.trim());
        const userId = String(payload?.sub ?? payload?.userId ?? '').trim();
        if (!userId) return null;

        // Ensure the user still exists and is active
        const userEntity = await this.usersService.findEntityById(Number(userId));
        if (!userEntity || userEntity.isActive === false) return null;

        return userId;
      } catch (err) {
        return null;
      }
    }

    // no token provided, reject
    return null;
  }
}