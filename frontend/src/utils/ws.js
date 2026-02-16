import { getActiveConversationUserId, removeTypingIndicator, showTypingIndicator } from "../pages/messages/utils/messages_conversation.js";
import { renderMessagesHistory, renderSingleMessage } from "../pages/messages/utils/messages_fetchMessages.js";
import { WebSocketManager } from "./../../packages/websocket.js";
console.log("SCRIPT CHARGÉ");
export let socket = new WebSocketManager({
    url: "ws://localhost:3000/ws",
    onOpen: [(e) => { console.log(e) }],
    onMessage: [onMessage],
    onError: [(e) => { console.log(e) }],
    onClose: [(e) => { console.log(e) }],
})

function onMessage(res) {
    res = JSON.parse(res.data);
    console.log("here");
    
    switch (res.type) {
        case "onlineUsers":
            let onlineUsers = new Map();
            for (let obj of res.data) {
                onlineUsers.set(obj.id, obj);
            }

            let freindsList = document.getElementById("FreindsList");

            console.log(Array.from(freindsList.children));
            Array.from(freindsList.children).forEach(e => {
                const span = e.querySelector("#onOff");
                console.log(e.getAttribute("userid"));
                
                span.classList.toggle("ok", onlineUsers.has(e.getAttribute("userid")));
            });
            break;
        case "messages_history":
            renderMessagesHistory(res.data);
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