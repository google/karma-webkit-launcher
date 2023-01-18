# karma-webkit-launcher

[![Build status: Playwright (MacOS)](https://github.com/google/karma-webkit-launcher/actions/workflows/playwright_macos_tests.yml/badge.svg)](https://github.com/google/karma-webkit-launcher/actions/workflows/playwright_macos_tests.yml)
[![Build status: Playwright (Ubuntu)](https://github.com/google/karma-webkit-launcher/actions/workflows/playwright_ubuntu_tests.yml/badge.svg)](https://github.com/google/karma-webkit-launcher/actions/workflows/playwright_ubuntu_tests.yml)
[![Build status: Playwright (Windows)](https://github.com/google/karma-webkit-launcher/actions/workflows/playwright_windows_tests.yml/badge.svg)](https://github.com/google/karma-webkit-launcher/actions/workflows/playwright_windows_tests.yml)
[![Build status: Epiphany](https://github.com/google/karma-webkit-launcher/actions/workflows/epiphany_tests.yml/badge.svg)](https://github.com/google/karma-webkit-launcher/actions/workflows/epiphany_tests.yml)
[![NPM version](https://img.shields.io/npm/v/karma-webkit-launcher.svg)](https://www.npmjs.org/package/karma-webkit-launcher)

[![NPM](https://nodei.co/npm/karma-webkit-launcher.png?downloads=true&downloadRank=true)](https://nodei.co/npm/karma-webkit-launcher/)

Karma Launcher for Apple's Webkit

## Installation

The easiest way is to keep karma-webkit-launcher as a devDependency in your package.json, by running

```bash
npm install karma-webkit-launcher --save-dev
```

## Supported WebKit-Launcher

This karma-webkit-launcher provides the following browser launcher.

| Karma Runner Browsers | ENV                 | Type                                                              | CI note        |
| --------------------- | ------------------- | ----------------------------------------------------------------- | -------------- |
| WebKit                | WEBKIT_BIN          | Native / [Playwright][playwright] / [Safari][safari] (MacOS only) | -              |
| WebKitHeadless        | WEBKIT_HEADLESS_BIN | Native / [Playwright][playwright]                                 | -              |
| Safari                | SAFARI_BIN          | Native MacOS only                                                 | not supported  |
| Epiphany              | EPIPHANY_BIN        | Native Ubuntu only                                                | needs xvfb-run |

## Configuration

For the configuration just add `Webkit` or `WebkitHeadless` in your browser list.

```js
// karma.conf.js
export default (config) => {
  config.set({
    browsers: ['Webkit'],  // You may use 'WebkitHeadless' or other supported browser
```

You can pass the list of browsers as a CLI argument too:

```bash
karma start --browsers Webkit
```

## Headless Webkit with Playwright

[Playwright](https://github.com/microsoft/playwright) is a Node.js library to automate Chromium, Firefox and WebKit with a single API. Playwright is built to enable cross-browser web automation that is ever-green, capable, reliable and fast.

Headless execution is supported for all the browsers on all platforms.
Check out [system requirements](https://playwright.dev/docs/intro/#system-requirements) for details.

If no environment variable is set and playwright is available, it will be used automatically.

### Example Usage

#### Installing Playwright and karma-webkit-launcher

```bash
npm install playwright karma-webkit-launcher --save-dev
```

#### Example Karma configuration

```js
// karma.conf.js
module.exports = function (config) {
  config.set({
    browsers: ["WebkitHeadless"],
  });
};
```

### Manually define Playwright executable

To force the use of Playwright over an local Webkit instance, just overwrite the `WEBKIT_HEADLESS_BIN` or `WEBKIT_BIN` environment variable.

```js
// karma.conf.js
import playwright from "playwright";
process.env.WEBKIT_HEADLESS_BIN = playwright.webkit.executablePath();

module.exports = function (config) {
  config.set({
    browsers: ["WebkitHeadless"],
  });
};
```

## Advanced Topics

### Detected if Safari or Playwright is used

In some instances it is helpful to detect if Playwright or a real Safari Browser is used.
For this reason it's possible to detect which kind of browser is currently running the tests over this runner.

```javascript
if (
  new URLSearchParams(document.referrer || window.location.search).get(
    "test_browser"
  ) == "Playwright"
) {
  // Playwright specific tests
}
```

See: [Playwright Karma Test](test/playwright_test.js)

```javascript
if (
  new URLSearchParams(document.referrer || window.location.search).get(
    "test_browser"
  ) == "Safari"
) {
  // Safari specific tests
}
```

See: [Safari Karma Test](test/safari_test.js)

For more information on Karma see the [Karma Homepage][karma].

[karma]: https://karma-runner.github.io/
[playwright]: https://playwright.dev/
[safari]: https://www.apple.com/safari/
