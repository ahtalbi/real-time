import { ClientRouter } from "../../src/router.js";
import { showAlert } from "../../src/utils/alert.js";

const input = document.getElementById("password");
const icon = document.getElementById("togglePassword");
const img = document.getElementById("form-image");
const passwordField = document.getElementById("password");
const path = "assets/images/";
let focus = false;

passwordField.addEventListener("focus", () => { focus = true; });
passwordField.addEventListener("blur", () => { focus = false; });

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

let form = document.getElementById("login-container");
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payloadObj = {
        Nickname: form.nickname.value.trim(),
        Password: form.password.value,
    };

    console.log(payloadObj);
    
    const err = validateLogin(payloadObj);
    if (err) {
        showAlert(err);
        return;
    }

    let res;
    try {
        res = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadObj),
        });
    } catch (e) {
        showAlert("network error");
        return;
    }

    let data = await res.json();

    if (data.succes) ClientRouter.navigate("/");

})

function validateLogin({ Nickname, Password }) {
    if (Nickname?.length === 0 || Password?.length === 0) return "all feilds are required";
    if (!isValidLogin(Nickname)) return "invalid nickname or email";

    const minPass = 1;
    const maxPass = 60;
    if (Password.length < minPass) return `password must be at least ${minPass} characters`;
    if (Password.length > maxPass) return "feild too large";

    return null;
}

function isValidLogin(value) {
    if (/\s/.test(value)) return false;

    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    const nicknameRegex = /^[a-zA-Z0-9_]{3,30}$/;

    return emailRegex.test(value) || nicknameRegex.test(value);
}