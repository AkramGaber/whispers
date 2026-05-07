import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';

export async function signup(req, res, next) {
  // TODO:
  // Hint: validate already ran (see routes). Pull { username, email, password, displayName } from req.body.
  try {
    const { username, email, password, displayName } = req.body;
    const existing = await User.findOne({$or: [{email}, {username}]});
    // Check duplicate email/username -> 409. Hash password with User.hashPassword, create user,
    if(existing) throw new HttpError(409, 'Username or email already exists');
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({username, email, passwordHash, displayName});
    // signToken(user), respond 201 { token, user }. toJSON strips passwordHash automatically.
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    // Mongo duplicate-key errors (err.code === 11000) must also become 409.
    if(err.code === 11000) return next(new HttpError(409, 'UserName or email already exists'));
    next(err);
  }
  // See: docs/API.md "POST /api/auth/signup", tester/tests/auth.test.js
  // throw new Error('not implemented');
}

export async function login(req, res, next) {
  // TODO:
  // Hint: find user by email. If missing OR comparePassword fails, 401 with a GENERIC message
  // (don't leak which half was wrong). On success return { token, user }.
  try {
    const { email, password } = req.body;
    const user = await User.findOne({email});
    if(!user || !(await user.comparePassword(password))) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const token = signToken(user);
    res.json({ token, user });

  } catch(err) {
    next(err);
  }
  // See: docs/API.md "POST /api/auth/login", tester/tests/auth.test.js
  // throw new Error('not implemented');
}

export async function me(req, res) {
  // TODO:
  // Hint: authenticate middleware has already attached the user — just return it.
  res.json(req.user);
  // See: docs/API.md "GET /api/auth/me", tester/tests/auth.test.js
  // throw new Error('not implemented');
}
