export class WebSocketManager {
    #ws = null;
    #url;
    #state = "disconnected";

    #onOpen = [];
    #onMessage = [];
    #onClose = [];
    #onError = [];

    #reconnectAutomatically = true;
    #maxReconnectAttempts = 5;
    #reconnectCount = 0;

    #baseDelayMs = 500;
    #maxDelayMs = 10000;
    #reconnectTimeoutId = null;

    #retryProcessTimePeriod = 50;
    #processTimer = null;
    #messageQueue = [];

    #manualClose = false;

    constructor({
        url,
        reconnectAutomatically = true,
        maxReconnectAttempts = 5,
        reconnectTimeoutId,
        baseDelayMs,
        maxDelayMs,
        retryProcessTimePeriod,
        onOpen,
        onMessage,
        onClose,
        onError,
        onWebSocketUnsupported,
    } = {}) {
        if (typeof WebSocket === "undefined") {
            if (typeof onWebSocketUnsupported === "function") {
                onWebSocketUnsupported();
            }
            throw new Error("WebSocket API is not available in this environment.");
        }

        if (typeof url === "string") this.#url = url;
        if (typeof reconnectAutomatically === "boolean") this.#reconnectAutomatically = reconnectAutomatically;
        if (typeof maxReconnectAttempts === "number" && maxReconnectAttempts >= 0) this.#maxReconnectAttempts = maxReconnectAttempts;
        if (typeof reconnectTimeoutId === "number" && reconnectTimeoutId > 0) this.#baseDelayMs = reconnectTimeoutId;
        if (typeof baseDelayMs === "number" && baseDelayMs > 0) this.#baseDelayMs = baseDelayMs;
        if (typeof maxDelayMs === "number" && maxDelayMs >= this.#baseDelayMs) this.#maxDelayMs = maxDelayMs;
        if (typeof retryProcessTimePeriod === "number" && retryProcessTimePeriod > 0) this.#retryProcessTimePeriod = retryProcessTimePeriod;

        if (Array.isArray(onOpen)) this.#onOpen = onOpen;
        if (Array.isArray(onMessage)) this.#onMessage = onMessage;
        if (Array.isArray(onClose)) this.#onClose = onClose;
        if (Array.isArray(onError)) this.#onError = onError;
    }

    onOpen(handler) { if (typeof handler === "function") this.#onOpen.push(handler); return this; }
    onClose(handler) { if (typeof handler === "function") this.#onClose.push(handler); return this; }
    onMessage(handler) { if (typeof handler === "function") this.#onMessage.push(handler); return this; }
    onError(handler) { if (typeof handler === "function") this.#onError.push(handler); return this; }

    offOpen(handler) { this.#onOpen = this.#onOpen.filter((h) => h !== handler); return this; }
    offClose(handler) { this.#onClose = this.#onClose.filter((h) => h !== handler); return this; }
    offMessage(handler) { this.#onMessage = this.#onMessage.filter((h) => h !== handler); return this; }
    offError(handler) { this.#onError = this.#onError.filter((h) => h !== handler); return this; }

    getState() { return this.#state; }

    connect(url) {
        const nextUrl = url || this.#url;
        if (!this.#isValidWebSocketUrl(nextUrl)) {
            throw new Error("Invalid WebSocket URL. Use ws:// or wss://.");
        }

        this.#url = nextUrl;
        this.#manualClose = false;
        this.#state = "connecting";

        if (this.#reconnectTimeoutId) {
            clearTimeout(this.#reconnectTimeoutId);
            this.#reconnectTimeoutId = null;
        }

        if (this.#ws && (this.#ws.readyState === WebSocket.OPEN || this.#ws.readyState === WebSocket.CONNECTING)) {
            this.#ws.onopen = null;
            this.#ws.onmessage = null;
            this.#ws.onclose = null;
            this.#ws.onerror = null;
            this.#ws.close();
        }

        this.#ws = new WebSocket(this.#url);
        this.#setupEventHandlers();

        return new Promise((resolve) => {
            const onOpen = () => {
                this.#ws.removeEventListener("error", onError);
                resolve(true);
            };
            const onError = (e) => {
                this.#ws.removeEventListener("open", onOpen);
                resolve(false);
            };

            this.#ws.addEventListener("open", onOpen, { once: true });
            this.#ws.addEventListener("error", onError, { once: true });
        });
    }

    close(code = 1000, reason = "Manual close") {
        this.#manualClose = true;
        this.#state = "disconnected";

        if (this.#reconnectTimeoutId) {
            clearTimeout(this.#reconnectTimeoutId);
            this.#reconnectTimeoutId = null;
        }

        if (this.#processTimer) {
            clearTimeout(this.#processTimer);
            this.#processTimer = null;
        }

        if (this.#ws && (this.#ws.readyState === WebSocket.OPEN || this.#ws.readyState === WebSocket.CONNECTING)) {
            this.#ws.close(code, reason);
        }
    }

    send(data) {
        const startProcessing = this.#messageQueue.length === 0;
        this.#messageQueue.push(data);
        
        if (!this.#ws && !this.#manualClose) {
            this.connect(this.#url);
        }

        if (startProcessing) {
            this.#processQueue();
        }
    }

    removeListeners(cleanArrays = false) {
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

    #setupEventHandlers() {
        if (!this.#ws) return;

        this.#ws.onopen = (e) => {
            this.#reconnectCount = 0;
            this.#state = "connected";
            this.#emit(this.#onOpen, e);
            this.#processQueue();
        };

        this.#ws.onmessage = (e) => {
            this.#emit(this.#onMessage, e);
        };

        this.#ws.onclose = (e) => {
            this.#emit(this.#onClose, e);
            this.#state = "closed";
            this.#ws = null;

            if (this.#shouldReconnect(e)) {
                this.#scheduleReconnect();
            }
        };

        this.#ws.onerror = (e) => {
            this.#emit(this.#onError, e);
        };
    }

    #processQueue() {
        if (this.#messageQueue.length === 0) return;

        if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) {
            if (this.#processTimer) return;
            this.#processTimer = setTimeout(() => {
                clearTimeout(this.#processTimer);
                this.#processTimer = null;
                this.#processQueue();
            }, this.#retryProcessTimePeriod);
            return;
        }

        while (this.#messageQueue.length > 0 && this.#ws && this.#ws.readyState === WebSocket.OPEN) {
            const data = this.#messageQueue[0];
            this.#ws.send(data);
            this.#messageQueue.shift();
        }

        if (this.#messageQueue.length > 0) {
            this.#processQueue();
        }
    }

    #scheduleReconnect() {
        if (!this.#url) return;
        if (this.#reconnectTimeoutId) return;
        if (this.#reconnectCount >= this.#maxReconnectAttempts) return;

        const exponentialDelay = Math.min(this.#baseDelayMs * (2 ** this.#reconnectCount), this.#maxDelayMs);
        const addedTime = Math.floor(Math.random() * 300);
        const reconnectDelay = exponentialDelay + addedTime;

        this.#reconnectCount += 1;
        this.#reconnectTimeoutId = setTimeout(() => {
            this.#reconnectTimeoutId = null;
            if (!this.#manualClose) {
                this.connect(this.#url).catch(() => {});
            }
        }, reconnectDelay);
    }

    #shouldReconnect(closeEvent) {
        if (!this.#reconnectAutomatically) return false;
        if (this.#manualClose) return false;
        if (!closeEvent) return true;
        if (closeEvent.code === 1000 || closeEvent.code === 1008) return false; // https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1

        return true;
    }

    #emit(handlers, e) {
        handlers.forEach((handler) => {
            handler(e);
        });
    }

    #isValidWebSocketUrl(url) {
        if (typeof url !== "string" || url.length === 0) return false;
        return /^wss?:\/\//.test(url);
    }
}
