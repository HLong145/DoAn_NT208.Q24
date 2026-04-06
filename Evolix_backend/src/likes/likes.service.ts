import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { Tweet } from '../tweets/entities/tweet.entity';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    // Inject Tweet repository to update the like_count
    @InjectRepository(Tweet)
    private tweetRepository: Repository<Tweet>,
  ) {}

  async toggleLike(userId: number, tweetId: number) {
    // 1. Verify if the tweet actually exists before liking
    const tweet = await this.tweetRepository.findOne({ where: { id: tweetId } });
    if (!tweet) {
      throw new NotFoundException('Tweet not found! Cannot like a ghost tweet.');
    }

    // 2. Check if the user already liked this exact tweet
    const existingLike = await this.likeRepository.findOne({
      where: { userId: userId, tweetId: tweetId },
    });

    if (existingLike) {
      // 3. User already liked -> remove the record (Unlike)
      await this.likeRepository.remove(existingLike);
      
      // 4. Decrease the like_count, BUT only if it's strictly greater than 0 to prevent negative numbers!
      if (tweet.likeCount > 0) {
        await this.tweetRepository.decrement({ id: tweetId }, 'likeCount', 1);
      }
      
      return { message: 'Unliked successfully', liked: false };
    } else {
      // 5. User hasn't liked -> create a new like record
      const newLike = this.likeRepository.create({
        userId: userId,
        tweetId: tweetId,
      });
      await this.likeRepository.save(newLike);
      
      // 6. Increase the like_count in tweets table by 1 directly in DB
      await this.tweetRepository.increment({ id: tweetId }, 'likeCount', 1);
      
      return { message: 'Liked successfully', liked: true };
    }
  }
}