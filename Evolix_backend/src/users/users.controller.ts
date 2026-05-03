import { Controller, Get, Param, Query, UseGuards, Patch, Request, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  @UseGuards(AuthGuard)
  @Get('profile/:handle')
  getProfile(@Request() req, @Param('handle') handle: string) {
    return this.usersService.getProfileByHandle(handle, req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get('suggestions')
  suggestions(@Request() req) {
    return this.usersService.getSuggestions(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Patch('me/profile')
  updateMyProfile(@Request() req, @Body() body: UpdateProfileDto) {
    return this.usersService.updateMyProfile(req.user.sub, body ?? {});
  }

  // API Stalk Profile: GET http://localhost:3000/users/id
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id); //Using "+" will make the id from string -> int
  }
}