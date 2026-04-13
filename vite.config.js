import { defineConfig } from "vite";

export default defineConfig({
  // Vercel serves this app from domain root.
  base: "/",
  resolve: {
    alias: [
      // General fix: rewrite any malformed pnpm-internal three examples imports
      {
        find: /^\.pnpm\/three@[^/]+\/node_modules\/three\/examples\/jsm\/(.*)$/,
        replacement: 'three/examples/jsm/$1',
      },
      // Workaround for a malformed import path inside GLTFLoader (pnpm layout)
      {
        find: /^\.pnpm\/three@[^/]+\/node_modules\/three\/examples\/jsm\/utils\/BufferGeometryUtils\.js$/,
        replacement: 'three/examples/jsm/utils/BufferGeometryUtils.js',
      },
      // Workaround for malformed import from FBXLoader to fflate
      {
        find: /^\.pnpm\/three@[^/]+\/node_modules\/three\/examples\/jsm\/libs\/fflate\.module\.js$/,
        replacement: 'three/examples/jsm/libs/fflate.module.js',
      },
    ],
  },
  build: {
    target: "es2020",
    outDir: "dist",
    assetsDir: "", // Put assets at root of dist
    assetsInlineLimit: 0,
    // Set base to './' for relative paths, important for S3/static hosting
  },
  server: {
    port: 3000,
    open: false,
  },
});
