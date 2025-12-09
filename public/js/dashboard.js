import {
  fetchWithAuth,
  loadCurrentUser,
  initLogout,
  getToken
} from "./common.js";

async function loadProfile() {
  const el = document.getElementById("profile-content");
  if (!el) return;

  if (!getToken()) {
    el.textContent = "Giriş yapılmamış.";
    return;
  }

  try {
    const res = await fetchWithAuth("/api/auth/me");
    const data = await res.json();
    if (!res.ok) {
      el.textContent = data.message || "Profil alınamadı.";
      return;
    }
    el.innerHTML = `
      <p><strong>ID:</strong> ${data.id}</p>
      <p><strong>Kullanıcı Adı:</strong> ${data.username}</p>
      <p><strong>Rol:</strong> ${data.role}</p>
    `;
  } catch (err) {
    console.error(err);
    el.textContent = "Hata.";
  }
}

async function loadResources() {
  const tbody = document.getElementById("resources-tbody");
  if (!tbody) return;

  if (!getToken()) {
    tbody.innerHTML = `<tr><td colspan="3">Giriş yapılmamış.</td></tr>`;
    return;
  }

  try {
    const res = await fetchWithAuth("/api/resources");
    const data = await res.json();

    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="3">${data.message || "Kaynak alınamadı."}</td></tr>`;
      return;
    }

    if (!data.items || data.items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="3">Kayıt bulunamadı.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    data.items.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item._id}</td>
        <td>${item.title}</td>
        <td>${item.type}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="3">Hata.</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLogout();
  loadCurrentUser();
  loadProfile();
  loadResources();
});
