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

const child_process = require("child_process");
const os = require("os");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const isCI = require("is-ci");

/**
 * @return {string}
 */
function getTempDir() {
  return path.join(os.tmpdir(), uuidv4());
}

/**
 * @return {boolean}
 */
const isPlaywrightAvailable = function () {
  try {
    if (require.resolve("playwright")) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
};

/**
 * @return {String}
 */
const getPlaywrightExecutable = function () {
  if (!isPlaywrightAvailable()) {
    return;
  }
  const playwright = require("playwright");
  return playwright.webkit.executablePath();
};

/**
 * @return {String}
 */
const getWebkitExecutable = function () {
  if (isPlaywrightAvailable()) {
    const playwright = require("playwright");
    return playwright.webkit.executablePath();
  } else if (process.platform == "darwin") {
    return "/usr/bin/osascript";
  }
  return "";
};

/**
 * @return {boolean}
 */
const hasSafariEnv = function () {
  return process.env && process.env.SAFARI_BIN && process.env.SAFARI_BIN != "";
};

/**
 * @return {boolean}
 */
const hasWebkitEnv = function () {
  return process.env && process.env.WEBKIT_BIN && process.env.WEBKIT_BIN != "";
};

/**
 * @return {boolean}
 */
const hasWebkitHeadlessEnv = function () {
  return (
    process.env &&
    process.env.WEBKIT_HEADLESS_BIN &&
    process.env.WEBKIT_HEADLESS_BIN != ""
  );
};

/**
 * @param {String} url
 * @param {String} test_browser
 * @return {URL}
 */
const addTestBrowserInformation = function (url, test_browser) {
  const newURL = new URL(url);
  newURL.searchParams.append("test_browser", test_browser);
  return newURL;
};

/**
 * Safari Browser definition.
 * @param {*} baseBrowserDecorator
 * @param {*} args
 */
const SafariBrowser = function (baseBrowserDecorator, args) {
  baseBrowserDecorator(this);
  let testUrl;

  this._start = (url) => {
    const flags = args.flags || [];
    const command = this._getCommand();
    testUrl = addTestBrowserInformation(url, "Safari");
    if (command && command.endsWith("osascript")) {
      if (process.platform != "darwin") {
        console.warn(
          `The platform ${process.platform}, is unsupported for SafariBrowser.`
        );
      }
      if (isCI) {
        console.warn(
          `Depending on the CI system, it could be that you need to disable SIP to allow the execution of AppleScripts!`
        );
      }
      this._execCommand(
        this._getCommand(),
        [path.resolve(__dirname, "scripts/LaunchSafari.scpt"), testUrl].concat(
          flags
        )
      );
    } else {
      this._execCommand(
        this._getCommand(),
        [testUrl, "--user-data-dir=" + getTempDir()].concat(flags)
      );
    }
  };

  this.on("kill", (done) => {
    // Close opened tabs if open by osascript.
    if (
      process.platform == "darwin" &&
      this._getCommand().endsWith("osascript")
    ) {
      closeSafariTab(testUrl);
    }
    done();
  });

  this.on("done", () => {
    // Close opened tabs if open by osascript.
    if (
      process.platform == "darwin" &&
      this._getCommand().endsWith("osascript")
    ) {
      closeSafariTab(testUrl);
    }
  });
};

SafariBrowser.prototype = {
  name: "Safari",
  DEFAULT_CMD: {
    darwin: !hasSafariEnv() ? "/usr/bin/osascript" : "",
  },
  ENV_CMD: "SAFARI_BIN",
};

SafariBrowser.$inject = ["baseBrowserDecorator", "args"];

/**
 * Webkit Browser definition.
 * @param {*} baseBrowserDecorator
 * @param {*} args
 */
const WebkitBrowser = function (baseBrowserDecorator, args) {
  // Automatically switch to Safari, if osascript is used and not headless mode.
  if (
    (args && args.flags
      ? !args.flags.join(" ").includes("--headless")
      : true) &&
    process.platform == "darwin" &&
    !hasWebkitEnv() &&
    getWebkitExecutable().endsWith("osascript")
  ) {
    SafariBrowser.call(this, baseBrowserDecorator, args);
    return;
  }

  baseBrowserDecorator(this);
  let testUrl;

  this._start = (url) => {
    const command = this._getCommand();

    // Add used browser to test url.
    if (command && command.includes("ms-playwright")) {
      testUrl = addTestBrowserInformation(url, "Playwright");
    } else {
      testUrl = addTestBrowserInformation(url, "Custom");
    }

    const flags = args.flags || [];
    this._execCommand(
      this._getCommand(),
      [testUrl, "--user-data-dir=" + getTempDir()].concat(flags)
    );
  };

  this.on("kill", (done) => {
    // Clean up all remaining processes after 500ms delay on normal clients.
    if (!isCI) {
      childProcessCleanup(this.id, done);
    } else {
      done();
    }
  });

  this.on("done", () => {
    // Clean up all remaining processes after 500ms delay on normal clients.
    if (!isCI) {
      childProcessCleanup(this.id);
    }
  });
};

WebkitBrowser.prototype = {
  name: "Webkit",
  DEFAULT_CMD: {
    linux: !hasWebkitEnv() ? getPlaywrightExecutable() : "",
    darwin: !hasWebkitEnv() ? getWebkitExecutable() : "",
    win32: !hasWebkitEnv() ? getPlaywrightExecutable() : "",
  },
  ENV_CMD: "WEBKIT_BIN",
};

WebkitBrowser.$inject = ["baseBrowserDecorator", "args"];

/**
 * Webkit Headless Browser definition.
 * @param {*} baseBrowserDecorator
 * @param {*} args
 */
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
  DEFAULT_CMD: {
    linux: !hasWebkitHeadlessEnv() ? getPlaywrightExecutable() : "",
    darwin: !hasWebkitHeadlessEnv() ? getPlaywrightExecutable() : "",
    win32: !hasWebkitHeadlessEnv() ? getPlaywrightExecutable() : "",
  },
  ENV_CMD: "WEBKIT_HEADLESS_BIN",
};

