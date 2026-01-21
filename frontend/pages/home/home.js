import { showAlert } from "../../src/utils/alert.js";

let PostCreate = document.getElementById("postCreate");

PostCreate.addEventListener("submit", async () => {
    const payload = {
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