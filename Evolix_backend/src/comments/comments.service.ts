import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { Tweet } from '../tweets/entities/tweet.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

type CommentAuthor = {
  id: number;
  name: string;
  handle: string;
  avatar: string;
};

type CommentListItem = {
  id: string;
  author: CommentAuthor;
  content: string;
  timestamp: string;
  media?: string[];
  parentCommentId?: number | null;
};

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    // Inject Tweet repository to update the comment_count
    @InjectRepository(Tweet)
    private tweetRepository: Repository<Tweet>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // Create a new comment and increment the tweet's comment count
  async createComment(userId: number, tweetId: number, content: string, parentCommentId?: number, mediaUrls?: string) {
    if (!content && !mediaUrls) {
      throw new BadRequestException('Comment must have text or media!');
    }

    const tweet = await this.tweetRepository.findOne({ where: { id: tweetId } });
    if (!tweet) {
      throw new NotFoundException('Tweet not found! Cannot comment on a ghost tweet.');
    }

    const newComment = this.commentRepository.create({
      userId,
      tweetId,
      content,
      ...(parentCommentId ? { parentCommentId } : {}),
      ...(mediaUrls ? { mediaUrls } : {}),
    });
    await this.commentRepository.save(newComment);

    // 4. Increase the comment_count in tweets table by 1 directly in DB
    await this.tweetRepository.increment({ id: tweetId }, 'commentCount', 1);

    await this.notificationsService.createNotification({
      recipientId: tweet.userId,
      actorId: userId,
      type: 'reply',
      tweetId,
      content: content.slice(0, 140),
    });

    return {
      message: 'Comment added successfully',
      comment: newComment,
    };
  }

  async getCommentsByTweet(tweetId: number): Promise<CommentListItem[]> {
    const comments = await this.commentRepository.find({
      where: { tweetId },
      order: { createdAt: 'ASC' },
    });

    const commentAuthors = await this.usersService.findManyByIds(comments.map((comment) => comment.userId));
    const commentAuthorMap = new Map<number, (typeof commentAuthors)[number]>(commentAuthors.map((commentAuthor) => [commentAuthor.id, commentAuthor]));

    return comments.map<CommentListItem>((comment) => {
      const commentAuthor = commentAuthorMap.get(comment.userId);
      const avatarSeed = encodeURIComponent(String(commentAuthor?.username ?? comment.userId));

      return {
        id: comment.id.toString(),
        author: {
          id: comment.userId,
          name: commentAuthor?.displayName ?? commentAuthor?.username ?? `User ${comment.userId}`,
          handle: commentAuthor?.username ?? `user${comment.userId}`,
          avatar: commentAuthor?.avatarUrl ?? `https://i.pravatar.cc/150?u=${avatarSeed}`,
        },
        content: comment.content,
        timestamp: this.formatRelativeTime(comment.createdAt),
        parentCommentId: comment.parentCommentId ?? null,
        media: comment.mediaUrls ? comment.mediaUrls.split(',').map((u) => u.trim()).filter(Boolean) : undefined,
      };
    });
  }

  private formatRelativeTime(createdAt: Date) {
    const diffInSeconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  }
}