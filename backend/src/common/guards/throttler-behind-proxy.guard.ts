import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type Req = {
  headers: Record<string, string | string[] | undefined>;
  ips?: string[];
  ip?: string;
};

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected getTracker(req: Req): Promise<string> {
    const forwarded = req.headers['x-forwarded-for'];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const val =
      (typeof first === 'string' ? first : '').split(',')[0]?.trim() ||
      req.ips?.[0] ||
      req.ip ||
      'unknown';
    return Promise.resolve(val);
  }
}
