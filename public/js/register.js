import { loadCurrentUser } from "./common.js";

document.addEventListener("DOMContentLoaded", () => {
  loadCurrentUser();

  const btn = document.getElementById("reg-btn");
  const msg = document.getElementById("reg-msg");

  if (!btn) return;

  btn.addEventListener("click", async () => {
    msg.textContent = "";
    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value.trim();
    const password2 = document.getElementById("reg-password2").value.trim();

    if (!username || !password || !password2) {
      msg.textContent = "Tüm alanlar zorunludur.";
      msg.style.color = "#f97373";
      return;
    }

    if (password !== password2) {
      msg.textContent = "Şifreler eşleşmiyor.";
      msg.style.color = "#f97373";
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        msg.textContent = data.message || "Kayıt başarısız.";
        msg.style.color = "#f97373";
        return;
      }

      msg.textContent = "Kayıt başarılı. Giriş sayfasına yönlendiriliyorsunuz...";
      msg.style.color = "#4ade80";
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (err) {
      console.error(err);
      msg.textContent = "Bir hata oluştu.";
      msg.style.color = "#f97373";
    }
  });
});