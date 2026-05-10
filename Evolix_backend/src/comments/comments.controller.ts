import { Controller, Post, Body, Param, UseGuards, Request, ParseIntPipe, Inject, Get, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CommentsService } from './comments.service';
import { AuthGuard } from '../auth/auth.guard';

const uploadStorage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

@Controller('comments')
export class CommentsController {
  constructor(
    // Tiêm Kafka Client vào để xử lý hàng đợi (Message Queue)
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    // Inject CommentsService để thực thi logic thao tác với Cơ sở dữ liệu
    private readonly commentsService: CommentsService
  ) {}

  @UseGuards(AuthGuard)
  @Get(':tweetId')
  getCommentsByTweet(@Param('tweetId', ParseIntPipe) tweetId: number) {
    return this.commentsService.getCommentsByTweet(tweetId);
  }

  // Endpoint to add a comment: POST http://localhost:3000/comments/:tweetId
  @UseGuards(AuthGuard)
  @Post(':tweetId')
  @UseInterceptors(FilesInterceptor('media', 4, { storage: uploadStorage }))
  async createComment(
    @Request() req: any,
    @Param('tweetId', ParseIntPipe) tweetId: number,
    @Body('content') content: string,
    @Body('parentCommentId') parentCommentId?: number,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const userId = req.user.sub;
    const mediaUrls = files?.length
      ? files.map((f) => `/uploads/${f.filename}`).join(',')
      : null;

    const messagePayload = {
      userId,
      tweetId,
      content,
      parentCommentId: parentCommentId ?? null,
      mediaUrls,
    };

    // Đẩy sự kiện vào Kafka để xử lý bất đồng bộ (Asynchronous processing)
    await firstValueFrom(this.kafkaClient.emit('tweet.comment', JSON.stringify(messagePayload)));

    // Phản hồi thành công ngay lập tức cho người dùng
    return {
      message: 'Comment request is being processed asynchronously',
      status: 'pending'
    };
  }

  /**
   * Khai báo EventPattern để lắng nghe sự kiện từ Kafka.
   * Khi sự kiện 'tweet.comment' được đẩy vào hàng đợi, hàm này sẽ tự động được kích hoạt.
   * 
   * @param message - Dữ liệu payload được gửi kèm trong sự kiện
   */
  @EventPattern('tweet.comment')
  async handleTweetComment(@Payload() message: any) {
    let data = message;
    if (typeof message === 'string') {
      data = JSON.parse(message);
    } else if (message.value) {
      data = message.value;
    }

    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const { userId, tweetId, content, parentCommentId, mediaUrls } = parsedData;

    await this.commentsService.createComment(userId, tweetId, content, parentCommentId ?? undefined, mediaUrls ?? undefined);
    
    // Ghi log ra Terminal để theo dõi tiến trình làm việc của Background Worker
    console.log(`[Kafka Consumer] Successfully processed comment from User ID: ${userId} on Tweet ID: ${tweetId}`);
  }
}