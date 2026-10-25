import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

// Use the project's TypeScript compiler so the tests also run on supported
// Node 20, which cannot import a .ts file directly.
const source = readFileSync(new URL("../src/components/AppShot/observe-width.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { observeWidth } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);

function browser(t) {
  const previous = globalThis.window;
  const frames = new Map();
  let nextId = 0;
  let observer;
  globalThis.window = {
    ResizeObserver: class {
      constructor(callback) {
        this.callback = callback;
        this.disconnected = false;
        observer = this;
      }
      observe(target) {
        this.target = target;
      }
      disconnect() {
        this.disconnected = true;
      }
    },
    requestAnimationFrame(callback) {
      frames.set(++nextId, callback);
      return nextId;
    },
    cancelAnimationFrame(id) {
      frames.delete(id);
    },
  };
  t.after(() => {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  });
  return {
    frames,
    get observer() {
      return observer;
    },
    resize(width, height) {
      observer.callback([{ contentRect: { width, height } }]);
    },
    paint() {
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback());
    },
  };
}

test("AppShot defers layout outside ResizeObserver and ignores its own height changes", (t) => {
  const env = browser(t);
  let layouts = 0;
  observeWidth({}, () => {
    layouts++;
  });
  env.resize(600, 0);
  assert.equal(layouts, 0, "layout must not mutate observed geometry during observer delivery");
  env.resize(590, 0);
  env.resize(580, 0);
  assert.equal(env.frames.size, 1, "resize bursts should share one pending frame");
  env.paint();
  assert.equal(layouts, 1);
  env.resize(580, 290);
  env.resize(580, 291);
  assert.equal(env.frames.size, 0, "a crop height change must not schedule another layout");
  env.resize(390, 291);
  env.paint();
  assert.equal(layouts, 2, "a real width change still remeasures the capture");
});

test("AppShot cleanup disconnects observation and cancels a pending layout", (t) => {
  const env = browser(t);
  let layouts = 0;
  const cleanup = observeWidth({}, () => layouts++);
  env.resize(600, 0);
  assert.equal(env.frames.size, 1);
  cleanup();
  assert.equal(env.observer.disconnected, true);
  assert.equal(env.frames.size, 0);
  env.paint();
  assert.equal(layouts, 0, "an unmounted capture must not lay out");
});
