import path from "path";
import { loadEnv, defineConfig } from "vite";
import analyze from "rollup-plugin-analyzer";
import { visualizer } from "rollup-plugin-visualizer";
import reactRefresh from "@vitejs/plugin-react-refresh";
import { urbitPlugin } from "@urbit/vite-plugin-urbit";
import { execSync } from "child_process";

// https://vitejs.dev/config/
export default ({ mode }) => {
  if (mode !== "mock") {
    // using current commit until release
    const GIT_DESC = execSync("git rev-parse --short HEAD", {
      encoding: "utf8",
    }).trim();
    process.env.VITE_SHORTHASH = GIT_DESC;
  } else {
    process.env.VITE_SHORTHASH = "1";
  }

  Object.assign(process.env, loadEnv(mode, process.cwd()));
  const SHIP_URL =
    process.env.SHIP_URL ||
    process.env.VITE_SHIP_URL ||
    "http://localhost:8080";
  console.log(SHIP_URL);

  return defineConfig({
    server: {
      port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 3000,
      fs: {
        allow: ["/"],
      },
    },
    resolve: {
      alias: {
        react: path.resolve("./node_modules/react"),
        "react-dom": path.resolve("./node_modules/react-dom"),
        "styled-components": path.resolve("./node_modules/styled-components"),
        "styled-system": path.resolve("./node_modules/styled-system"),
      },
    },
    build:
      mode !== "profile"
        ? undefined
        : {
            rollupOptions: {
              plugins: [
                analyze({
                  limit: 20,
                }),
                visualizer(),
              ],
            },
          },
    plugins:
      mode === "mock"
        ? [reactRefresh()]
        : [
            urbitPlugin({ base: "campfire", target: SHIP_URL, secure: false }),
            reactRefresh(),
          ],
  });
};
