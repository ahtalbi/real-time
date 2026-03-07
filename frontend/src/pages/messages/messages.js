import { initLogoutMenu } from "../home/utils/home_initLogout.js";
import { initConversations } from "./utils/messages_conversation.js";
import { initFetchUsers } from "./utils/messages_fetchUsers.js";
import { ClientRouter } from "../../router.js";
import { initSetUserData } from "./utils/messages_setUserData.js";

async function initMessages() {
    initSetUserData();
    initLogoutMenu();
    await initFetchUsers();
    await initConversations();
    document.getElementById("logo").addEventListener("click", () => { ClientRouter.navigate("/") });
}

initMessages();
