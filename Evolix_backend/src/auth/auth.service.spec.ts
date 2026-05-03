import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };

  const baseUser = {
    id: 1,
    username: 'alice',
    email: 'alice@example.com',
    password: 'hashed-password',
    displayName: 'Alice',
    bio: null,
    location: null,
    website: null,
    avatarUrl: null,
    headerUrl: null,
    isActive: true,
    deactivatedAt: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
  } as User;

  beforeEach(async () => {
    userRepository = {
      findOne: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    jwtService = {
      signAsync: jest.fn(),
    };

    service = new AuthService(userRepository as any, jwtService as unknown as JwtService);

    jest.clearAllMocks();
  });

  it('registers a new account and returns a session', async () => {
    userRepository.findOne.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-secret');
    jwtService.signAsync.mockResolvedValue('jwt-token');
    userRepository.create.mockReturnValue({ ...baseUser, password: 'hashed-secret' });

    const result = await service.register('alice', 'alice@example.com', 'secret123');

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: [{ username: 'alice' }, { email: 'alice@example.com' }],
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    expect(userRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      username: 'alice',
      email: 'alice@example.com',
      password: 'hashed-secret',
      displayName: 'alice',
      isActive: true,
    }));
    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 1, username: 'alice' });
    expect(result).toEqual({
      token: 'jwt-token',
      user: {
        id: '1',
        name: 'Alice',
        email: 'alice@example.com',
        handle: 'alice',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    });
  });

  it('logs in an active account with valid credentials', async () => {
    userRepository.findOne.mockResolvedValue(baseUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('jwt-token');

    const result = await service.login('alice@example.com', 'secret123');

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: [{ email: 'alice@example.com' }, { username: 'alice@example.com' }],
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('secret123', 'hashed-password');
    expect(result.token).toBe('jwt-token');
    expect(result.user.handle).toBe('alice');
  });

  it('updates the password after verifying the current password', async () => {
    userRepository.findOne.mockResolvedValue(baseUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

    const result = await service.changePassword(1, 'current-secret', 'new-secret');

    expect(bcrypt.compare).toHaveBeenCalledWith('current-secret', 'hashed-password');
    expect(bcrypt.hash).toHaveBeenCalledWith('new-secret', 10);
    expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      password: 'new-hashed-password',
    }));
    expect(result).toEqual({ message: 'Password updated successfully' });
  });

  it('deactivates an active account', async () => {
    userRepository.findOne.mockResolvedValue(baseUser);

    const result = await service.deactivateAccount(1);

    expect(userRepository.save).toHaveBeenCalledWith(expect.objectContaining({
      isActive: false,
      deactivatedAt: expect.any(Date),
    }));
    expect(result).toEqual({ message: 'Account deactivated successfully' });
  });
});
