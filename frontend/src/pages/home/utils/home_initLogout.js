import { GlobalEventsManager } from "../../../events/init.js";
import { worker } from "../../../utils/ws.js";

// this function to init the logout button 
export function initLogoutMenu() {
	GlobalEventsManager.click.RegisterEvent("profile", () => {
		const menu = document.getElementById("profileDropdown");
		if (!menu) return;
		menu.classList.toggle("is-open");
	});

	GlobalEventsManager.click.RegisterEvent("logoutBtn", async () => {
		await logout();
	});

	document.addEventListener("click", (e) => {
		const menu = document.getElementById("profileDropdown");
		if (!menu || e.target.nextElementSibling === menu) return;
		menu.classList.remove("is-open");
	});
}

// this function to send the logout 
export async function logout() {
	try {
		const res = await fetch("http://localhost:3000/logout", {
			method: "POST",
			credentials: "include",
		});

		if (!res.ok) throw new Error(`Logout failed: ${res.status}`);

		localStorage.removeItem("rtf_user");
		worker.port.postMessage({ type: "shw_logout" });
	} catch (err) {
		console.error(err);
	}
} ////////////////