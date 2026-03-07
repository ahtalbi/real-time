// this function just to set the user data when open the page
export function initSetUserData() {
    let dataUser = localStorage.getItem("rtf_user");
    dataUser = JSON.parse(dataUser);

    let usernameContainer = document.getElementById("nickname");
    usernameContainer.textContent = dataUser.Nickname;
}