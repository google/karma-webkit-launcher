/**
 * @fileoverview Playwright specific tests config for karma-webkit-launcher.
 *
 * @license Copyright 2021 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author mbordihn@google.com (Markus Bordihn)
 */

const playwright = require("playwright");
process.env.WEBKIT_HEADLESS_BIN = playwright.webkit.executablePath();

module.exports = (config) => {
  config.set({
    basePath: "..",
    browserConsoleLogOptions: { level: "warn" },
    browsers: ["WebkitHeadless"],
    singleRun: true,
    frameworks: ["jasmine"],
    files: [
      {
        pattern: "test/*_test.js",
        watched: false,
      },
    ],
    plugins: [require.resolve("../"), "karma-jasmine"],
  });
};
