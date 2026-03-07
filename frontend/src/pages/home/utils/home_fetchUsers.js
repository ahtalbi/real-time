import { worker } from "../../../utils/ws.js";

// this function to fetch users
export async function initFetchUsers() {
	worker.port.postMessage({ type: "ws_users_info_for_user", for_all_users: true });
}