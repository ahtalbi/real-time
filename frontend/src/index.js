import { InitGlobalEventManager } from "./events/init.js";
import { HandleRoutes } from "./router.js";

function main() {
  InitGlobalEventManager();
  HandleRoutes();
}

main();
