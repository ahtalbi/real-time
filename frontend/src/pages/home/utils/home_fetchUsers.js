import { worker } from "../../../utils/ws.js";

export function initFetchUsers() {
	worker.port.postMessage({ type: "ws_users_info_for_user", for_all_users: true });
}
