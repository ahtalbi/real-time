export function initSetUserData() {
    let dataUser = localStorage.getItem("rtf_user");
    dataUser = JSON.parse(dataUser);

    let userNameH2 = document.getElementById("username");
    if (!userNameH2) return;
    userNameH2.textContent = dataUser?.Nickname;

	let imagePhoto = document.getElementById("profile");
    if (!imagePhoto) return;
	imagePhoto.src = (dataUser?.ProfileImage.Valid) ? dataUser?.ProfileImage.String : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2K1RhGUfKPoqfQRBcOKh85yJyf-5XILTo3Q&s";
	imagePhoto = document.getElementById("avatar");
	imagePhoto.src = (dataUser?.ProfileImage.Valid) ? dataUser?.ProfileImage.String : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2K1RhGUfKPoqfQRBcOKh85yJyf-5XILTo3Q&s";

    let usernameContainer = document.getElementById("nickname");
    if (!usernameContainer) return;
    usernameContainer.textContent = dataUser?.Nickname;
}

// {"ID":"55667366-7c61-4dac-994f-711263bcaba6",
// "Nickname":"oscar",
// "Birthday":"1999-11-02",
// "Gender":"Male",
// "Firstname":"oscar",
// "Lastname":"oscar",
// "Email":"oscar@gmail.com",
// "Password":"",
// "ProfileImage":{"String":"",
// "Valid":false},
// "SessionID":{"String":"",
// "Valid":false},
// "SessionExpired":""}