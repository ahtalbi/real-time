import { stateUsers } from "./messages_fetchUsers.js";
import { ConversationTemplate, NoConversationSelected } from "./messages_templates.js";
import { initFetchMessages } from "./messages_fetchMessages.js";
import { socket } from "../../../utils/ws.js";

let typingIndicatorTimer = null;

export async function initConversations() {
    const urlParams = new URLSearchParams(window.location.search);
    let userId = urlParams.get("userId");
    let container = document.getElementById("card-messages");
    socket.send(JSON.stringify({ type: "online_users" }));
    if (userId) {
        let user = stateUsers.Users[userId];
        console.log(stateUsers.Users)
        if (!user) {
            container.appendChild(NoConversationSelected());
            return;
        }
        let currentUser = JSON.parse(localStorage.getItem("rtf_user"));
        socket.send(JSON.stringify({ type: "message_read_in_place", senderID: userId, receiverID: currentUser.ID }));
        socket.send(JSON.stringify({ type: "users_info_for_user" }));
        container.appendChild(ConversationTemplate(user));
        initFetchMessages(userId, socket);
    } else {
        container.appendChild(NoConversationSelected());
    }
}

export function getActiveConversationUserId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("userId");
}

export function showTypingIndicator() {
    const body = document.getElementById("conversationBody");
    if (!body) return;

    removeTypingIndicator();

    const indicator = document.createElement("div");
    indicator.id = "typingIndicator";
    indicator.className = "bubble incoming typing-indicator";
    indicator.textContent = "Typing...";
    body.appendChild(indicator);
    body.scrollTop = body.scrollHeight;

    typingIndicatorTimer = setTimeout(() => {
        removeTypingIndicator();
    }, 1200);
}

export function removeTypingIndicator() {
    if (typingIndicatorTimer) {
        clearTimeout(typingIndicatorTimer);
        typingIndicatorTimer = null;
    }

    const indicator = document.getElementById("typingIndicator");
    if (indicator) indicator.remove();
}
