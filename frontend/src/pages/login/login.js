import { GlobalEventsManager } from "../../events/init.js";
import { initImageAnimation } from "./utils/login_imageAnimation.js";
import { loginSendPost } from "./utils/login_postRequest.js";

function initLogin() {
    initImageAnimation();
    GlobalEventsManager.submit.RegisterEvent("login-container", loginSendPost);
}

initLogin();