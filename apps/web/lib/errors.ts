import { ApiError } from "@zenx-go/api-client";

const messages: Record<string, string> = {
  INVALID_CREDENTIALS: "Thông tin xác thực không đúng.",
  PASSWORD_REUSE: "Mật khẩu mới phải khác mật khẩu hiện tại.",
  EMAIL_ALREADY_EXISTS: "Email này đã được sử dụng.",
  PHONE_ALREADY_EXISTS: "Số điện thoại này đã được sử dụng.",
  USERNAME_ALREADY_EXISTS: "Tên đăng nhập này đã được sử dụng.",
  OTP_INVALID: "Mã xác thực không đúng.",
  OTP_EXPIRED: "Mã xác thực đã hết hạn.",
  OTP_ALREADY_USED: "Mã xác thực đã được sử dụng.",
  OTP_RATE_LIMITED: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
  VERIFICATION_TOKEN_INVALID: "Phiên xác thực không hợp lệ hoặc đã hết hạn.",
  CANNOT_UNLINK_LAST_LOGIN_METHOD: "Hãy thiết lập mật khẩu hoặc liên kết phương thức khác trước khi hủy liên kết.",
  SOCIAL_ALREADY_LINKED: "Tài khoản này đã được liên kết.",
  SOCIAL_LINKED_TO_ANOTHER_ACCOUNT: "Tài khoản mạng xã hội đã thuộc tài khoản ZENX GO khác.",
  SOCIAL_NOT_CONFIGURED: "Nhà cung cấp đăng nhập chưa được cấu hình.",
  INVALID_AVATAR: "Ảnh đại diện không hợp lệ. Hãy chọn JPEG, PNG hoặc WebP tối đa 2 MB.",
  EXPORT_LIMIT_EXCEEDED: "Có quá nhiều giao dịch để xuất cùng lúc. Hãy thu hẹp bộ lọc rồi thử lại.",
  UNAUTHORIZED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  FORBIDDEN: "Tài khoản không được phép thực hiện thao tác này.",
};

export function getErrorMessage(error: unknown, fallback = "Đã có lỗi xảy ra. Vui lòng thử lại.") {
  if (error instanceof ApiError) {
    return messages[error.code] ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return fallback;
  }

  return fallback;
}
