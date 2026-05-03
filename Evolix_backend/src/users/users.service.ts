import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Not } from 'typeorm';
import { User } from './entities/user.entity';
import { Follow } from '../follows/entities/follow.entity';
import { Tweet } from '../tweets/entities/tweet.entity';

export type ProfileResponse = {
  user: {
    id: number;
    name: string;
    handle: string;
    email: string;
    bio: string;
    location: string;
    website: string;
    avatarUrl: string;
    headerUrl: string;
    joined: string;
    followingCount: number;
    followersCount: number;
    postsCount: number;
    isFollowing: boolean;
  };
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
    @InjectRepository(Tweet)
    private tweetRepository: Repository<Tweet>,
  ) {}

  //Check profile by ID
  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      //DO NOT, SELECT PASSWORD ELSE -> SQLI
      select: ['id', 'username', 'email', 'createdAt'], 
    });
    
    if (!user) {
      throw new NotFoundException('User can not be found');
    }
    return user;
  }

  //Check profile by username
  async searchUsers(keyword: string) {
    return this.userRepository.find({
      where: { username: Like(`%${keyword}%`) }, //Find names with keywords
      select: ['id', 'username', 'email'], //DO NOT PUT PASSWORD HERE
      take: 10, //Only find maximum of 10 users
    });
  }

  async findManyByIds(ids: number[]) {
    const uniqueIds = [...new Set(ids.filter((id) => Number.isFinite(id)))];

    if (uniqueIds.length === 0) {
      return [];
    }

    return this.userRepository.find({
      where: { id: In(uniqueIds) },
      select: ['id', 'username', 'email', 'createdAt'],
    });
  }

  async findEntityById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  async getSuggestions(viewerUserId: number) {
    // find who the viewer is already following
    const following = await this.followRepository.find({ where: { followerId: viewerUserId } });
    const excluded = [viewerUserId, ...following.map(f => f.followingId)];

    // pick up to 4 users that are not the viewer and not already followed
    const suggestions = await this.userRepository.find({
      where: { id: Not(In(excluded)) },
      take: 4,
      select: ['id', 'username', 'email', 'createdAt', 'displayName', 'avatarUrl'],
    });

    return suggestions.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName ?? u.username,
      avatarUrl: u.avatarUrl ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(u.username)}`,
    }));
  }

  async getProfileByHandle(handle: string, viewerUserId?: number): Promise<ProfileResponse> {
    const user = await this.userRepository.findOne({
      where: { username: handle },
    });

    if (!user) {
      throw new NotFoundException('User can not be found');
    }

    const [followingCount, followersCount, postsCount, isFollowing] = await Promise.all([
      this.followRepository.count({ where: { followerId: user.id } }),
      this.followRepository.count({ where: { followingId: user.id } }),
      this.tweetRepository.count({ where: { userId: user.id } }),
      viewerUserId ? this.followRepository.findOne({ where: { followerId: viewerUserId, followingId: user.id } }) : Promise.resolve(null),
    ]);

    return {
      user: {
        id: user.id,
        name: user.displayName ?? user.username,
        handle: user.username,
        email: user.email,
        bio: user.bio ?? '',
        location: user.location ?? '',
        website: user.website ?? '',
        avatarUrl: user.avatarUrl ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(user.username)}`,
        headerUrl: user.headerUrl ?? `https://picsum.photos/seed/${encodeURIComponent(user.username)}/1200/400`,
        joined: user.createdAt.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        followingCount,
        followersCount,
        postsCount,
        isFollowing: Boolean(isFollowing),
      },
    };
  }

  async updateMyProfile(userId: number, updates: {
    name?: string;
    bio?: string;
    location?: string;
    website?: string;
    avatarUrl?: string;
    headerUrl?: string;
  }) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User can not be found');
    }

    const name = updates.name?.trim();
    const bio = updates.bio?.trim();
    const location = updates.location?.trim();
    const website = updates.website?.trim();

    if (name !== undefined && name.length === 0) {
      throw new BadRequestException('Name cannot be empty');
    }

    user.displayName = name ?? user.displayName;
    user.bio = bio ?? user.bio;
    user.location = location ?? user.location;
    user.website = website ?? user.website;
    if (updates.avatarUrl !== undefined) {
      user.avatarUrl = updates.avatarUrl;
    }
    if (updates.headerUrl !== undefined) {
      user.headerUrl = updates.headerUrl;
    }

    await this.userRepository.save(user);

    return this.getProfileByHandle(user.username, user.id);
  }
}