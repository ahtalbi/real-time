import { GlobalEventsManager } from "../../../events/init.js";
import { reactionEmojiByType } from "./home_templates.js";

export function initReactions() {
	GlobalEventsManager.click.RegisterEvent( "reaction-option", async (option) => {
			let type = Number(option.dataset.reactionType);
			let wrapper = option.closest(".reactions");
			let postOrCommentID = wrapper.dataset.reactionId;
			let postOrComment = wrapper.dataset.reactionScope.trim().toUpperCase();
			let mainButton = wrapper.querySelector("[data-reaction-toggle]");
			let totalEl = wrapper.querySelector(".reaction-total");
			let nextEmoji = reactionEmojiByType[type] || "👍";
			let isSameReaction = mainButton.classList.contains("is-selected") && mainButton.textContent.trim() === nextEmoji;

			let payload = {
				PostorcommentID: postOrCommentID,
				PostOrComment: postOrComment,
				Type: type,
			};

			try {
				let res = await fetch(
					"http://localhost:3000/createreaction",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload),
					},
				);

				let data = await res.json();

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
