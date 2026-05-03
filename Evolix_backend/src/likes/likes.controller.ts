import { Controller, Post, Param, UseGuards, Request, ParseIntPipe, Inject } from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from '../auth/auth.guard';
import { LikesService } from './likes.service';

@Controller('likes')
export class LikesController {
  constructor(
    // Tiêm Kafka Client vào thay cho LikesService để xử lý hàng đợi (Message Queue)
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    // Inject LikesService để thực thi logic thao tác với Cơ sở dữ liệu
    private readonly likesService: LikesService,
  ) {}

  // Endpoint to toggle like: POST http://localhost:3000/likes/:tweetId
  // Must be protected by AuthGuard so we know WHO is liking the tweet
  @UseGuards(AuthGuard)
  @Post(':tweetId')
  async toggleLike(
    @Request() req, 
    // ParseIntPipe safely converts the string from the URL into a number
    @Param('tweetId', ParseIntPipe) tweetId: number 
  ) {
    // Extract user ID from the JWT token payload
    const userId = req.user.sub;
    
    // Đóng gói dữ liệu người dùng và ID bài viết
    const messagePayload = {
      userId: userId,
      tweetId: tweetId,
    };

    // Đẩy sự kiện vào Kafka để xử lý bất đồng bộ (Asynchronous processing)
    await firstValueFrom(this.kafkaClient.emit('tweet.like', JSON.stringify(messagePayload)));
    
    // Phản hồi thành công ngay lập tức cho người dùng
    return { 
      message: 'Like request is being processed asynchronously',
      status: 'pending'
    };
  }

  /**
   * Khai báo EventPattern để lắng nghe sự kiện từ Kafka.
   * Khi sự kiện 'tweet.like' được đẩy vào hàng đợi, hàm này sẽ tự động được kích hoạt.
   * 
   * @param message - Dữ liệu payload được gửi kèm trong sự kiện
   */
  @EventPattern('tweet.like')
  async handleTweetLike(@Payload() message: any) {
    // Phân tích dữ liệu JSON thành Object (xử lý an toàn cho cả trường hợp data là string hoặc object)
    let data = message;
    if (typeof message === 'string') {
      data = JSON.parse(message);
    } else if (message.value) {
      data = message.value;
    }
    
    // Đảm bảo dữ liệu được bóc tách an toàn nếu nó là chuỗi JSON lồng nhau
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const { userId, tweetId } = parsedData;

    // Gọi service để thực thi logic tăng/giảm likeCount trong cơ sở dữ liệu MySQL
    await this.likesService.toggleLike(userId, tweetId);
    
    // Ghi log ra Terminal để theo dõi tiến trình làm việc của Background Worker
    console.log(`[Kafka Consumer] Successfully processed like for User ID: ${userId} on Tweet ID: ${tweetId}`);
  }
}