import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // For apps behind a proxy (like Heroku, AWS ELB, etc.), use X-Forwarded-For
    return (
      (req.headers['x-forwarded-for'] || '').split(',')[0] ||
      req.ips?.[0] ||
      req.ip ||
      'unknown'
    );
  }
}

