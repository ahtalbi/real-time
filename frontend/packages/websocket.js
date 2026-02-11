class WebSocketManager {
    #ws = null;
    #url;
    #onOpen = [];
    #onMessage = [];
    #onClose = [];
    #onError = [];
    #reconnectAutomatically = true;
    #maxReconnectAttempts = 5;
    #manualClose = false;
    #baseDelayMs = null;
    #maxDelayMs = 2000;
    #reconnectCount = 0;

    constructor({ url, reconnectAutomatically = true, maxReconnectAttempts = 5, reconnectTimer, onOpen, onMessage, onClose, onError, onWebSocketUnsupported } = {}) {
        if (typeof WebSocket === "undefined") {
            if (typeof onWebSocketUnsupported === "function") {
                onWebSocketUnsupported();
            }
            throw new Error("WebSocket API is not available in your browser try to change or upgrade browser .");
        }

        if (url) this.#url = url;
        if (typeof reconnectAutomatically === "boolean") this.#reconnectAutomatically = reconnectAutomatically;
        if (maxReconnectAttempts && typeof maxReconnectAttempts === "number") this.#maxReconnectAttempts = maxReconnectAttempts;
        if (reconnectTimer && typeof reconnectTimer === "number") this.#baseDelayMs = reconnectTimer;
        if (Array.isArray(onOpen)) this.#onOpen = onOpen;
        if (Array.isArray(onMessage)) this.#onMessage = onMessage;
        if (Array.isArray(onClose)) this.#onClose = onClose;
        if (Array.isArray(onError)) this.#onError = onError;
    }

    onOpen(onOpen) { if (typeof onOpen === "function") this.#onOpen.push(onOpen); return this; }
    onClose(onClose) { if (typeof onClose === "function") this.#onClose.push(onClose); return this; }
    onMessage(onMessage) { if (typeof onMessage === "function") this.#onMessage.push(onMessage); return this; }
    onError(onError) { if (typeof onError === "function") this.#onError.push(onError); return this; }

    connect(url) {
        url = url || this.#url;
        if (!url || typeof url !== "string") throw new Error("Can't connect to this url the format should be ws://yourdomain/endpoint and be woking");
        if (this.#ws) this.#ws = null;
        this.#ws = new WebSocket(url);
        this.#setupEventHandlers();
    }

    #scheduleReconnect() {
        if (this.#reconnectCount >= this.#maxReconnectAttempts) return;
        if (this.#baseDelayMs) return;

        const exp = Math.min(this.#baseDelayMs * 2 ** this.#reconnectCount, this.#maxDelayMs);
        const jitter = Math.floor(Math.random() * 300);
        const delay = exp + jitter;

        this.#reconnectCount += 1;
        this.#baseDelayMs = setTimeout(() => {
            this.#baseDelayMs = null;
            this.connect(this.#url);
        }, delay);
    }

    #setupEventHandlers() {
        this.#ws.onopen = (e) => { this.#onOpen.forEach(handler => handler(e)); };
        this.#ws.onmessage = (e) => { this.#onMessage.forEach(handler => handler(e)); };
        this.#ws.onclose = (e) => {
            this.#onClose.forEach(handler => handler(e));
            if (this.#reconnectAutomatically && !this.#manualClose) {
                this.#scheduleReconnect();
            }
        };
        this.#ws.onerror = (e) => { this.#onError.forEach(handler => handler(e)); };
    }

    close() {
        this.#manualClose = true;
        if (this.#maxDelayMs) {
            clearTimeout(this.#maxDelayMs);
            this.#maxDelayMs = null;
        }
        this.#ws?.close();
    }

    send(data) {
        this.#ws?.send(data);
    }

    removeeListeners(cleanArrays = false) {
        if (cleanArrays) {
            this.#onOpen = [];
            this.#onMessage = [];
            this.#onClose = [];
            this.#onError = [];
        }
        if (this.#ws) {
            this.#ws.onopen = null;
            this.#ws.onclose = null;
            this.#ws.onmessage = null;
            this.#ws.onerror = null;
        }
    }
}
