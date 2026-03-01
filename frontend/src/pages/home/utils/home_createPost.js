import { showAlert } from "../../../utils/alert.js";
import { GlobalEventsManager } from "../../../events/init.js";
import { postTemplate } from "./home_templates.js";

export function initCreatePost() {
	let posts = document.getElementById("posts");
	let picture = document.getElementById("createpostImage");
	let img = document.getElementById('pic');

	picture.addEventListener("change", function () {
		if (picture.files.length > 0) {
			let file = this.files[0];
			img.src = URL.createObjectURL(file);
			img.textContent = ''
			img.style.backgroundImage = `url(${img.src})`;
			img.style.backgroundSize = "cover";
			img.style.backgroundPosition = "center";
		}
	});

	GlobalEventsManager.submit.RegisterEvent("postCreate", async (form) => {
		const content = form.elements.content.value.trim();
		if (content.length < 1 || content.length > 600) {
			showAlert("the length of the post should be between 1 and 600");
			return;
		}

		const catsCheched = form.querySelectorAll('input[name="categories"]:checked');
		const categoryType = Array.from(catsCheched).map(cb => cb.value).join(",");

		const file = picture.files[0];

		const formData = new FormData();
		formData.append("Content", content);
		formData.append("CategoryType", categoryType);
		if (picture.files.length > 0) {
			formData.append("Image", file);
		}


		let data = null;
		try {
			let res = await fetch("http://localhost:3000/createpost", {
				method: "POST",
				body: formData,
			});

			if (!res.ok) {
				let msg = await res.text();
				return showAlert(msg);
			}
			
			data = await res.json();

			// reset createpost
			img.textContent = '📎'
			img.src = '';
			img.style.backgroundImage = ``;
			
		} catch (e) {
			showAlert(`Error: ${e.message}`);
			return
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

export function showcategoriesForCreatePost() {
	const container = document.querySelector('.composer');
	const textarea = document.querySelector('#postCreate textarea[name="content"]');
	const categories = document.querySelector('.categories-row');

	textarea.addEventListener('focus', () => {
		categories.classList.add('is-open');
	});

	document.addEventListener('click', (e) => {
		if (!container.contains(e.target)) {
			categories.classList.remove('is-open');
		}
	});
}