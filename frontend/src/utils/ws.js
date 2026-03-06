import { getActiveConversationUserId, showTypingIndicator } from "../pages/messages/utils/messages_conversation.js";
import { MessageTemplate, UserTemplate } from "../pages/messages/utils/messages_templates.js";
import { renderMessagesHistory } from "../pages/messages/utils/messages_fetchMessages.js";
import { ClientRouter } from "../router.js";

// =================================================================
// shared worker
// =================================================================
export let worker = new SharedWorker("./src/worker.js");
export let stateUsers = {
    Users: {},
};
worker.port.start();

worker.port.onmessage = function (e) {
    switch (e.data.type) {
        case "tab_uuid":
            sessionStorage.setItem("tab_uuid", e.data.uuid);
            break;
        case "shw_loggedIn":
            ClientRouter.navigate("/", { history: "replace" });
            break;
        case "shw_logout":
            ClientRouter.navigate("/login", { history: "replace" });
            break;
        case "shw_user_offline":
            let el = document.querySelector(`[data-user-id="${e.data.userID}"]`);
            if (el) {
                let dot = el.querySelector('.dot');
                if (dot) dot.classList.remove('ok');
            }
            break;
        case "shw_users_info_for_user":
            let usersList = document.getElementById("FreindsList");
            if (!usersList) return;
            usersList.innerHTML = "";
            stateUsers.Users = {};
            for (let user of e.data.message) {
                console.log("here", user.ID);
                
                stateUsers.Users[user.ID] = user;
                if (user?.ID === JSON.parse(localStorage.getItem("rtf_user"))?.ID) continue;
                usersList.append(UserTemplate(user));
            }
            window.dispatchEvent(new CustomEvent("users:updated"));
            break;
        case "shw_message":
            let conversation = document.querySelector("#conversationBody");
            if (!conversation) return;
            let message = e.data.message;
            let urlParams = new URLSearchParams(window.location.search);
            let userId = urlParams.get("userId");
            conversation.append(MessageTemplate(message.SenderID, message.Content, new Date().toISOString(), message.SenderName, message.ReceiverName));
            conversation.scrollTop = conversation.scrollHeight;
            if (message.SenderID !== userId) return;
            let currentUser = JSON.parse(localStorage.getItem("rtf_user"));
            let user = stateUsers.Users[userId];
            if (user) {
                worker.port.postMessage({
                    type: "ws_message_read_in_place",
                    senderID: userId,
                    receiverID: currentUser?.ID,
                });
                worker.port.postMessage({ type: "ws_users_info_for_user", for_all_users: true});
            }
            break;
        case "shw_messages_history":
            renderMessagesHistory(e.data.message);
            break;
        case "shw_typing":
            if (e.data.from === getActiveConversationUserId()) {
                showTypingIndicator();
            }
            break;
    }
}
