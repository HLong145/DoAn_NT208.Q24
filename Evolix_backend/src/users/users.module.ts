import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], //Ask for auth to check
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], //Export to check for User if needed
})
export class UsersModule {}