import { Router } from 'express';
import * as controller from './BookmarkController';
import { paginationMiddleware, requireLogin } from '../../../../middleware';
import { throwAsNext } from '../../../../libs';
import { createBookmarkValidator, deleteBookmarkValidator } from './validator';

const path = '/bookmarks';
const router = Router();
// route require authentication
router.use('/', requireLogin);
router.post('/', createBookmarkValidator, throwAsNext(controller.createBookmark));
router.delete('/', deleteBookmarkValidator, throwAsNext(controller.removeBookmark));
router.get('/', paginationMiddleware({
  maxSize: 20,
  defaultSize: 10,
}), throwAsNext(controller.getBookmarks));
export default { path, router };
