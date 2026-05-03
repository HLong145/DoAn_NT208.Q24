import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Toggle Follow: If user A already follows user B, unfollow. Otherwise, follow.
  async toggleFollow(followerId: number, followingId: number) {
    // 1. Prevent users from following themselves (Narcissism check!)
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself!');
    }

    // 2. Check if the follow relationship already exists in the database
    const existingFollow = await this.followRepository.findOne({
      where: { 
        followerId: followerId, 
        followingId: followingId 
      },
    });

    if (existingFollow) {
      // 3. If it exists, we remove it (Unfollow)
      await this.followRepository.remove(existingFollow);
      await this.invalidateTimelineCaches([followerId]);
      
      return { 
        message: 'Unfollowed successfully', 
        isFollowing: false 
      };
    } else {
      // 4. If it does not exist, we create a new record (Follow)
      const newFollow = this.followRepository.create({
        followerId: followerId,
        followingId: followingId,
      });
      await this.followRepository.save(newFollow);

      await this.invalidateTimelineCaches([followerId]);
      this.realtimeGateway.emitToUser(followingId.toString(), 'user.followed', {
        followerId,
        followingId,
        createdAt: new Date().toISOString(),
      });
      await this.notificationsService.createNotification({
        recipientId: followingId,
        actorId: followerId,
        type: 'follow',
      });
      
      return { 
        message: 'Followed successfully', 
        isFollowing: true 
      };
    }
  }

  async findFollowerIds(followingId: number) {
    const follows = await this.followRepository.find({
      where: {
        followingId: followingId,
      },
    });

    return follows.map((follow) => follow.followerId);
  }

  async findFollowingIds(followerId: number) {
    const follows = await this.followRepository.find({
      where: {
        followerId,
      },
    });

    return follows.map((follow) => follow.followingId);
  }

  private async invalidateTimelineCaches(userIds: number[]) {
    const uniqueUserIds = [...new Set(userIds.filter((id) => Number.isFinite(id)))];
    const store = (this.cacheManager as any).store;

    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const pattern = `timeline_user_${userId}*`;

        try {
          if (store && typeof store.keys === 'function') {
            const keys: string[] = await store.keys(pattern);
            if (Array.isArray(keys) && keys.length > 0) {
              await Promise.all(keys.map((k) => this.cacheManager.del(k)));
              return;
            }
          }
        } catch (err) {
          // ignore and fallback
        }

        const limits = [10, 20, 50];
        const fallbackDeletes: Promise<unknown>[] = [this.cacheManager.del(`timeline_user_${userId}`)];

        for (const l of limits) {
          for (let p = 0; p < 5; p++) {
            const offset = p * l;
            fallbackDeletes.push(this.cacheManager.del(`timeline_user_${userId}_limit_${l}_offset_${offset}`));
          }
        }

        await Promise.all(fallbackDeletes);
      }),
    );
  }
}