// this functionn to see if the data of the user in register is valid
export function validateUserInfos(user) {
  if (!user.Nickname?.length || !user.Birthday?.length || !user.Gender?.length || !user.Firstname?.length || !user.Lastname?.length || !user.Email?.length || !user.Password?.length || !user.VerifyPassword?.length) return "all feilds are required";
  if (user.Password !== user.VerifyPassword) return "Passwords unmached";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(user.Birthday)) return "invalid date format";

  let birthMs = Date.parse(user.Birthday + "T00:00:00Z");
  if (Number.isNaN(birthMs)) return "invalid date format";

  let now = Date.now();
  let max = now - (60 * 60 * 24 * 365.25 * 200 * 1000);
  let legal = now - (60 * 60 * 24 * 365.25 * 15 * 1000);
  if (birthMs > legal || birthMs < max) return "you're not allowed to use this website";
  if (user.Gender !== "Male" && user.Gender !== "Female" && user.Gender !== "Other") return "invalid gender";
  if (!/^[a-zA-Z0-9_]+$/.test(user.Nickname)) return "invalid nickname format";
  if (!/^[a-zA-Z_]+$/.test(user.Firstname)) return "invalid firstname format";
  if (!/^[a-zA-Z_]+$/.test(user.Lastname)) return "invalid lastname format";
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(user.Email)) return "invalid email format";
  if (user.Nickname.length > 30 || user.Firstname.length > 30 || user.Lastname.length > 30 || user.Email.length > 60 || user.Password.length > 60) return "feild too large";
  return null;
}
