import { stateUsers } from "./messages_fetchUsers.js";
import { ConversationTemplate, NoConversationSelected } from "./messages_templates.js";
import { WebSocketManager } from "../../../../packages/websocket.js";

let converstionState = {
    io: null,
}

export let socket = new WebSocketManager({
    url: "ws://localhost:3000/ws",
    onOpen: [(e) => { console.log(e) }],
    onMessage: [onMessage],
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
        socket.send(`{"type": "messages_history", "receiverID": "${userId}", "StartID": 0} `)
    } else {
        container.appendChild(NoConversationSelected());
    }
}

function onMessage(res) {
    res = JSON.parse(res.data);
    console.log(res);
    
    switch (res.type) {
        case "onlineUsers":
            let onlineUsers = new Map();
            for (let obj of res.data) {
                onlineUsers.set(obj.id, obj);
            }
            let freindsList = document.getElementById("FreindsList");

            Array.from(freindsList.children).forEach(e => {
                const span = e.querySelector("#onOff");
                span.classList.toggle("ok", onlineUsers.has(e.getAttribute("userid")));
            });
            break;
        case "messages_history":
            console.log(res);
            break;
    }
}
