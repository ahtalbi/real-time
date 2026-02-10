import { GlobalEventsManager } from "../../../events/init.js";

export function UserTemplate(User) {
	const tpl = document.createElement("template");
	tpl.innerHTML = `<li class="row-between" userid="${User.ID}" username="${User.Nickname}">
    	<span>${User.Nickname}</span>
		<button class="btn sm" id="messageUserBtn-${User.ID}" type="button" userid="${User.ID}" username="${User.Nickname}">Message</button>
	</li>`;

	let el = tpl.content.firstElementChild;

	GlobalEventsManager.click.RegisterEvent(`messageUserBtn-${User.ID}`, () => {
		const container = document.getElementById("card-messages");
		container.innerHTML = "";
		container.appendChild(ConversationTemplate(User));
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

        <div class="conversation-body" id="conversationBody"></div>

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