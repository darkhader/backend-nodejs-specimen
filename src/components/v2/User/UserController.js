import request from 'request-promise-native';
import * as uploadImageUtil from '../../../util/uploadImageUtil';
import * as dbAccess from './UserDAL';
import * as common from './common';
import { commonLogAction, commonNotify, commonIgnoreAndBlock, commonToken } from '../common';
import { ERRORS } from '../../../constant';

export const getMe = async (req, res) => {
  const { userId } = req;
  if (userId.substring(0, 4) !== 'NAU-') {
    const me = await dbAccess.getMe(userId);
    if (me) {
      res.json(me);
    } else {
      return Promise.reject(ERRORS.USER_NOTFOUND_ERROR);
    }
  } else {
    res.json({ id: userId, isAnonymous: true });
  }
};
export const updateProfile = async (req, res) => {
  const { userId, avatar } = req;
  const { fullName, about } = req.body;
  await dbAccess.updateProfile(userId, fullName, about);
  if (fullName) {
    const token = await commonToken.getToken(userId, fullName, avatar);
    const refreshToken = await commonToken.getRefreshToken(token);
    res.json({ token, refreshToken });
    return;
  }
  res.ok();
};
export const updateAvatar = async (req, res) => {
  const { userId, fullName } = req;
  const { avatar } = req.body;
  const body = await uploadImageUtil.uploadImage(Buffer.from(avatar, 'base64'), 'avatar');

  await dbAccess.updateAvatar(userId, body.substring(1, body.length - 2));
  const token = await commonToken.getToken(userId, fullName, body.substring(1, body.length - 2));
  const refreshToken = await commonToken.getRefreshToken(token);
  res.json({ avatar: body.substring(1, body.length - 2), token, refreshToken });
};

export const viewAvatar = async (req, res) => {
  const { avatar } = req.query;
  request(`http://10.40.112.7:3003/${avatar}`).pipe(res);
};

// Which authors are i following?
export const getAuthorsFollowing = async (req, res) => {
  const { userId } = req;
  const blockUserIds = await commonIgnoreAndBlock.getListUserIdBlock(userId);
  const authors = await dbAccess.getAuthorsFollowing(userId, req.pagination, blockUserIds);
  res.json({ total: 0, total_record: 0, items: authors });
};
// Which authors should i follow?
export const getAuthorsFollowSuggest = async (req, res) => {
  const { userId } = req;
  const blockUserIds = await commonIgnoreAndBlock.getListUserIdBlock(userId);
  const authors = await dbAccess.getAuthorsFollowSuggest(userId, req.pagination, blockUserIds);
  res.json({ total: 0, total_record: 0, items: authors });
};
// Follow Author
export const followAuthor = async (req, res) => {
  const { authorId } = req.body;
  const { userId, fullName, avatar } = req;
  if (authorId === userId) {
    return Promise.reject(ERRORS.USER_DONT_HAVE_PERMISSION_ERROR);
  }
  await dbAccess.followAuthor(userId, authorId);
  // Send Noti
  const data = {
    user: {
      id: userId,
      fullName,
      avatar,
    },
  };
  commonNotify.sendNotiWhenFollowUser(authorId, data);
  // Log Action
  commonLogAction.logFollowAuthor(userId, authorId);
  res.ok();
};
// Unfollow Author
export const unfollowAuthor = async (req, res) => {
  const { authorId } = req.body;
  const { userId } = req;
  await dbAccess.unfollowAuthor(userId, authorId);
  // Log Action
  commonLogAction.logUnFollowAuthor(userId, authorId);
  res.ok();
};
// Which categories are i following?
export const getCategoriesFollowing = async (req, res) => {
  const { userId } = req;
  const categories = await dbAccess.getCategoriesFollowing(userId);
  res.json({ total: 0, total_record: 0, items: categories });
};
// Which categories should i follow?
export const getCategoriesFollowSuggest = async (req, res) => {
  const { userId } = req;
  const categories = await dbAccess.getCategoriesFollowSuggest(userId);
  res.json({ total: 0, total_record: 0, items: categories });
};
// Update Follow Category
export const updateFollowCategory = async (req, res) => {
  const { updatedCategories } = req.body;
  const { userId } = req;
  const { followCategoryIds, unfollowCategoryIds } = await dbAccess.updateFollowCategory(userId, updatedCategories);
  // Log Action
  if (followCategoryIds.length) {
    commonLogAction.logFollowListCategory(userId, followCategoryIds);
  }
  if (unfollowCategoryIds.length) {
    commonLogAction.logUnFollowListCategory(userId, unfollowCategoryIds);
  }
  res.ok();
};
// Follow Category
export const followCategory = async (req, res) => {
  const { categoryId } = req.body;
  const { userId } = req;
  await dbAccess.followCategory(userId, categoryId);
  // Log Action
  commonLogAction.logFollowCategory(userId, categoryId);
  res.ok();
};
// Unfollow Category
export const unfollowCategory = async (req, res) => {
  const { categoryId } = req.body;
  const { userId } = req;
  await dbAccess.unfollowCategory(userId, categoryId);
  // Log Action
  commonLogAction.logUnFollowCategory(userId, categoryId);
  res.ok();
};


/**
 * Share
 */
export const sharePost = async (req, res) => {
  const { postId } = req.body;
  const { userId } = req;
  // execute async
  dbAccess.anonymousShare(postId);
  // Log Action
  commonLogAction.logSharePost(userId, postId);
  res.ok();
};

// Report Post
export const reportPost = async (req, res) => {
  const { postId, reason, reasonId } = req.body;
  const { userId } = req;
  // execute async
  dbAccess.reportPost(userId, postId, reasonId);
  // Log Action
  commonLogAction.logReportPost(userId, postId, reasonId, reason);
  res.ok();
};

// Ignore Post
export const ignorePost = async (req, res) => {
  const { postId } = req.body;
  const { userId } = req;
  await dbAccess.ignorePost(userId, postId);
  common.addIgnorePostToCache(userId, postId);
  // Log Action
  commonLogAction.logIgnorePost(userId, postId);
  res.ok();
};

// Ignore Post
export const unignorePost = async (req, res) => {
  const { postId } = req.body;
  const { userId } = req;
  await dbAccess.unignorePost(userId, postId);
  common.removeIgnorePostToCache(userId, postId);
  // Log Action
  commonLogAction.logUnIgnorePost(userId, postId);
  res.ok();
};

// Block User
export const blockUser = async (req, res) => {
  const { blockedUserId } = req.body;
  const { userId } = req;
  await dbAccess.blockUser(userId, blockedUserId);
  common.addBlockedUserToCache(userId, blockedUserId);
  // Log Action
  commonLogAction.logBlockUser(userId, blockedUserId);
  res.ok();
};

// Unblock Author
export const unblockUser = async (req, res) => {
  const { blockedUserId } = req.body;
  const { userId } = req;
  await dbAccess.unblockUser(userId, blockedUserId);
  common.removeBlockedUserToCache(userId, blockedUserId);
  // Log Action
  commonLogAction.logBlockUser(userId, blockedUserId);
  res.ok();
};
