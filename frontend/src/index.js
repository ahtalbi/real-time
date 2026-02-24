import { InitGlobalEventManager } from "./events/init.js";
import { HandleRoutes } from "./router.js";
import { initTheme } from "./utils/theme.js";

async function main() {
  initTheme();
  InitGlobalEventManager();
  HandleRoutes();
}

main();
