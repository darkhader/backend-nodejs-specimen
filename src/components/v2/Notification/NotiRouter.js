import { Router } from 'express';
import * as controller from './NotiController';
import { paginationMiddleware, requireLogin } from '../../../middleware';
import { throwAsNext } from '../../../libs';

const path = '/noti';
const router = Router();

// --- Require authenticate ---
router.use('/', requireLogin);
router.get('/', paginationMiddleware({
  maxSize: 20,
  defaultSize: 10,
}), throwAsNext(controller.getNoti));

export default { path, router };
