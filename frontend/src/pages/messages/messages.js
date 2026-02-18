import { initLogoutMenu } from "../home/utils/home_initLogout.js";
import { initConversations } from "./utils/messages_conversation.js";
import { initFetchUsers } from "./utils/messages_fetchUsers.js";
import { ClientRouter } from "../../router.js";

async function initMessages() {
    initLogoutMenu();
    await initFetchUsers();
    await initConversations();
    document.getElementById("logo").addEventListener("click", () => { ClientRouter.navigate("/") });
}

initMessages();