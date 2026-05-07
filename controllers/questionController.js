import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { HttpError } from '../middleware/errorHandler.js';

export async function sendQuestion(req, res, next) {
  // TODO:
  try {
    const { username } = req.params;
    const { body } = req.body;
    // Hint: find recipient by :username. 404 if missing, 403 if acceptingQuestions === false.
    const recipient = await User.findOne({ username });
    if(!recipient) throw new HttpError(404, 'User not found');
    if(!recipient.acceptingQuestions) throw new HttpError(403, 'User not accepting questions!');
    // Create Question { recipient: recipient._id, body }. Respond 201 WITHOUT recipient field
    const question = await Question.create({ recipient: recipient._id, body });
    // (anonymous send — do not leak sender OR recipient id in the echo).
    const response = question.toObject();
    delete response.recipient;
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
  // See: docs/API.md "POST /api/users/:username/questions", tester/tests/send-question.test.js
  // throw new Error('not implemented');
}

export async function listInbox(req, res, next) {
  // TODO:
  try {
    const { status } = req.query;
    // Hint: filter { recipient: req.user._id }. Optional ?status=pending|answered|ignored (else 400).
    if(status && !['pending', 'answered', 'ignored'].includes(status) ) {
      throw new HttpError(400, 'Invalid status filter');
    }

    // Pagination: page (default 1, min 1), limit (default 20, min 1, max 50).
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { recipient: req.user._id };
    if(status) filter.status = status;

    // Sort createdAt desc. Envelope: { data, page, limit, total, totalPages }.
    const [data, total] = await Promise.all([
      Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Question.countDocuments(filter)
    ]);

    res.json({ data, page, limit, total, totalPages: Math.ceil(total/limit) });
  } catch(err) {
    next(err);
  }
  // See: docs/API.md "GET /api/questions/inbox", tester/tests/inbox.test.js
  // throw new Error('not implemented');
}

async function getOwnedQuestion(id, userId) {
  // TODO:
  // Hint: load by id -> 404 if missing -> 403 if recipient !== userId.
  const question = await Question.findById(id);
  if(!question) throw new HttpError(404, 'Question not found');
  // Compare as strings (ObjectId). Returns the question doc.
  if(question.recipient.toString() !== userId.toString()) {
    throw new HttpError(403, 'Access denied');
  }
  return question;
  // throw new Error('not implemented');
}

export async function answerQuestion(req, res, next) {
  // TODO:
  try {
    // Hint: use getOwnedQuestion for 404/403. Set answer, answeredAt=now, status='answered'.
    const question = await getOwnedQuestion(req.params.id, req.user._id);
    const { answer, visibility } = req.body;

    question.answer = answer;
    question.answeredAt = new Date();
    question.status = 'answered';
    // If body has visibility, apply it. Save + return the question.
    if(visibility) question.visibility = visibility;
    await question.save();
    res.json(question);
  } catch(err) {
    next(err);
  }
  // See: docs/API.md "POST /api/questions/:id/answer", tester/tests/answer.test.js
  // throw new Error('not implemented');
}

export async function updateQuestion(req, res, next) {
  // TODO:
  try {
    // Hint: ownership check. Accept any of answer / status / visibility. If answer provided,
    const question = await getOwnedQuestion(req.params.id, req.user._id);
    const { answer, status, visibility } = req.body;
    // also set answeredAt + status='answered'. Save + return.
    if(answer !== undefined) {
      question.answer = answer;
      question.answeredAt = new Date();
      question.status = 'answered';
    }
    if(status) question.status = status;
    if(visibility) question.visibility = visibility;
    await question.save();
    res.json(question);
  } catch (err) {
    next(err);
  }
  // See: docs/API.md "PATCH /api/questions/:id", tester/tests/answer.test.js
  // throw new Error('not implemented');
}

export async function removeQuestion(req, res, next) {
  // TODO:
   try {
     // Hint: ownership check, deleteOne, 204 no content.
    const question = await getOwnedQuestion(req.params.id, req.user._id);
    await question.deleteOne();
    res.status(204).end();
   } catch (err) {
    next(err);
   }
  // See: docs/API.md "DELETE /api/questions/:id", tester/tests/answer.test.js
  // throw new Error('not implemented');
}

export async function listPublicFeed(req, res, next) {
  // TODO:
  try {
    // Hint: find user by :username (404 if missing). Filter questions:
    const { username } = req.params; 
    const user = await User.findOne({ username });
    if(!user) throw new HttpError(404, 'User not found');

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    //   recipient=user._id, status='answered', visibility='public'.
    const filter = {
      recipient: user._id, status: 'answered', visibility: 'public'
    };

    const [data, total] = await Promise.all([
      Question.find(filter, { recipient: 0 }).sort({ answeredAt: -1 }).skip(skip).limit(limit),
      Question.countDocuments(filter)
    ]);
    res.json({ data, page, limit, total, totalPages: Math.ceil(total/limit) });
  } catch(err) {
    next(err);
  }
  // Exclude recipient field from response. Sort answeredAt desc. Same pagination envelope as inbox.
  // See: docs/API.md "GET /api/users/:username/questions", tester/tests/public-feed.test.js
  // throw new Error('not implemented');
}
