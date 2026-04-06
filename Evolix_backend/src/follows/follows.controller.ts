import { Controller, Post, Param, UseGuards, Request, ParseIntPipe, Inject } from '@nestjs/common';
import { ClientKafka, EventPattern, Payload } from '@nestjs/microservices';
import { FollowsService } from './follows.service';
import { AuthGuard } from '../auth/auth.guard'; 

@Controller('follows')
export class FollowsController {
  constructor(
    // Tiêm Kafka Client vào để xử lý hàng đợi (Message Queue)
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    // Inject FollowsService để thực thi logic thao tác với Cơ sở dữ liệu
    private readonly followsService: FollowsService
  ) {}

  // Endpoint to toggle follow: POST http://localhost:3000/follows/:followingId
  // Protected by AuthGuard to know WHO is following
  @UseGuards(AuthGuard)
  @Post(':followingId')
  toggleFollow(
    @Request() req, 
    // Safely parse the user ID from the URL parameter
    @Param('followingId', ParseIntPipe) followingId: number 
  ) {
    // Extract the follower's ID from the JWT token
    const followerId = req.user.sub;
    
    // Đóng gói dữ liệu người dùng đi theo dõi và người được theo dõi
    const messagePayload = {
      followerId: followerId,
      followingId: followingId,
    };

    // Đẩy sự kiện vào Kafka để xử lý bất đồng bộ (Asynchronous processing)
    this.kafkaClient.emit('user.follow', JSON.stringify(messagePayload));

    // Phản hồi thành công ngay lập tức cho người dùng
    return {
      message: 'Follow request is being processed asynchronously',
      status: 'pending'
    };
  }

  /**
   * Khai báo EventPattern để lắng nghe sự kiện từ Kafka.
   * Khi sự kiện 'user.follow' được đẩy vào hàng đợi, hàm này sẽ tự động được kích hoạt.
   * 
   * @param message - Dữ liệu payload được gửi kèm trong sự kiện
   */
  @EventPattern('user.follow')
  async handleUserFollow(@Payload() message: any) {
    // Phân tích dữ liệu JSON thành Object (xử lý an toàn cho cả trường hợp data là string hoặc object)
    const data = typeof message === 'string' ? JSON.parse(message) : (message.value ? message.value : message);
    
    // Đảm bảo dữ liệu được bóc tách an toàn nếu nó là chuỗi JSON lồng nhau
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    const { followerId, followingId } = parsedData;

    // Gọi service để thực thi logic theo dõi/bỏ theo dõi trong cơ sở dữ liệu MySQL
    await this.followsService.toggleFollow(followerId, followingId);
    
    // Ghi log ra Terminal để theo dõi tiến trình làm việc của Background Worker
    console.log(`[Kafka Consumer] Successfully processed follow from User ID: ${followerId} to User ID: ${followingId}`);
  }
}