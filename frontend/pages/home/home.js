import { showAlert } from "../../src/utils/alert.js";

let offset = 10;
const LIMIT = 10;
let loading = false;
let hasMore = true;

async function fetchPosts() {
    if (loading || !hasMore) return;

    loading = true;

    const payload = {
        offset: offset
    };

    let res;

    try {
        res = await fetch("http://localhost:3000/getposts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
    } catch {
        loading = false;
        showAlert("Server unreachable");
        return;
    }

    const data = await res.json();

    if (!data || data.length === 0) {
        hasMore = false;
        return;
    }

    

    offset += LIMIT;
    loading = false;
}

function launchObserver() {
    const footer = document.getElementById("footer-observer");
    if (!footer) return;

    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
              fetchPosts();
            }
        },
        {
            threshold: 0
        }
    );

    observer.observe(footer);
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", launchObserver);
} else {
  launchObserver();
}

let PostCreate = document.getElementById("postCreate");
PostCreate.addEventListener("submit", async () => {
  let payload = {
    Content: PostCreate.content.value.trim(),
    CategoryType: [PostCreate.category.value]
  };

  await fetch("http://localhost:3000/createpost", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(showAlert("post added succesfully", 3000, "green"))
})

document.querySelectorAll('[data-comment-form]').forEach(form => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log(form, form.PostId);

    let postId = form.PostId.value;
    let commentContent = form.querySelector('input[name="comment"]').value.trim();
    if (!commentContent) return;
    let payload = {
      PostID: postId,
      Content: commentContent
    };

    try {
      let res = await fetch("http://localhost:3000/createcomment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      let data = await res.json();
      showAlert("Comment added successfully", 3000, "green");
      console.log(data);

      form.reset();
    } catch (err) {
      console.log(err);

      showAlert("Failed to post comment:", err, 3000, "red");
    }
  });
});

document.addEventListener("click", (e) => {
  let btn = e.target.closest("[data-toggle-comments], [data-close-comments]");
  console.log(btn);

  if (!btn) return;
  let post = e.target.closest(".post");
  if (!post) return;

  let box = post.querySelector(".comments");
  if (!box) return;

  if (btn.hasAttribute("data-close-comments")) {
    box.classList.add("is-hidden");
    return;
  }

  box.classList.toggle("is-hidden");
});
