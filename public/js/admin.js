import {
  fetchWithAuth,
  loadCurrentUser,
  initLogout,
  getToken
} from "./common.js";

const tbody = document.getElementById("users-tbody");
const btnRefresh = document.getElementById("btn-refresh");

// Artık sadece secure endpoint'i kullanıyoruz
const BASE_PATH = "/api/admin/secure/users";

async function loadUsers() {
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="4">Yükleniyor...</td></tr>`;

  if (!getToken()) {
    tbody.innerHTML = `<tr><td colspan="4">Giriş yapılmamış.</td></tr>`;
    return;
  }

  try {
    const res = await fetchWithAuth(BASE_PATH);
    const data = await res.json();

    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="4">${data.message || "Liste alınamadı."}</td></tr>`;
      return;
    }

    if (!data.users || data.users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">Kullanıcı bulunamadı.</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    data.users.forEach((u) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u._id}</td>
        <td>${u.username}</td>
        <td>${u.role}</td>
        <td>
          <button class="btn btn-primary btn-small"
                  data-id="${u._id}"
                  data-action="delete">
            Sil
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="4">Hata oluştu.</td></tr>`;
  }
}

async function deleteUser(id) {
  if (!confirm("Bu kullanıcıyı silmek istiyor musunuz?")) return;

  try {
    const res = await fetchWithAuth(`${BASE_PATH}/${id}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Silme başarısız.");
      return;
    }
    await loadUsers();
  } catch (err) {
    console.error(err);
    alert("Hata oluştu.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initLogout();
  loadCurrentUser();
  loadUsers();

  btnRefresh?.addEventListener("click", loadUsers);

  tbody?.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) return;

    if (action === "delete") {
      deleteUser(id);
    }
  });
});
