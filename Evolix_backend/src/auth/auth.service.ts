import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

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
    });
    await this.userRepository.save(newUser);

    return { message: 'Successfully Registered', user: { username, email } };
  }

  //Login Func
  async login(username: string, pass: string) {
    //Check for user in DB
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Username or Password is incorrect');
    }

    //Another check for the password vs encrypted password
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Username or Password is incorrect');
    }

    //Login Success
    const payload = { sub: user.id, username: user.username };
    return {
      message: 'Login success',
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}