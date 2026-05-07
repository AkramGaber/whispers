import { Question } from '../models/Question.js';
import { User } from '../models/User.js';

export async function listGlobalFeed(req, res, next) {
  // TODO:
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const tag = req.query.tag;
    // Hint: filter status='answered', visibility='public'.
    const filter = {
      status: 'answered',
      visibility: 'public'
    };
    // Optional ?tag=xxx: first find user ids with that tag (User.find({tags: xxx}).distinct('_id')),
    if(tag) {
      const userIds = await User.find({tags: tag}).distinct('_id');
      //   then add recipient: { $in: ids } to the filter. If no users match, return empty page.
      if(userIds.length === 0) {
        return res.json({ data: [], page, limit, total: 0, totalPages: 0 });
      }
      filter.recipient = { $in: userIds };
    }
    // Populate recipient with: username displayName avatarUrl tags.
    // Sort answeredAt desc. Pagination envelope { data, page, limit, total, totalPages }.
    const [data, total] = await Promise.all([
      Question.find(filter).sort({answeredAt: -1}).skip(skip).limit(limit).populate('recipient', 'username displayName avatarUrl tags'),
      Question.countDocuments(filter)
    ]);

    res.json({ data, page, limit, total, totalPages: Math.ceil(total/limit)});
  } catch(err) {
    next(err);
  }
  // See: docs/API.md "GET /api/feed", tester/tests/global-feed.test.js
  // throw new Error('not implemented');
}
