import { Provider, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { redisConfig } from './redis.config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    const redis = new Redis(redisConfig);

    redis.on('connect', () => {
      Logger.log('Redis connected successfully');
    });

    redis.on('error', (error) => {
      Logger.error('Redis connection error:', error);
    });

    return redis;
  },
};
