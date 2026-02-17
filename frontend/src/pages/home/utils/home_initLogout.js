import { showAlert } from "../../../utils/alert.js";
import { ClientRouter } from "../../../router.js";
import { GlobalEventsManager } from "../../../events/init.js";
import { socket } from "../../../utils/ws.js";

export function initLogoutMenu() {
	GlobalEventsManager.click.RegisterEvent("profile", () => {
		const menu = document.getElementById("profileDropdown");
		if (!menu) return;
		menu.classList.toggle("is-open");
	});

	GlobalEventsManager.click.RegisterEvent("logoutBtn",async () => {
		await logout();
		socket.send(JSON.stringify({ type: "users_info_for_user", for_all_users: true }));
	});

	document.addEventListener("click", (e) => {
		const menu = document.getElementById("profileDropdown");
		if (!menu || e.target.nextElementSibling === menu) return;
		menu.classList.remove("is-open");
	});
}

export function logout() {
    socket.send(JSON.stringify({ type: "logout" }));

    localStorage.removeItem("rtf_user");
    ClientRouter.navigate("/login");
}
