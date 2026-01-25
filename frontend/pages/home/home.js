import { launchObserver } from "./utils/home_fetchposts.js";
import { initCreatePost } from "./utils/home_createPost.js";
import { initCreateComment, initToggleComments } from "./utils/home_comments.js";
import { initReactions } from "./utils/home_reactions.js";

initCreatePost();
initCreateComment();
initToggleComments();
initReactions();

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", launchObserver);
} else {
  launchObserver();
}
