import { socket } from "../../../utils/ws.js";
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
	let isFirstBatch = stateMessages.StartID === 0;
	let beforeHeight = body.scrollHeight;

	if (!Array.isArray(messages) || messages.length === 0) {
		stateMessages.finish = true;
		stateMessages.loading = false;
		return;
	}

	let orderedMessages = [...messages].reverse();
	let fragment = document.createDocumentFragment();

	for (let message of orderedMessages) {
		let side = message.SenderID === stateMessages.receiverID ? "incoming" : "outgoing";
		let bubble = MessageTemplate(side, message.Content || "", message.CreatedAt);
		fragment.appendChild(bubble);
	}

	if (isFirstBatch) {
		body.appendChild(fragment);
	} else {
		let firstBubble = body.querySelector(".bubble");
		if (firstBubble) {
			body.insertBefore(fragment, firstBubble);
		} else {
			body.appendChild(fragment);
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
	const urlParams = new URLSearchParams(window.location.search);
    let userId = urlParams.get("userId");
	if (message.SenderID !== userId) return;
	let body = document.getElementById("conversationBody");
	let currentUser = JSON.parse(localStorage.getItem("rtf_user"));
	socket.send(JSON.stringify({type: "message_read_in_place", senderID: message.SenderID, receiverID: currentUser.ID}));
	let side = message.SenderID === stateMessages.receiverID ? "incoming" : "outgoing";
	let bubble = MessageTemplate(side, message.Content, message.CreatedAt);
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
