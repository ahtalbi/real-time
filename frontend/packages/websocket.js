class WebSocketManager {
    socket = null;
    listeners = {};
    url = null;
    reconnectDelay = 3000;
    reconnect = true;

    connect(url) {
        if (this.socket?.readyState <= 1) return;

        this.url = url;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => this.emit("open");

        this.socket.onmessage = (e) => {
            let data = e.data;
            try {
                data = JSON.parse(e.data);
                this.emit(data.type, data.payload);
            } catch {}
            this.emit("message", data);
        };

        this.socket.onclose = () => {
            this.emit("close");
            if (this.reconnect) {
                setTimeout(() => this.connect(this.url), this.reconnectDelay);
            }
        };

        this.socket.onerror = (e) => this.emit("error", e);
    }

    send(data) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }

    on(event, fn) {
        (this.listeners[event] ||= []).push(fn);
    }

    off(event, fn) {
        this.listeners[event] =
            this.listeners[event]?.filter(cb => cb !== fn) || [];
    }

    close() {
        this.reconnect = false;
        this.socket?.close();
    }

    emit(event, payload) {
        this.listeners[event]?.forEach(fn => fn(payload));
    }
}

export const wsManager = new WebSocketManager();
