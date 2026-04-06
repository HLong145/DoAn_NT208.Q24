import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // API Register: POST http://localhost:3000/auth/register
  @Post('register')
  register(@Body() body: any) {
    return this.authService.register(body.username, body.email, body.password);
  }

  // API Login: POST http://localhost:3000/auth/login
  @Post('login')
  login(@Body() body: any) {
    return this.authService.login(body.username, body.password);
  }
}