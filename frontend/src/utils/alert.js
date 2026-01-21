let alertTimer = null;
// this function is for making alert when the user make some thing wrong
export function showAlert(message, duration = 10000) {
  const old = document.getElementById("alert");
  if (old) old.remove();
  if (alertTimer) clearTimeout(alertTimer);

  const div = document.createElement("div");
  div.id = "alert";
  div.textContent = message;
  document.body.appendChild(div);

  alertTimer = setTimeout(() => {
    div.remove();
    alertTimer = null;
  }, duration);
}
