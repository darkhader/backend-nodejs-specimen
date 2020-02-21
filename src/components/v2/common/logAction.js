
import config from '../../../config';
import amqp from 'amqplib';
import { ACTION } from '../../../constant';

let conn = null;
let ch = null;
const logQueue = 'user_log';


amqp.connect(config.rabbitmqUrl).then(connection => {
  conn = connection;
  return conn.createChannel();
}).then(channel => {
  ch = channel;
});
// Log Action
const logAction = async data => ch.sendToQueue(logQueue, Buffer.from(JSON.stringify(data)), { persistent: true });

export const logViewPost = async (userId, postId) => logAction({
  actionId: ACTION.VIEW_POST,
  userId,
  time: new Date().getTime(),
  postId,
});

export const logViewAuthor = async (userId, authorId) => logAction({
  actionId: ACTION.VIEW_AUTHOR,
  userId,
  time: new Date().getTime(),
  authorId,
});

export const logUpvotePost = async (userId, postId) => logAction({
  actionId: ACTION.UPVOTE_POST,
  userId,
  time: new Date().getTime(),
  postId,
});

export const logUnUpvotePost = async (userId, postId) => logAction({
  actionId: ACTION.UNUPVOTE_POST,
  userId,
  time: new Date().getTime(),
  postId,
});

export const logDownvotePost = async (userId, postId) => logAction({
  actionId: ACTION.DOWNVOTE_POST,
  userId,
  time: new Date().getTime(),
  postId,
});

export const logUnDownvotePost = async (userId, postId) => logAction({
  actionId: ACTION.UNDOWNVOTE_POST,
  userId,
  time: new Date().getTime(),
  postId,
});

export const logComment = async (userId, postId, authorId, commentId, content) => logAction({
  actionId: ACTION.COMMENT,
  userId,
  time: new Date().getTime(),
  postId,
  authorId,
  commentId,
  content,
});

export const logDeleteComment = async (userId, commentId) => logAction({
  actionId: ACTION.DELETE_COMMENT,
  userId,
  time: new Date().getTime(),
  commentId,
});

export const logEditComment = async (userId, commentId, content) => logAction({
  actionId: ACTION.EDIT_COMMENT,
  userId,
  time: new Date().getTime(),
  commentId,
  content,
});

export const logSharePost = async (userId, postId) => logAction({
  actionId: ACTION.SHARE_POST,
  userId,
  time: new Date().getTime(),
  postId,
});

export const logBookmarkPost = async (userId, postId) => logAction({
  actionId: ACTION.BOOKMARK_POST,
  userId,
  time: new Date().getTime(),
  postId,
});

export const logUnBookmarkPost = async (userId, postId) => logAction({
  actionId: ACTION.UNBOOKMARK_POST,
  userId,
  time: new Date().getTime(),
  postId,
});

export const logIgnorePost = async (userId, postId) => logAction({
  actionId: ACTION.IGNORE_POST,
  userId,
  time: new Date().getTime(),
  postId,
});

export const logUnIgnorePost = async (userId, postId) => logAction({
  actionId: ACTION.UNIGNORE_POST,
  userId,
  time: new Date().getTime(),
  postId,
});

export const logReportPost = async (userId, postId, reasonId, reason) => logAction({
  actionId: ACTION.REPORT_POST,
  userId,
  time: new Date().getTime(),
  postId,
  reason,
  reasonId,
});

export const logUpvoteComment = async (userId, commentId) => logAction({
  actionId: ACTION.UPVOTE_COMMENT,
  userId,
  time: new Date().getTime(),
  commentId,
});

export const logUnUpvoteComment = async (userId, commentId) => logAction({
  actionId: ACTION.UNUPVOTE_COMMENT,
  userId,
  time: new Date().getTime(),
  commentId,
});

export const logDownvoteComment = async (userId, commentId) => logAction({
  actionId: ACTION.DOWNVOTE_COMMENT,
  userId,
  time: new Date().getTime(),
  commentId,
});

