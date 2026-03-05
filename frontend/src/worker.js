// =============================================
// sates
// =============================================
let tabs = new Set();
let socket = null;

// =============================================
// borad cast to all tabs
// =============================================
function broadcastToTabs(msg) {
  tabs.forEach(tab => tab.postMessage(msg));
}

// =============================================
// init web socket 
// ============================================= ico
function initWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  let url = "ws://localhost:3000/ws";
  socket = new WebSocket(url);

  socket.onclose = () => {
    socket = null;
  }

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case "ws_message":
        broadcastToTabs({ type: "shw_message", message: data.message });
        break;
      case "users_info_for_user":
        broadcastToTabs({ type: "shw_users_info_for_user", message: data.data });
        break;
      case "ws_logout":
        socket.close();
        broadcastToTabs({ type: "shw_logout", message: data.data });
        break;
      case "ws_messages_history":
        broadcastToTabs({ type: "shw_users_info_for_user", message: data.data });
    }
  };
  socket.onopen = () => {
    flushPending();
  };
};

// =============================================
// on connect new tab opened
// =============================================
let pending = [];

function flushPending() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  while (pending.length) {
    socket.send(JSON.stringify(pending.shift()));
  }
}
onconnect = (e) => {
  const port = e.ports[0];
  port.start();
  tabs.add(port);
  console.log("on add", tabs.size);

  port.onmessage = async (payload) => {
    payload = payload.data;
    if (payload.type === "disconnect") {
      port.close();
      tabs.delete(port);
      if (tabs.size === 0) {
        try {
          const res = await fetch("http://localhost:3000/logout", {
            method: "POST",
            credentials: "include",
          });

          if (!res.ok) throw new Error(`Logout failed: ${res.status}`);

          localStorage.removeItem("rtf_user");
          worker.port.postMessage({ type: "shw_logout" });
        } catch {

        }
      }
    };
    const match = /^[a-z]+_/.exec(payload.type);
    const prefix = match[0];
    switch (prefix) {
      case "ws_":
        if (!socket) {
          initWebSocket();
        }
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(payload));
        } else {
          pending.push(payload);
        }
        break;
      case "shw_":
        broadcastToTabs(payload);
        break;
    }
  }

  port.onclose = () => {
    tabs.delete(port);
  };
};

initWebSocket();