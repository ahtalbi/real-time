import { reactionEmojiByType } from "./home_templates.js";

export function initReactions() {
  let lastReaciton = -1;
  document.addEventListener("click", async (e) => {
    const option = e.target.closest("[data-reaction-type]");
    if (!option) return;

    const type = Number(option.dataset.reactionType);
    if (!Number.isInteger(type) || type < 0 || type > 6) return;

    const wrapper = option.closest(".reactions");
    if (!wrapper) return;

    const mainButton = wrapper.querySelector("[data-reaction-toggle]");
    const totalEl = wrapper.querySelector(".reaction-total");

    const postOrCommentID = wrapper.dataset.reactionId;
    const scopeRaw = wrapper.dataset.reactionScope;
    const postOrComment = (scopeRaw || "POST").trim().toUpperCase();

    if (!postOrCommentID) return;
    if (postOrComment !== "POST" && postOrComment !== "COMMENT") return;

    if (mainButton) {
      if (lastReaciton === type) {
        lastReaciton = -1;
        mainButton.classList.remove("is-selected");
        mainButton.textContent =
          wrapper.dataset.defaultEmoji || "👍";
      } else {
        lastReaciton = type;
        mainButton.textContent =
          reactionEmojiByType[type] ||
          wrapper.dataset.defaultEmoji ||
          "👍";
        mainButton.classList.add("is-selected");
      }
    }

    const payload = {
      PostorcommentID: postOrCommentID,
      PostOrComment: postOrComment,
      Type: type,
    };

    try {
      const res = await fetch("http://localhost:3000/createreaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        console.error("reaction error:", data);
        return;
      }

      if (totalEl && data && Number.isInteger(data.total)) {
        totalEl.textContent = String(data.total);
      }
    } catch (err) {
      console.error("fetch reaction failed:", err);
    }
  });
}
