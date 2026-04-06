import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Tweet } from '../tweets/entities/tweet.entity';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  // Authorize this module to interact with both Comments and Tweets tables
  imports: [
    TypeOrmModule.forFeature([Comment, Tweet]),
    // Thêm Kafka vào khu vực bình luận
    KafkaModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService]
})
export class CommentsModule {}