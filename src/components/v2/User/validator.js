import { body, oneOf } from 'express-validator/check';
import { checkValidateError } from '../../../middleware';
import { MESSAGES } from '../../../constant';

export const updateProfileValidator = [
  oneOf([
    body('fullName').trim().isLength({ min: 1, max: 50 }),
    body('fullName').not().exists({ checkNull: true }),
  ], MESSAGES.VALIDATOR.FULLNAME),
  oneOf([
    body('about').not().exists({ checkNull: true }),
    body('about').trim().isLength({ min: 0, max: 600 }),
  ]),
  checkValidateError,
];

export const updateFollowCategoryValidator = [
  body('updatedCategories').isArray(),
  body('updatedCategories.*').isString(),
  checkValidateError,
];

export const followAuthorValidator = [
  body('authorId').exists({ checkFalsy: true }),
  checkValidateError,
];

export const followCategoryValidator = [
  body('categoryId').isString(),
  checkValidateError,
];

export const sharePostValidator = [
  body('postId').exists({ checkNull: true }),
  checkValidateError,
];

export const reportPostValidator = [
  body('postId').exists({ checkNull: true }),
  body('reason').isString(),
  body('reasonId').isNumeric().toInt(),
  checkValidateError,
];

export const ignorePostValidator = [
  body('postId').exists({ checkNull: true }),
  checkValidateError,
];

export const blockUserValidator = [
  body('blockedUserId').exists({ checkFalsy: true }),
  checkValidateError,
];
