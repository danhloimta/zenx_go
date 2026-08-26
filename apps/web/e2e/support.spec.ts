import { expect, test } from '@playwright/test';

test('support page renders FAQ categories, search, and accordion answers', async ({ page }) => {
  await page.goto('/support');
  await expect(page.getByRole('heading', { name: 'Chúng tôi có thể giúp gì cho bạn?' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Tài khoản', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Làm thế nào để đổi mật khẩu?', exact: true }).click();
  await expect(page.getByText('Vào Tài khoản → Đổi mật khẩu', { exact: false })).toBeVisible();

  await page.getByRole('textbox', { name: 'Tìm kiếm câu hỏi' }).fill('thanh toán');
  await expect(page.getByRole('button', { name: 'Thanh toán thành công nhưng chưa nhận được Coin?', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Làm thế nào để đổi mật khẩu?', exact: true })).toHaveCount(0);
});

test('report issue requires authentication and preserves its destination', async ({ page }) => {
  await page.goto('/support/report-issue');
  await expect(page).toHaveURL(/\/auth\/login\?next=%2Fsupport%2Freport-issue/);
  await expect(page.getByRole('heading', { name: 'Đăng nhập tài khoản' })).toBeVisible();
});
