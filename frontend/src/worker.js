// =============================================
// sates
// =============================================
let tabs = new Map();
let socket = null;

// =============================================
// borad cast to all tabs
// =============================================
function broadcastToTabs(msg, tab_uuid = null) {
  if (tabs.get(tab_uuid)) {
    tabs.get(tab_uuid).postMessage(msg);
    return;
  }
  tabs.forEach(tab => tab.postMessage(msg));
}

// =============================================
// init web socket 
// =============================================
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
      case "ws_users_info_for_user":
        
        broadcastToTabs({ type: "shw_users_info_for_user", message: data.data });
        break;
      // case "ws_logout":
      //   socket.close();
      //   broadcastToTabs({ type: "shw_logout", message: data.data });
      //   break;
      case "ws_messages_history":
        broadcastToTabs({ type: "shw_messages_history", message: data.data }, data.tab_uuid);
        break;
      case "ws_typing":
        broadcastToTabs({ type: "shw_typing", from: data.from });
        break;
      case "ws_user_offline":
        broadcastToTabs({ type: "shw_user_offline", userID: data.userID });
        break;
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

  let uuid = crypto.randomUUID();
  tabs.set(uuid, port);
  port.postMessage({ type: "tab_uuid", uuid: uuid });

  port.onmessage = async (payload) => {
    payload = payload.data;
    if (payload.type === "disconnect") {
      port.close();
      tabs.delete(uuid);
      return;
    }
    if (!payload || typeof payload.type !== "string") return;

    const match = /^[a-z]+_/.exec(payload.type);
    if (!match) return;
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
    tabs.delete(uuid);
  };
};

initWebSocket();
