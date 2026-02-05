import { launchObserver } from "./utils/home_fetchposts.js";
import { initCreatePost } from "./utils/home_createPost.js";
import { initCreateComment, initToggleComments } from "./utils/home_comments.js";
import { initReactions } from "./utils/home_reactions.js";
import { initFetchUsers } from "./utils/home_fetchUsers.js";
import { initLogoutMenu } from "./utils/home_initLogout.js";

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
initLogoutMenu();
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
