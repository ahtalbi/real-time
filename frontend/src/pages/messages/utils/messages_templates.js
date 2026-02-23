import { GlobalEventsManager } from "../../../events/init.js";
import { ClientRouter } from "../../../router.js";
import { showAlert } from "../../../utils/alert.js";
import { socket, worker } from "../../../utils/ws.js";
import { escapeHTML, timeAgo } from "../../home/utils/home_templates.js";
import { initFetchUsers } from "./messages_fetchUsers.js";

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
            />
            </textarea>
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

	let input = el.querySelector("#messageInput");
	input.addEventListener("input", (e) => {
		let value = String(e.target.value || "");
		if (!value.trim()) return;
		socket.send(JSON.stringify({
			type: "typing",
			receiverID: User.ID,
			Status: "typing",
		}));
	});

	let conversation = el.querySelector("#conversationBody");
	GlobalEventsManager.click.RegisterEvent("scrollBottomBtn", () => {
		conversation.scrollTop = conversation.scrollHeight;
	});

	GlobalEventsManager.submit.RegisterEvent(`composerForm`, (e) => {
		let message = e.messageInput.value;
		if (!String(message || "").trim()) return;

		if (message.length > 600) {
			showAlert("the length of the message is more than 600");
			return
		}

		worker.port.postMessage({ type: "message", message });
		socket.send(JSON.stringify({
			"type": "message",
			"message": {
				"Content": message,
				"ReceiverID": User.ID,
			}
		}))
		e.messageInput.value = "";
		initFetchUsers()

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

export function MessageTemplate(ReciverOrSender, content, createdAt) {
	let side = String(ReciverOrSender || "").toLowerCase();
	let outgoing = side === "sender" || side === "outgoing" || side === "me" || side === "self";


	let time = timeAgo(createdAt);

	let tpl = document.createElement("template");
	tpl.innerHTML = `
		<div class="bubble ${outgoing ? "outgoing" : "incoming"}">
			<p class="bubble-content"></p>
			<time class="bubble-date"></time>
		</div>`;

	let el = tpl.content.firstElementChild;

	console.log(escapeHTML(content))

	el.querySelector(".bubble-content").textContent = escapeHTML(content);
	let dateEl = el.querySelector(".bubble-date");
	dateEl.textContent = time;
	return el;
}