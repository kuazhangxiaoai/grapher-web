import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import cesium from "vite-plugin-cesium";
export default defineConfig({
  define: {
    __IS_PLAYER_MODE__: JSON.stringify(process.env.VITE_APP_MODE === "player"),
  },
  base: "/",
  plugins: [vue(), cesium()],
  server: {
    host: "0.0.0.0", // 本地ip地址
    port: 5173,
    proxy: {
      "/serve_api": {
        target: "http://10.11.52.173:8080", //王浩
        // target: "http://10.11.52.10:8080", //李双
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/serve_api/, "/graph_api/v1"),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use '@/assets/styles/variable.scss' as *;
          @use '@/assets/styles/mixin.scss' as *;
        `,
        api: "modern-compiler", // or "modern"
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
