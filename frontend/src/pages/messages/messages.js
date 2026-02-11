import { initLogoutMenu } from "../home/utils/home_initLogout.js";
import { initConversations } from "./utils/messages_conversation.js";
import { initFetchUsers } from "./utils/messages_fetchUsers.js";

async function initMessages() {
    initLogoutMenu();
    await initFetchUsers();
    initConversations();
}

initMessages();