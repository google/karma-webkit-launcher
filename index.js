/**
 * @fileoverview Karma Webkit Launcher
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

const os = require("os");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

/**
 * @return {string}
 */
function getTempDir() {
  return path.join(os.tmpdir(), uuidv4());
}

const WebkitBrowser = function (baseBrowserDecorator, args) {
  baseBrowserDecorator(this);

  this._start = (url) => {
    const flags = args.flags || [];
    this._execCommand(
      this._getCommand(),
      [url, "--user-data-dir=" + getTempDir()].concat(flags)
    );
  };
};

WebkitBrowser.prototype = {
  name: "Webkit",
  DEFAULT_CMD: {},
  ENV_CMD: "WEBKIT_BIN",
};

WebkitBrowser.$inject = ["baseBrowserDecorator", "args"];

const WebkitHeadlessBrowser = function (baseBrowserDecorator, args) {
  const headlessFlags = ["--headless"];
  if (process.platform == "darwin" || process.platform == "win32") {
    headlessFlags.push("--disable-gpu");
  }
  if (args && args.flags && args.flags.length > 0) {
    args.flags = args.flags.concat(headlessFlags);
  } else {
    args = {};
    args.flags = headlessFlags;
  }
  WebkitBrowser.call(this, baseBrowserDecorator, args);
};

WebkitHeadlessBrowser.prototype = {
  name: "WebkitHeadless",
  DEFAULT_CMD: {},
  ENV_CMD: "WEBKIT_HEADLESS_BIN",
};

WebkitHeadlessBrowser.$inject = ["baseBrowserDecorator", "args"];

const EpiphanyBrowser = function (baseBrowserDecorator, args) {
  baseBrowserDecorator(this);

  this._start = (url) => {
    const flags = args.flags || [];
    this._execCommand(
      this._getCommand(),
      [url, "--profile=" + getTempDir()].concat(flags)
    );
  };
};

EpiphanyBrowser.prototype = {
  name: "Epiphany",

  DEFAULT_CMD: {
    linux: "/usr/bin/epiphany",
  },
  ENV_CMD: "EPIPHANY_BIN",
};

EpiphanyBrowser.$inject = ["baseBrowserDecorator", "args"];

module.exports = {
  "launcher:Epiphany": ["type", EpiphanyBrowser],
  "launcher:Webkit": ["type", WebkitBrowser],
  "launcher:WebkitHeadless": ["type", WebkitHeadlessBrowser],
};
