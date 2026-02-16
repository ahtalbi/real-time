import { getActiveConversationUserId, removeTypingIndicator, showTypingIndicator } from "../pages/messages/utils/messages_conversation.js";
import { renderMessagesHistory, renderSingleMessage } from "../pages/messages/utils/messages_fetchMessages.js";
import { WebSocketManager } from "./../../packages/websocket.js";
export let socket = new WebSocketManager({
    url: "ws://localhost:3000/ws",
    onMessage: [onMessage],
})

function onMessage(res) {
    res = JSON.parse(res.data);
    
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
            renderMessagesHistory(res.data);
            break;
        case "users_info_for_user":
            break;
        case "message":
            removeTypingIndicator();
            
            renderSingleMessage(res.message);
            break;
        case "typing":
            if (res.from !== getActiveConversationUserId()) break;
            showTypingIndicator();
            break;

    }
}