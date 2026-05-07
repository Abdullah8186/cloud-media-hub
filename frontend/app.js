const uploadForm = document.getElementById("uploadForm");
const mediaContainer = document.getElementById("mediaContainer");

const API_URL = "http://localhost:5001/api/media";

let notificationTimer;

async function loadMedia() {
    try {
        const response = await fetch(API_URL);
        const mediaItems = await response.json();

        mediaContainer.innerHTML = "";

        if (mediaItems.length === 0) {
            mediaContainer.innerHTML = `<p class="empty-message">No media uploaded yet.</p>`;
            return;
        }

        mediaItems.forEach(item => {
            const mediaId = item._id || item.id;

            const mediaCard = document.createElement("div");
            mediaCard.classList.add("media-card");

            mediaCard.innerHTML = `
                <img 
                    src="${item.imageUrl}" 
                    alt="media image"
                    onclick="openModal('${item.imageUrl}')"
                    style="cursor:pointer;"
                >

                <h3>${item.title}</h3>
                <p>${item.description}</p>

                <div class="button-group">
                    <button onclick="openUpdateModal('${mediaId}', '${item.title}', '${item.description}')">
                        Edit
                    </button>

                    <button onclick="deleteMedia('${mediaId}')">
                        Delete
                    </button>
                </div>
            `;

            mediaContainer.appendChild(mediaCard);
        });

    } catch (error) {
        showNotification("Failed to load media", "error");
    }
}

uploadForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const file = document.getElementById("mediaFile").files[0];
    const uploadButton = uploadForm.querySelector("button");

    if (!title || !description || !file) {
        showNotification("All fields are required", "error");
        return;
    }

    uploadButton.disabled = true;
    uploadButton.innerText = "Uploading...";

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("mediaFile", file);

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.message || "Upload failed", "error");
            return;
        }

        showNotification(data.message || "Media uploaded successfully", "success");
        uploadForm.reset();
        loadMedia();

    } catch (error) {
        showNotification("Upload failed", "error");
    } finally {
        uploadButton.disabled = false;
        uploadButton.innerText = "Upload Media";
    }
});

async function deleteMedia(id) {
    const confirmDelete = confirm("Are you sure you want to delete this media?");

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.message || "Delete failed", "error");
            return;
        }

        showNotification(data.message || "Media deleted successfully", "success");
        loadMedia();

    } catch (error) {
        showNotification("Delete failed", "error");
    }
}

const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const closeBtn = document.querySelector(".close");

function openModal(imageSrc) {
    modal.style.display = "block";
    modalImg.src = imageSrc;
}

closeBtn.onclick = function () {
    modal.style.display = "none";
};

window.onclick = function (event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

const updateModal = document.getElementById("updateModal");

function openUpdateModal(id, title, description) {
    updateModal.style.display = "block";

    document.getElementById("updateId").value = id;
    document.getElementById("updateTitle").value = title;
    document.getElementById("updateDescription").value = description;
}

function closeUpdateModal() {
    updateModal.style.display = "none";
}

async function submitUpdate() {
    const id = document.getElementById("updateId").value;
    const title = document.getElementById("updateTitle").value.trim();
    const description = document.getElementById("updateDescription").value.trim();

    if (!title || !description) {
        showNotification("Fields cannot be empty", "error");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                description
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showNotification(data.message || "Update failed", "error");
            return;
        }

        closeUpdateModal();
        showNotification(data.message || "Media updated successfully", "success");
        loadMedia();

    } catch (error) {
        showNotification("Update failed", "error");
    }
}

function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");

    clearTimeout(notificationTimer);

    notification.innerText = message;
    notification.className = "notification";

    if (type === "error") {
        notification.classList.add("error");
    } else {
        notification.classList.add("success");
    }

    notification.style.display = "block";

    notificationTimer = setTimeout(() => {
        notification.style.display = "none";
    }, 2000);
}

function searchMedia() {
    const input = document.getElementById("searchInput").value.toLowerCase();
    const cards = document.querySelectorAll(".media-card");

    cards.forEach(card => {
        const title = card.querySelector("h3").innerText.toLowerCase();

        if (title.includes(input)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

loadMedia();