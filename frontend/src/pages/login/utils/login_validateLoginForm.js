export function validateLogin({ Nickname, Password }) {
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
