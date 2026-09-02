import { expect, test } from '@playwright/test';
import { randomInt } from 'node:crypto';

test('account screens complete the release-gate journey without placeholder states', async ({ page }) => {
  const suffix = `${Date.now().toString().slice(-5)}${randomInt(100000, 1_000_000)}`;
  const username = `acct${suffix.slice(-8)}`;
  const email = `acct-${suffix}@example.com`;
  const phone = `+849${suffix.slice(-8)}`;

  await page.goto('/auth/register');
  await page.getByLabel('Tên đăng nhập').fill(username);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Số điện thoại').fill(phone);
  await page.getByRole('textbox', { name: 'Mật khẩu', exact: true }).fill('Password123!');
  await page.getByRole('textbox', { name: 'Xác nhận mật khẩu', exact: true }).fill('Password123!');
  await page.getByRole('button', { name: 'Gửi OTP' }).click();
  await expect(page.getByText(/Đã gửi OTP/)).toBeVisible();
  await page.getByLabel('Nhập số OTP').fill('123456');
  await page.locator('input[type="checkbox"]').nth(0).check();
  await page.getByRole('button', { name: 'Đăng ký tài khoản' }).click();
  await expect(page).toHaveURL(/\/account\/complete-profile/);
  await page.getByLabel('Họ và tên').fill('Account Screen Player');
  await page.getByLabel('Ngày sinh').fill('2000-01-01');
  await page.getByLabel('Tỉnh / Thành phố').fill('Ho Chi Minh City');
  await page.getByRole('button', { name: 'Hoàn tất hồ sơ' }).click();
  await expect(page).toHaveURL(/\/account\/profile/);

  await expect(page.getByRole('textbox', { name: 'Họ và tên' })).toHaveValue('Account Screen Player');
  await expect(page.getByText('Chưa liên kết', { exact: true })).toHaveCount(2);
  await expect(page.getByText('Nguyễn Văn A', { exact: true })).toHaveCount(0);
  await expect(page.getByText('playerone@gmail.com', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Xác thực', exact: true }).click();
  await page.getByRole('button', { name: 'Gửi mã xác thực', exact: true }).click();
  await page.getByLabel('Mã xác thực email').fill('123456');
  const emailChangeResponse = page.waitForResponse((response) => response.url().endsWith('/api/v1/account/change-email') && response.status() === 201);
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await emailChangeResponse;
  await expect(page.getByText('Đã cập nhật email thành công.', { exact: true })).toBeVisible();
  await expect(page.getByText('Đã xác thực', { exact: true })).toHaveCount(2);

  await page.goto('/account/security');
  await expect(page).toHaveURL(/\/account\/security/);
  await expect(page.getByText('Email').first()).toBeVisible();
  await expect(page.getByText('Chưa xác thực', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Đã xác thực', { exact: true })).toHaveCount(2);
  await expect(page.getByText('Đã thiết lập', { exact: true })).toHaveCount(1);
  await page.goto('/account/social');
  await expect(page).toHaveURL(/\/account\/social/);

  await page.goto('/account/change-password');
  await expect(page).toHaveURL(/\/account\/change-password/);
  await page.getByLabel('Mật khẩu hiện tại').fill('Password123!');
  await page.getByRole('textbox', { name: 'Mật khẩu mới', exact: true }).fill('weakpassword');
  await page.getByRole('textbox', { name: 'Xác nhận mật khẩu mới', exact: true }).fill('weakpassword');
  await expect(page.getByRole('button', { name: 'Lưu mật khẩu' })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Mật khẩu mới', exact: true }).fill('NewPassword123!');
  await page.getByRole('textbox', { name: 'Xác nhận mật khẩu mới', exact: true }).fill('NewPassword123!');
  await expect(page.getByRole('button', { name: 'Lưu mật khẩu' })).toBeEnabled();
  await page.getByRole('button', { name: 'Lưu mật khẩu' }).click();
  await expect(page.getByText(/Đã đổi mật khẩu thành công/)).toBeVisible();

  await page.goto('/account/social');
  await expect(page.getByRole('link', { name: 'Liên kết', exact: true })).toHaveCount(2);
  await page.getByRole('link', { name: 'Liên kết', exact: true }).first().click();
  await expect(page).toHaveURL(/(?:social_error=not_configured|social=linked)/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/account/security');
  await page.getByRole('button', { name: 'Mở menu' }).click();
  await expect(page.getByRole('button', { name: 'Đóng menu' })).toBeVisible();
  await page.getByRole('button', { name: 'Đóng menu' }).click();
});
