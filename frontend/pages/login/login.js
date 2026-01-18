const input = document.getElementById("password");
const icon = document.getElementById("togglePassword");
const img = document.getElementById("form-image");
const passwordField = document.getElementById("password");
const path = String(img.src);
let focus = false;
img.src += "cat1.jpg"

passwordField.addEventListener("focus", () => {focus = true;});
passwordField.addEventListener("blur", () => {focus = false;});

requestAnimationFrame(function hello() {
    if (passwordField.value.length > 0) img.src = path + "cat2.jpg"
    else if (focus) img.src = path + "cat3.jpg"
    else img.src = path + "cat1.jpg"
    requestAnimationFrame(hello)
})

icon.addEventListener("click", () => {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
});