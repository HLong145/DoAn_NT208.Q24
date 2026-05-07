import { Body, Controller, Get, Param, ParseIntPipe, Post, Request, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AuthGuard } from '../auth/auth.guard';
import { MessagesService } from './messages.service';

const uploadStorage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

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
  @UseInterceptors(FileInterceptor('media', { storage: uploadStorage }))
  sendMessage(
    @Request() req,
    @Param('threadId', ParseIntPipe) threadId: number,
    @Body('content') content: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const mediaUrl = file ? `/uploads/${file.filename}` : undefined;
    return this.messagesService.sendMessage(req.user.sub, threadId, content ?? '', mediaUrl);
  }
}