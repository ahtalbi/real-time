import { showAlert } from "../../../src/utils/alert.js";
import { postTemplate } from "./home_templates.js";

let offset = 0;
let loading = false;
let hasMore = true;

async function fetchPosts() {
  
  if (loading || !hasMore) return;
  loading = true;

  let res;
  try {
    res = await fetch("http://localhost:3000/getposts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offset }),
    });
  } catch {
    loading = false;
    showAlert("Server unreachable");
    return;
  }
  let data = await res.json().catch(() => null);
  if (!res.ok) {
    if (data && data.error === "no posts") {
      hasMore = false;
      loading = false;
      return;
    }
    loading = false;
    showAlert((data && data.error) || "Failed to fetch posts");
    return;
  }

  if (!data || !Array.isArray(data.posts) || data.posts.length === 0) {
    hasMore = false;
    loading = false;
    return;
  }

  let posts = document.getElementById("posts");
  for (let post of data.posts) {
    posts.insertAdjacentHTML("beforeend", postTemplate(post));
  }

  offset += 10;
  loading = false;
}

export function launchObserver() {
  let footer = document.getElementById("footer-observer");
  if (!footer) return;

  let observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) fetchPosts();
  });

  observer.observe(footer);
  fetchPosts();
}
