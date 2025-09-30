import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.provider';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.redisClient.get(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
      } else {
        this.logger.debug(`Cache miss for key: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Error getting key ${key} from Redis:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.redisClient.setex(key, ttlSeconds, value);
      } else {
        await this.redisClient.set(key, value);
      }
      this.logger.debug(`Cached value for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error setting key ${key} in Redis:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      this.logger.debug(`Deleted key from cache: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from Redis:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(
        `Error checking existence of key ${key} in Redis:`,
        error,
      );
      return false;
    }
  }

  async flushAll(): Promise<void> {
    try {
      await this.redisClient.flushall();
      this.logger.debug('Flushed all Redis cache');
    } catch (error) {
      this.logger.error('Error flushing Redis cache:', error);
    }
  }

  async getObject<T>(key: string): Promise<T | null> {
    try {
      const value = await this.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error parsing JSON for key ${key}:`, error);
      return null;
    }
  }

  async setObject<T>(
    key: string,
    value: T,
    ttlSeconds?: number,
  ): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.set(key, serialized, ttlSeconds);
    } catch (error) {
      this.logger.error(`Error serializing object for key ${key}:`, error);
    }
  }
}
