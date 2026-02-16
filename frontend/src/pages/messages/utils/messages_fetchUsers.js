import { showAlert } from "../../../utils/alert.js";
import { socket } from "../../../utils/ws.js";
import { UserTemplate } from "./messages_templates.js";

export let stateUsers = {}

async function fetchUsers() {
	if (stateUsers.finish) return;
	socket.send(JSON.stringify({type:"users_info_for_user"}))
	return await fetch("http://localhost:3000/getusers", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ startID: stateUsers.StartId }),
	})
		.then(async (res) => {
			const data = await res.json();
			if (!res.ok) {
				throw new Error(
					(data && data.error) ||
					`HTTP ${res.status}, Failed to Get the users`,
				);
			}
			return data;
		})
		.then((res) => {
			let arr = res.data;
			let frag = document.createDocumentFragment();
			for (let user of arr) {
				frag.appendChild(UserTemplate(user));
				stateUsers.Users[user.ID] = user;
			}
			let containerFreinds = document.getElementById("FreindsList");
			containerFreinds.append(frag);
			stateUsers.StartId += 100;
			if (arr.length < 100) stateUsers.finish = true;
			return res;
		})
		.catch((err) => {
			showAlert(err);
			return null;
		});
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
	stateUsers.io = new IntersectionObserver(async ([entry]) => {
		if (entry.isIntersecting) await fetchUsers();
	});
	stateUsers.io.observe(observer);
}
