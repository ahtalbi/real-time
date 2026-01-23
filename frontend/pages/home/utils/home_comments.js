import { showAlert } from "../../../src/utils/alert.js";
import { commentTemplate } from "./home_templates.js"; // ✅ ajoute ça


export function initCreateComment() {
  document.addEventListener("submit", async (e) => {
    let form = e.target.closest("[data-comment-form]");
    if (!form) return;

    e.preventDefault();

    let postId = form.querySelector('input[name="PostId"]')?.value;
    let input = form.querySelector('input[name="comment"]');
    let content = input?.value.trim();

    if (!postId || !content) return;

    if (content.length === 0 || content.length > 60) {
      showAlert("the length of the comment should be between 1 and 60");
      return;
    }

    try {
      let res = await fetch("http://localhost:3000/createcomment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PostID: postId, Content: content }),
      });

      let data = await res.json().catch(() => null);
      if (!res.ok) return showAlert(data?.error || `HTTP ${res.status}`);
      if (data?.error) return showAlert(data.error);

      const comment = data.comment ?? data;
      const post = form.closest(".post");
      const list = post?.querySelector(".comments-list");
      if (list && comment) {
        list.insertAdjacentHTML("beforeend", commentTemplate(comment));
      }

      showAlert("Comment added successfully", 3000, "green");
      form.reset();
    } catch (err) {
      console.log(err);
      showAlert("Failed to post comment", 3000, "red");
    }
  });
}

export function initToggleComments() {
  document.addEventListener("click", (e) => {
    let btn = e.target.closest("[data-toggle-comments], [data-close-comments]");
    if (!btn) return;

    let post = btn.closest(".post");
    if (!post) return;

    let box = post.querySelector(".comments");
    if (!box) return;

    if (btn.hasAttribute("data-close-comments")) {
      box.classList.add("is-hidden");
      return;
    }

    box.classList.toggle("is-hidden");
  });
}
