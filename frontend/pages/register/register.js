const form = document.getElementById("register-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    FrontID: crypto.randomUUID(),
    Nickname: form.nickname.value,
    Firstname: form.firstname.value,
    Lastname: form.lastname.value,
    Email: form.email.value,
    Birthday: form.birthday.value,
    Gender: form.gender.value,
    Password: form.password.value,
  };

  try {
    const res = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const ct = res.headers.get("content-type") || "";
    const text = await res.text();

    if (!res.ok) {
      console.error("HTTP", res.status, text);
      return;
    }

    if (ct.includes("application/json")) {
      const data = JSON.parse(text);
      console.log("OK:", data);
    } else {
      console.error("Pas du JSON. Content-Type =", ct);
      console.error("Body:", text.slice(0, 200));
    }
  } catch (err) {
    console.error("Register error:", err);
  }
});
