import { showAlert } from "../../src/utils/alert.js";

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
