import { Controller, Get, Post, Param, ParseIntPipe, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { BookmarksService } from './bookmarks.service';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @UseGuards(AuthGuard)
  @Get()
  getBookmarkedTweets(@Request() req) {
    return this.bookmarksService.listBookmarkedTweets(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Post(':tweetId')
  toggleBookmark(@Request() req, @Param('tweetId', ParseIntPipe) tweetId: number) {
    return this.bookmarksService.toggleBookmark(req.user.sub, tweetId);
  }
}