import { validationResult } from 'express-validator/check';
import createError from 'http-errors';

export const checkValidateError = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  } else {
    next(createError(422, errors.array()[0].msg, { errors: errors.array() }));
  }
};
