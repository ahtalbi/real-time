import { GlobalEventsManager } from "../../../events/init.js";
import { ClientRouter } from "../../../router.js";
import { showAlert } from "../../../utils/alert.js";
import { throttle } from "../../../utils/throttle.js";
import { formatTime } from "../../home/utils/home_templates.js";
import { stateMessages } from "./messages_fetchMessages.js";
import { initFetchUsers } from "./messages_fetchUsers.js";
import { worker } from "../../../utils/ws.js";

export function UserTemplate(User) {
	let tpl = document.createElement("template");
	tpl.innerHTML = `<li class="row-between" data-user-id="${User.ID}" data-username="${User.Nickname}">
  		<span><span class="dot ${User.IsOnline ? "ok" : ""}"></span>${User.Nickname}</span>
  		<button class="btn sm" id="messageUserBtn-${User.ID}" type="button" data-userid="${User.ID}" data-username="${User.Nickname}">Message
		<span class="nbr"></span>
		</button>
		</li>`;

	let el = tpl.content.firstElementChild;


	let b = el.querySelector('.nbr');
	if (Number(User.NumberOfUnreadMessages) > 0) {
		b.classList.add('nbr-of-unread-messages');
		b.textContent = User.NumberOfUnreadMessages;
	}

	GlobalEventsManager.click.RegisterEvent(`messageUserBtn-${User.ID}`, () => {
		ClientRouter.navigate(`/messages?userId=${User.ID}`, { history: "replace" });
	})

	return el;
}

export function ConversationTemplate(User) {
	let tpl = document.createElement("template");
	tpl.innerHTML = `
	<header class="conversation-header">
            <div class="row">
                <div class="avatar sm" id="conversationAvatar" aria-hidden="true"></div>
                <div class="meta">
                    <span class="name" id="conversationName">${User.Nickname}</span>
                    <span class="status" id="conversationStatus">Ready when you are</span>
                </div>
            </div>
        </header>

        <div class="conversation-body" id="conversationBody">
			<div id="messages-observer"></div>
		</div>
		<button class="scroll-bottom-btn" id="scrollBottomBtn" type="button">↓ Scroll to the bottom</button>

        <form class="composer" id="composerForm">
            <textarea
                class="input"
				name="messageInput"
                id="messageInput"
                type="text"
                placeholder="Ecrire un message..."
            /></textarea>
            <button
                class="btn primary"
                id="sendMessageBtn"
                type="submit"
            >
                Envoyer
            </button>
        </form>
`;

	let el = tpl.content;
	let throttleSendMessage = throttle(sendMessage, 100);

	let input = el.querySelector("#messageInput");
	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			let value = input.value.trim();
			if (!value) return;
			if (throttleSendMessage(value) === "functionne not executed") return;
			input.value = "";
			return;
		}
		worker.port.postMessage({
			type: "ws_typing",
			receiverID: User.ID,
			Status: "typing",
		});
	});

	function sendMessage(message) {
		if (!message) return;
		if (message.length > 600) {
			showAlert("the length of the message is more than 600");
			return
		}

		worker.port.postMessage({
			type: "ws_message",
			message: {
				Content: message,
				ReceiverID: User.ID,
			},
		});
		worker.port.postMessage({type: "ws_users_info_for_user", for_all_users: true});
		stateMessages.StartID++;
		conversation.scrollTop = conversation.scrollHeight;
		initFetchUsers();
	}

	let conversation = el.querySelector("#conversationBody");
	GlobalEventsManager.click.RegisterEvent("scrollBottomBtn", () => {
		conversation.scrollTop = conversation.scrollHeight;
	});

	GlobalEventsManager.submit.RegisterEvent(`composerForm`, (e) => {
		let value = e.messageInput.value.trim();
		if (throttleSendMessage(value) === "functionne not executed") return;
		e.messageInput.value = "";
	})

	return el;
}

export function NoConversationSelected() {
	let tpl = document.createElement("template");
	tpl.innerHTML = `<div class="conversation-empty">
		<div class="empty-icon" aria-hidden="true">💬</div>
		<h2 class="empty-title">Select a user to start chatting</h2>
		<p class="empty-subtitle">Choose someone from the list on the left and send your first message.</p>
	</div>`;
	return tpl.content.firstElementChild;
}

export function MessageTemplate(senderID, content, createdAt, senderName = "", reciverName = "") {
	let user = JSON.parse(localStorage.getItem("rtf_user"));

	let side = user.ID === senderID ? "outgoing" : "incoming";
	let time = formatTime(createdAt);

	let tpl = document.createElement("template");
	tpl.innerHTML = `
		<div class="bubble ${side}">
			<p class="UserName">${senderName}</p>
			<p class="bubble-content"></p>
			<time class="bubble-date"></time>
		</div>`;

	let el = tpl.content.firstElementChild;

	el.querySelector(".bubble-content").textContent = content.trim();

	let dateEl = el.querySelector(".bubble-date");
	dateEl.textContent = time;
	return el;
}
