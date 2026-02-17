import { getActiveConversationUserId, removeTypingIndicator, showTypingIndicator } from "../pages/messages/utils/messages_conversation.js";
import { renderMessagesHistory, renderSingleMessage } from "../pages/messages/utils/messages_fetchMessages.js";
import { UserTemplate } from "../pages/messages/utils/messages_templates.js";
import { WebSocketManager } from "./../../packages/websocket.js";
export let socket = new WebSocketManager({
    url: "ws://localhost:3000/ws",
    onMessage: [onMessage],
})

function onMessage(res) {
    res = JSON.parse(res.data);
    
    switch (res.type) {
        case "messages_history":
            renderMessagesHistory(res.data);
            break;
        case "users_info_for_user":
            console.log(res.data);
            
            let freindsList = document.getElementById("FreindsList");
            freindsList.innerHTML = "";
            for (let user of res.data) {
                console.log(user.ID, JSON.parse(localStorage.getItem("rtf_user")).ID);
                
                if (user.ID === JSON.parse(localStorage.getItem("rtf_user")).ID) continue;
                console.log(user.IsOnline);
                
                freindsList.append(UserTemplate(user));
            }
            break;
        case "message":
            removeTypingIndicator();
            renderSingleMessage(res.message);
            socket.send(JSON.stringify({type: "users_info_for_user"}));
            break;
        case "typing":
            if (res.from !== getActiveConversationUserId()) break;
            showTypingIndicator();
            break;
    }
}