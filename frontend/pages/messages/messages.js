let backBtn = document.getElementById("messagesBack");

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.pathname = "/";
  });
}
