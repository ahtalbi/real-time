import { showAlert } from "../../../utils/alert.js";
import { GlobalEventsManager } from "../../../events/init.js";
import { postTemplate } from "./home_templates.js";

export function initCreatePost() {
	const posts = document.getElementById("posts");

	GlobalEventsManager.submit.RegisterEvent("postCreate", async (form) => {
		const content = form.elements.content.value.trim();
		const categoryType = form.elements.category.value;
		if (content.length < 1 || content.length > 60) {
			showAlert("the length of the post should be between 1 and 60");
			return;
		}

		const formData = new FormData();
		formData.append("Content", content);
		formData.append("CategoryType", categoryType);

		let data = null;
		try {
			const res = await fetch("http://localhost:3000/createpost", {
				method: "POST",
				body: formData,
			});
			data = await res.json();
			if (!res.ok) return showAlert(data?.error || `HTTP ${res.status}`);
			if (data?.error) return showAlert(data.error);
		} catch {
			showAlert("Server unreachable");
			return;
		}

		const post = data?.post;
		if (!Array.isArray(post.Comments)) post.Comments = [];

		const wrapper = document.createElement("div");
		wrapper.innerHTML = postTemplate(post);
		posts.insertBefore(wrapper.firstElementChild, posts.firstElementChild.nextSibling);
		showAlert("post added succesfully", 3000, "green");
		form.reset();
	});
}
