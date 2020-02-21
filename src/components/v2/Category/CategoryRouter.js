import { Router } from 'express';
import * as controller from './CategoryController';
import { throwAsNext } from '../../../libs';

// import subrouter
// ...
const path = '/categories';
const router = Router();

// route
// router.use('', requireAnonymousToken);
router.get('/', throwAsNext(controller.getAllCategories));
router.get('/default', throwAsNext(controller.getDefaultCategories));

// registerSubrouter

// export
export default { path, router };
