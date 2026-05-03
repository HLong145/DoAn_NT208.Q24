import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository, Not } from 'typeorm';
import { Tweet } from './entities/tweet.entity';
import { Comment } from '../comments/entities/comment.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { FollowsService } from '../follows/follows.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BookmarksService } from '../bookmarks/bookmarks.service';

type TimelineAuthor = {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
};

type TimelineTweet = {
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

type PaginationOptions = {
  limit?: number;
  offset?: number;
};

type TweetDetailComment = {
  id: string;
  author: {
    id: number;
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
};

type TweetDetail = TimelineTweet & {
  isLiked: boolean;
  isReposted: boolean;
  isBookmarked: boolean;
  originalTweetId?: number | null;
  comments: TweetDetailComment[];
};

@Injectable()
export class TweetsService {
  constructor(
    @InjectRepository(Tweet)
    private readonly tweetRepository: Repository<Tweet>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly followsService: FollowsService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly bookmarksService: BookmarksService,
  ) {}

  /**
   * Tạo một bài viết (tweet) mới.
   * 
   * @param userId - ID của người dùng tạo bài viết.
   * @param content - Nội dung của bài viết.
   * @returns Thông báo thành công và dữ liệu bài viết vừa tạo.
   */
  async createTweet(userId: number, content: string) {
    if (!content) {
      throw new BadRequestException('Content cannot be empty');
    }

    const newTweet = this.tweetRepository.create({
      userId: userId, 
      content: content,
      isRetweet: false, // Đảm bảo cờ này là false cho các bài viết gốc
    });

    await this.tweetRepository.save(newTweet);

    const followerIds = await this.followsService.findFollowerIds(userId);
    await this.invalidateTimelineCaches([userId, ...followerIds]);
    await this.invalidateDiscoveryCaches(newTweet.content);

    if (followerIds.length > 0) {
      await this.notificationsService.createForRecipients(
        followerIds,
        userId,
        'tweet',
        newTweet.id,
      );

      this.realtimeGateway.sendNotificationToFollowers(
        followerIds.map((followerId) => followerId.toString()),
        {
          event: 'tweet.created',
          tweetId: newTweet.id,
          authorId: userId,
          content: newTweet.content,
          createdAt: newTweet.createdAt,
        },
      );
    }

    return {
      message: 'Tweet created successfully',
      tweet: newTweet,
    };
  }

  /**
   * Compute trending topics by scanning recent tweets for hashtags.
   * This is a lightweight heuristic suitable for a demo environment.
   */
  async getTrendingTopics(limit = 10) {
    const cacheKey = 'trending_topics';
    const cached = await this.cacheManager.get<Array<{ topic: string; posts: string }>>(cacheKey);
    if (cached) return cached.slice(0, limit);

    // load recent tweets
    const recent = await this.tweetRepository.find({
      order: { createdAt: 'DESC' },
      take: 200,
      select: ['content'],
    });

    const counts = new Map<string, number>();
    const hashtagRe = /#([\p{L}0-9_\-]+)/gu;

    for (const t of recent) {
      if (!t.content) continue;
      const matches = Array.from(t.content.matchAll(hashtagRe));
      const seen = new Set<string>();
      for (const m of matches) {
        const tag = `#${m[1]}`;
        if (seen.has(tag)) continue; // count per tweet once
        seen.add(tag);
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }

    const topics = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, cnt]) => ({ topic: tag, posts: `${cnt} posts` }));

    // Fallback if no hashtags found: return a small default list
    const result = topics.length === 0 ? [
      { topic: '#design', posts: '120K' },
      { topic: '#AIRevolution', posts: '85K' },
      { topic: '#webdev', posts: '45K' },
    ] : topics;

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);

    return result.slice(0, limit);
  }

  /**
   * Return a lead story object for Explore page. Cached briefly.
   */
  async getLeadStory() {
    const cacheKey = 'lead_story';
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    // Prefer recent tweets with media - use query builder to safely check IS NOT NULL/empty
    const tweetWithMedia = await this.tweetRepository.createQueryBuilder('t')
      .where("t.mediaUrls IS NOT NULL AND t.mediaUrls != ''")
      .orderBy('t.createdAt', 'DESC')
      .getOne();

    if (tweetWithMedia) {
      const [author] = await this.usersService.findManyByIds([tweetWithMedia.userId]);
      const image = tweetWithMedia.mediaUrls?.split(',').map(s => s.trim()).find(Boolean) ?? `https://picsum.photos/seed/${encodeURIComponent(String(tweetWithMedia.id))}/800/400`;
      const story = {
        title: (tweetWithMedia.content || '').slice(0, 120) || 'Latest from the community',
        byline: author?.username ?? `User ${tweetWithMedia.userId}`,
        image,
        tweetId: tweetWithMedia.id,
      };
      await this.cacheManager.set(cacheKey, story, 60);
      return story;
    }

    const fallback = {
      title: 'The Evolution of Digital Typography',
      byline: 'By Design Weekly',
      image: 'https://picsum.photos/seed/explore/800/400',
    };

    await this.cacheManager.set(cacheKey, fallback, 60);
    return fallback;
  }

  /**
   * Xử lý tính năng chia sẻ lại bài viết (retweet).
   * 
   * @param userId - ID của người dùng thực hiện retweet.
   * @param originalTweetId - ID của bài viết gốc cần chia sẻ.
   * @returns Thông báo thành công và dữ liệu bài viết (retweet) vừa tạo.
   */
  async retweet(userId: number, originalTweetId: number) {
    // Kiểm tra sự tồn tại của bài viết gốc
    const originalTweet = await this.tweetRepository.findOne({ where: { id: originalTweetId } });
    
    if (!originalTweet) {
      throw new NotFoundException('Original tweet not found');
    }

    // Khởi tạo bài viết mới với cờ isRetweet được bật
    const newRetweet = this.tweetRepository.create({
      userId: userId,
      isRetweet: true,
      originalTweetId: originalTweetId,
      content: '', // Mặc định retweet không có nội dung bổ sung
    });

    await this.tweetRepository.save(newRetweet);

    const followerIds = await this.followsService.findFollowerIds(userId);
    await this.invalidateTimelineCaches([userId, ...followerIds]);
    await this.invalidateDiscoveryCaches(originalTweet.content);

    if (followerIds.length > 0) {
      await this.notificationsService.createForRecipients(
        followerIds,
        userId,
        'tweet',
        newRetweet.id,
      );

      this.realtimeGateway.sendNotificationToFollowers(
        followerIds.map((followerId) => followerId.toString()),
        {
          event: 'tweet.retweeted',
          tweetId: newRetweet.id,
          authorId: userId,
          originalTweetId,
          isRetweet: true,
          createdAt: newRetweet.createdAt,
        },
      );
    }

    return {
      message: 'Retweeted successfully',
      tweet: newRetweet,
    };
  }

  /**
   * Lấy danh sách bảng tin (timeline) của người dùng với cơ chế Caching bằng Redis.
   * Giúp giảm tải cho hệ thống Cơ sở dữ liệu khi truy vấn lượng dữ liệu lớn.
   *
   * @param userId - ID của người dùng đang yêu cầu lấy bảng tin.
   * @returns Danh sách các bài viết (tweets) được sắp xếp theo thời gian mới nhất.
   */
  async getUserTimeline(userId: number, pagination: PaginationOptions = {}): Promise<TimelineTweet[]> {
    return this.getFeed(userId, 'following', pagination);
  }

  async getFeed(userId: number, scope: 'following' | 'for-you' = 'following', pagination: PaginationOptions = {}): Promise<TimelineTweet[]> {
    const limit = this.normalizeLimit(pagination.limit, 50, 1, 100);
    const offset = this.normalizeOffset(pagination.offset);

    if (scope === 'for-you') {
      return this.getForYouFeed(userId, limit, offset);
    }

    const cacheKey = `timeline_user_${userId}_limit_${limit}_offset_${offset}`;

    const cachedTimeline = await this.cacheManager.get<TimelineTweet[]>(cacheKey);

    if (cachedTimeline) {
      return cachedTimeline;
    }

    const followingIds = await this.followsService.findFollowingIds(userId);
    const timelineAuthorIds = [...new Set([userId, ...followingIds])];

    const tweets = await this.tweetRepository.find({
      where: { userId: In(timelineAuthorIds) },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const timeline = await this.buildTimelineTweets(tweets, userId);

    await this.cacheManager.set(cacheKey, timeline, 60000);

    return timeline;
  }

  async getTweetsByUser(userId: number, viewerUserId?: number, pagination: PaginationOptions = {}): Promise<TimelineTweet[]> {
    const limit = this.normalizeLimit(pagination.limit, 20, 1, 100);
    const offset = this.normalizeOffset(pagination.offset);

    const tweets = await this.tweetRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return this.buildTimelineTweets(tweets, viewerUserId);
  }

  async searchTweets(query: string, viewerUserId?: number, pagination: PaginationOptions = {}): Promise<TimelineTweet[]> {
    const normalizedQuery = query.trim();
    const limit = this.normalizeLimit(pagination.limit, 50, 1, 100);
    const offset = this.normalizeOffset(pagination.offset);

    if (!normalizedQuery) {
      return [];
    }

    const tweets = await this.tweetRepository.find({
      where: { content: Like(`%${normalizedQuery}%`) },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return this.buildTimelineTweets(tweets, viewerUserId);
  }

  async getTweetDetail(tweetId: number, viewerUserId?: number): Promise<{ tweet: TweetDetail }> {
    const tweet = await this.tweetRepository.findOne({ where: { id: tweetId } });

    if (!tweet) {
      throw new NotFoundException('Tweet not found');
    }

    const [author] = await this.usersService.findManyByIds([tweet.userId]);
    const comments = await this.commentRepository.find({
      where: { tweetId },
      order: { createdAt: 'ASC' },
    });

    const commenterIds = [...new Set(comments.map((comment) => comment.userId))];
    const commentAuthors = await this.usersService.findManyByIds(commenterIds);
    const commentAuthorMap = new Map<number, (typeof commentAuthors)[number]>(commentAuthors.map((commentAuthor) => [commentAuthor.id, commentAuthor]));

    const avatarSeed = encodeURIComponent(String(author?.username ?? tweet.userId));
    const bookmarkedTweetIds = new Set(await this.bookmarksService.getBookmarkedTweetIds(viewerUserId ?? NaN));

    return {
      tweet: {
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
        isBookmarked: bookmarkedTweetIds.has(tweet.id),
        originalTweetId: tweet.originalTweetId,
        media: tweet.mediaUrls ? tweet.mediaUrls.split(',').map((url) => url.trim()).filter(Boolean) : undefined,
        comments: comments.map<TweetDetailComment>((comment) => {
          const commentAuthor = commentAuthorMap.get(comment.userId);
          const commentAvatarSeed = encodeURIComponent(String(commentAuthor?.username ?? comment.userId));

          return {
            id: comment.id.toString(),
            author: {
              id: comment.userId,
              name: commentAuthor?.username ?? `User ${comment.userId}`,
              handle: commentAuthor?.username ?? `user${comment.userId}`,
              avatar: `https://i.pravatar.cc/150?u=${commentAvatarSeed}`,
            },
            content: comment.content,
            timestamp: this.formatRelativeTime(comment.createdAt),
          };
        }),
      },
    };
  }

  private async invalidateTimelineCaches(userIds: number[]) {
    const uniqueUserIds = [...new Set(userIds.filter((id) => Number.isFinite(id)))];
    const store = (this.cacheManager as any).store;

    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const pattern = `timeline_user_${userId}*`;

        // Prefer using store.keys when available (redis store), then delete each matched key
        try {
          if (store && typeof store.keys === 'function') {
            const keys: string[] = await store.keys(pattern);
            if (Array.isArray(keys) && keys.length > 0) {
              await Promise.all(keys.map((k) => this.cacheManager.del(k)));
              return;
            }
          }
        } catch (err) {
          // fallthrough to best-effort deletion of common keys
        }

        // Fallback: attempt to delete a set of likely keys (common limits/offsets)
        const limits = [10, 20, 50];
        const fallbackDeletes: Promise<unknown>[] = [
          this.cacheManager.del(`timeline_user_${userId}`),
        ];

        for (const l of limits) {
          // delete first few pages for each limit
          for (let p = 0; p < 5; p++) {
            const offset = p * l;
            fallbackDeletes.push(this.cacheManager.del(`timeline_user_${userId}_limit_${l}_offset_${offset}`));
          }
        }

        await Promise.all(fallbackDeletes);
      }),
    );
  }

  private async invalidateDiscoveryCaches(content: string) {
    const tasks: Promise<unknown>[] = [this.cacheManager.del('lead_story')];

    if (/#([\p{L}0-9_\-]+)/u.test(content)) {
      tasks.push(this.cacheManager.del('trending_topics'));
    }

    await Promise.all(tasks);
  }

  private async buildTimelineTweets(tweets: Tweet[], viewerUserId?: number): Promise<TimelineTweet[]> {
    if (tweets.length === 0) {
      return [];
    }

    const authors = await this.usersService.findManyByIds([...new Set(tweets.map((tweet) => tweet.userId))]);
    const authorMap = new Map<number, TimelineAuthor>(authors.map((author) => [author.id, author]));
    const bookmarkedTweetIds = new Set(await this.bookmarksService.getBookmarkedTweetIds(viewerUserId ?? NaN));

    return tweets.map<TimelineTweet>((tweet) => {
      const author = authorMap.get(tweet.userId);
      const authorName = author?.username ?? `User ${tweet.userId}`;
      const avatarSeed = encodeURIComponent(String(author?.username ?? tweet.userId));

      return {
        id: tweet.id.toString(),
        author: {
          id: tweet.userId,
          name: authorName,
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
        isBookmarked: bookmarkedTweetIds.has(tweet.id),
        media: tweet.mediaUrls ? tweet.mediaUrls.split(',').map((url) => url.trim()).filter(Boolean) : undefined,
      };
    });
  }

  private async getForYouFeed(viewerUserId?: number, limit = 50, offset = 0): Promise<TimelineTweet[]> {
    const tweets = await this.tweetRepository.find({
      order: { createdAt: 'DESC' },
      take: Math.min(200, limit + offset),
    });

    const rankedTweets = [...tweets]
      .sort((left, right) => this.scoreTweet(right) - this.scoreTweet(left))
      .slice(offset, offset + limit);

    return this.buildTimelineTweets(rankedTweets, viewerUserId);
  }

  private scoreTweet(tweet: Tweet) {
    const ageInHours = Math.max(0, (Date.now() - new Date(tweet.createdAt).getTime()) / 3_600_000);
    const recencyScore = Math.max(0, 48 - ageInHours);
    return recencyScore + tweet.likeCount * 2 + tweet.commentCount * 3 + (tweet.isRetweet ? 1 : 0);
  }

  private normalizeLimit(value: number | undefined, fallback: number, min: number, max: number) {
    if (!Number.isFinite(value ?? NaN)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, Math.floor(value ?? fallback)));
  }

  private normalizeOffset(value: number | undefined) {
    if (!Number.isFinite(value ?? NaN)) {
      return 0;
    }

    return Math.max(0, Math.floor(value ?? 0));
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