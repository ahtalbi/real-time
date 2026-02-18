import { getActiveConversationUserId, removeTypingIndicator, showTypingIndicator } from "../pages/messages/utils/messages_conversation.js";
import { renderMessagesHistory, renderSingleMessage } from "../pages/messages/utils/messages_fetchMessages.js";
import { UserTemplate } from "../pages/messages/utils/messages_templates.js";
import { WebSocketManager } from "./../../packages/websocket.js";
import { stateUsers } from "../pages/messages/utils/messages_fetchUsers.js";
export let socket = new WebSocketManager({
    url: "ws://localhost:3000/ws",
    onMessage: [onMessage],
})


let worker = new SharedWorker("./src/worker.js");
worker.port.start()

function onMessage(res) {
    res = JSON.parse(res.data);
    
    switch (res.type) {
        case "messages_history":
            renderMessagesHistory(res.data);
            break;
        case "users_info_for_user":
            let usersList = document.getElementById("FreindsList");
            usersList.innerHTML = "";
            stateUsers.Users = {};
            for (let user of res.data) {
                stateUsers.Users[user.ID] = user;
                if (user.ID === JSON.parse(localStorage.getItem("rtf_user")).ID) continue;
                usersList.append(UserTemplate(user));
            }
            break;

        case "message":
            removeTypingIndicator();
            // renderSingleMessage(res.message);
            // send to workers
            worker.port.postMessage(res.message);

            socket.send(JSON.stringify({type: "users_info_for_user"}));
            break;
        case "typing":
            if (res.from !== getActiveConversationUserId()) break;
            worker.port.postMessage('typing');
            // showTypingIndicator();
            break;
        case "logout_success":
            localStorage.removeItem("rtf_user");
            ClientRouter.navigate("/login");
            break;
        case "user_offline":
            const el = document.querySelector(`[data-user-id="${res.userID}"]`);
            if (el) {
              const dot = el.querySelector('.dot');
              if (dot) dot.classList.remove('ok')
            }
            break;
        
              }
}


worker.port.onmessage = function(e) {

    if (e.data == 'typing') {
        showTypingIndicator();
        return
    }
        
    renderSingleMessage(e.data);
}