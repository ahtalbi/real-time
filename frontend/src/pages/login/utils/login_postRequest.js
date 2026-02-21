import { ClientRouter } from "../../../router.js";
import { showAlert } from "../../../utils/alert.js";
import { socket } from "../../../utils/ws.js";
import { validateLogin } from "./login_validateLoginForm.js";

export function loginSendPost(form) {
    let payload = {
        Nickname: form.nickname.value.trim(),
        Password: form.password.value,
    };

    let err = validateLogin(payload);
    if (err) {
        showAlert(err);
        return;
    }

    fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(async (res) => {
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || `HTTP ${res.status}`);
            }
            return res.json();
        })
        .then(res => {
            if (res.success && res.user) {
                try {
                    localStorage.setItem("rtf_user", JSON.stringify(res.user));
                } catch {
                    showAlert("localStorage error");
                    return;
                }
                ClientRouter.navigate("/");
                showAlert("Welcome Back", 2000, "green");
                socket.send(JSON.stringify({ type: "users_info_for_user"}));
            } else if (res.error) {
                showAlert(res.error);
            }
        })
        .catch(err => {
            console.error(err);
            showAlert(err.message);
        });
}
