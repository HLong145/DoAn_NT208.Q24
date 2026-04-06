import { Controller, Post, Body, Param, UseGuards, Request, ParseIntPipe, Get } from '@nestjs/common';
import { TweetsService } from './tweets.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('tweets')
export class TweetsController {
  constructor(private readonly tweetsService: TweetsService) {}

  /**
   * API Endpoint: Tạo một bài viết (tweet) mới.
   * Yêu cầu xác thực JWT.
   * 
   * @route POST /tweets
   */
  @UseGuards(AuthGuard)
  @Post()
  createTweet(@Request() req, @Body('content') content: string) {
    const userId = req.user.sub;
    return this.tweetsService.createTweet(userId, content);
  }

  /**
   * API Endpoint: Xử lý tính năng chia sẻ lại bài viết (retweet).
   * Yêu cầu xác thực JWT. Ép kiểu Param 'id' sang số nguyên (ParseIntPipe).
   * 
   * @route POST /tweets/:id/retweet
   */
  @UseGuards(AuthGuard)
  @Post(':id/retweet')
  retweet(
    @Request() req, 
    @Param('id', ParseIntPipe) originalTweetId: number
  ) {
    const userId = req.user.sub;
    return this.tweetsService.retweet(userId, originalTweetId);
  }

  /**
   * API Endpoint: Lấy bảng tin cá nhân của người dùng.
   * Cung cấp luồng dữ liệu (timeline) đã được tối ưu tốc độ bằng Redis Cache.
   * Yêu cầu xác thực JWT.
   *
   * @route GET /tweets/timeline
   */
  @UseGuards(AuthGuard)
  @Get('timeline')
  getUserTimeline(@Request() req) {
    const userId = req.user.sub;
    return this.tweetsService.getUserTimeline(userId);
  }
}