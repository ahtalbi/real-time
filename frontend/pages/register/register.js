import { GlobalEventsManager } from "../../src/events/init.js";
import { registerSendPost } from "./utils/resister_postRequest.js";

function initRegister() {
  GlobalEventsManager.submit.RegisterEvent("register-form", registerSendPost);
}

initRegister();