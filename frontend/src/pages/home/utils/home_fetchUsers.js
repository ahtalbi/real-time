import { socket } from "../../../utils/ws.js";

export function initFetchUsers() {
	socket.send(JSON.stringify({ type: "users_info_for_user" }));
}
