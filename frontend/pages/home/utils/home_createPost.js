import { showAlert } from "../../../src/utils/alert.js";
import { postTemplate } from "./home_templates.js";

export function initCreatePost() {
  let PostCreate = document.getElementById("postCreate");

  PostCreate.addEventListener("submit", async (e) => {
    e.preventDefault();

    let payload = {
      Content: PostCreate.content.value.trim(),
      CategoryType: PostCreate.category.value,
    };

    if (payload.Content.length === 0 || payload.Content.length > 60) {
      showAlert("the length of the post should be between 1 and 60");
      return;
    }

    let data;
    try {
      let res = await fetch("http://localhost:3000/createpost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      data = await res.json().catch(() => null);

      if (!res.ok) {
        showAlert(data?.error || `HTTP ${res.status}`);
        return;
      }
      if (data?.error) {
        showAlert(data.error);
        return;
      }
    } catch {
      showAlert("Server unreachable");
      return;
    }

    const post = data?.post ?? data;
    if (!Array.isArray(post.Comments)) post.Comments = [];

    let posts = document.getElementById("posts");

    let div = postTemplate(post);
    let wrapper = document.createElement("div");
    wrapper.innerHTML = div;

    posts.insertBefore(wrapper.firstElementChild, posts.firstElementChild.nextSibling);
    showAlert("post added succesfully", 3000, "green");
    PostCreate.reset();
  });
}
