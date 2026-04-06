import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // API Search username: GET http://localhost:3000/users/search?q=name
  @UseGuards(AuthGuard)
  @Get('search')
  search(@Query('q') q: string) {
    if (!q) return []; //If user doesn't input anything -> return blank textbox
    return this.usersService.searchUsers(q);
  }

  // API Stalk Profile: GET http://localhost:3000/users/id
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id); //Using "+" will make the id from string -> int
  }
}