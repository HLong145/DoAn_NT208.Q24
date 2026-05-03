import { Module } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity'; 
import { KafkaModule } from '../kafka/kafka.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  // Register the Follow entity to use TypeORM repository within this module
  imports: [
    TypeOrmModule.forFeature([Follow]),
    // Cắm điện trạm Kafka vào khu vực theo dõi
    KafkaModule,
    RealtimeModule,
    NotificationsModule,
  ], 
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}