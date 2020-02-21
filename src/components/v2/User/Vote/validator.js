import { body } from 'express-validator/check';
import { checkValidateError } from '../../../../middleware';

export const votePostValidator = [
  body('postId').exists({ checkNull: true }),
  checkValidateError,
];
export const voteCommentValidator = [
  body('commentId').isNumeric().toInt(),
  checkValidateError,
];
