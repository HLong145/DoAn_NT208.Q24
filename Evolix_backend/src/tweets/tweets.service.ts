import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tweet } from './entities/tweet.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class TweetsService {
  constructor(
    @InjectRepository(Tweet)
    private readonly tweetRepository: Repository<Tweet>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Tạo một bài viết (tweet) mới.
   * 
   * @param userId - ID của người dùng tạo bài viết.
   * @param content - Nội dung của bài viết.
   * @returns Thông báo thành công và dữ liệu bài viết vừa tạo.
   */
  async createTweet(userId: number, content: string) {
    if (!content) {
      throw new BadRequestException('Content cannot be empty');
    }

    const newTweet = this.tweetRepository.create({
      userId: userId, 
      content: content,
      isRetweet: false, // Đảm bảo cờ này là false cho các bài viết gốc
    });

    await this.tweetRepository.save(newTweet);

    return {
      message: 'Tweet created successfully',
      tweet: newTweet,
    };
  }

  /**
   * Xử lý tính năng chia sẻ lại bài viết (retweet).
   * 
   * @param userId - ID của người dùng thực hiện retweet.
   * @param originalTweetId - ID của bài viết gốc cần chia sẻ.
   * @returns Thông báo thành công và dữ liệu bài viết (retweet) vừa tạo.
   */
  async retweet(userId: number, originalTweetId: number) {
    // Kiểm tra sự tồn tại của bài viết gốc
    const originalTweet = await this.tweetRepository.findOne({ where: { id: originalTweetId } });
    
    if (!originalTweet) {
      throw new NotFoundException('Original tweet not found');
    }

    // Khởi tạo bài viết mới với cờ isRetweet được bật
    const newRetweet = this.tweetRepository.create({
      userId: userId,
      isRetweet: true,
      originalTweetId: originalTweetId,
      content: '', // Mặc định retweet không có nội dung bổ sung
    });

    await this.tweetRepository.save(newRetweet);

    return {
      message: 'Retweeted successfully',
      tweet: newRetweet,
    };
  }

  /**
   * Lấy danh sách bảng tin (timeline) của người dùng với cơ chế Caching bằng Redis.
   * Giúp giảm tải cho hệ thống Cơ sở dữ liệu khi truy vấn lượng dữ liệu lớn.
   *
   * @param userId - ID của người dùng đang yêu cầu lấy bảng tin.
   * @returns Danh sách các bài viết (tweets) được sắp xếp theo thời gian mới nhất.
   */
  async getUserTimeline(userId: number): Promise<Tweet[]> {
    const cacheKey = `timeline_user_${userId}`;

    // Kiểm tra dữ liệu trong Redis Cache
    const cachedTimeline = await this.cacheManager.get<Tweet[]>(cacheKey);
    
    if (cachedTimeline) {
      return cachedTimeline;
    }

    // Nếu Cache miss, thực hiện truy vấn từ MySQL Database
    // Sử dụng Index [userId, createdAt] để tối ưu hiệu suất đọc
    const tweets = await this.tweetRepository.find({
      where: { userId: userId },
      order: { createdAt: 'DESC' },
    });

    // Lưu kết quả vào Redis Cache để tối ưu cho các request tiếp theo
    await this.cacheManager.set(cacheKey, tweets);

    return tweets;
  }
}