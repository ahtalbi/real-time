import { worker } from "../../../utils/ws.js";

export async function initFetchUsers() {
	return new Promise((resolve, reject) => {
		let settled = false;
		let timeoutId = setTimeout(() => {
			if (settled) return;
			settled = true;
			window.removeEventListener("users:updated", onUpdatedUsers);
			reject(new Error("cant get users infos"));
		}, 5000);

		let onUpdatedUsers = () => {
			if (settled) return;
			settled = true;
			clearTimeout(timeoutId);
			window.removeEventListener("users:updated", onUpdatedUsers);
			resolve();
		};
		window.addEventListener("users:updated", onUpdatedUsers);

		worker.port.postMessage({ type: "ws_users_info_for_user", for_all_users: true });
	});
}
