import { stateUsers } from "./messages_fetchUsers.js";
import { ConversationTemplate, NoConversationSelected} from "./messages_templates.js";

export function initConversations() {
    const urlParams = new URLSearchParams(window.location.search);
    let userId = urlParams.get("userId");
    let container = document.getElementById("card-messages");
    if (userId) {
        let user = stateUsers.Users[userId];
        if (!user) {
            container.appendChild(NoConversationSelected());
            return;
        }
        container.appendChild(ConversationTemplate(user));
    } else {
        container.appendChild(NoConversationSelected());
    }
}