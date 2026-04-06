import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    //Get the token from request
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('You must login to see this information');
    }
    
    try {
      //Take the secret key from auth modules to check if the token is right
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'nguoiyeucuayuuka', 
      });
      //If correct, put users into requests and post
      request['user'] = payload;
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