import { showAlert } from "../../../utils/alert.js";
import { GlobalEventsManager } from "../../../events/init.js";
import { commentTemplate } from "./home_templates.js";

export function initCreateComment() {
	GlobalEventsManager.submit.RegisterEvent("comment-form", async (form) => {
		let postId = form.elements.PostId.value;
		let content = form.elements.comment.value.trim();
		if (content.length < 1 || content.length > 60) {
			showAlert("the length of the comment should be between 1 and 60");
			return;
		}

		try {
			let res = await fetch(`http://localhost:3000/createcomment`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ PostID: postId, Content: content }),
			});
			let data = await res.json();
			if (!res.ok) return showAlert(data?.error || `HTTP ${res.status}`);
			if (data?.error) return showAlert(data.error);

			let list = document.getElementById(`comments-list-${postId}`);
			let count = document.getElementById(`comments-count-${postId}`);
			list.insertAdjacentHTML("afterbegin", commentTemplate(data.comment));
			count.textContent = String(Number(count.textContent) + 1);

			showAlert("Comment added successfully", 3000, "green");
			form.reset();
		} catch (err) {
			showAlert("Failed to post comment");
		}
	});
}

export function initToggleComments() {
	GlobalEventsManager.click.RegisterEvent("toggle-comments-btn", (btn) => {
		let post = btn.closest(".post");
		let box = document.getElementById(`comments-box-${post.id}`);
		box.classList.toggle("is-hidden");
	});

	GlobalEventsManager.click.RegisterEvent("close-comments-btn", (btn) => {
		let post = btn.closest(".post");
		let box = document.getElementById(`comments-box-${post.id}`);
		box.classList.add("is-hidden");
	});

	GlobalEventsManager.click.RegisterEvent("see-more-comments-btn", async (btn) => {
		let post = btn.closest(".post");
		let list = document.getElementById(`comments-list-${post.id}`);

		try {
			let res = await fetch(`http://localhost:3000/getcomments`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ PostID: post.id, Offset: list.children.length }),
			});
			let data = await res.json();
			if (!res.ok) return;

			for (let comment of data.comments || []) {
				list.insertAdjacentHTML("beforeend", commentTemplate(comment));
			}
			if (!data.morecommentsexist) btn.remove();
		} catch (err) {
			console.error("fetch comments failed:", err);
		}
	});
}
