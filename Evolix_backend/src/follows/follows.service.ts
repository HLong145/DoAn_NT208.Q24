import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
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
      
      return { 
        message: 'Followed successfully', 
        isFollowing: true 
      };
    }
  }
}