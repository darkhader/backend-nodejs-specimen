import { body, query } from 'express-validator/check';
import { checkValidateError } from '../../../../middleware';

export const createBookmarkValidator = [
  body('postId').exists({ checkNull: true }),
  checkValidateError,
];

export const deleteBookmarkValidator = [
  query('postId').exists({ checkNull: true }),
  checkValidateError,
];
