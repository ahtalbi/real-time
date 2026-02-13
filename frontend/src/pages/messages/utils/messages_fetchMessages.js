import { socket } from "./messages_conversation.js";
import { MessageTemplate } from "./messages_templates.js";

export let stateMessages = {
	receiverID: null,
	StartID: 0,
	finish: false,
	loading: false,
	io: null,
	topObserver: null,
};

export function initFetchMessages(receiverID) {
	stateMessages.receiverID = receiverID;
	stateMessages.StartID = 0;
	stateMessages.finish = false;
	stateMessages.loading = false;

	let body = document.getElementById("conversationBody");
	let topObserver = document.getElementById("messages-observer");
	stateMessages.topObserver = topObserver;

	if (stateMessages.io) stateMessages.io.disconnect();
		stateMessages.io = new IntersectionObserver(([entry]) => {
		if (entry.isIntersecting) {
			fetchMessages();
		}
	}, { root: body });
	stateMessages.io.observe(topObserver);
	body.addEventListener("scroll", () => {
		toggleScrollBottomButton(!isNearBottom(body));
	});
	toggleScrollBottomButton(!isNearBottom(body));

	fetchMessages();
}

function fetchMessages() {
	if (stateMessages.finish || stateMessages.loading) return;
	stateMessages.loading = true;
	if (stateMessages.io && stateMessages.topObserver) {
		stateMessages.io.unobserve(stateMessages.topObserver);
	}
	socket.send(JSON.stringify({
		type: "messages_history",
		receiverID: stateMessages.receiverID,
		StartID: stateMessages.StartID,
	}));
}

export function renderMessagesHistory(messages) {
	let body = document.getElementById("conversationBody");
	let observer = document.getElementById("messages-observer");
	let isFirstBatch = stateMessages.StartID === 0;

	let beforeHeight = body.scrollHeight;

	if (!Array.isArray(messages) || messages.length === 0) {
		stateMessages.finish = true;
		stateMessages.loading = false;
		return;
	}

	messages.sort((a, b) => {
		const ta = Date.parse(a.CreatedAt || "") || 0;
		const tb = Date.parse(b.CreatedAt || "") || 0;
		return ta - tb;
	});

	for (let message of messages) {
		let side = message.SenderID === stateMessages.receiverID ? "incoming" : "outgoing";
		let bubble = MessageTemplate(side, message.Content);
		if (isFirstBatch) {
			body.appendChild(bubble);
		} else {
			let anchor = body.querySelector(".bubble:last-of-type");
			body.insertBefore(bubble, anchor || (observer?.nextSibling || null));
		}
	}

	stateMessages.StartID += messages.length;
	stateMessages.loading = false;
	if (!stateMessages.finish && stateMessages.io && stateMessages.topObserver) {
		stateMessages.io.observe(stateMessages.topObserver);
	}
	if (isFirstBatch) {
		body.scrollTop = body.scrollHeight;
	} else {
		let afterHeight = body.scrollHeight;
		body.scrollTop += (afterHeight - beforeHeight);
	}
	toggleScrollBottomButton(!isNearBottom(body));
}

export function renderSingleMessage(message) {
	let body = document.getElementById("conversationBody");
	if (!body || !message) return;

	let side = message.SenderID === stateMessages.receiverID ? "incoming" : "outgoing";
	let bubble = MessageTemplate(side, message.Content || "");
	body.appendChild(bubble);
	toggleScrollBottomButton(!isNearBottom(body));
}

function isNearBottom(body) {
	let threshold = 8;
	return body.scrollHeight - body.scrollTop - body.clientHeight <= threshold;
}

function toggleScrollBottomButton(show) {
	let btn = document.getElementById("scrollBottomBtn");
	btn.style.display = show ? "flex" : "none";
}
