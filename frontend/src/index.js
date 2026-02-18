import { InitGlobalEventManager } from "./events/init.js";
import { HandleRoutes } from "./router.js";

async function main() {
  InitGlobalEventManager();
  HandleRoutes();  
  
  const worker = new SharedWorker("worker.js");
  worker.port.start();
}

main();
