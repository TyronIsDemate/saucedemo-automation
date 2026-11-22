const { test, expect } = require('../support/shop');

test('standard user can log in @smoke', async ({ page, signedIn }) => {
  await expect(page.getByTestId('inventory-item')).toHaveCount(6);
});

for (const { label, username, password, error } of [
  { label: 'missing username', username: '', password: 'secret_sauce', error: 'Username is required' },
  { label: 'missing password', username: 'standard_user', password: '', error: 'Password is required' },
  { label: 'invalid password', username: 'standard_user', password: 'incorrect', error: 'Username and password do not match any user in this service' },
  { label: 'unknown user', username: 'unknown_demo_user', password: 'secret_sauce', error: 'Username and password do not match any user in this service' },
  { label: 'locked out user', username: 'locked_out_user', password: 'secret_sauce', error: 'Sorry, this user has been locked out.' },
]) {
  test(`rejects ${label}`, async ({ page, shop }) => {
    await shop.signIn(username, password);
    await expect(page.getByTestId('error')).toContainText(error);
    await expect(page.getByTestId('login-button')).toBeVisible();
    await expect(page.getByTestId('inventory-container')).toHaveCount(0);
  });
}

test('login error can be dismissed and credentials corrected', async ({ page, shop }) => {
  await shop.signIn('standard_user', 'wrong');
  await expect(page.getByTestId('error')).toBeVisible();
  await page.getByTestId('error-button').click();
  await expect(page.getByTestId('error')).toHaveCount(0);
  await page.getByTestId('password').fill('secret_sauce');
  await page.getByTestId('password').press('Enter');
  await shop.ready('inventory', 'Products');
});

test('logout blocks direct access to inventory', async ({ page, signedIn }) => {
  await signedIn.menu();
  await page.getByTestId('logout-sidebar-link').click();
  await expect(page.getByTestId('login-button')).toBeVisible();
  await page.goto('/inventory.html');
  await expect(page.getByTestId('login-button')).toBeVisible();
  await expect(page.getByTestId('error')).toContainText("You can only access '/inventory.html' when you are logged in.");
});
