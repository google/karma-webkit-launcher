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

/**
 * @return {string}
 */
function getTempDir() {
  return path.join(os.tmpdir(), uuidv4());
}

/**
 * Webkit Browser definition.
 * @param {*} baseBrowserDecorator
 * @param {*} args
 */
const WebkitBrowser = function (baseBrowserDecorator, args) {
  baseBrowserDecorator(this);

  let id;

  this.on("start", (url) => {
    id = this.id;
    const flags = args.flags || [];
    this._execCommand(
      this._getCommand(),
      [url, "--user-data-dir=" + getTempDir()].concat(flags)
    );
  });

  this.on("done", () => {
    // Make sure to clean up all remaining processes after 500ms delay.
    setTimeout(() => {
      childProcessCleanup(id);
    }, 500);
  });
};

WebkitBrowser.prototype = {
  name: "Webkit",
  DEFAULT_CMD: {},
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
  DEFAULT_CMD: {},
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

  this.on("start", (url) => {
    const flags = args.flags || [];
    this._execCommand(
      this._getCommand(),
      [url, "--profile=" + getTempDir()].concat(flags)
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

const childProcessCleanup = function (task_id) {
  if (process.platform == "darwin") {
    // Find all related child process for playwright based on the task id.
    const findChildProcesses = `ps | grep "playwright" | grep "id=${task_id}"`;
    child_process.exec(findChildProcesses, (error, stdout) => {
      if (error) {
        throw error;
      }
      if (stdout && stdout.includes("playwright") && stdout.includes(task_id)) {
        const childProcessIds = stdout.match(/^[0-9]+/gm);
        if (childProcessIds && childProcessIds.length > 0) {
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
              if (killError.code != "ESRCH") {
                throw killError;
              }
            }
          });
        }
      }
    });
  }
};

module.exports = {
  "launcher:Epiphany": ["type", EpiphanyBrowser],
  "launcher:Webkit": ["type", WebkitBrowser],
  "launcher:WebkitHeadless": ["type", WebkitHeadlessBrowser],
};
