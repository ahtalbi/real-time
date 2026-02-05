export function initSetUserData() {
    let dataUser = localStorage.getItem("rtf_user");
    dataUser = JSON.parse(dataUser);

    let userNameH2 = document.getElementById("username");
    userNameH2.textContent = dataUser.Firstname + " " + dataUser.Lastname;

	let imagePhoto = document.getElementById("profile");
	imagePhoto.src = (dataUser.ProfileImage.Valid) ? dataUser.ProfileImage.String : "https://avatars.githubusercontent.com/u/128240067?v=4";
	imagePhoto = document.getElementById("avatar");
	imagePhoto.src = (dataUser.ProfileImage.Valid) ? dataUser.ProfileImage.String : "https://avatars.githubusercontent.com/u/128240067?v=4";	
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