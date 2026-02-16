import { registerSendPost } from "./utils/register_postRequest.js";
import { GlobalEventsManager } from "./../../events/init.js";

function initRegister() {
  GlobalEventsManager.submit.RegisterEvent("register-form", registerSendPost);
}

initRegister();