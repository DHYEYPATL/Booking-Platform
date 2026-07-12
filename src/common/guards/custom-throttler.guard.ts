import { Injectable, Inject } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  @Inject(JwtService)
  private readonly jwtService: JwtService;

  /**
   * Tracks requests by User ID if authenticated, falling back to IP address.
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = this.jwtService.decode(token);
        if (decoded && decoded.sub) {
          return `user:${decoded.sub}`;
        }
      } catch {
        // Fallback to IP if decoding fails
      }
    }
    return req.ip;
  }

  /**
   * Enforces 120 requests/min limit for authenticated users, and 30 requests/min for public users.
   */
  protected async handleRequest(requestProps: any): Promise<boolean> {
    const { context } = requestProps;
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;
    let actualLimit = 30; // Default public rate limit

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = this.jwtService.decode(token);
        if (decoded && decoded.sub) {
          actualLimit = 120; // 4x higher limit for logged-in users
        }
      } catch {
        // Fallback to public limit if token is invalid/expired
      }
    }

    // Overwrite the limit in request properties dynamically
    requestProps.limit = actualLimit;

    return super.handleRequest(requestProps);
  }
}
