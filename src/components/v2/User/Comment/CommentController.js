import * as dbAccess from './CommentDAL';
import { commonLogAction, commonNotify } from '../../common';

/**
 * Comment
 */
export const addComment = async (req, res) => {
  const { postId, content, authorId } = req.body;
  const { userId, fullName, avatar } = req;

  const commentId = await dbAccess.addComment(userId, { postId, content, authorId });

  // Send Noti
  const contentRemoveTag = content.replace(/@\("(((?!").)+)","(((?!").)+)"\)/g, (match, p1) => p1);
  if (userId !== authorId) {
    const data = {
      authorId,
      postId,
      commentId,
      user: {
        id: userId,
        fullName,
        avatar,
      },
      content: contentRemoveTag.length < 50 ? contentRemoveTag : `${contentRemoveTag.substring(0, 47)}...`,
    };
    commonNotify.sendNotiWhenCommentPost(authorId, data);
  }
  // Log Action
  commonLogAction.logComment(userId, postId, authorId, commentId, contentRemoveTag);
  res.json({ commentId });
};

/**
 * Delete Comment
 */
export const deleteComment = async (req, res) => {
  const { commentId } = req.query;
  const { userId } = req;
  await dbAccess.deleteComment(userId, { commentId });
  // Log Action
  commonLogAction.logDeleteComment(userId, commentId);
  res.ok();
};

/**
 * Edit Comment
 */
export const editComment = async (req, res) => {
  const { commentId, content } = req.body;
  const { userId } = req;
  await dbAccess.editComment(userId, { commentId, content });

  const contentRemoveTag = content.replace(/@\("(((?!").)+)","(((?!").)+)"\)/g, (match, p1) => p1);
  // Log Action
  commonLogAction.logEditComment(userId, commentId, contentRemoveTag);
  res.ok();
};

/**
 * Create Sub Comment
 */
export const createSubComment = async (req, res) => {
  const { parentCmtId, content, postId, authorId, userParentId } = req.body;
  const { userId, fullName, avatar } = req;

  const commentId = await dbAccess.createSubComment(userId, parentCmtId, content, postId, authorId, userParentId);
  // Send Noti
  const contentRemoveTag = content.replace(/@\("(((?!").)+)","(((?!").)+)"\)/g, (match, p1) => p1);
  if (userId !== userParentId) {
    const data = {
      authorId,
      postId,
      parentCmtId,
      userParentId,
      commentId,
      user: {
        id: userId,
        fullName,
        avatar,
      },
      content: contentRemoveTag.length < 50 ? contentRemoveTag : `${contentRemoveTag.substring(0, 47)}...`,
    };
    commonNotify.sendNotiWhenReplyComment(userParentId, data);
  }
  // Log Action
  commonLogAction.logSubComment(userId, postId, authorId, parentCmtId, userParentId, commentId, contentRemoveTag);
  res.json({ commentId });
};

/**
 * Delete Sub Comment
 */
export const deleteSubComment = async (req, res) => {
  const { commentId } = req.query;
  const { userId } = req;
  await dbAccess.deleteSubComment(userId, commentId);
  // Log Action
  commonLogAction.logDeleteSubComment(userId, commentId);
  res.ok();
};

/**
 * Edit SubComment
 */
export const editSubComment = async (req, res) => {
  const { commentId, content } = req.body;
  const { userId } = req;
  await dbAccess.editSubComment(userId, commentId, content);
  // Log Action
  const contentRemoveTag = content.replace(/@\("(((?!").)+)","(((?!").)+)"\)/g, (match, p1) => p1);
  commonLogAction.logEditSubComment(userId, commentId, contentRemoveTag);
  res.ok();
};

// Get List Comment
export const getListComment = async (req, res) => {
  const { userId } = req;
  const comments = await dbAccess.getListComment(req.pagination, userId);
  const lastId = comments.length ? comments[comments.length - 1].id : null;

  res.json({ total: 0, total_record: 0, items: comments, lastId });
};
