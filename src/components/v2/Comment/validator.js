import { query } from 'express-validator/check';
import { checkValidateError } from '../../../middleware';

export const listCommentValidator = [
  query('filters.postId').exists({ checkNull: true }),
  query('filters.authorId').exists({ checkNull: true }),
  checkValidateError,
];

export const listSubCommentValidator = [
  query('filters.parentCmtId').isNumeric().toInt(),
  checkValidateError,
];
