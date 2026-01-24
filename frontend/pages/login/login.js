import { ClientRouter } from "../../src/router.js";
import { showAlert } from "../../src/utils/alert.js";

let input = document.getElementById("password");
let icon = document.getElementById("togglePassword");
let img = document.getElementById("form-image");
let passwordField = document.getElementById("password");
let path = "assets/images/";
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
    let isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    icon.classList.toggle("fa-eye");
    icon.classList.toggle("fa-eye-slash");
});

let form = document.getElementById("login-container");
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let payloadObj = {
        Nickname: form.nickname.value.trim(),
        Password: form.password.value,
    };

    // console.log(payloadObj);
    
    let err = validateLogin(payloadObj);
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
    
    if (data.success) ClientRouter.navigate("/");
    else if (data.error) showAlert(data.error);
})

function validateLogin({ Nickname, Password }) {
    if (Nickname?.length === 0 || Password?.length === 0) return "all feilds are required";
    if (!isValidLogin(Nickname)) return "invalid nickname or email";

    let minPass = 1;
    let maxPass = 60;
    if (Password.length < minPass) return `password must be at least ${minPass} characters`;
    if (Password.length > maxPass) return "feild too large";

    return null;
}

function isValidLogin(value) {
    if (/\s/.test(value)) return false;

    let emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    let nicknameRegex = /^[a-zA-Z0-9_]{1,30}$/;

    return emailRegex.test(value) || nicknameRegex.test(value);
}