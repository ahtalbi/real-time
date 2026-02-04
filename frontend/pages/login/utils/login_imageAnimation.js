import { GlobalEventsManager } from "../../../src/events/init.js";

let reqAnForImage = null;

export function initImageAnimation() {
    if (reqAnForImage) reqAnForImage = null;
    let input = document.getElementById("password");
    let icon = document.getElementById("togglePassword");
    let img = document.getElementById("form-image");
    let passwordField = document.getElementById("password");
    let path = "assets/images/";
    let focus = false;
    
    passwordField.addEventListener("focus", () => { focus = true; });
    passwordField.addEventListener("blur", () => { focus = false; });
    
    reqAnForImage = requestAnimationFrame(function hello() {
        if (passwordField.value.length > 0) img.src = path + "cat2.jpg";
        else if (focus) img.src = path + "cat3.jpg";
        else img.src = path + "cat1.jpg";
        requestAnimationFrame(hello);
    })
    
    let toggleIcon = () => {
        let isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
    };

    GlobalEventsManager.click.RegisterEvent("togglePassword", toggleIcon);
}