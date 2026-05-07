import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';

export async function getPublicProfile(req, res, next) {
  // TODO:
  try {
    const { username } = req.params;
    // Hint: User.findOne({ username }). 404 if missing. Exclude email + passwordHash from response.
    const user = await User.findOne({ username }).select('-email -passwordHash');

    if(!user) {
      throw new HttpError(404, 'User not found');
    }
    res.json(user);
  } catch(err) {
    next(err);
  }
  // See: docs/API.md "GET /api/users/:username", tester/tests/profile.test.js
  // throw new Error('not implemented');
}

export async function updateMe(req, res, next) {
  // TODO:
  try {
    const userId = req.user._id;
    // Hint: whitelist fields a user may update: displayName, bio, avatarUrl, acceptingQuestions, tags.
    const { displayName, bio, avatarUrl, acceptingQuestions, tags } = req.body;
    // Silently IGNORE username / email even if sent — they are immutable here.
    const updateData = {};
    if(displayName !== undefined) updateData.displayName = displayName;
    if(bio !== undefined) updateData.bio = bio;
    if(avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if(acceptingQuestions !== undefined) updateData.acceptingQuestions = acceptingQuestions;
    if(tags !== undefined) updateData.tags = tags;
    // Use findByIdAndUpdate with { new: true, runValidators: true }.
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      {$set: updateData},
      {new: true, runValidators: true}
    );
    res.json(updatedUser);
  } catch(err) {
    next(err);
  }
  // See: docs/API.md "PATCH /api/users/me", tester/tests/profile.test.js
  // throw new Error('not implemented');
}
