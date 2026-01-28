import { showAlert } from "../../../src/utils/alert.js";
import { postTemplate } from "./home_templates.js";

let statePosts = {
  offset: 0,
  loading: false,
  hasMore: true,
  observer: null,
};

async function fetchPosts() {
  if (statePosts.loading || !statePosts.hasMore) return;

  statePosts.loading = true;

  let res;
  try {
    res = await fetch("http://localhost:3000/getposts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offset: statePosts.offset }),
    });
  } catch {
    statePosts.loading = false;
    showAlert("Server unreachable");
    return;
  }

  let data = await res.json().catch(() => null);

  if (!res.ok) {
    if (data && data.error === "no posts") {
      statePosts.hasMore = false;
      statePosts.loading = false;
      return;
    }

    statePosts.loading = false;
    showAlert((data && data.error) || "Failed to fetch posts");
    return;
  }

  if (!data || !Array.isArray(data.posts) || data.posts.length === 0) {
    statePosts.hasMore = false;
    statePosts.loading = false;
    return;
  }

  const posts = document.getElementById("posts");

  for (const post of data.posts) {
    posts.insertAdjacentHTML("beforeend", postTemplate(post));
  }

  statePosts.offset += 10;
  statePosts.loading = false;
}

export function launchObserver() {
  const footer = document.getElementById("footer-observer");
  if (!footer) return;

  statePosts.offset = 0;
  statePosts.loading = false;
  statePosts.hasMore = true;

  const posts = document.getElementById("posts");
  if (posts) {
    posts.querySelectorAll("article.post").forEach((el) => el.remove());
  }

  if (statePosts.observer) {
    statePosts.observer.disconnect();
  }

  statePosts.observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) fetchPosts();
  });

  statePosts.observer.observe(footer);

  fetchPosts();
}
