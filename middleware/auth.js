import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { HttpError } from './errorHandler.js';

const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

export async function authenticate(req, _res, next) {
  // TODO:
  // Hint: read Authorization: Bearer <token>. Verify with jwt.verify(token, JWT_SECRET).
  try {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(401, 'Unauthorized: No token provided');
    }
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    // Load User.findById(payload.sub). Attach to req.user. Any failure -> 401.
    if(!user) throw new HttpError(401, 'Unauthorized: no user found');
    req.user = user;
    next();
  } catch (err) {
    next(new HttpError(401, err.message || 'Unauthorized!'));
  }
  // See: docs/API.md "Authentication", tester/tests/auth.test.js
  // throw new Error('not implemented');
}

export function signToken(user) {
  // TODO:
  // Hint: jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '7d' })
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '7d' });
  // throw new Error('not implemented');
}
