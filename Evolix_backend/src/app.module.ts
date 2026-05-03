import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { User } from './users/entities/user.entity';
import { Tweet } from './tweets/entities/tweet.entity';
import { Follow } from './follows/entities/follow.entity';
import { Like } from './likes/entities/like.entity';
import { Comment } from './comments/entities/comment.entity';
import { Notification } from './notifications/entities/notification.entity';
import { Bookmark } from './bookmarks/entities/bookmark.entity';
import { DirectMessageConversation } from './messages/entities/direct-message-conversation.entity';
import { DirectMessageParticipant } from './messages/entities/direct-message-participant.entity';
import { DirectMessage } from './messages/entities/direct-message.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TweetsModule } from './tweets/tweets.module';
import { LikesModule } from './likes/likes.module';
import { FollowsModule } from './follows/follows.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { MessagesModule } from './messages/messages.module';
import { KafkaModule } from './kafka/kafka.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST ?? 'localhost',
            port: Number(process.env.REDIS_PORT ?? 6379),
          },
          ttl: 60000,
        }),
      }),
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USER ?? 'yuwkaa',
      password: process.env.DB_PASSWORD ?? 'yuwkaapassword',
      database: process.env.DB_NAME ?? 'evolix_db',
      entities: [User, Tweet, Follow, Like, Comment, Notification, Bookmark, DirectMessageConversation, DirectMessageParticipant, DirectMessage],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    TweetsModule,
    LikesModule,
    FollowsModule,
    CommentsModule,
    NotificationsModule,
    BookmarksModule,
    MessagesModule,
    KafkaModule,
    RealtimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}