export class WebSocketManager {
    static instance = null;
    socket = null;
    listeners = new Map();
    url = null;
    reconnectInterval = 3000;
    shouldReconnect = true;

    constructor() {
        if (WebSocketManager.instance) {
            return WebSocketManager.instance;
        }
        WebSocketManager.instance = this;
    }

    connect(url) {
        if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        this.url = url;
        this.shouldReconnect = true;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            console.log("WebSocket connected");
            this.#emit("open");
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.#emit(data.type, data.payload);
                this.#emit("message", data);
            } catch (e) {
                console.error("Failed to parse WebSocket message:", e);
                this.#emit("message", event.data);
            }
        };

        this.socket.onclose = () => {
            console.log("WebSocket disconnected");
            this.#emit("close");
            if (this.shouldReconnect) {
                setTimeout(() => this.connect(this.url), this.reconnectInterval);
            }
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            this.#emit("error", error);
        };
    }

    send(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.warn("WebSocket is not open. Message not sent:", data);
        }
    }

    on(type, callback) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type).push(callback);
    }

    off(type, callback) {
        if (!this.listeners.has(type)) return;
        const callbacks = this.listeners.get(type);
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    }

    close() {
        this.shouldReconnect = false;
        if (this.socket) {
            this.socket.close();
        }
    }

    #emit(type, payload) {
        if (this.listeners.has(type)) {
            this.listeners.get(type).forEach(callback => callback(payload));
        }
    }
}

export const wsManager = new WebSocketManager();
