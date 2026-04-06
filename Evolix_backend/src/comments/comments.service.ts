import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Tweet } from '../tweets/entities/tweet.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    // Inject Tweet repository to update the comment_count
    @InjectRepository(Tweet)
    private tweetRepository: Repository<Tweet>,
  ) {}

  // Create a new comment and increment the tweet's comment count
  async createComment(userId: number, tweetId: number, content: string) {
    // 1. Check if comment content is empty
    if (!content) {
      throw new BadRequestException('Comment content cannot be empty!');
    }

    // 2. Verify if the tweet actually exists
    const tweet = await this.tweetRepository.findOne({ where: { id: tweetId } });
    if (!tweet) {
      throw new NotFoundException('Tweet not found! Cannot comment on a ghost tweet.');
    }

    // 3. Create and save the new comment record
    const newComment = this.commentRepository.create({
      userId: userId,
      tweetId: tweetId,
      content: content,
    });
    await this.commentRepository.save(newComment);

    // 4. Increase the comment_count in tweets table by 1 directly in DB
    await this.tweetRepository.increment({ id: tweetId }, 'commentCount', 1);

    return {
      message: 'Comment added successfully',
      comment: newComment,
    };
  }
}