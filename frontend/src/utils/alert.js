let alertTimer = null;

// this is function i use it to show alert to the user
export function showAlert(message, duration = 10000, bg = "red") {
  let old = document.getElementById("alert");
  if (old) old.remove();
  if (alertTimer) clearTimeout(alertTimer);

  let div = document.createElement("div");
  div.id = "alert";
  div.style.backgroundColor = bg;
  div.textContent = message;
  document.body.appendChild(div);

  alertTimer = setTimeout(() => {
    div.remove();
    alertTimer = null;
  }, duration);
}
