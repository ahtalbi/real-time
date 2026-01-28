import { launchObserver } from "./utils/home_fetchposts.js";
import { initCreatePost } from "./utils/home_createPost.js";
import { initCreateComment, initToggleComments } from "./utils/home_comments.js";
import { initReactions } from "./utils/home_reactions.js";
import { showAlert } from "../../src/utils/alert.js";
import { initFetchUsers } from "./utils/home_fetchUsers.js";

export function initLogout() {
  let profile = document.getElementById("profile");
  let menu = document.getElementById("profileMenu");
  let logoutBtn = document.getElementById("logoutBtn");
  if (!profile || !menu || !logoutBtn) return;

  profile.addEventListener("click", (event) => {
    event.stopPropagation();
    menu.classList.toggle("is-open");
  });

  menu.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    menu.classList.remove("is-open");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") menu.classList.remove("is-open");
  });

  logoutBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    let res;
    try {
      res = await fetch("http://localhost:3000/logout", { method: "POST" });
    } catch {
      showAlert("Server unreachable");
      return;
    }

    let data = await res.json().catch(() => null);
    if (!res.ok) {
      showAlert((data && data.error) || "Logout failed");
      return;
    }

    try {
      localStorage.removeItem("rtf_user");
    } catch {
      // ignore storage errors
    }
    window.location.pathname = "/login";
  });
}

function initMessagesShortcut() {
  let messagesBtn = document.getElementById("messagesBtn");
  if (!messagesBtn) return;

  messagesBtn.addEventListener("click", () => {
    window.location.pathname = "/messages";
  });
}

initCreatePost();
initCreateComment();
initToggleComments();
initReactions();
initLogout();
initMessagesShortcut();
initFetchUsers();

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", launchObserver);
} else {
  launchObserver();
}

window.addEventListener("pageshow", (event) => {
  if (event.persisted) launchObserver();
});
