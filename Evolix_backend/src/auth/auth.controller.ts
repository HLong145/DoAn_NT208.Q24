import { Controller, Post, Body, Get, Request, UseGuards, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { ChangeEmailDto, ChangeHandleDto, ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  me(@Request() req) {
    return this.authService.me(req.user.sub);
  }

  // API Register: POST http://localhost:3000/auth/register
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.username, body.email, body.password);
  }

  // API Login: POST http://localhost:3000/auth/login
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(AuthGuard)
  @Patch('password')
  changePassword(@Request() req, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(req.user.sub, body.currentPassword, body.newPassword);
  }

  @UseGuards(AuthGuard)
  @Patch('email')
  changeEmail(@Request() req, @Body() body: ChangeEmailDto) {
    return this.authService.changeEmail(req.user.sub, body.newEmail, body.currentPassword);
  }

  @UseGuards(AuthGuard)
  @Patch('handle')
  changeHandle(@Request() req, @Body() body: ChangeHandleDto) {
    return this.authService.changeHandle(req.user.sub, body.newHandle, body.currentPassword);
  }

  @UseGuards(AuthGuard)
  @Patch('deactivate')
  deactivateAccount(@Request() req) {
    return this.authService.deactivateAccount(req.user.sub);
  }
}