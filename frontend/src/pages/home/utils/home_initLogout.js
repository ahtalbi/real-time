import { showAlert } from "../../../utils/alert.js";
import { ClientRouter } from "../../../router.js";
import { GlobalEventsManager } from "../../../events/init.js";

export function initLogoutMenu() {
	GlobalEventsManager.click.RegisterEvent("profile", () => {
		const menu = document.getElementById("profileDropdown");
		if (!menu) return;
		menu.classList.toggle("is-open");
	});

	GlobalEventsManager.click.RegisterEvent("logoutBtn", () => {
		logout();
	});

	document.addEventListener("click", (e) => {
		const menu = document.getElementById("profileDropdown");
		if (!menu || e.target.nextElementSibling === menu) return;
		menu.classList.remove("is-open");
	});
}

export function logout() {
	fetch("http://localhost:3000/logout", { method: "POST" })
		.then(async (res) => {
			if (!res.ok) {
				const data = await res.json();
				throw new Error(
					(data && data.error) ||
						`HTTP ${res.status}, Failed to logout`,
				);
			}
			return res.json();
		})
		.then(() => {
			showAlert("logout successfully", 2000, "green");
			try {
				localStorage.removeItem("rtf_user");
			} catch {
				showAlert("error in removing from local storage");
			}
			ClientRouter.navigate("/login");
		})
		.catch((err) => {
			showAlert(err);
		});
}
