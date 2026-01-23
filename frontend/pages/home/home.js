import { launchObserver } from "./utils/home_fetchPosts.js";
import { initCreatePost } from "./utils/home_createPost.js";
import { initCreateComment, initToggleComments } from "./utils/home_comments.js";

initCreatePost();
initCreateComment();
initToggleComments();

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", launchObserver);
} else {
  launchObserver();
}