import { Module } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { FollowsController } from './follows.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity'; 
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  // Register the Follow entity to use TypeORM repository within this module
  imports: [
    TypeOrmModule.forFeature([Follow]),
    // Cắm điện trạm Kafka vào khu vực theo dõi
    KafkaModule,
  ], 
  controllers: [FollowsController],
  providers: [FollowsService]
})
export class FollowsModule {}