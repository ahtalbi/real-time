import { ClientRouter } from "../../../src/router.js";
import { showAlert } from "../../../src/utils/alert.js";
import { validateUserInfos } from "./register_validateUserInfos.js";

export function registerSendPost(form) {
    let payload = {
        Nickname: form.nickname.value.trim(),
        Firstname: form.firstname.value.trim(),
        Lastname: form.lastname.value.trim(),
        Email: form.email.value.trim(),
        Birthday: form.birthday.value,
        Gender: form.gender.value,
        Password: form.password.value,
        VerifyPassword: form.passwordverificate.value,
    };
    let err = validateUserInfos(payload);
    if (err) { showAlert(err); return }

    fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(res => {
            if (res.success) { ClientRouter.navigate("/login"); showAlert("registration succesfully", 2000, "green"); }
            else if (res.error) showAlert(res.error);
        })
        .catch(err => showAlert(err));
}