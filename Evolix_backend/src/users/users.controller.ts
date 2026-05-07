import { Controller, Get, Param, Query, UseGuards, Patch, Post, Request, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

const uploadStorage = diskStorage({
  destination: join(process.cwd(), 'uploads'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

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

  @UseGuards(AuthGuard)
  @Post('me/upload')
  @UseInterceptors(FileInterceptor('file', { storage: uploadStorage }))
  uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('No file uploaded');
    return { url: `/uploads/${file.filename}` };
  }

  // API Stalk Profile: GET http://localhost:3000/users/id
  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id); //Using "+" will make the id from string -> int
  }
}