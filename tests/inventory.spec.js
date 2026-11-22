const { test, expect, products, money } = require('../support/shop');

test('catalog has expected products, descriptions, prices and loaded images', async ({ page, signedIn }) => {
  const cards = page.getByTestId('inventory-item');
  await expect(cards).toHaveCount(products.length);
  for (const product of products) {
    const card = cards.filter({ has: page.getByTestId('inventory-item-name').filter({ hasText: product.name }) });
    await expect(card.getByTestId('inventory-item-name')).toHaveText(product.name);
    await expect(card.getByTestId('inventory-item-price')).toHaveText(money(product.cents));
    await expect(card.getByTestId('inventory-item-desc')).not.toHaveText('');
    await expect.poll(() => card.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  }
});

for (const [option, label, expected] of [
  ['az', 'name ascending', [...products].sort((a, b) => a.name.localeCompare(b.name))],
  ['za', 'name descending', [...products].sort((a, b) => b.name.localeCompare(a.name))],
  ['lohi', 'price ascending', [...products].sort((a, b) => a.cents - b.cents)],
  ['hilo', 'price descending', [...products].sort((a, b) => b.cents - a.cents)],
]) {
  test(`sorts by ${label}`, async ({ page, signedIn }) => {
    // Start from another ordering so even the default option exercises a change.
    await page.getByTestId('product-sort-container').selectOption(option === 'az' ? 'za' : 'az');
    await page.getByTestId('product-sort-container').selectOption(option);
    if (option === 'az' || option === 'za') {
      await expect(page.getByTestId('inventory-item-name')).toHaveText(expected.map(p => p.name));
    } else {
      await expect(page.getByTestId('inventory-item-price')).toHaveText(expected.map(p => money(p.cents)));
    }
  });
}

test('product details match the catalog and support adding and removing', async ({ page, signedIn }) => {
  const product = products[0];
  await page.getByTestId('inventory-item-name').filter({ hasText: product.name }).click();
  await expect(page.getByTestId('back-to-products')).toBeVisible();
  await expect(page.getByTestId('inventory-item-name')).toHaveText(product.name);
  await expect(page.getByTestId('inventory-item-price')).toHaveText(money(product.cents));
  await page.getByTestId('add-to-cart').click();
  await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');
  await page.getByTestId('remove').click();
  await expect(page.getByTestId('shopping-cart-badge')).toHaveCount(0);
  await page.getByTestId('back-to-products').click();
  await signedIn.ready('inventory', 'Products');
  await expect(page.getByTestId(`add-to-cart-${product.slug}`)).toBeVisible();
});
