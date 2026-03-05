import { worker } from "../../../utils/ws.js";

export let stateUsers = {}

async function fetchUsers() {
	if (stateUsers.finish) return;
	worker.port.postMessage({ type: "ws_users_info_for_user", for_all_users: true });
}

export async function initFetchUsers() {
	stateUsers.Users = {};
	stateUsers.StartId = 0;
	stateUsers.finish = false;
	stateUsers.io = null;

	let list = document.getElementById("FreindsList");
	list.innerHTML = "";
	let observer = document.getElementById("freinds-observer");
	if (!observer) {
		observer = document.createElement("div");
		observer.id = "freinds-observer";
		observer.style.height = "1px";
		list.parentElement?.appendChild(observer);
	}

	fetchUsers();
	await new Promise((resolve) => {
		const check = () => {
			if (stateUsers.Users && Object.keys(stateUsers.Users).length > 0) return resolve();
			setTimeout(check, 50);
		};
		check();
	});
	stateUsers.io = new IntersectionObserver(async ([entry]) => {
		if (entry.isIntersecting) await fetchUsers();
	});
	await stateUsers.io.observe(observer);
}
