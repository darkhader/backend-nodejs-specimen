import { query, oneOf } from 'express-validator/check';
import { checkValidateError } from '../../../middleware';

export const searchValidator = [
  query('key').exists({ checkNull: true }),
  checkValidateError,
];

export const searchUserValidator = [
  query('key').exists({ checkNull: true }),
  checkValidateError,
];

export const searchPostValidator = [
  query('key').exists({ checkNull: true }),
  oneOf([
    query('filters.categoryId').not().exists({ checkNull: true }),
    query('filters.categoryId').isString(),
  ]),
  oneOf([
    query('filters.fromTime').not().exists({ checkNull: true }),
    query('filters.fromTime').isNumeric().toInt(),
  ]),
  oneOf([
    query('filters.toTime').not().exists({ checkNull: true }),
    query('filters.toTime').isNumeric().toInt(),
  ]),
  checkValidateError,
];

export const suggestKeyValidator = [
  query('key').exists({ checkNull: true }),
  checkValidateError,
];
