import { Module } from '@nestjs/common';
import { TweetsService } from './tweets.service';
import { TweetsController } from './tweets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tweet } from './entities/tweet.entity'; 
import { Comment } from '../comments/entities/comment.entity';
import { FollowsModule } from '../follows/follows.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BookmarksModule } from '../bookmarks/bookmarks.module';

@Module({
  // Register the Tweet entity to use TypeORM repository within this module
  imports: [TypeOrmModule.forFeature([Tweet, Comment]), FollowsModule, RealtimeModule, UsersModule, NotificationsModule, BookmarksModule], 
  controllers: [TweetsController],
  providers: [TweetsService],
})
export class TweetsModule {}