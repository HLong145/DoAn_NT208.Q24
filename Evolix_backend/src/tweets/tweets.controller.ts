import { Controller, Post, Body, Param, UseGuards, Request, ParseIntPipe, Get, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { TweetsService } from './tweets.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateTweetDto } from './dto/create-tweet.dto';

const uploadStorage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

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
  @UseInterceptors(FilesInterceptor('media', 4, { storage: uploadStorage }))
  createTweet(@Request() req, @Body() body: CreateTweetDto, @UploadedFiles() files?: Express.Multer.File[]) {
    const userId = req.user.sub;
    const mediaUrls = files?.length
      ? files.map((f) => `/uploads/${f.filename}`).join(',')
      : undefined;
    return this.tweetsService.createTweet(userId, body.content, mediaUrls);
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
  getUserTimeline(@Request() req, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const userId = req.user.sub;
    return this.tweetsService.getUserTimeline(userId, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @UseGuards(AuthGuard)
  @Get('feed')
  getFeed(@Request() req, @Query('scope') scope?: 'following' | 'for-you', @Query('limit') limit?: string, @Query('offset') offset?: string) {
    const userId = req.user.sub;
    return this.tweetsService.getFeed(userId, scope === 'for-you' ? 'for-you' : 'following', {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @UseGuards(AuthGuard)
  @Get('trending')
  getTrending() {
    return this.tweetsService.getTrendingTopics();
  }

  @UseGuards(AuthGuard)
  @Get('lead')
  getLead() {
    return this.tweetsService.getLeadStory();
  }

  @UseGuards(AuthGuard)
  @Get('search')
  searchTweets(@Request() req, @Query('q') q: string, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.tweetsService.searchTweets(q ?? '', req.user.sub, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @UseGuards(AuthGuard)
  @Get('user/:userId')
  getTweetsByUser(@Request() req, @Param('userId', ParseIntPipe) userId: number, @Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.tweetsService.getTweetsByUser(userId, req.user.sub, {
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  getTweetDetail(@Request() req, @Param('id', ParseIntPipe) tweetId: number) {
    return this.tweetsService.getTweetDetail(tweetId, req.user.sub);
  }
}