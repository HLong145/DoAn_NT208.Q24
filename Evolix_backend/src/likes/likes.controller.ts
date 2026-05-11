import { Controller, Post, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { LikesService } from './likes.service';

@Controller('likes')
export class LikesController {
  constructor(
    private readonly likesService: LikesService,
  ) {}

  // Endpoint to toggle like: POST http://localhost:3000/likes/:tweetId
  // Must be protected by AuthGuard so we know WHO is liking the tweet
  @UseGuards(AuthGuard)
  @Post(':tweetId')
  async toggleLike(
    @Request() req,
    @Param('tweetId', ParseIntPipe) tweetId: number,
  ) {
    const userId = req.user.sub;
    return this.likesService.toggleLike(userId, tweetId);
  }

}