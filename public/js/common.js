// public/js/common.js

export function getToken() {
  return localStorage.getItem("jwtToken") || null;
}

export function setToken(token) {
  localStorage.setItem("jwtToken", token);
}

export function clearToken() {
  localStorage.removeItem("jwtToken");
}

export async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = options.headers || {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}

export async function loadCurrentUser() {
  const infoEl = document.getElementById("current-user-info");
  const adminLinks = document.querySelectorAll(".nav-admin");
  const token = getToken();

  // Varsayılan: giriş yoksa admin linklerini gizle
  if (!token) {
    if (infoEl) infoEl.textContent = "Oturum yok";
    adminLinks.forEach((el) => (el.style.display = "none"));
    return;
  }

  try {
    const res = await fetchWithAuth("/api/auth/me");
    const data = await res.json();

    if (!res.ok) {
      if (infoEl) infoEl.textContent = "Oturum geçersiz";
      adminLinks.forEach((el) => (el.style.display = "none"));
      return;
    }

    if (infoEl) infoEl.textContent = `${data.username} (${data.role})`;

    // Sadece admin rolüne admin menüsünü göster
    adminLinks.forEach((el) => {
      el.style.display = data.role === "admin" ? "" : "none";
    });
  } catch (err) {
    console.error(err);
    if (infoEl) infoEl.textContent = "Hata";
    adminLinks.forEach((el) => (el.style.display = "none"));
  }
}

export function initLogout() {
  const btn = document.getElementById("logout-btn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    clearToken();
    window.location.href = "/login";
  });
}
