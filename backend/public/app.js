const API_URL = "/api";

let allMedia = [];

/* AUTH DISPLAY */

function showLogin() {
  document.getElementById("loginBox").classList.remove("hidden");
  document.getElementById("registerBox").classList.add("hidden");
}

function showRegister() {
  document.getElementById("registerBox").classList.remove("hidden");
  document.getElementById("loginBox").classList.add("hidden");
}

function checkAuth() {
  const token = localStorage.getItem("token");

  if (token) {
    document.getElementById("mainApp").classList.remove("hidden");
    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("registerBox").classList.add("hidden");
  } else {
    document.getElementById("mainApp").classList.add("hidden");
    document.getElementById("loginBox").classList.remove("hidden");
  }
}

/* REGISTER */

async function register() {
  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, email, password })
  });

  const data = await res.json();

  alert(data.message || "Registered successfully");

  showLogin();
}

/* LOGIN */

async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);

    alert("Login successful");

    checkAuth();
    loadMedia();
  } else {
    alert(data.message || "Login failed");
  }
}

/* LOGOUT */

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");

  alert("Logged out");

  checkAuth();
}

/* MEDIA */

async function loadMedia() {
  const res = await fetch(`${API_URL}/media`);
  allMedia = await res.json();

  displayMedia(allMedia);
}

function displayMedia(mediaList) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  mediaList.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.title}" />

      <h3>${item.title}</h3>

      <p>${item.description}</p>

      <div class="card-actions">
        <button onclick="editMedia('${item._id}', '${escapeText(item.title)}', '${escapeText(item.description)}')">
          Edit
        </button>

        <button onclick="deleteMedia('${item._id}')">
          Delete
        </button>
      </div>
    `;

    gallery.appendChild(card);
  });
}

async function uploadMedia() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first");
    return;
  }

  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const image = document.getElementById("image").files[0];

  if (!title || !description || !image) {
    alert("Please fill in title, description and choose an image");
    return;
  }

  const formData = new FormData();

  formData.append("title", title);
  formData.append("description", description);
  formData.append("image", image);

  await fetch(`${API_URL}/media`, {
    method: "POST",
    headers: {
      Authorization: token
    },
    body: formData
  });

  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("image").value = "";

  loadMedia();
}

/* EDIT INTERFACE */

function editMedia(id, oldTitle, oldDescription) {
  const card = event.target.closest(".card");

  card.innerHTML = `
    <div class="edit-box">
      <h3>Edit Media</h3>

      <input type="text" id="editTitle-${id}" value="${oldTitle}" />

      <input type="text" id="editDescription-${id}" value="${oldDescription}" />

      <button onclick="saveEdit('${id}')">Save Changes</button>

      <button onclick="loadMedia()">Cancel</button>
    </div>
  `;
}

async function saveEdit(id) {
  const token = localStorage.getItem("token");

  const newTitle = document.getElementById(`editTitle-${id}`).value;
  const newDescription = document.getElementById(`editDescription-${id}`).value;

  if (!newTitle || !newDescription) {
    alert("Please enter both title and description");
    return;
  }

  await fetch(`${API_URL}/media/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({
      title: newTitle,
      description: newDescription
    })
  });

  loadMedia();
}

/* DELETE */

async function deleteMedia(id) {
  const token = localStorage.getItem("token");

  if (!confirm("Are you sure you want to delete this media?")) return;

  await fetch(`${API_URL}/media/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: token
    }
  });

  loadMedia();
}

/* SEARCH */

function filterMedia() {
  const searchText = document.getElementById("searchInput").value.toLowerCase();

  const filtered = allMedia.filter((item) =>
    item.title.toLowerCase().includes(searchText)
  );

  displayMedia(filtered);
}

/* SMALL FIX FOR QUOTES IN EDIT */

function escapeText(text) {
  if (!text) return "";

  return text
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;");
}

/* START */

checkAuth();
loadMedia();