import { showAlert } from "../../../utils/alert.js";
import { UserTemplate } from "./messages_templates.js";

let stateUsers = {
	StartId: 0,
	finish: false,
	io: null,
};

export function fetchUsers() {
	if (stateUsers.finish) return;
	return fetch("http://localhost:3000/getusers", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ startID: stateUsers.StartId }),
	})
		.then(async (res) => {
			if (!res.ok) {
				const data = await res.json();
				throw new Error(
					(data && data.error) ||
					`HTTP ${res.status}, Failed to Get the users`,
				);
			}
			return res.json();
		})
		.then((res) => {
			let arr = res.data;
			let frag = document.createDocumentFragment();
			for (let user of arr) {
				frag.appendChild(UserTemplate(user));
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

export function initFetchUsers() {
	stateUsers = {
		StartId: 0,
		finish: false,
		io: null,
	};

	let list = document.getElementById("FreindsList");
	list.innerHTML = "";
	let observer = document.getElementById("freinds-observer");
	if (!observer) {
		observer = document.createElement("div");
		observer.id = "freinds-observer";
		observer.style.height = "1px";
		list.parentElement?.appendChild(observer);
	}

	stateUsers.io = new IntersectionObserver(([entry]) => {
		if (entry.isIntersecting) fetchUsers();
	});
	stateUsers.io.observe(observer);

	const run = () => {
		fetchUsers();
	};

	if (document.readyState === "loading") {
		window.addEventListener("DOMContentLoaded", run);
	} else {
		run();
	}
}
