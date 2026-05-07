import { HttpError } from "./errorHandler.js";

export const validate = (schema) => (req, res, next) => {
  // TODO:
  // Hint: schema.safeParse(req.body). On failure: 400 with { error: { message, details } }.
  const result = schema.safeParse(req.body);
  if(!result.success) {
    return next(new HttpError(400, 'Validation failed', result.error.issues));
  }
  // On success: replace req.body with result.data and call next().
  req.body = result.data;
  next();
  // throw new Error('not implemented');
};
