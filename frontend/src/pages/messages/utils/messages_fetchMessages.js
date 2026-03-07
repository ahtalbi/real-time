import { throttle } from "../../../utils/throttle.js";
import { worker } from "../../../utils/ws.js";
import { MessageTemplate } from "./messages_templates.js";

export let stateMessages = {
	receiverID: null,
	StartID: 0,
	finish: false,
	loading: false,
	io: null, // this is the intercept observer
	topObserver: null, // this is the element his self
};

// this function to initlize the procces of fetching the messages and to start the observer
export function initFetchMessages(receiverID) {
	stateMessages.receiverID = receiverID;
	stateMessages.StartID = 0;
	stateMessages.finish = false;
	stateMessages.loading = false;

	let body = document.getElementById("conversationBody");
	let topObserver = document.getElementById("messages-observer");
	stateMessages.topObserver = topObserver;

	let throttledFetchMessages = throttle(fetchMessages, 500);

	if (stateMessages.io) stateMessages.io.disconnect();
	stateMessages.io = new IntersectionObserver(([entry]) => {
		if (entry.isIntersecting) {
			throttledFetchMessages();
		}
	}, { root: body });
	stateMessages.io.observe(topObserver);

	body.addEventListener("scroll", () => {
		toggleScrollBottomButton(!isNearBottom(body));
	});

	toggleScrollBottomButton(!isNearBottom(body));
}

// this function to fetch the messages using the tab_uuid to just take the messages for this tab
function fetchMessages() {
	if (stateMessages.finish || stateMessages.loading) return;
	stateMessages.loading = true;
	let tabUuid = sessionStorage.getItem("tab_uuid");
	
	worker.port.postMessage({
		type: "ws_messages_history",
		receiverID: stateMessages.receiverID,
		StartID: stateMessages.StartID,
		tab_uuid: tabUuid,
	});
}

// this function to render Messages History on the elements based on teh batch
export function renderMessagesHistory(messages) {
	let body = document.getElementById("conversationBody");
	let isFirstBatch = stateMessages.StartID === 0;

	if (!Array.isArray(messages) || messages.length === 0) {
		stateMessages.finish = true;
		stateMessages.loading = false;
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
	if (isFirstBatch) {
		body.scrollTop += body.scrollHeight;
	} else {
		body.scrollTop = body.scrollTop + 10;
	}
	toggleScrollBottomButton(!isNearBottom(body));
}

// this function to check if we are at the bottom of the conversation or no
function isNearBottom(body) { return body.scrollHeight - body.scrollTop - body.clientHeight <= 8; }

// this function is to toggle the button scroll to bottom
function toggleScrollBottomButton(show) {
	let btn = document.getElementById("scrollBottomBtn");
	btn.style.display = show ? "flex" : "none";
}
