import { GlobalEventsManager } from "../../../events/init.js";
import { ClientRouter } from "../../../router.js";

export function UserTemplate(User) {
	const tpl = document.createElement("template");
	tpl.innerHTML = `<li class="row-between" userid="${User.ID}" username="${User.Nickname}">
    	<span>${User.Nickname}</span>
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

	GlobalEventsManager.submit.RegisterEvent(`sendMessageBtn`, () => {
		const input = document.getElementById("messageInput");
		const msg = input.value;

		const body = document.getElementById("conversationBody");
		if (body) {
			const bubble = document.createElement("div");
			bubble.className = "bubble outgoing";
			bubble.textContent = msg;
			body.appendChild(bubble);
			body.scrollTop = body.scrollHeight;
		}

		input.value = "";
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

export function MessageTemplate(ReciverOrSender) {
	const tpl = document.createElement("template");

	let type = "incoming";
	let content = "";

	if (typeof ReciverOrSender === "string") {
		type = ReciverOrSender.toLowerCase() === "sender" ? "outgoing" : "incoming";
	} else if (ReciverOrSender && typeof ReciverOrSender === "object") {
		const side = (ReciverOrSender.side || ReciverOrSender.type || "").toLowerCase();
		type = side === "sender" || side === "outgoing" ? "outgoing" : "incoming";
		content = ReciverOrSender.content || ReciverOrSender.message || "";
	}

	tpl.innerHTML = `<div class="bubble ${type}"></div>`;
	const el = tpl.content.firstElementChild;
	el.textContent = content;

	return el;
}
