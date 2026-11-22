const { test, expect, products, money } = require('../support/shop');

for (const [field, customer, error] of [
  ['first name', { first: '' }, 'First Name is required'],
  ['last name', { last: '' }, 'Last Name is required'],
  ['postal code', { postal: '' }, 'Postal Code is required'],
]) {
  test(`checkout requires ${field}`, async ({ page, signedIn }) => {
    await signedIn.add(products[0]);
    await signedIn.checkout();
    await signedIn.customer(customer);
    await expect(page.getByTestId('error')).toContainText(error);
    await signedIn.ready('checkout-step-one', 'Checkout: Your Information');
    // Verify the user can recover without restarting checkout.
    await signedIn.customer();
    await signedIn.ready('checkout-step-two', 'Checkout: Overview');
  });
}

for (const [label, selection] of [['single product', [products[0]]], ['multiple products', products.slice(0, 3)]]) {
  test(`completes an order for ${label} @smoke`, async ({ page, signedIn }) => {
    await test.step('Select products and provide customer information', async () => {
      for (const product of selection) await signedIn.add(product);
      await signedIn.checkout();
      await signedIn.customer();
      await signedIn.ready('checkout-step-two', 'Checkout: Overview');
    });
    await test.step('Verify line items and totals in integer cents', async () => {
      await expect(page.getByTestId('inventory-item-name')).toHaveText(selection.map(p => p.name));
      await expect(page.getByTestId('inventory-item-price')).toHaveText(selection.map(p => money(p.cents)));
      await expect(page.getByTestId('item-quantity')).toHaveText(selection.map(() => '1'));
      const subtotal = selection.reduce((sum, p) => sum + p.cents, 0);
      const tax = Math.round(subtotal * 8 / 100);
      await expect(page.getByTestId('subtotal-label')).toHaveText(`Item total: ${money(subtotal)}`);
      await expect(page.getByTestId('tax-label')).toHaveText(`Tax: ${money(tax)}`);
      await expect(page.getByTestId('total-label')).toHaveText(`Total: ${money(subtotal + tax)}`);
    });
    await test.step('Finish order and verify the cart is cleared', async () => {
      await page.getByTestId('finish').click();
      await signedIn.ready('checkout-complete', 'Checkout: Complete!');
      await expect(page.getByTestId('complete-header')).toHaveText('Thank you for your order!');
      await expect(page.getByTestId('shopping-cart-badge')).toHaveCount(0);
      await page.getByTestId('back-to-products').click();
      await signedIn.ready('inventory', 'Products');
      await signedIn.cart();
      await expect(page.getByTestId('inventory-item')).toHaveCount(0);
    });
  });
}

for (const stage of ['information', 'overview']) {
  test(`cancel from ${stage} preserves the selected product`, async ({ page, signedIn }) => {
    await signedIn.add(products[0]);
    await signedIn.checkout();
    if (stage === 'overview') {
      await signedIn.customer();
      await signedIn.ready('checkout-step-two', 'Checkout: Overview');
    }
    await page.getByTestId('cancel').click();
    if (stage === 'overview') {
      await signedIn.ready('inventory', 'Products');
      await signedIn.cart();
    } else await signedIn.ready('cart', 'Your Cart');
    await expect(page.getByTestId('inventory-item-name')).toHaveText([products[0].name]);
    await expect(page.getByTestId('shopping-cart-badge')).toHaveText('1');
  });
}
