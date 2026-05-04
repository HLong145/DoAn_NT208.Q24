import { Controller, Post, Param, UseGuards, Request, ParseIntPipe, Get } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { AuthGuard } from '../auth/auth.guard'; 

@Controller('follows')
export class FollowsController {
  constructor(
    // Inject FollowsService để thực thi logic thao tác với Cơ sở dữ liệu
    private readonly followsService: FollowsService
  ) {}

  @UseGuards(AuthGuard)
  @Get('following')
  getFollowingIds(@Request() req) {
    return this.followsService.findFollowingIds(req.user.sub);
  }

  // Endpoint to toggle follow: POST http://localhost:3000/follows/:followingId
  // Protected by AuthGuard to know WHO is following
  @UseGuards(AuthGuard)
  @Post(':followingId')
  async toggleFollow(
    @Request() req, 
    // Safely parse the user ID from the URL parameter
    @Param('followingId', ParseIntPipe) followingId: number 
  ) {
    // Extract the follower's ID from the JWT token
    const followerId = req.user.sub;
    return this.followsService.toggleFollow(followerId, followingId);
  }
}