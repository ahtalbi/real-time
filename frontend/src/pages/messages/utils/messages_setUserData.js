export function initSetUserData() {
    let dataUser = localStorage.getItem("rtf_user");
    dataUser = JSON.parse(dataUser);

    let usernameContainer = document.getElementById("nickname");
    usernameContainer.textContent = dataUser.Nickname;
}