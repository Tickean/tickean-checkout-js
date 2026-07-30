import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  // Browser embed (WP / CDN). Without this, esbuild pulls engine.io node
  // transports (xmlhttprequest-ssl → require("fs")) and the module crashes.
  platform: "browser",
  target: "es2020",
  // Bundle socket.io into the browser embed (WP importmap has no bare specifier).
  noExternal: ["socket.io-client"],
  esbuildOptions(options) {
    options.mainFields = ["browser", "module", "main"];
    options.conditions = ["browser", "import", "default"];
  },
});
