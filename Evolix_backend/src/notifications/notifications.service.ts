import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Notification, NotificationType } from './entities/notification.entity';
import { UsersService } from '../users/users.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

type NotificationActor = {
  id: number;
  name: string;
  handle: string;
  avatar: string;
};

export type NotificationListItem = {
  id: string;
  type: NotificationType;
  actor: NotificationActor;
  content: string;
  timestamp: string;
  isRead: boolean;
  targetId: string | null;
};

type CreateNotificationInput = {
  recipientId: number;
  actorId: number;
  type: NotificationType;
  tweetId?: number | null;
  content?: string | null;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly usersService: UsersService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async createNotification(input: CreateNotificationInput) {
    if (input.recipientId === input.actorId) {
      return null;
    }

    const notification = this.notificationRepository.create({
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: input.type,
      tweetId: input.tweetId ?? null,
      content: input.content ?? null,
      isRead: false,
    });

    await this.notificationRepository.save(notification);
    await this.invalidateRecipientCache(input.recipientId);

    const [payload] = await this.toListItems([notification]);
    if (payload) {
      this.realtimeGateway.emitToUser(String(input.recipientId), 'notification.created', payload);
    }

    return payload ?? null;
  }

  async createForRecipients(recipientIds: number[], actorId: number, type: NotificationType, tweetId?: number | null, content?: string | null) {
    const uniqueRecipientIds = [...new Set(recipientIds.filter((id) => Number.isFinite(id) && id !== actorId))];

    if (uniqueRecipientIds.length === 0) {
      return [];
    }

    const notifications = uniqueRecipientIds.map((recipientId) =>
      this.notificationRepository.create({
        recipientId,
        actorId,
        type,
        tweetId: tweetId ?? null,
        content: content ?? null,
        isRead: false,
      }),
    );

    await this.notificationRepository.save(notifications);
    await Promise.all(uniqueRecipientIds.map((recipientId) => this.invalidateRecipientCache(recipientId)));

    const payloads = await this.toListItems(notifications);
    for (let index = 0; index < payloads.length; index += 1) {
      this.realtimeGateway.emitToUser(String(uniqueRecipientIds[index]), 'notification.created', payloads[index]);
    }

    return payloads;
  }

  async listForUser(recipientId: number, limit = 50): Promise<NotificationListItem[]> {
    const cacheKey = `notifications_user_${recipientId}`;
    const cached = await this.cacheManager.get<NotificationListItem[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const notifications = await this.notificationRepository.find({
      where: { recipientId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const items = await this.toListItems(notifications);
    await this.cacheManager.set(cacheKey, items, 30_000);
    return items;
  }

  async markAllAsRead(recipientId: number) {
    await this.notificationRepository.update({ recipientId, isRead: false }, { isRead: true });
    await this.invalidateRecipientCache(recipientId);
    return { message: 'Notifications marked as read' };
  }

  private async toListItems(notifications: Notification[]): Promise<NotificationListItem[]> {
    if (notifications.length === 0) {
      return [];
    }

    const actorIds = [...new Set(notifications.map((notification) => notification.actorId))];
    const actors = await this.usersService.findManyByIds(actorIds);
    const actorMap = new Map<number, (typeof actors)[number]>(actors.map((actor) => [actor.id, actor]));

    return notifications.map((notification) => {
      const actor = actorMap.get(notification.actorId);
      const handle = actor?.username ?? `user${notification.actorId}`;
      const avatarSeed = encodeURIComponent(handle);

      return {
        id: notification.id.toString(),
        type: notification.type,
        actor: {
          id: notification.actorId,
          name: actor?.username ?? `User ${notification.actorId}`,
          handle,
          avatar: `https://i.pravatar.cc/150?u=${avatarSeed}`,
        },
        content: notification.content ?? this.buildDefaultContent(notification.type, handle),
        timestamp: this.formatRelativeTime(notification.createdAt),
        isRead: notification.isRead,
        targetId: notification.tweetId != null ? String(notification.tweetId) : null,
      };
    });
  }

  private buildDefaultContent(type: NotificationType, handle: string) {
    switch (type) {
      case 'follow':
        return `@${handle} followed you`;
      case 'like':
        return `@${handle} liked your post`;
      case 'reply':
        return `@${handle} replied to your post`;
      case 'tweet':
        return `@${handle} posted a new tweet`;
      default:
        return 'You have a new notification';
    }
  }

  private async invalidateRecipientCache(recipientId: number) {
    await this.cacheManager.del(`notifications_user_${recipientId}`);
  }

  private formatRelativeTime(createdAt: Date) {
    const diffInSeconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  }
}