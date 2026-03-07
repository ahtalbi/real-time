import { ConversationTemplate, NoConversationSelected } from "./messages_templates.js";
import { initFetchMessages } from "./messages_fetchMessages.js";
import { stateUsers, worker } from "../../../utils/ws.js";

let typingIndicatorTimer = null;

// this function to init the conversation to see if we are selected a conversation or no 
export async function initConversations() {
    let userId = getActiveConversationUserId();
    let container = document.getElementById("card-messages");
    
    container.innerHTML = "";
    if (userId) {
        let user = stateUsers.Users[userId];
        if (!user) {
            container.appendChild(NoConversationSelected());
            return;
        }
        
        let currentUser = JSON.parse(localStorage.getItem("rtf_user"));
        worker.port.postMessage({
            type: "ws_message_read_in_place",
            senderID: userId,
            receiverID: currentUser.ID,
        });
        worker.port.postMessage({ type: "ws_users_info_for_user", for_all_users: true });
        container.appendChild(ConversationTemplate(user));
        initFetchMessages(userId);
    } else {
        container.appendChild(NoConversationSelected());
    }
}

// this function to get the user id on the url parametre
export function getActiveConversationUserId() {
    let urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("userId");
}

// this funciton is to show that the auther person is typing
export function showTypingIndicator() {
    let body = document.getElementById("conversationBody");
    if (!body) return;

    removeTypingIndicator();

    let indicator = document.createElement("div");
    indicator.id = "typingIndicator";
    indicator.className = "bubble incoming typing-indicator";
    indicator.textContent = "Typing...";
    body.appendChild(indicator);
    body.scrollTop = body.scrollHeight;

    typingIndicatorTimer = setTimeout(() => {
        removeTypingIndicator();
    }, 1200);
}


// this funciton is to remove the typing after some time
export function removeTypingIndicator() {
    if (typingIndicatorTimer) {
        clearTimeout(typingIndicatorTimer);
        typingIndicatorTimer = null;
    }

    let indicator = document.getElementById("typingIndicator");
    if (indicator) indicator.remove();
}
