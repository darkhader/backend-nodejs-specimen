import { Router } from 'express';
import * as controller from './UserController';
import { paginationMiddleware, requireLogin, requireAnonymousToken } from '../../../middleware';
import { throwAsNext } from '../../../libs';
import { commonCategory } from '../common';
import {
  followAuthorValidator,
  followCategoryValidator,
  sharePostValidator,
  reportPostValidator,
  ignorePostValidator,
  blockUserValidator,
  updateProfileValidator,
  updateFollowCategoryValidator,
} from './validator';

// import subrouter
import bookmark from './Bookmarks/BookmarkRouter';
import vote from './Vote/VoteRouter';
import comment from './Comment/CommentRouter';
// ...
const path = '/users';
const router = Router();

// registerSubrouter
router.use(vote.path, vote.router);
router.use(comment.path, comment.router);
router.use(bookmark.path, bookmark.router);
router.get('/view-avatar', throwAsNext(controller.viewAvatar));

// --- Require Anonymous
router.use('/', requireAnonymousToken);

// --- Share
router.post('/share', sharePostValidator, throwAsNext(controller.sharePost));

// --- Get Me
router.get('/me', throwAsNext(controller.getMe));
// --- Follow Category
router.get('/categories-following', throwAsNext(controller.getCategoriesFollowing));
router.get('/categories-follow-suggest', throwAsNext(controller.getCategoriesFollowSuggest));
router.post('/update-follow-category', updateFollowCategoryValidator, throwAsNext(controller.updateFollowCategory));
router.post('/follow-category',
  followCategoryValidator,
  throwAsNext(commonCategory.checkCategory('body.categoryId')),
  throwAsNext(controller.followCategory));
router.post('/unfollow-category',
  followCategoryValidator,
  throwAsNext(controller.unfollowCategory));
// --- Follow Author
router.get('/authors-following',
  requireLogin,
  paginationMiddleware({
    maxSize: 20,
    defaultSize: 10,
  }),
  throwAsNext(controller.getAuthorsFollowing));
router.get('/authors-follow-suggest',
  paginationMiddleware({
    maxSize: 20,
    defaultSize: 20,
  }),
  throwAsNext(controller.getAuthorsFollowSuggest));
router.post('/follow-author', requireLogin, followAuthorValidator, throwAsNext(controller.followAuthor));
router.post('/unfollow-author', requireLogin, followAuthorValidator, throwAsNext(controller.unfollowAuthor));
// --- Require authenticate ---
router.use('/', requireLogin);
// --- Update Profile
router.put('/update-profile', updateProfileValidator, throwAsNext(controller.updateProfile));
router.post('/update-avatar', throwAsNext(controller.updateAvatar));

// --- Report
router.post('/report', reportPostValidator, throwAsNext(controller.reportPost));
// --- Ignore
router.post('/ignore', ignorePostValidator, throwAsNext(controller.ignorePost));
router.post('/unignore', ignorePostValidator, throwAsNext(controller.unignorePost));
// --- Block author
router.post('/block', blockUserValidator, throwAsNext(controller.blockUser));
router.post('/unblock', blockUserValidator, throwAsNext(controller.unblockUser));

// export
export default { path, router };
