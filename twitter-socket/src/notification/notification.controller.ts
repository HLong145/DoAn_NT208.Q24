import { Controller, Post, Body } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

@Controller('test-socket')
export class NotificationController {
  // Inject Gateway vào Controller
  constructor(private readonly notificationGateway: NotificationGateway) {}

  @Post('trigger')
  triggerFanout(@Body() body: { authorId: string; tweetId: string; followerIds: string[] }) {
    const { authorId, tweetId, followerIds } = body;

    const tweetData = {
      message: `Tài khoản ${authorId} vừa đăng một tweet mới!`,
      tweetId: tweetId,
      time: new Date().toLocaleTimeString(),
    };

    // Gọi hàm trong Gateway
    this.notificationGateway.sendNotificationToFollowers(followerIds, tweetData);

    return { status: 'success', message: 'Đã bắn tín hiệu Socket' };
  }
}