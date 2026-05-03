import { Controller, Post, Body, Param, UseGuards, Request, ParseIntPipe, Inject, Get } from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CommentsService } from './comments.service';
import { AuthGuard } from '../auth/auth.guard';

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
  async createComment(
    @Request() req,
    // Extract tweetId from the URL
    @Param('tweetId', ParseIntPipe) tweetId: number,
    // Extract the comment text from the request body
    @Body('content') content: string,
  ) {
    // Get user ID from the token
    const userId = req.user.sub;
    
    // Đóng gói dữ liệu bình luận bao gồm ID người dùng, ID bài viết và nội dung
    const messagePayload = {
      userId: userId,
      tweetId: tweetId,
      content: content,
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
    // Phân tích dữ liệu JSON thành Object (xử lý an toàn cho cả trường hợp data là string hoặc object)
    let data = message;
    if (typeof message === 'string') {
      data = JSON.parse(message);
    } else if (message.value) {
      data = message.value;
    }
    
    // Đảm bảo dữ liệu được bóc tách an toàn nếu nó là chuỗi JSON lồng nhau
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const { userId, tweetId, content } = parsedData;

    // Gọi service để thực thi logic tạo bình luận trong cơ sở dữ liệu MySQL
    await this.commentsService.createComment(userId, tweetId, content);
    
    // Ghi log ra Terminal để theo dõi tiến trình làm việc của Background Worker
    console.log(`[Kafka Consumer] Successfully processed comment from User ID: ${userId} on Tweet ID: ${tweetId}`);
  }
}