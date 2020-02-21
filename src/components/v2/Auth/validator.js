import { body, oneOf } from 'express-validator/check';
import { checkValidateError } from '../../../middleware';
import { MESSAGES } from '../../../constant';

export const refreshPasswordValidator = [
  body('refreshToken').exists({ checkFalsy: true }),
  checkValidateError,
];

export const registerWithPhoneValidator = [
  body('phone').exists({ checkFalsy: true }),
  oneOf([
    body('otp').isLength(4),
    body('otp').not().exists({ checkNull: true }),
  ]),
  checkValidateError,
];

export const loginWithPhoneValidator = [
  body('phone').exists({ checkFalsy: true }),
  body('password').custom(value => Boolean(value.match(/^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/g)))
    .withMessage(MESSAGES.VALIDATOR.PASSWORD),
  checkValidateError,
];

export const updateInfoValidator = [
  body('password').custom(value => Boolean(value.match(/^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/g)))
    .withMessage(MESSAGES.VALIDATOR.PASSWORD),
  body('fullName').trim().isLength({ min: 1, max: 50 }).withMessage(MESSAGES.VALIDATOR.FULLNAME),
  body('registerCode').exists({ checkFalsy: true }),
  oneOf([
    body('followingCategoryIds').not().exists({ checkNull: true }),
    [
      body('followingCategoryIds').isArray().not().isEmpty(),
      body('followingCategoryIds.*').isString(),
    ],
  ]),
  checkValidateError,
];

export const loginFacebookValidator = [
  oneOf([
    body('code').exists({ checkFalsy: true }),
    body('accessToken').exists({ checkFalsy: true }),
  ]),
  oneOf([
    body('followingCategoryIds').not().exists({ checkNull: true }),
    [
      body('followingCategoryIds').isArray().not().isEmpty(),
      body('followingCategoryIds.*').isString(),
    ],
  ]),
  checkValidateError,
];

export const forgotPasswordValidator = [
  oneOf([
    body('code').exists({ checkFalsy: true }),
    body('accessToken').exists({ checkFalsy: true }),
  ]),
  oneOf([
    body('newPassword').not().exists({ checkNull: true }),
    body('newPassword').custom(value => Boolean(value.match(/^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/g)))
      .withMessage(MESSAGES.VALIDATOR.PASSWORD),
  ]),
  checkValidateError,
];

export const linkPhoneValidator = [
  body('password').custom(value => Boolean(value.match(/^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/g)))
    .withMessage(MESSAGES.VALIDATOR.PASSWORD),
  body('phone').exists({ checkFalsy: true }),
  oneOf([
    body('code').exists({ checkFalsy: true }),
    body('accessToken').exists({ checkFalsy: true }),
  ]),
  checkValidateError,
];

export const linkFbValidator = [
  oneOf([
    body('code').exists({ checkFalsy: true }),
    body('accessToken').exists({ checkFalsy: true }),
  ]),
  checkValidateError,
];

export const registerWithFbKitValidator = [
  body('password').custom(value => Boolean(value.match(/^(?=.*[a-zA-Z])(?=.*\d).{6,20}$/g)))
    .withMessage(MESSAGES.VALIDATOR.PASSWORD),
  body('fullName').trim().isLength({ min: 1, max: 50 }).withMessage(MESSAGES.VALIDATOR.FULLNAME),
  oneOf([
    body('code').exists({ checkFalsy: true }),
    body('accessToken').exists({ checkFalsy: true }),
  ]),
  oneOf([
    body('followingCategoryIds').not().exists({ checkNull: true }),
    [
      body('followingCategoryIds').isArray().not().isEmpty(),
      body('followingCategoryIds.*').isString(),
    ],
  ]),
  checkValidateError,
];
