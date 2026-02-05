import { initFetchUsers } from "../home/utils/home_fetchUsers.js";
import { showAlert } from "../../utils/alert.js";

const messagesByUser = new Map();
let activeUserId = "";
let activeUserName = "";
let socket = null;
let currentUserId = "";

const listEl = document.querySelector("[data-friends-list]");
const bodyEl = document.querySelector("[data-conversation-body]");
const nameEl = document.querySelector("[data-conversation-name]");
const statusEl = document.querySelector("[data-conversation-status]");
const composerEl = document.querySelector("[data-composer]");
const inputEl = document.querySelector("[data-message-input]");
const sendBtn = document.querySelector("[data-message-send]");

function getStoredUserId() {
  try {
    const raw = localStorage.getItem("rtf_user");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.ID || parsed?.id || "";
  } catch {
    return "";
  }
}

function normalizeMessage(payload) {
  if (!payload || typeof payload !== "object") return null;
  return {
    ID: payload.ID || payload.id || "",
    SenderID: payload.SenderID || payload.senderID || payload.senderId || "",
    ReceiverID: payload.ReceiverID || payload.receiverID || payload.receiverId || "",
    Content: payload.Content || payload.content || "",
    CreatedAt: payload.CreatedAt || payload.createdAt || "",
  };
}

function setComposerEnabled(enabled) {
  if (inputEl) inputEl.disabled = !enabled;
  if (sendBtn) sendBtn.disabled = !enabled;
}

function setHeader(name, statusText) {
  if (nameEl) nameEl.textContent = name || "Select a user";
  if (statusEl) statusEl.textContent = statusText || "Ready when you are";
}

function scrollConversationToBottom() {
  if (!bodyEl) return;
  bodyEl.scrollTop = bodyEl.scrollHeight;
}

function renderEmptyState() {
  if (!bodyEl) return;
  bodyEl.innerHTML = "";
  let empty = document.createElement("div");
  empty.className = "empty";
  empty.textContent = activeUserId ? "No messages yet." : "Pick a user to start chatting.";
  bodyEl.appendChild(empty);
}

function appendMessageToConversation(msg) {
  if (!bodyEl) return;
  const empty = bodyEl.querySelector(".empty");
  if (empty) empty.remove();
  const bubble = document.createElement("div");
  const incoming = msg.SenderID === activeUserId;
  bubble.className = `bubble ${incoming ? "incoming" : "outgoing"}`;
  bubble.textContent = msg.Content;
  bodyEl.appendChild(bubble);
  scrollConversationToBottom();
}

function renderConversation(userId) {
  if (!bodyEl) return;
  bodyEl.innerHTML = "";
  const messages = messagesByUser.get(userId) || [];
  if (!messages.length) {
    renderEmptyState();
    return;
  }
  messages.forEach((msg) => appendMessageToConversation(msg));
}

function updateActiveThread(userId) {
  if (!listEl) return;
  listEl.querySelectorAll("[data-user-id]").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.userId === userId);
  });
}

function updateThreadPreview(userId, content) {
  if (!listEl || !userId) return;
  const thread = listEl.querySelector(`[data-user-id="${userId}"]`);
  if (!thread) return;
  const preview = thread.querySelector(".preview");
  if (preview) preview.textContent = content;
}

function addMessageToThread(msg) {
  if (!msg || !msg.Content) return;
  const senderId = msg.SenderID;
  const receiverId = msg.ReceiverID;
  let threadUserId = "";
  if (currentUserId) {
    threadUserId = senderId === currentUserId ? receiverId : senderId;
  } else if (activeUserId && (senderId === activeUserId || receiverId === activeUserId)) {
    threadUserId = activeUserId;
  } else {
    threadUserId = senderId || receiverId;
  }
  if (!threadUserId) return;

  if (!messagesByUser.has(threadUserId)) messagesByUser.set(threadUserId, []);
  messagesByUser.get(threadUserId).push(msg);
  updateThreadPreview(threadUserId, msg.Content);

  if (activeUserId === threadUserId) {
    appendMessageToConversation(msg);
  }
}

function setActiveUser(userId, userName) {
  if (!userId) return;
  activeUserId = userId;
  activeUserName = userName || "Unknown";
  setHeader(activeUserName, "Online");
  setComposerEnabled(true);
  updateActiveThread(userId);
  renderConversation(userId);
}

function handleIncoming(data) {
  let payload;
  try {
    payload = JSON.parse(data);
  } catch {
    return;
  }

  const msg = normalizeMessage(payload.message || payload);
  if (!msg || !msg.Content) return;
  addMessageToThread(msg);
}

function connectSocket() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${protocol}://${window.location.host}/message`;

  socket = new WebSocket(wsUrl);

  socket.addEventListener("open", () => {
    if (!activeUserId) setHeader("Select a user", "Connected");
  });

  socket.addEventListener("message", (event) => {
    handleIncoming(event.data);
  });

  socket.addEventListener("close", () => {
    setHeader(activeUserName || "Select a user", "Disconnected");
    setComposerEnabled(false);
    showAlert("Message connection closed");
  });

  socket.addEventListener("error", () => {
    showAlert("Message connection error");
  });
}

function sendMessage() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    showAlert("Message connection not ready");
    return;
  }
  if (!activeUserId) {
    showAlert("Select a user first");
    return;
  }

  const content = inputEl?.value?.trim() || "";
  if (!content) return;

  const payload = {
    ReceiverID: activeUserId,
    Content: content,
  };

  socket.send(JSON.stringify(payload));
  inputEl.value = "";
  inputEl.focus();
}

function initThreadsClick() {
  if (!listEl) return;
  listEl.addEventListener("click", (event) => {
    const item = event.target.closest("[data-user-id]");
    if (!item) return;
    setActiveUser(item.dataset.userId, item.dataset.userName);
  });
}

function initComposer() {
  if (!composerEl) return;
  composerEl.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage();
  });
}

function initMessages() {
  currentUserId = getStoredUserId();
  setComposerEnabled(false);
  renderEmptyState();
  initThreadsClick();
  initComposer();
  connectSocket();
  initFetchUsers();
}

initMessages();
