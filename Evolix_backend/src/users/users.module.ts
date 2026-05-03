import { Global, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Follow } from '../follows/entities/follow.entity';
import { Tweet } from '../tweets/entities/tweet.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, Follow, Tweet])], //Ask for auth to check
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], //Export to check for User if needed
})
export class UsersModule {}