import { socket } from "../../../utils/ws.js";

export let stateUsers = {}

async function fetchUsers() {
	if (stateUsers.finish) return;
	socket.send(JSON.stringify({type:"users_info_for_user"}))
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
	await fetchUsers();
	// await for users to fetched
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
