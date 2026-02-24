import { getActiveConversationUserId, removeTypingIndicator, showTypingIndicator } from "../pages/messages/utils/messages_conversation.js";
import { renderMessagesHistory, renderSingleMessage } from "../pages/messages/utils/messages_fetchMessages.js";
import { MessageTemplate, UserTemplate } from "../pages/messages/utils/messages_templates.js";
import { WebSocketManager } from "./../../packages/websocket.js";
import { stateUsers } from "../pages/messages/utils/messages_fetchUsers.js";

export let socket = new WebSocketManager({
    url: "ws://localhost:3000/ws",
    onMessage: [onMessage],
});

export let worker = new SharedWorker("./src/worker.js");
worker.port.start();

function onMessage(res) {
    res = JSON.parse(res.data);

    switch (res.type) {
        case "messages_history":
            renderMessagesHistory(res.data);
            break;
        
        case "users_info_for_user":
            worker.port.postMessage({ type: "users_info_for_user", data: res.data });
            break;
        
        case "message":
            removeTypingIndicator();
            worker.port.postMessage(res.message);
            socket.send(JSON.stringify({ type: "users_info_for_user" }));
            break;
        
        case "typing":
            worker.port.postMessage({ type: "typing", from: res.from });
            break;
        
        case "logout_success":
            localStorage.removeItem("rtf_user");
            ClientRouter.navigate("/login");
            socket.send(JSON.stringify({ type: "users_info_for_user", for_all_users: true }));
            break;
        
        case "user_offline":
            worker.port.postMessage({ type: "user_offline", userID: res.userID })
            break;
    }
}

worker.port.onmessage = function (e) {
    if (e.data.type === "user_offline") {
        let el = document.querySelector(`[data-user-id="${e.data.userID}"]`);
        if (el) {
            let dot = el.querySelector('.dot');
            if (dot) dot.classList.remove('ok');
        }
        return
    }
    if (e.data.type === "users_info_for_user") {
        let usersList = document.getElementById("FreindsList");
        usersList.innerHTML = "";
        stateUsers.Users = {};
        for (let user of e.data.data) {
            stateUsers.Users[user.ID] = user;
            if (user.ID === JSON.parse(localStorage.getItem("rtf_user")).ID) continue;
            usersList.append(UserTemplate(user));
        }
        return
    }
    if (e.data.type === "message") {
        let conversation = document.querySelector("#conversationBody");
        conversation.append(MessageTemplate("me", e.data.message, new Date().toISOString()));
        conversation.scrollTop = conversation.scrollHeight;
    }
    if (e.data && e.data.type === "typing") {
        if (e.data.from === getActiveConversationUserId()) {
            showTypingIndicator();
        }
        return;
    }
    renderSingleMessage(e.data);
}