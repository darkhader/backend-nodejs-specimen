import { query, oneOf } from 'express-validator/check';
import { checkValidateError } from '../../../middleware';
import { POSTS } from '../../../constant';

export const listPostValidator = [
  oneOf([
    query('orderBy').not().exists({ checkNull: true }),
    query('orderBy').isIn([
      POSTS.ORDER_TYPE.CREATED_TIME,
      POSTS.ORDER_TYPE.COMMENT_NUMBER,
      POSTS.ORDER_TYPE.UPVOTE_NUMBER,
      POSTS.ORDER_TYPE.DOWNVOTE_NUMBER,
      POSTS.ORDER_TYPE.RECOMMEND,
      POSTS.ORDER_TYPE.TRENDING,
    ]),
  ]),
  oneOf([
    query('filters.categoryId').not().exists({ checkNull: true }),
    query('filters.categoryId').isString(),
  ]),
  checkValidateError,
];
