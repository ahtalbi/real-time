import { GlobalEventsManager } from "../../../events/init.js";
import { reactionEmojiByType } from "./home_templates.js";

export function initReactions() {
	GlobalEventsManager.click.RegisterEvent(
		"reaction-option",
		async (option) => {
			const type = Number(option.dataset.reactionType);
			const wrapper = option.closest(".reactions");
			const postOrCommentID = wrapper.dataset.reactionId;
			const postOrComment = wrapper.dataset.reactionScope
				.trim()
				.toUpperCase();
			const mainButton = wrapper.querySelector("[data-reaction-toggle]");
			const totalEl = wrapper.querySelector(".reaction-total");
			const nextEmoji = reactionEmojiByType[type] || "👍";
			const isSameReaction =
				mainButton.classList.contains("is-selected") &&
				mainButton.textContent.trim() === nextEmoji;

			const payload = {
				PostorcommentID: postOrCommentID,
				PostOrComment: postOrComment,
				Type: type,
			};

			try {
				const res = await fetch(
					"http://localhost:3000/createreaction",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload),
					},
				);

				const data = await res.json();

				if (!res.ok) return console.error("reaction error:", data);
				if (isSameReaction) {
					mainButton.classList.remove("is-selected");
					mainButton.textContent = "👍";
				} else {
					mainButton.classList.add("is-selected");
					mainButton.textContent = nextEmoji;
				}
				if (data && Number.isInteger(data.total)) {
					totalEl.textContent = String(data.total);
				}
			} catch (err) {
				console.error("fetch reaction failed:", err);
			}
		},
	);
}
