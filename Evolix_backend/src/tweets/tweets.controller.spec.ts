import { TweetsController } from './tweets.controller';

describe('TweetsController', () => {
  let controller: TweetsController;
  let tweetsService: {
    createTweet: jest.Mock;
    retweet: jest.Mock;
    getUserTimeline: jest.Mock;
    getFeed: jest.Mock;
    getTrendingTopics: jest.Mock;
    getLeadStory: jest.Mock;
    searchTweets: jest.Mock;
    getTweetsByUser: jest.Mock;
    getTweetDetail: jest.Mock;
  };

  beforeEach(async () => {
    tweetsService = {
      createTweet: jest.fn(),
      retweet: jest.fn(),
      getUserTimeline: jest.fn(),
      getFeed: jest.fn(),
      getTrendingTopics: jest.fn(),
      getLeadStory: jest.fn(),
      searchTweets: jest.fn(),
      getTweetsByUser: jest.fn(),
      getTweetDetail: jest.fn(),
    };

    controller = new TweetsController(tweetsService as any);

    jest.clearAllMocks();
  });

  it('delegates tweet creation to the service', async () => {
    tweetsService.createTweet.mockResolvedValue({ message: 'Tweet created successfully' });

    const result = await controller.createTweet({ user: { sub: 5 } } as any, { content: 'Hello world' });

    expect(tweetsService.createTweet).toHaveBeenCalledWith(5, 'Hello world');
    expect(result).toEqual({ message: 'Tweet created successfully' });
  });

  it('passes feed query parameters to the service', async () => {
    tweetsService.getFeed.mockResolvedValue([{ id: '1' }]);

    const result = await controller.getFeed({ user: { sub: 5 } } as any, 'for-you', '20', '5');

    expect(tweetsService.getFeed).toHaveBeenCalledWith(5, 'for-you', { limit: 20, offset: 5 });
    expect(result).toEqual([{ id: '1' }]);
  });
});
