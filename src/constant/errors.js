import createError from 'http-errors';

export const ERRORS = {
  USER_NOTFOUND_ERROR: createError.BadRequest('Không tìm thấy người dùng!'),
  UNAUTHORIZED_ERROR: createError.Unauthorized('Không được cấp quyền!'),
  INVALID_PASSWORD_ERROR: createError.BadRequest('Mật khẩu sai!'),
  USER_INACTIVED_ERROR: createError.BadRequest('Tài khoản đã bị vô hiệu hóa'),
  INVALID_OTP_ERROR: createError.BadRequest('OTP sai!'),
  // When register by phone
  PHONE_EXISTED: createError.BadRequest('Số điện thoại đã tồn tại!'),
  // When forgot password
  PHONE_NOT_EXISTED: createError.BadRequest('Số điện thoại chưa tồn tại!'),
  // When update info phone
  USER_INFO_UPDATED: createError.BadRequest('Thông tin đã được cập nhật'),
  // When update or delete post, comment
  USER_DONT_HAVE_PERMISSION_ERROR: createError.BadGateway('Bạn không được cấp quyền'),
  CATEGORY_INACTIVE_ERROR: createError.BadGateway('Category Inactive'),
  NOTHING_CHANGED: createError.BadGateway('Không có gì thay đổi'),
  FACEBOOK_EXIST: createError.BadRequest('Người dùng facebook đã tồn tại'),
  POST_NOT_EXISTED: createError.BadRequest('Bài viết không tồn tại'),
  COMMENT_NOT_EXISTED: createError.BadRequest('Comment không tồn tại'),
};
