import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Follow } from '../follows/entities/follow.entity';
import { Tweet } from '../tweets/entities/tweet.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
  };
  let followRepository: {
    find: jest.Mock;
    count: jest.Mock;
    findOne: jest.Mock;
  };
  let tweetRepository: {
    count: jest.Mock;
  };

  const baseUser = {
    id: 1,
    username: 'alice',
    email: 'alice@example.com',
    password: 'hashed-password',
    displayName: 'Alice',
    bio: 'Hello',
    location: 'Hanoi',
    website: 'example.com',
    avatarUrl: null,
    headerUrl: null,
    isActive: true,
    deactivatedAt: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  } as User;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };
    followRepository = {
      find: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
    };
    tweetRepository = {
      count: jest.fn(),
    };

    service = new UsersService(userRepository as any, followRepository as any, tweetRepository as any);

    jest.clearAllMocks();
  });

  it('finds a public user profile by id', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 7,
      username: 'bob',
      email: 'bob@example.com',
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
    });

    const result = await service.findOne(7);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 7 },
      select: ['id', 'username', 'email', 'createdAt'],
    });
    expect(result).toEqual({
      id: 7,
      username: 'bob',
      email: 'bob@example.com',
      createdAt: new Date('2024-02-01T00:00:00.000Z'),
    });
  });

  it('returns suggestions excluding the viewer and followed accounts', async () => {
    followRepository.find.mockResolvedValue([{ followingId: 2 }, { followingId: 3 }]);
    userRepository.find.mockResolvedValue([
      {
        id: 4,
        username: 'carol',
        email: 'carol@example.com',
        createdAt: new Date('2024-03-01T00:00:00.000Z'),
        displayName: 'Carol',
        avatarUrl: null,
      },
      {
        id: 5,
        username: 'dave',
        email: 'dave@example.com',
        createdAt: new Date('2024-03-02T00:00:00.000Z'),
        displayName: null,
        avatarUrl: 'https://cdn.example.com/avatar.png',
      },
    ]);

    const result = await service.getSuggestions(1);

    expect(followRepository.find).toHaveBeenCalledWith({ where: { followerId: 1 } });
    expect(userRepository.find).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: expect.anything() },
      take: 4,
      select: ['id', 'username', 'email', 'createdAt', 'displayName', 'avatarUrl'],
    }));
    expect(result).toEqual([
      {
        id: 4,
        username: 'carol',
        displayName: 'Carol',
        avatarUrl: 'https://i.pravatar.cc/150?u=carol',
      },
      {
        id: 5,
        username: 'dave',
        displayName: 'dave',
        avatarUrl: 'https://cdn.example.com/avatar.png',
      },
    ]);
  });

  it('builds a full profile response with social counts', async () => {
    userRepository.findOne.mockResolvedValue(baseUser);
    followRepository.count
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(11);
    tweetRepository.count.mockResolvedValue(13);
    followRepository.findOne.mockResolvedValue({ id: 99 });

    const result = await service.getProfileByHandle('alice', 8);

    expect(result.user).toEqual({
      id: 1,
      name: 'Alice',
      handle: 'alice',
      email: 'alice@example.com',
      bio: 'Hello',
      location: 'Hanoi',
      website: 'example.com',
      avatarUrl: 'https://i.pravatar.cc/150?u=alice',
      headerUrl: 'https://picsum.photos/seed/alice/1200/400',
      joined: 'January 2024',
      followingCount: 7,
      followersCount: 11,
      postsCount: 13,
      isFollowing: true,
    });
  });

  it('updates the profile and trims text fields', async () => {
    const existingUser = { ...baseUser, displayName: 'Alice', bio: 'Old bio', location: 'Old', website: 'old.com' } as User;
    userRepository.findOne.mockResolvedValue(existingUser);
    userRepository.save.mockImplementation(async (value) => value);

    jest.spyOn(service, 'getProfileByHandle').mockResolvedValue({
      user: {
        id: 1,
        name: 'New Name',
        handle: 'alice',
        email: 'alice@example.com',
        bio: 'Updated bio',
        location: 'Updated location',
        website: 'updated.example.com',
        avatarUrl: 'avatar',
        headerUrl: 'header',
        joined: 'January 2024',
        followingCount: 1,
        followersCount: 2,
        postsCount: 3,
        isFollowing: false,
      },
    } as any);

    const result = await service.updateMyProfile(1, {
      name: '  New Name  ',
      bio: '  Updated bio  ',
      location: '  Updated location  ',
      website: '  updated.example.com  ',
    });

    expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      displayName: 'New Name',
      bio: 'Updated bio',
      location: 'Updated location',
      website: 'updated.example.com',
    }));
    expect(result.user.name).toBe('New Name');
  });
});
