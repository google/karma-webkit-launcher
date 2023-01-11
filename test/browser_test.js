/**
 * @fileoverview Karma Webkit Launcher - Test
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

/**
 * @param {function} callback
 */
function deferredCallback(callback) {
  setTimeout(function () {
    callback("done.");
  }, 1000);
}

describe("Karma Webkit Launcher", function () {
  it("open", function () {
    expect(typeof window.webkitConvertPointFromNodeToPage).toEqual("function");
  });

  it("Simple Calculation: 1 + 1 = 2", function () {
    expect(1 + 1).toEqual(2);
  });

  it("Timeout with 100ms delay", function (done) {
    setTimeout(() => {
      done();
    }, 100);
  });

  it("Timeout with 500ms delay", function (done) {
    setTimeout(() => {
      done();
    }, 500);
  });

  it("Deferred callback after 1 sec", function () {
    jasmine.clock().install();
    const callback = jasmine.createSpy("callback");
    deferredCallback(callback);
    jasmine.clock().tick(1000);
    expect(callback).toHaveBeenCalledWith("done.");
    jasmine.clock().uninstall();
  });
});
