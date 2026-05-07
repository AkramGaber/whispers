import { RateLimitHit } from '../models/RateLimitHit.js';
import { HttpError } from './errorHandler.js';

export function rateLimit({ max, windowMs, keyFn }) {
  return async function rateLimitMiddleware(req, _res, next) {
    // TODO:
    // Hint: compute windowStart = floor(now / windowMs) * windowMs.
    try {
      const key = keyFn(req);
      const now = Date.now();
      const windowStart = Math.floor(now / windowMs) * windowMs;
      // Use findOneAndUpdate with { upsert: true, new: true } and $inc: { count: 1 } on { key, windowStart }.
      const record = await RateLimitHit.findOneAndUpdate(
        {key, windowStart}, { $inc: {count: 1} }, {upsert: true, new: true}
      );
      // If returned count > max, throw HttpError(429). Otherwise next().
      if(record.count > max) {
        throw new HttpError(429, 'Too many requests, please try again latere.');
      }
      next();
    } catch(err) {
      next(err);
    }
    // See: docs/API.md "Rate limiting", tester/tests/bonus-rate-limit.test.js
    // throw new Error('not implemented');
  };
}

export function clientIp(req) {
  // TODO:
  // Hint: prefer x-forwarded-for (first IP before comma) — required behind proxies/serverless.
  const forwarded = req.headers['x-forwarded-for'];
  if(forwarded) return forwarded.split(',')[0].trim();
  // Fall back to req.socket.remoteAddress, then 'unknown'.
  return req.socket.remoteAddress || 'unknown';
  // throw new Error('not implemented');
}
