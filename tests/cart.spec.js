const { test, expect, products, money } = require('../support/shop');

test('new session has an empty cart', async ({ page, signedIn }) => {
  await expect(page.getByTestId('shopping-cart-badge')).toHaveCount(0);
  await signedIn.cart();
  await expect(page.getByTestId('inventory-item')).toHaveCount(0);
});

test('multiple products persist through refresh and shopping navigation @smoke', async ({ page, signedIn }) => {
  for (const product of products.slice(0, 3)) await signedIn.add(product);
  await expect(page.getByTestId('shopping-cart-badge')).toHaveText('3');
  await signedIn.cart();
  await page.reload();
  await signedIn.ready('cart', 'Your Cart');
  await expect(page.getByTestId('inventory-item-name')).toHaveText(products.slice(0, 3).map(p => p.name));
  await expect(page.getByTestId('inventory-item-price')).toHaveText(products.slice(0, 3).map(p => money(p.cents)));
  await expect(page.getByTestId('item-quantity')).toHaveText(['1', '1', '1']);
  await page.getByTestId('continue-shopping').click();
  await signedIn.ready('inventory', 'Products');
  await expect(page.getByTestId('shopping-cart-badge')).toHaveText('3');
  for (const product of products.slice(0, 3)) await expect(page.getByTestId(`remove-${product.slug}`)).toBeVisible();
});

test('removing products updates cart rows, badge and inventory buttons', async ({ page, signedIn }) => {
  await signedIn.add(products[0]);
  await signedIn.add(products[1]);
  await signedIn.cart();
  await page.getByTestId(`remove-${products[0].slug}`).click();
  await expect(page.getByTestId('inventory-item-name')).toHaveText([products[1].name]);
  await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');
  await page.getByTestId(`remove-${products[1].slug}`).click();
  await expect(page.getByTestId('inventory-item')).toHaveCount(0);
  await expect(page.getByTestId('shopping-cart-badge')).toHaveCount(0);
  await page.getByTestId('continue-shopping').click();
  await signedIn.ready('inventory', 'Products');
  for (const product of products.slice(0, 2)) await expect(page.getByTestId(`add-to-cart-${product.slug}`)).toBeVisible();
});

test('removing from inventory also removes the cart item', async ({ page, signedIn }) => {
  await signedIn.add(products[0]);
  await page.getByTestId(`remove-${products[0].slug}`).click();
  await signedIn.cart();
  await expect(page.getByTestId('inventory-item')).toHaveCount(0);
  await expect(page.getByTestId('shopping-cart-badge')).toHaveCount(0);
});
