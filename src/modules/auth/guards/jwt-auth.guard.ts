import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  override handleRequest(err: any, user: any, _info: any) {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'You must be authenticated to access this resource',
        )
      );
    }
    return user;
  }
}
