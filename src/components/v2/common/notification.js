// lib
import * as dbUtil from '../../../util/databaseUtil';
import * as notificationUtil from '../../../util/notificationUtil';
import uuidv4 from 'uuid/v4';
import { NOTIFICATION } from '../../../constant';

const saveNotis = async (userIds, data, type) => {
  const eventId = uuidv4();
  const notifications = userIds.map(userId => [userId, eventId, data ? JSON.stringify(data) : null, type]);
  const sql = 'INSERT INTO notifications (userId,eventId,data,type) VALUES ?';
  await dbUtil.execute(sql, [notifications]);
  return eventId;
};

const sendNoti = async (userIds, msg, data, type) => {
  const eventId = await saveNotis(userIds, data, type);
  return notificationUtil.createNotificationBytags(userIds, 'userId', msg, { ...data, eventId, type });
};

// User A follow user B, send noti to user B
export const sendNotiWhenFollowUser = async (userId, data = {}) => {
  const msg = `${data.user.fullName} đang theo dõi bạn.`;
  return sendNoti([userId], msg, data, NOTIFICATION.TYPE.NEW_FOLLOWER);
};

// User A comment in a post of user B, send noti to user B
export const sendNotiWhenCommentPost = async (userId, data = {}) => {
  const msg = `${data.user.fullName} đã bình luận bài viết của bạn: ${data.content}`;
  return sendNoti([userId], msg, data, NOTIFICATION.TYPE.NEW_COMMENT);
};

// User A reply a comment of user B, send noti to user B
export const sendNotiWhenReplyComment = async (userId, data = {}) => {
  const msg = `${data.user.fullName} đã trả lời bình luận của bạn: ${data.content}`;
  return sendNoti([userId], msg, data, NOTIFICATION.TYPE.NEW_SUB_COMMENT);
};

// User A create new post, send noti to user A's followers
export const sendNotiWhenCreateNewPost = async (userIds, data = {}) => {
  const msg = `${data.author.fullName} vừa viết bài mới`;
  return sendNoti(userIds, msg, data, NOTIFICATION.TYPE.NEW_POST_AUTHOR);
};
