import { Router } from 'express';
import * as controller from './GroupController';
import { paginationMiddleware } from '../../../middleware';
import { throwAsNext } from '../../../libs';

const path = '/groups';
const router = Router();

// --- Require authenticate ---
router.get('/', throwAsNext(controller.getGroups));
router.get('/posts', paginationMiddleware({
  maxSize: 20,
  defaultSize: 10,
}), throwAsNext(controller.getPostsOfGroup));

export default { path, router };
