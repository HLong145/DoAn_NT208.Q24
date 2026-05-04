import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { DirectMessageConversation } from './entities/direct-message-conversation.entity';
import { DirectMessageParticipant } from './entities/direct-message-participant.entity';
import { DirectMessage } from './entities/direct-message.entity';
import { UsersModule } from '../users/users.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([DirectMessageConversation, DirectMessageParticipant, DirectMessage]), UsersModule, RealtimeModule, NotificationsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}