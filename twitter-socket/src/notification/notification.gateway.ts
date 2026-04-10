import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true }) 
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeUsers = new Map<string, string>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.activeUsers.set(userId, client.id);
      console.log(`[+] User ${userId} vừa online (Socket ID: ${client.id})`);
    } else {
      client.disconnect(); 
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.activeUsers.delete(userId);
      console.log(`[-] User ${userId} đã offline.`);
    }
  }

  sendNotificationToFollowers(followerIds: string[], tweetData: any) {
    let notifiedCount = 0;
    followerIds.forEach((followerId) => {
      const socketId = this.activeUsers.get(followerId);
      if (socketId) {
        this.server.to(socketId).emit('new_tweet', tweetData);
        notifiedCount++;
      }
    });
    console.log(`[Fanout] Đã gửi thông báo tới ${notifiedCount}/${followerIds.length} followers online.`);
  }
}