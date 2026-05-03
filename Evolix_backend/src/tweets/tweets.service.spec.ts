import { TweetsService } from './tweets.service';
import { Tweet } from './entities/tweet.entity';
import { Comment } from '../comments/entities/comment.entity';

describe('TweetsService', () => {
  let service: TweetsService;
  let tweetRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let commentRepository: {
    find: jest.Mock;
  };
  let cacheManager: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };
  let followsService: {
    findFollowerIds: jest.Mock;
    findFollowingIds: jest.Mock;
  };
  let realtimeGateway: {
    sendNotificationToFollowers: jest.Mock;
  };
  let usersService: {
    findManyByIds: jest.Mock;
  };
  let notificationsService: {
    createForRecipients: jest.Mock;
  };
  let bookmarksService: {
    getBookmarkedTweetIds: jest.Mock;
  };

  const now = new Date('2024-04-01T12:00:00.000Z');

  const buildTweet = (id: number, createdAt: Date, overrides: Partial<Tweet> = {}) => ({
    id,
    userId: 1,
    content: `tweet ${id}`,
    mediaUrls: null,
    isRetweet: false,
    originalTweetId: null,
    likeCount: 0,
    commentCount: 0,
    createdAt,
    ...overrides,
  } as Tweet);

  beforeEach(async () => {
    tweetRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    commentRepository = {
      find: jest.fn(),
    };
    cacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };
    followsService = {
      findFollowerIds: jest.fn(),
      findFollowingIds: jest.fn(),
    };
    realtimeGateway = {
      sendNotificationToFollowers: jest.fn(),
    };
    usersService = {
      findManyByIds: jest.fn(),
    };
    notificationsService = {
      createForRecipients: jest.fn(),
    };
    bookmarksService = {
      getBookmarkedTweetIds: jest.fn(),
    };

    service = new TweetsService(
      tweetRepository as any,
      commentRepository as any,
      cacheManager as any,
      followsService as any,
      realtimeGateway as any,
      usersService as any,
      notificationsService as any,
      bookmarksService as any,
    );

    jest.useFakeTimers();
    jest.setSystemTime(now);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a tweet, invalidates caches, and notifies followers', async () => {
    tweetRepository.create.mockReturnValue({
      id: 10,
      userId: 1,
      content: 'Launch day #evolix',
      createdAt: new Date('2024-04-01T12:00:00.000Z'),
    });
    followsService.findFollowerIds.mockResolvedValue([2, 3]);
    notificationsService.createForRecipients.mockResolvedValue(undefined);

    const result = await service.createTweet(1, 'Launch day #evolix');

    expect(tweetRepository.save).toHaveBeenCalled();
    expect(followsService.findFollowerIds).toHaveBeenCalledWith(1);
    expect(cacheManager.del).toHaveBeenCalledWith('timeline_user_1');
    expect(cacheManager.del).toHaveBeenCalledWith('timeline_user_2');
    expect(cacheManager.del).toHaveBeenCalledWith('timeline_user_3');
    expect(cacheManager.del).toHaveBeenCalledWith('lead_story');
    expect(cacheManager.del).toHaveBeenCalledWith('trending_topics');
    expect(notificationsService.createForRecipients).toHaveBeenCalledWith([2, 3], 1, 'tweet', 10);
    expect(realtimeGateway.sendNotificationToFollowers).toHaveBeenCalledWith(['2', '3'], expect.objectContaining({
      event: 'tweet.created',
      tweetId: 10,
      authorId: 1,
      content: 'Launch day #evolix',
    }));
    expect(result.message).toBe('Tweet created successfully');
  });

  it('returns a ranked for-you feed with pagination applied', async () => {
    const tweets = [
      buildTweet(1, new Date('2024-03-30T12:00:00.000Z'), { likeCount: 0, commentCount: 0 }),
      buildTweet(2, new Date('2024-03-31T12:00:00.000Z'), { likeCount: 0, commentCount: 0 }),
      buildTweet(3, new Date('2024-04-01T11:30:00.000Z'), { likeCount: 10, commentCount: 5 }),
    ];

    tweetRepository.find.mockResolvedValue(tweets);
    usersService.findManyByIds.mockResolvedValue([{ id: 1, username: 'alice', email: 'alice@example.com', createdAt: new Date() }]);
    bookmarksService.getBookmarkedTweetIds.mockResolvedValue([]);

    const result = await service.getFeed(1, 'for-you', { limit: 2, offset: 0 });

    expect(tweetRepository.find).toHaveBeenCalledWith(expect.objectContaining({ take: 2 }));
    expect(result.map((tweet) => tweet.id)).toEqual(['3', '2']);
  });

  it('uses pagination and cache for the following feed', async () => {
    tweetRepository.find.mockResolvedValue([
      buildTweet(12, new Date('2024-03-30T12:00:00.000Z')),
    ]);
    followsService.findFollowingIds.mockResolvedValue([]);
    usersService.findManyByIds.mockResolvedValue([{ id: 1, username: 'alice', email: 'alice@example.com', createdAt: new Date() }]);
    bookmarksService.getBookmarkedTweetIds.mockResolvedValue([]);
    cacheManager.get.mockResolvedValue(null);

    const result = await service.getFeed(1, 'following', { limit: 1, offset: 1 });

    expect(cacheManager.get).toHaveBeenCalledWith('timeline_user_1_limit_1_offset_1');
    expect(tweetRepository.find).toHaveBeenCalledWith(expect.objectContaining({ take: 1, skip: 1 }));
    expect(cacheManager.set).toHaveBeenCalledWith('timeline_user_1_limit_1_offset_1', expect.any(Array), 60000);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('12');
  });

  it('computes trending topics from recent tweets', async () => {
    tweetRepository.find.mockResolvedValue([
      { content: 'Hello #NestJS' },
      { content: 'A second post about #TypeScript' },
      { content: 'Another post about #TypeScript and #backend' },
    ]);
    cacheManager.get.mockResolvedValue(null);

    const result = await service.getTrendingTopics(3);

    expect(result).toEqual([
      { topic: '#TypeScript', posts: '2 posts' },
      { topic: '#NestJS', posts: '1 posts' },
      { topic: '#backend', posts: '1 posts' },
    ]);
    expect(cacheManager.set).toHaveBeenCalledWith('trending_topics', result, 300);
  });
});
