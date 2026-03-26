import Redis from 'ioredis';

import { config, rateLimitConfig } from '../config';

const redis = new Redis(config.REDIS_URL);

interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export class RateLimitService {
  static async checkUser(userId: string): Promise<RateLimitResult> {
    return this.check(this.buildKey('user', userId), rateLimitConfig.userLimit);
  }

  static async checkIp(ipAddress: string): Promise<RateLimitResult> {
    return this.check(this.buildKey('ip', ipAddress), rateLimitConfig.ipLimit);
  }

  static async checkExecute(userId: string): Promise<RateLimitResult> {
    return this.check(this.buildKey('execute', userId), rateLimitConfig.executeLimit);
  }

  private static async check(key: string, limit: number): Promise<RateLimitResult> {
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, rateLimitConfig.windowSeconds);
    }

    return {
      allowed: count <= limit,
      retryAfterSeconds: rateLimitConfig.windowSeconds
    };
  }

  private static buildKey(scope: 'user' | 'ip' | 'execute', identity: string): string {
    const windowMinute = Math.floor(Date.now() / 60_000);
    return `ratelimit:${scope}:${identity}:${windowMinute}`;
  }
}
