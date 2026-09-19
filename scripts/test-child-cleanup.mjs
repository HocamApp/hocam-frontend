import { after } from "node:test";

// UI tests retain query-cache and DOM timers after their assertions finish.
// Track only timers created in the isolated child. After its tests finish,
// unref existing timers instead of force-exiting: later teardown hooks still
// run, and Node produces its normal completion summary and exit status.
if (process.env.NODE_TEST_CONTEXT === "child-v8") {
  const timers = new Set();
  const original = {
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval,
  };
  globalThis.setTimeout = function (callback, delay, ...args) {
    const timer = original.setTimeout(function (...values) {
      timers.delete(timer);
      callback.apply(this, values);
    }, delay, ...args);
    timers.add(timer);
    return timer;
  };
  globalThis.setInterval = function (callback, delay, ...args) {
    const timer = original.setInterval(callback, delay, ...args);
    timers.add(timer);
    return timer;
  };
  globalThis.clearTimeout = function (timer) {
    timers.delete(timer);
    return original.clearTimeout(timer);
  };
  globalThis.clearInterval = function (timer) {
    timers.delete(timer);
    return original.clearInterval(timer);
  };
  after(() => {
    Object.assign(globalThis, original);
    for (const timer of timers) timer.unref?.();
    timers.clear();
  });
}
