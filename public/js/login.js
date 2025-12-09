import { setToken, loadCurrentUser } from "./common.js";

document.addEventListener("DOMContentLoaded", () => {
  loadCurrentUser();

  const btn = document.getElementById("login-btn");
  const msg = document.getElementById("login-msg");

  if (!btn) return;

  btn.addEventListener("click", async () => {
    msg.textContent = "";
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      msg.textContent = "Kullanıcı adı ve şifre zorunlu.";
      msg.style.color = "#f97373";
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        msg.textContent = data.message || "Giriş başarısız.";
        msg.style.color = "#f97373";
        return;
      }

      setToken(data.token);
      msg.textContent = "Giriş başarılı, yönlendiriliyorsunuz...";
      msg.style.color = "#4ade80";
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch (err) {
      console.error(err);
      msg.textContent = "Bir hata oluştu.";
      msg.style.color = "#f97373";
    }
  });
});