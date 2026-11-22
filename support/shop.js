const { test: base, expect } = require('@playwright/test');

// Explicit catalog expectations make product/price regressions visible.
const products = [
  { name: 'Sauce Labs Backpack', slug: 'sauce-labs-backpack', cents: 2999 },
  { name: 'Sauce Labs Bike Light', slug: 'sauce-labs-bike-light', cents: 999 },
  { name: 'Sauce Labs Bolt T-Shirt', slug: 'sauce-labs-bolt-t-shirt', cents: 1599 },
  { name: 'Sauce Labs Fleece Jacket', slug: 'sauce-labs-fleece-jacket', cents: 4999 },
  { name: 'Sauce Labs Onesie', slug: 'sauce-labs-onesie', cents: 799 },
  { name: 'Test.allTheThings() T-Shirt (Red)', slug: 'test.allthethings()-t-shirt-(red)', cents: 1599 },
];
const money = cents => `$${(cents / 100).toFixed(2)}`;

class Shop {
  constructor(page) { this.page = page; }
  async signIn(username = 'standard_user', password = 'secret_sauce') {
    await this.page.goto('/');
    await this.page.getByTestId('username').fill(username);
    await this.page.getByTestId('password').fill(password);
    await this.page.getByTestId('login-button').click();
  }
  async ready(path, title) {
    await expect(this.page).toHaveURL(new RegExp(`/${path}\\.html$`));
    // The SPA can update the URL before replacing the previous page's DOM.
    await expect(this.page.getByTestId('title')).toHaveText(title);
  }
  async add(product) {
    await this.page.getByTestId(`add-to-cart-${product.slug}`).click();
    await expect(this.page.getByTestId(`remove-${product.slug}`)).toBeVisible();
  }
  async cart() {
    await this.page.getByTestId('shopping-cart-link').click();
    await this.ready('cart', 'Your Cart');
  }
  async checkout() {
    await this.cart();
    await this.page.getByTestId('checkout').click();
    await this.ready('checkout-step-one', 'Checkout: Your Information');
  }
  async customer({ first = 'Demo', last = 'Tester', postal = '90210' } = {}) {
    await this.page.getByTestId('firstName').fill(first);
    await this.page.getByTestId('lastName').fill(last);
    await this.page.getByTestId('postalCode').fill(postal);
    await this.page.getByTestId('continue').click();
  }
  async menu() {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
    await expect(this.page.getByTestId('logout-sidebar-link')).toBeVisible();
  }
}

const test = base.extend({
  shop: async ({ page }, use) => { await use(new Shop(page)); },
  signedIn: async ({ shop }, use) => {
    await shop.signIn();
    await shop.ready('inventory', 'Products');
    await use(shop);
  },
});

module.exports = { test, expect, products, money };
