import { worker } from "../../../utils/ws.js";

export async function initFetchUsers() {
	return new Promise((resolve, reject) => {
		let done = false;
		let timeoutId = setTimeout(() => {
			if (done) return;
			done = true;
			window.removeEventListener("users:updated", onUsersUpdated);
			reject(new Error("Timed out while waiting for users list"));
		}, 4000);

		function onUsersUpdated() {
			if (done) return;
			done = true;
			clearTimeout(timeoutId);
			window.removeEventListener("users:updated", onUsersUpdated);
			resolve();
		}

		window.addEventListener("users:updated", onUsersUpdated, { once: true });
		worker.port.postMessage({ type: "ws_users_info_for_user", for_all_users: true });
	});
}
