import { Body, Controller, Post } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';

type TriggerFanoutBody = {
  authorId: string;
  tweetId: string;
  followerIds: string[];
};

@Controller('realtime')
export class RealtimeController {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  @Post('trigger')
  triggerFanout(@Body() body: TriggerFanoutBody) {
    const followerIds = Array.isArray(body.followerIds) ? body.followerIds.filter(Boolean) : [];
    const tweetData = {
      message: `Tài khoản ${body.authorId} vừa đăng một tweet mới!`,
      authorId: body.authorId,
      tweetId: body.tweetId,
      time: new Date().toISOString(),
    };

    const notifiedCount = this.realtimeGateway.sendNotificationToFollowers(followerIds, tweetData);

    return {
      status: 'success',
      message: 'Socket event dispatched',
      notifiedCount,
    };
  }
}