import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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
}