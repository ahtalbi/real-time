import { stateUsers } from "./messages_fetchUsers.js";
import { ConversationTemplate, NoConversationSelected } from "./messages_templates.js";
import { WebSocketManager } from "../../../../packages/websocket.js";

let converstionState = {
    io: null,
}

export let socket = new WebSocketManager({
    url: "ws://localhost:3000/ws",
    onOpen: [(e) => { console.log(e) }],
    onMessage: [(e) => { console.log(e) }],
    onError: [(e) => { console.log(e) }],
    onClose: [(e) => { console.log(e) }],
})

export async function initConversations() {
    let ok = await socket.connect();
    if (!ok) {
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    let userId = urlParams.get("userId");
    let container = document.getElementById("card-messages");
    socket.send(JSON.stringify({ type: "online_users" }));
    if (userId) {
        let user = stateUsers.Users[userId];
        if (!user) {
            container.appendChild(NoConversationSelected());
            return;
        }
        container.appendChild(ConversationTemplate(user));
        converstionState.io
    } else {
        container.appendChild(NoConversationSelected());
    }
}
