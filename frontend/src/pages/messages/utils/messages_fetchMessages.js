import { worker } from "../../../utils/ws.js";
import { MessageTemplate } from "./messages_templates.js";

export let stateMessages = {
	receiverID: null,
	StartID: 0,
	finish: false,
	io: null,
	topObserver: null,
};

export function initFetchMessages(receiverID) {
	stateMessages.receiverID = receiverID;
	stateMessages.StartID = 0;
	stateMessages.finish = false;
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
}

function fetchMessages() {
	if (stateMessages.finish) return;
	if (stateMessages.io && stateMessages.topObserver) {
		stateMessages.io.unobserve(stateMessages.topObserver);
	}
	let tabUuid = sessionStorage.getItem("tab_uuid");
	
	worker.port.postMessage({
		type: "ws_messages_history",
		receiverID: stateMessages.receiverID,
		StartID: stateMessages.StartID,
		tab_uuid: tabUuid,
	});
}

export function renderMessagesHistory(messages) {
	let body = document.getElementById("conversationBody");
	let isFirstBatch = stateMessages.StartID === 0;

	if (!Array.isArray(messages) || messages.length === 0) {
		stateMessages.finish = true;
		return;
	}

	let orderedMessages = [...messages].reverse();
	let fragment = document.createDocumentFragment();

	for (let message of orderedMessages) {
		let bubble = MessageTemplate(message.SenderID, message.Content, message.CreatedAt, message.SenderName, message.ReceiverName);
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
		body.scrollTop += body.scrollHeight;
	} else {
		body.scrollTop = body.scrollTop + 10;
	}
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
