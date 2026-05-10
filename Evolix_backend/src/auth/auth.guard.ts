import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('You must login to see this information');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token has expired, please login again');
      }
      throw new UnauthorizedException('Fake token nihahaha');
    }

    const userId = Number(payload?.sub ?? NaN);
    if (!Number.isFinite(userId)) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.usersService.findEntityById(userId);
    if (!user || user.isActive === false) {
      throw new UnauthorizedException('Account is deactivated or not found');
    }

    // attach payload and user entity
    request['user'] = {
      ...payload,
      sub: userId,
    };
    request['userEntity'] = user;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}