import { body, query } from 'express-validator/check';
import { checkValidateError } from '../../../../middleware';

export const addCommentValidator = [
  body('postId').exists({ checkNull: true }),
  body('authorId').exists({ checkNull: true }),
  body('content').exists({ checkNull: true }).trim().isLength({ min: 1, max: 1000 }),
  checkValidateError,
];

export const deleteCommentValidator = [
  query('commentId').isNumeric().toInt(),
  checkValidateError,
];

export const editCommentValidator = [
  body('commentId').isNumeric().toInt(),
  body('postId').exists({ checkNull: true }),
  body('authorId').exists({ checkNull: true }),
  body('content').exists({ checkNull: true }).trim().isLength({ min: 1, max: 1000 }),
  checkValidateError,
];

export const addSubCommentValidator = [
  body('parentCmtId').isNumeric().toInt(),
  body('content').exists({ checkNull: true }).trim().isLength({ min: 1, max: 1000 }),
  checkValidateError,
];

export const deleteSubCommentValidator = [
  query('commentId').isNumeric().toInt(),
  checkValidateError,
];

export const editSubCommentValidator = [
  body('commentId').isNumeric().toInt(),
  body('parentCmtId').isNumeric().toInt(),
  body('content').exists({ checkNull: true }).trim().isLength({ min: 1, max: 1000 }),
  checkValidateError,
];
