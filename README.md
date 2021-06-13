# karma-webkit-launcher

> Launcher for Apple's Webkit

## Installation

The easiest way is to keep karma-webkit-launcher as a devDependency in your package.json, by running

```bash
$ npm install karma-webkit-launcher --save-dev
```

## Configuration

```js
// karma.conf.js
// Karma Test Config
export default (config) => {
  config.set({
    browsers: ['Webkit'],  // You may use 'WebkitHeadless' or other supported browser
```

You can pass list of browsers as a CLI argument too:

```bash
$ karma start --browsers Webkit
```

## Headless Webkit with Playwright

[Playwright](https://github.com/microsoft/playwright) is a Node.js library to automate Chromium, Firefox and WebKit with a single API. Playwright is built to enable cross-browser web automation that is ever-green, capable, reliable and fast.

Headless execution is supported for all the browsers on all platforms. Check out [system requirements](https://playwright.dev/docs/intro/#system-requirements) for details.

### Usage

```bash
$ npm install playwright karma-webkit-launcher --save-dev
```

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
