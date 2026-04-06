import { Module } from '@nestjs/common';
import { TweetsService } from './tweets.service';
import { TweetsController } from './tweets.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tweet } from './entities/tweet.entity'; 

@Module({
  // Register the Tweet entity to use TypeORM repository within this module
  imports: [TypeOrmModule.forFeature([Tweet])], 
  controllers: [TweetsController],
  providers: [TweetsService],
})
export class TweetsModule {}