export const logUnDownvoteComment = async (userId, commentId) => logAction({
  actionId: ACTION.UNDOWNVOTE_COMMENT,
  userId,
  time: new Date().getTime(),
  commentId,
});

export const logUpvoteSubComment = async (userId, subcommentId) => logAction({
  actionId: ACTION.UPVOTE_SUBCOMMENT,
  userId,
  time: new Date().getTime(),
  subcommentId,
});

export const logUnUpvoteSubComment = async (userId, subcommentId) => logAction({
  actionId: ACTION.UNUPVOTE_SUBCOMMENT,
  userId,
  time: new Date().getTime(),
  subcommentId,
});

export const logDownvoteSubComment = async (userId, subcommentId) => logAction({
  actionId: ACTION.DOWNVOTE_SUBCOMMENT,
  userId,
  time: new Date().getTime(),
  subcommentId,
});

export const logUnDownvoteSubComment = async (userId, subcommentId) => logAction({
  actionId: ACTION.UNDOWNVOTE_SUBCOMMENT,
  userId,
  time: new Date().getTime(),
  subcommentId,
});

export const logSubComment = async (userId, postId, authorId, parentCmtId, userParentId, subcommentId, content) => logAction({
  actionId: ACTION.SUBCOMMENT,
  userId,
  time: new Date().getTime(),
  postId,
  authorId,
  parentCmtId,
  userParentId,
  subcommentId,
  content,
});

export const logDeleteSubComment = async (userId, subcommentId) => logAction({
  actionId: ACTION.DELETE_SUBCOMMENT,
  userId,
  time: new Date().getTime(),
  subcommentId,
});

export const logEditSubComment = async (userId, subcommentId, content) => logAction({
  actionId: ACTION.EDIT_SUBCOMMENT,
  userId,
  time: new Date().getTime(),
  subcommentId,
  content,
});

export const logFollowAuthor = async (userId, authorId) => logAction({
  actionId: ACTION.FOLLOW_AUTHOR,
  userId,
  time: new Date().getTime(),
  authorId,
});

export const logUnFollowAuthor = async (userId, authorId) => logAction({
  actionId: ACTION.UNFOLLOW_AUTHOR,
  userId,
  time: new Date().getTime(),
  authorId,
});

export const logFollowCategory = async (userId, categoryId) => logAction({
  actionId: ACTION.FOLLOW_CATEGORY,
  userId,
  time: new Date().getTime(),
  categoryId,
});

export const logUnFollowCategory = async (userId, categoryId) => logAction({
  actionId: ACTION.UNFOLLOW_CATEGORY,
  userId,
  time: new Date().getTime(),
  categoryId,
});

export const logFollowListCategory = async (userId, categoryIds) => logAction({
  actionId: ACTION.FOLLOW_LIST_CATEGORY,
  userId,
  time: new Date().getTime(),
  categoryIds,
});

export const logUnFollowListCategory = async (userId, categoryIds) => logAction({
  actionId: ACTION.UNFOLLOW_LIST_CATEGORY,
  userId,
  time: new Date().getTime(),
  categoryIds,
});

export const logBlockUser = async (userId, blockedUserId) => logAction({
  actionId: ACTION.BLOCK_USER,
  userId,
  time: new Date().getTime(),
  blockedUserId,
});

export const logUnBlockUser = async (userId, blockedUserId) => logAction({
  actionId: ACTION.UNBLOCK_USER,
  userId,
  time: new Date().getTime(),
  blockedUserId,
});

export const logSearchAll = async (userId, keyword) => logAction({
  actionId: ACTION.SEARCH_ALL,
  userId,
  time: new Date().getTime(),
  keyword,
});

export const logSearchUser = async (userId, keyword) => logAction({
  actionId: ACTION.SEARCH_USER,
  userId,
  time: new Date().getTime(),
  keyword,
});

export const logSearchPost = async (userId, keyword) => logAction({
  actionId: ACTION.SEARCH_POST,
  userId,
  time: new Date().getTime(),
  keyword,
});
