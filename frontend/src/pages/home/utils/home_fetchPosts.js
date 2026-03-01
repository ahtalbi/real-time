import { showAlert } from "../../../utils/alert.js";
import { postTemplate } from "./home_templates.js";

let statePosts = {
	StartID: 0,
	finish: true,
	io: null,
};

async function fetchPosts() {
	if (!statePosts.finish) return;

	let res;
	try {
		res = await fetch("http://10.1.9.10:3000/getposts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ offset: statePosts.StartID }),
		});
	} catch {
		statePosts.loading = false;
		showAlert("Server unreachable");
		return;
	}

	let data = await res.json();
	if (!res.ok) {
		if (data && data.error === "no posts") {
			statePosts.finish = false;
			return;
		}

		showAlert((data && data.error) || "Failed to fetch posts");
		return;
	}

	if (!data || !Array.isArray(data.posts) || data.posts.length === 0) {
		statePosts.finish = false;
		return;
	}

	let posts = document.getElementById("posts");
	let fo = document.getElementById("footer-observer");
	for (let post of data.posts) {
		let tm = document.createElement("div");
		tm.innerHTML = postTemplate(post);
		posts.insertBefore(tm.firstElementChild, fo);
	}

	statePosts.StartID += 10;
}

export function initPostsFetchObserver() {
	let footer = document.getElementById("footer-observer");

	statePosts.StartID = 0;
	statePosts.finish = true;

	const posts = document.getElementById("posts");
	if (posts) {
		posts.querySelectorAll("article.post").forEach((el) => el.remove());
	}

	if (statePosts.io) {
		statePosts.io.disconnect();
	}

	statePosts.io = new IntersectionObserver(([entry]) => {
		if (entry.isIntersecting) fetchPosts();
	});

	statePosts.io.observe(footer);
}
