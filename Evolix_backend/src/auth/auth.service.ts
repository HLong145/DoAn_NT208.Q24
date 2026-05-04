import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  handle: string;
  createdAt: string;
  avatarUrl: string;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  //Register Func
  async register(username: string, email: string, pass: string) {
    // Check the availability of email and username
    const existingUser = await this.userRepository.findOne({ 
        where: [{ username }, { email }] 
    });
    if (existingUser) {
      throw new BadRequestException('Username or Email has been used');
    }

    //Hashing password
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(pass, saltOrRounds);

    //Save new users in DB
    const newUser = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      displayName: username,
      bio: null,
      location: null,
      website: null,
      avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(username)}`,
      headerUrl: `https://picsum.photos/seed/${encodeURIComponent(username)}/1200/400`,
      isActive: true,
      deactivatedAt: null,
    });
    await this.userRepository.save(newUser);

    return this.buildAuthSession(newUser);
  }

  //Login Func
  async login(identifier: string, pass: string) {
    //Check for user in DB
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      throw new UnauthorizedException('Username or Password is incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    //Another check for the password vs encrypted password
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Username or Password is incorrect');
    }

    //Login Success
    const payload = { sub: user.id, username: user.username };
    return this.buildAuthSession(user, payload);
  }

  async me(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    return {
      user: this.toAuthUser(user),
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return {
      message: 'Password updated successfully',
    };
  }

  async deactivateAccount(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      return {
        message: 'Account is already deactivated',
      };
    }

    user.isActive = false;
    user.deactivatedAt = new Date();
    await this.userRepository.save(user);

    return {
      message: 'Account deactivated successfully',
    };
  }

  private async buildAuthSession(user: User, payload?: { sub: number; username: string }) {
    const tokenPayload = payload ?? { sub: user.id, username: user.username };

    return {
      token: await this.jwtService.signAsync(tokenPayload),
      user: this.toAuthUser(user),
    };
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id.toString(),
      name: user.displayName ?? user.username,
      email: user.email,
      handle: user.username,
      createdAt: user.createdAt.toISOString(),
      avatarUrl: user.avatarUrl ?? `https://i.pravatar.cc/150?u=${encodeURIComponent(user.username)}`,
    };
  }
}