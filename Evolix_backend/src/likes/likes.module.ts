import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity'; 
import { Tweet } from '../tweets/entities/tweet.entity'; 
import { KafkaModule } from '../kafka/kafka.module'

@Module({
  // This module is authorized to interact with both Like and Tweet tables
  imports: [TypeOrmModule.forFeature([Like, Tweet]),
  KafkaModule
], 
  controllers: [LikesController],
  providers: [LikesService]
})
export class LikesModule {}