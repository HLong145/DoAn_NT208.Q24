import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    //Get the token from request
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('You must login to see this information');
    }
    
    try {
      //Take the secret key from auth modules to check if the token is right
      const payload = await this.jwtService.verifyAsync(token);

      // If token is valid, ensure the user still exists and is active
      const userId = Number(payload?.sub ?? NaN);
      if (!Number.isFinite(userId)) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const user = await this.usersService.findEntityById(userId);
      if (!user || user.isActive === false) {
        throw new UnauthorizedException('Account is deactivated or not found');
      }

      // attach payload and user entity
      request['user'] = payload;
      request['userEntity'] = user;
    } catch {
      throw new UnauthorizedException('Fake token nihahaha');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}