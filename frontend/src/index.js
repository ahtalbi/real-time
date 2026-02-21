import { InitGlobalEventManager } from "./events/init.js";
import { HandleRoutes } from "./router.js";

async function main() {
  InitGlobalEventManager();
  HandleRoutes();
}

main();
