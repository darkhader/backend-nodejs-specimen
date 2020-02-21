import { Router } from 'express';
import * as controller from './AuthController';
import { requireLogin } from '../../../middleware';
import { throwAsNext } from '../../../libs';
import {
  refreshPasswordValidator, registerWithPhoneValidator,
  loginWithPhoneValidator, updateInfoValidator,
  loginFacebookValidator, forgotPasswordValidator,
  linkPhoneValidator,
  registerWithFbKitValidator,
  linkFbValidator,
} from './validator';

const path = '/auth';
const router = Router();

// route
// --- Refresh Token ---
router.post('/refresh-token', refreshPasswordValidator, throwAsNext(controller.refreshToken));
// --- Register with phone ---
router.post('/phone/register', registerWithPhoneValidator, throwAsNext(controller.registerWithPhone));
// --- Login with phone ---
router.post('/phone/login', loginWithPhoneValidator, throwAsNext(controller.loginWithPhone));
// --- Update password and fullname ---
router.post('/phone/update-info', updateInfoValidator, throwAsNext(controller.updateInfo));
// --- Login facebook ---
router.post('/facebook/login', loginFacebookValidator, throwAsNext(controller.loginFacebook));
// --- Register with facebook kit
router.post('/facebook-kit/register', registerWithFbKitValidator, throwAsNext(controller.registerWithFbKit));
// --- Forgot passwordd ---
router.post('/forgot-password', forgotPasswordValidator, throwAsNext(controller.forgotPassword));

// require authentication
router.post('/link-phone', requireLogin, linkPhoneValidator, throwAsNext(controller.linkPhone));
router.post('/link-facebook', requireLogin, linkFbValidator, throwAsNext(controller.linkFacebook));

// get anonymous token
router.post('/anonymous/token', throwAsNext(controller.getAnonymousToken));

// registerSubrouter

// export
export default { path, router };
