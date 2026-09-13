import { register, registerHooks } from "node:module";

register("./test-alias-loader.mjs", import.meta.url);

/* @phosphor-icons/react declares "type": "module" yet ships its CommonJS build
   as dist/index.cjs.js. Inside a "type": "module" package a ".js" file counts as
   an ES module, so Node 24.18+ evaluates that CommonJS bundle as ESM and it
   throws "exports is not defined in ES module scope". 24.16 did not enforce the
   rule, and CI installs the latest 24.x, so the suite went red on GitHub while
   staying green locally.

   tsx transpiles tests to CommonJS, so they reach this package through its
   "require" condition. The file is genuinely CommonJS; only its format is
   misdeclared. The hook states the real format and changes nothing else — the
   same single bundle the tests always loaded. Swapping in the package's ES build
   instead also works, but it imports ~1,500 icon modules per test process:
   the suite ran 2.5x slower and exhausted the OS file table.

   Next's bundler takes the "import" branch, so production never loads this. */
const MISDECLARED_CJS = "/@phosphor-icons/react/dist/index.cjs.js";

registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith(MISDECLARED_CJS)) {
      return nextLoad(url, { ...context, format: "commonjs" });
    }
    return nextLoad(url, context);
  },
});
