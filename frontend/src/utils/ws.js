import { getActiveConversationUserId, removeTypingIndicator, showTypingIndicator } from "../pages/messages/utils/messages_conversation.js";
import { renderMessagesHistory, stateMessages } from "../pages/messages/utils/messages_fetchMessages.js";
import { MessageTemplate, UserTemplate } from "../pages/messages/utils/messages_templates.js";
import { WebSocketManager } from "./../../packages/websocket.js";
import { stateUsers } from "../pages/messages/utils/messages_fetchUsers.js";
import { ClientRouter } from "../router.js";

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
            worker.port.postMessage({ type: "message", message: res.message });
            socket.send(JSON.stringify({ type: "users_info_for_user" }));
            let urlParams = new URLSearchParams(window.location.search);
            let userId = urlParams.get("userId");
            let currentUser = JSON.parse(localStorage.getItem("rtf_user"));
            if (userId) {
                console.log(userId, currentUser.ID);
                
                socket.send(JSON.stringify({ type: "message_read_in_place", senderID: userId, receiverID: currentUser.ID }));
            }
            stateMessages.StartID++
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
    switch (e.data.type) {
        case "loggedIn":
            ClientRouter.navigate("/", { history: "replace" });
        case "user_offline":
            let el = document.querySelector(`[data-user-id="${e.data.userID}"]`);
            if (el) {
                let dot = el.querySelector('.dot');
                if (dot) dot.classList.remove('ok');
            }
            break;
        case "users_info_for_user":
            let usersList = document.getElementById("FreindsList");
            if (!usersList) return;
            usersList.innerHTML = "";
            stateUsers.Users = {};
            for (let user of e.data.data) {
                stateUsers.Users[user.ID] = user;
                if (user.ID === JSON.parse(localStorage.getItem("rtf_user")).ID) continue;
                usersList.append(UserTemplate(user));
            }
            break;
        case "message":
            let conversation = document.querySelector("#conversationBody");
            let message = e.data.message;
            conversation.append(MessageTemplate(message.SenderID, message.Content, new Date().toISOString(), message.SenderName, message.ReceiverName));
            conversation.scrollTop = conversation.scrollHeight;
            break;
        case "typing":
            if (e.data.from === getActiveConversationUserId()) {
                showTypingIndicator();
            }
            break;
    }
}