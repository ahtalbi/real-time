import { GlobalEventsManager } from "../../../events/init.js";
import { ClientRouter } from "../../../router.js";
import { socket } from "./messages_conversation.js";

export function UserTemplate(User) {
	const tpl = document.createElement("template");
	tpl.innerHTML = `<li class="row-between" userid="${User.ID}" username="${User.Nickname}">
    	<span><span id="onOff" class="dot"></span>${User.Nickname}</span>
		<button class="btn sm" id="messageUserBtn-${User.ID}" type="button" userid="${User.ID}" username="${User.Nickname}">Message</button>
	</li>`;

	let el = tpl.content.firstElementChild;

	GlobalEventsManager.click.RegisterEvent(`messageUserBtn-${User.ID}`, () => {
		ClientRouter.navigate(`/messages?userId=${User.ID}`, { history: "replace" });
	})

	return el;
}

export function ConversationTemplate(User) {
	const tpl = document.createElement("template");
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

        <form class="composer" id="composerForm">
            <input
                class="input"
				name="messageInput"
                id="messageInput"
                type="text"
                placeholder="Ecrire un message..."
            />
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
		console.log(e.target.value);
	});

	let conversation = el.querySelector("#conversationBody");
	GlobalEventsManager.submit.RegisterEvent(`composerForm`, (e) => {
		let message = e.messageInput.value;
		conversation.append(MessageTemplate("me", message));
		socket.send(JSON.stringify({
			"type": "message",
			"message": {
				"Content": message,
				"ReceiverID": User.ID,
			}
		}))
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

export function MessageTemplate(ReciverOrSender, content) {
	const side = String(ReciverOrSender || "").toLowerCase();
	const outgoing = side === "sender" || side === "outgoing" || side === "me" || side === "self";

	const tpl = document.createElement("template");
	tpl.innerHTML = `<div class="bubble ${outgoing ? "outgoing" : "incoming"}"></div>`;

	const el = tpl.content.firstElementChild;
	el.textContent = String(content || "");
	return el;
}
