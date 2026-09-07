import { ApiError } from '@zenx-go/api-client';

const messages: Record<string, string> = {
  INVALID_CREDENTIALS: 'Thông tin xác thực không đúng.',
  PASSWORD_REUSE: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
  EMAIL_ALREADY_EXISTS: 'Email này đã được sử dụng.',
  PHONE_ALREADY_EXISTS: 'Số điện thoại này đã được sử dụng.',
  ACCOUNT_NOT_FOUND: 'Không tìm thấy tài khoản.',
  ACCOUNT_LOCKED: 'Tài khoản của bạn đã bị khóa.',
  ACCOUNT_SUSPENDED: 'Tài khoản của bạn đã bị tạm ngưng.',
  ACCOUNT_DELETED: 'Tài khoản này đã bị xóa.',
  OTP_EXPIRED: 'Mã xác thực đã hết hạn.',
  OTP_ALREADY_USED: 'Mã xác thực đã được sử dụng.',
  OTP_RATE_LIMITED: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
  VERIFICATION_TOKEN_INVALID: 'Phiên xác thực không hợp lệ hoặc đã hết hạn.',
  CANNOT_UNLINK_LAST_LOGIN_METHOD:
    'Hãy thiết lập mật khẩu hoặc liên kết phương thức khác trước khi hủy liên kết.',
  SOCIAL_ALREADY_LINKED: 'Tài khoản này đã được liên kết.',
  SOCIAL_LINKED_TO_ANOTHER_ACCOUNT: 'Tài khoản mạng xã hội đã thuộc tài khoản ZENX GO khác.',
  SOCIAL_NOT_CONFIGURED: 'Nhà cung cấp đăng nhập chưa được cấu hình.',
  INVALID_AVATAR: 'Ảnh đại diện không hợp lệ. Hãy chọn JPEG, PNG hoặc WebP tối đa 2 MB.',
  INVALID_MEDIA:
    'Hình ảnh tải lên không hợp lệ. Vui lòng chọn file JPEG, PNG, WebP, GIF hoặc SVG tối đa 10 MB.',
  INVALID_SENSITIVE_PROFILE: 'Thông tin định danh hoặc bảo mật không hợp lệ.',
  INVALID_SENSITIVE_CHALLENGE: 'Mã bí mật hoặc câu trả lời không đúng.',
  SENSITIVE_CHALLENGE_LOCKED: 'Bạn đã thử quá số lần cho phép. Hãy thử lại sau 15 phút.',
  SENSITIVE_PROFILE_OTP_UNAVAILABLE:
    'Hãy xác thực số điện thoại hoặc email trước khi quản lý thông tin nhạy cảm.',
  SENSITIVE_ACCESS_TOKEN_INVALID: 'Phiên xác minh đã hết hạn. Vui lòng xác minh lại.',
  SENSITIVE_SECURITY_REQUIRED: 'Hãy thiết lập mã bí mật và câu hỏi bảo mật trước khi lưu CCCD.',
  CITIZEN_ID_ALREADY_EXISTS: 'Số CCCD này không thể sử dụng.',
  EXPORT_LIMIT_EXCEEDED: 'Có quá nhiều giao dịch để xuất cùng lúc. Hãy thu hẹp bộ lọc rồi thử lại.',
  UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Tài khoản không được phép thực hiện thao tác này.',
  ADMIN_ACCESS_REQUIRED: 'Tài khoản chưa được cấp quyền quản trị.',
  ADMIN_SELF_ACTION_FORBIDDEN: 'Không thể tự tước quyền hoặc thực hiện thao tác này trên tài khoản của chính bạn.',
  LAST_SUPER_ADMIN_PROTECTED: 'Không thể tạm ngưng hoặc tước quyền Super Admin cuối cùng đang hoạt động.',
  PASSWORD_CHANGE_REQUIRED: 'Bạn cần đổi mật khẩu tạm trước khi tiếp tục.',
  STALE_ADMIN_UPDATE: 'Dữ liệu đã thay đổi. Hãy tải lại trang rồi thử lại.',
  ADMIN_CONTACT_VERIFICATION_REQUIRED: 'Hãy chọn trạng thái xác minh cho thông tin liên hệ mới.',
  ADMIN_NO_CHANGES: 'Chưa có thay đổi nào để lưu.',
  ADMIN_STATUS_TRANSITION_INVALID: 'Trạng thái tài khoản này không thể được thay đổi từ admin.',
  SUPPORT_CATEGORY_NOT_FOUND: 'Danh mục hỗ trợ không tồn tại hoặc đã tạm dừng.',
  SUPPORT_TICKET_NOT_FOUND: 'Không tìm thấy yêu cầu hỗ trợ.',
  SUPPORT_TICKET_NOT_ASSIGNED: 'Hãy nhận ticket trước khi phản hồi.',
  SUPPORT_TICKET_ASSIGNED_TO_ANOTHER: 'Ticket đang được một agent khác xử lý.',
  SUPPORT_TICKET_CLOSED: 'Ticket đã đóng và không thể tiếp tục phản hồi.',
  SUPPORT_TICKET_REOPEN_EXPIRED: 'Ticket đã quá thời hạn mở lại. Vui lòng tạo yêu cầu mới.',
  SUPPORT_TICKET_STATUS_INVALID: 'Trạng thái ticket không thể chuyển theo workflow này.',
  SUPPORT_AGENT_NOT_FOUND: 'Không tìm thấy agent hỗ trợ phù hợp.',
  SUPPORT_INVALID_MARKDOWN: 'Nội dung FAQ có định dạng Markdown không được hỗ trợ.',
  SUPPORT_CATEGORY_CODE_EXISTS: 'Mã danh mục FAQ đã tồn tại.',
  SUPPORT_FAQ_DUPLICATE: 'Câu hỏi FAQ đã tồn tại trong danh mục.',
  SUPPORT_FAQ_NOT_FOUND: 'Không tìm thấy FAQ.',
  CONTENT_NOT_FOUND: 'Không tìm thấy nội dung.',
  CONTENT_SLUG_EXISTS: 'Slug hoặc mã nội dung đã tồn tại.',
  CONTENT_INVALID_URL: 'URL nội dung không hợp lệ.',
  CONTENT_INVALID_STATE: 'Trạng thái hoặc dữ liệu nội dung không hợp lệ.',
  CONTENT_GENRE_NOT_FOUND: 'Không tìm thấy thể loại game.',
  CONTENT_GENRE_CODE_EXISTS: 'Mã thể loại game đã tồn tại.',
  CONTENT_GENRE_SLUG_EXISTS: 'Slug thể loại game đã tồn tại.',
  CONTENT_GENRE_IN_USE: 'Thể loại vẫn đang được gắn với game và không thể xóa.',
  CONTENT_GENRE_MUST_BE_INACTIVE: 'Hãy ngừng sử dụng thể loại trước khi xóa.',
  CONTENT_GENRE_INACTIVE: 'Thể loại đã ngừng sử dụng và không thể gắn mới.',
  COIN_PACKAGE_CODE_EXISTS: 'Mã gói nạp đã tồn tại.',
  COIN_PACKAGE_NOT_FOUND: 'Không tìm thấy gói nạp.',
  COIN_PACKAGE_IN_USE: 'Gói nạp đã có lịch sử thanh toán và không thể xóa.',
  COIN_PACKAGE_MUST_BE_INACTIVE: 'Hãy ngừng bán gói nạp trước khi xóa.',
  FINANCE_STALE_UPDATE: 'Dữ liệu tài chính đã thay đổi. Hãy tải lại trang rồi thử lại.',
  FINANCE_PAYMENT_TRANSITION_INVALID: 'Payment không thể chuyển sang trạng thái này.',
  FINANCE_PROVIDER_TRANSACTION_EXISTS: 'Mã giao dịch ngân hàng chưa được nhập hoặc đã được sử dụng cho một đơn nạp khác.',
  FINANCE_INVALID_AMOUNT: 'Số tiền phải là số nguyên dương hợp lệ.',
  INSUFFICIENT_BALANCE: 'Số dư Coin không đủ để thực hiện hoàn/trừ.',
};

export function getErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
  if (error instanceof ApiError) {
    if (messages[error.code]) {
      return messages[error.code];
    }
    if (error.message && error.message !== 'Request failed' && !error.message.startsWith('HTTP_')) {
      return error.message;
    }
    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

