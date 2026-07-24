// Test-only module resolver. The app uses bundler-style extensionless relative
// imports ("./presets"), which Node's ESM loader won't resolve on its own.
// This in-thread hook appends ".ts" so `node --test` can load the real source
// modules unchanged — production code stays idiomatic; the harness adapts.
import { registerHooks } from "node:module";

registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    const hasExt = /\.[mc]?[jt]s$/.test(specifier);
    if (relative && !hasExt) {
      try {
        return nextResolve(specifier + ".ts", context);
      } catch {
        // Fall through to default resolution (e.g. a directory index).
      }
    }
    return nextResolve(specifier, context);
  },
});