WebkitHeadlessBrowser.$inject = ["baseBrowserDecorator", "args"];

/**
 * Epiphany Browser definition.
 * @param {*} baseBrowserDecorator
 * @param {*} args
 */
const EpiphanyBrowser = function (baseBrowserDecorator, args) {
  baseBrowserDecorator(this);
  let testUrl;

  this.on("start", (url) => {
    testUrl = addTestBrowserInformation(url, "Epiphany");
    const flags = args.flags || [];
    this._execCommand(
      this._getCommand(),
      [testUrl, "--profile=" + getTempDir()].concat(flags)
    );
  });
};

EpiphanyBrowser.prototype = {
  name: "Epiphany",
  DEFAULT_CMD: {
    linux: "/usr/bin/epiphany",
  },
  ENV_CMD: "EPIPHANY_BIN",
};

EpiphanyBrowser.$inject = ["baseBrowserDecorator", "args"];

/**
 * @param {string} url
 */
const closeSafariTab = function (url) {
  if (!url || url == "") {
    return;
  }
  const findChildProcesses = `osascript ${path.resolve(
    __dirname,
    "scripts/CloseSafariTab.scpt"
  )} "${url}"`;
  child_process.exec(findChildProcesses, (error) => {
    if (error && error.signal != "SIGHUP") {
      throw error;
    }
  });
};

/**
 * @param {number} task_id
 * @param {function} callback
 */
const childProcessCleanup = function (task_id, callback) {
  const shouldExecuteCallback = callback && typeof callback === "function";
  if (process.platform == "darwin") {
    // Find all related child process for playwright based on the task id.
    const findChildProcesses = `ps | grep -i "playwright" | grep -i "id=${task_id}"`;
    child_process.exec(findChildProcesses, (error, stdout) => {
      // Ignore error from killed karma processes.
      if (error && error.signal != "SIGHUP") {
        throw error;
      }

      // Check process list for relevant entries.
      if (
        stdout &&
        stdout.toLowerCase().includes("playwright") &&
        stdout.includes(task_id)
      ) {
        // Extract relevant child process ids.
        const childProcessIds = stdout.match(/^\s?(\d)+\s?/gm);
        if (childProcessIds && childProcessIds.length > 0) {
          killChildProcesses(childProcessIds, task_id);

          // Allow 500ms to close the processes before calling the callback.
          if (shouldExecuteCallback) {
            setTimeout(callback, 500);
          }
        } else if (shouldExecuteCallback) {
          callback();
        }
      }
    });
  } else if (shouldExecuteCallback) {
    callback();
  }
};

/**
 * @param {Array} childProcessIds
 * @param {String} task_id
 */
const killChildProcesses = function (childProcessIds, task_id = "unknown") {
  if (!childProcessIds || childProcessIds.length <= 0) {
    return;
  }

  childProcessIds.forEach((childProcessId) => {
    // Check if the process is still valid with a 0 kill signal.
    try {
      process.kill(childProcessId, 0);
    } catch (error) {
      if (error.code === "EPERM") {
        console.error(
          `No permission to kill child process ${childProcessId} for karma-task ${task_id}`
        );
      }
      return;
    }

    // Killing child process, if there are no permission error.
    try {
      process.kill(childProcessId, "SIGHUP");
    } catch (killError) {
      // Ignore errors if process is already killed.
      if (killError.code != "ESRCH") {
        throw killError;
      }
    }
  });
};

module.exports = {
  "launcher:Epiphany": ["type", EpiphanyBrowser],
  "launcher:Safari": ["type", SafariBrowser],
  "launcher:Webkit": ["type", WebkitBrowser],
  "launcher:WebkitHeadless": ["type", WebkitHeadlessBrowser],
};
