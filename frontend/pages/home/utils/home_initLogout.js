import { showAlert } from "../../../src/utils/alert.js";
import { ClientRouter } from "../../../src/router.js";
import { GlobalEventsManager } from "../../../src/events/init.js";

export function initLogoutMenu() {
  if (!GlobalEventsManager?.click) return;

  GlobalEventsManager.click.RegisterEvent("toggleProfileMenu", () => {
    const menu = document.getElementById("profileMenu");
    if (!menu) return;
    menu.classList.toggle("is-open");
  });

  GlobalEventsManager.click.RegisterEvent("keepProfileMenuOpen", (_el, e) => {
    e.stopPropagation();
  });

  GlobalEventsManager.click.RegisterEvent("logoutBtn", () => {
    logout();
  });

  GlobalEventsManager.click.RegisterEvent("closeProfileMenuOutside", () => {
    const menu = document.getElementById("profileMenu");
    if (!menu) return;
    menu.classList.remove("is-open");
  });

  document.addEventListener("click", () => {
    const menu = document.getElementById("profileMenu");
    if (!menu) return;
    menu.classList.remove("is-open");
  });
}

export function logout() {
  fetch("http://localhost:3000/logout", { method: "POST" })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error((data && data.error) || `HTTP ${res.status}`);
      }
      return res.json().catch(() => null);
    })
    .then(() => {
      try {
        localStorage.removeItem("rtf_user");
      } catch { }
      if (ClientRouter?.navigate) ClientRouter.navigate("/login");
      else window.location.pathname = "/login";
    })
    .catch((err) => {
      showAlert(err?.message === "Failed to fetch" ? "Server unreachable" : err?.message || "Logout failed");
    });
}
