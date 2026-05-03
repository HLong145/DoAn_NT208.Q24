import { Body, Controller, Get, Param, ParseIntPipe, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(AuthGuard)
  @Get('threads')
  getThreads(@Request() req) {
    return this.messagesService.getThreads(req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Post('threads')
  createConversation(@Request() req, @Body('participantId') participantId: string | number) {
    return this.messagesService.createOrGetConversation(req.user.sub, Number(participantId));
  }

  @UseGuards(AuthGuard)
  @Get('threads/:threadId/messages')
  getMessages(@Request() req, @Param('threadId', ParseIntPipe) threadId: number) {
    return this.messagesService.getMessages(req.user.sub, threadId);
  }

  @UseGuards(AuthGuard)
  @Post('threads/:threadId/messages')
  sendMessage(@Request() req, @Param('threadId', ParseIntPipe) threadId: number, @Body('content') content: string) {
    return this.messagesService.sendMessage(req.user.sub, threadId, content);
  }
}