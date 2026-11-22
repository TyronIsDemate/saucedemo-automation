# SauceDemo browser automation

JavaScript/Playwright regression tests against https://www.saucedemo.com.

## Setup and run

Use Node.js 22 or newer. From this directory:

```sh
npm ci
npx playwright install chromium
npm test
```

Useful commands:

```sh
npm run test:smoke                 # Four core login/cart/order scenarios
npm run test:headed                # Watch the browser
npm run test:ui                    # Interactive test explorer
npm run report                    # Open the latest HTML report
npx playwright test tests/auth.spec.js
npx playwright test --grep 'sorts by'
```

## Coverage: 25 scenarios

| File | Scenarios |
| --- | --- |
| `tests/auth.spec.js` | Successful login; missing username/password; incorrect password; unknown/locked accounts; error dismissal and correction; logout and protected navigation |
| `tests/inventory.spec.js` | Catalog names/prices/descriptions/images; all four sorting modes; product detail consistency and add/remove controls |
| `tests/cart.spec.js` | Empty initial cart; multiple items and quantities; persistence through reload/navigation; removal from cart and inventory |
| `tests/checkout.spec.js` | Each required field and recovery; single/multiple item orders; line items, tax and totals; confirmation and cart clearing; cancellation at both stages |

## Structure and reliability

`support/shop.js` defines shared navigation helpers, isolated fixtures and explicit
catalog expectations. Every test receives a fresh browser context and signs in
through the UI when needed. No test depends on another test's state or execution
order. Navigation waits for both the URL and destination heading because the
site can update its URL before rendering the new page.

Locators prefer `data-test` attributes and accessible roles. Assertions retry
until their timeout; there are no fixed sleeps. Money is calculated in integer
cents using the demo's expected 8% tax rate. Catalog values and tax are intentional
business expectations, not values copied from the totals being tested.

The suite uses public demo credentials and fictional customer information.
It targets `standard_user`; intentionally defective demo personas such as
`problem_user` are outside this regression baseline. These browser tests do not
constitute accessibility, security, performance or API coverage.

Tests use one worker to keep public-site traffic modest. Local failures are not
retried. CI retries once, so inspect any flaky results rather than treating a retry
as a fix. Failed runs retain screenshots and traces. HTML output is in
`playwright-report/`; JUnit results are in `test-results/results.xml`.

## Optional browser coverage

Chromium is the default. To enable Firefox and WebKit as well on macOS/Linux:

```sh
npx playwright install firefox webkit
CROSS_BROWSER=1 npm test
```

In PowerShell, set `$env:CROSS_BROWSER='1'` before `npm test`.
Only Chromium has been validated for this expansion; other engines are configured
but require their own run. For CI, use `npm ci`,
`npx playwright install --with-deps chromium`, and `CI=1 npm test`;
retain `playwright-report/` and `test-results/` even on failure.

## Extending the suite

Add scenarios to the relevant spec, importing `test` and `expect` from
`support/shop.js`. Request `signedIn` for authenticated setup or `shop` for login
failure scenarios. Add `@smoke` to a title only for a core quick-check scenario.
Update explicit catalog expectations when the demo intentionally changes.

References: [Playwright fixtures](https://playwright.dev/docs/test-fixtures)
and [locators](https://playwright.dev/docs/locators).
# saucedemo-automation
