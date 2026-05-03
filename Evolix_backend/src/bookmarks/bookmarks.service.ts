import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { Tweet } from '../tweets/entities/tweet.entity';
import { UsersService } from '../users/users.service';

type BookmarkTweet = {
  id: string;
  author: {
    id: number;
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  stats: {
    replies: number;
    reposts: number;
    likes: number;
    views: number;
  };
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
  media?: string[];
};

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(Tweet)
    private readonly tweetRepository: Repository<Tweet>,
    private readonly usersService: UsersService,
  ) {}

  async toggleBookmark(userId: number, tweetId: number) {
    if (!Number.isFinite(userId) || !Number.isFinite(tweetId)) {
      throw new BadRequestException('Invalid bookmark request');
    }

    const tweet = await this.tweetRepository.findOne({ where: { id: tweetId } });
    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    const existingBookmark = await this.bookmarkRepository.findOne({ where: { userId, tweetId } });

    if (existingBookmark) {
      await this.bookmarkRepository.remove(existingBookmark);
      return { message: 'Bookmark removed successfully', bookmarked: false };
    }

    const bookmark = this.bookmarkRepository.create({ userId, tweetId });
    await this.bookmarkRepository.save(bookmark);

    return { message: 'Bookmark added successfully', bookmarked: true };
  }

  async listBookmarkedTweets(userId: number, limit = 50): Promise<BookmarkTweet[]> {
    if (!Number.isFinite(userId)) {
      throw new BadRequestException('Invalid user id');
    }

    const bookmarks = await this.bookmarkRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    if (bookmarks.length === 0) {
      return [];
    }

    const tweetIds = bookmarks.map((bookmark) => bookmark.tweetId);
    const tweets = await this.tweetRepository.find({
      where: { id: In(tweetIds) },
    });

    const tweetsById = new Map<number, Tweet>(tweets.map((tweet) => [tweet.id, tweet]));
    const authors = await this.usersService.findManyByIds([...new Set(tweets.map((tweet) => tweet.userId))]);
    const authorMap = new Map<number, (typeof authors)[number]>(authors.map((author) => [author.id, author]));

    return bookmarks.flatMap<BookmarkTweet>((bookmark) => {
      const tweet = tweetsById.get(bookmark.tweetId);
      if (!tweet) {
        return [];
      }

      const author = authorMap.get(tweet.userId);
      const avatarSeed = encodeURIComponent(String(author?.username ?? tweet.userId));

      return [{
        id: tweet.id.toString(),
        author: {
          id: tweet.userId,
          name: author?.username ?? `User ${tweet.userId}`,
          handle: author?.username ?? `user${tweet.userId}`,
          avatar: `https://i.pravatar.cc/150?u=${avatarSeed}`,
        },
        content: tweet.content,
        timestamp: this.formatRelativeTime(tweet.createdAt),
        stats: {
          replies: tweet.commentCount,
          reposts: tweet.isRetweet ? 1 : 0,
          likes: tweet.likeCount,
          views: 0,
        },
        isLiked: false,
        isReposted: tweet.isRetweet,
        isBookmarked: true,
        media: tweet.mediaUrls ? tweet.mediaUrls.split(',').map((url) => url.trim()).filter(Boolean) : undefined,
      }];
    });
  }

  async getBookmarkedTweetIds(userId: number): Promise<number[]> {
    if (!Number.isFinite(userId)) {
      return [];
    }

    const bookmarks = await this.bookmarkRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return bookmarks.map((bookmark) => bookmark.tweetId);
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