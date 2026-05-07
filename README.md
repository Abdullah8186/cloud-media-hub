# Cloud Media Hub

Cloud Media Hub is a cloud-native multimedia sharing platform developed for CW2 coursework.  
The application allows users to upload, view, update, search, and delete media files through a responsive web interface.

---

# Features

## User Features

- Upload image files
- View uploaded media
- Edit media title and description
- Delete media
- Search media by title
- Image preview modal
- Upload validation
- Responsive modern UI
- Success and error notifications

---

# Technologies Used

## Frontend
- HTML5
- CSS3
- JavaScript

## Backend
- Node.js
- Express.js
- Multer
- CORS

## Cloud & Database
- Microsoft Azure
- MongoDB
- Azure Blob Storage (planned deployment)

---

# Security Features

- File type validation
- Upload size limits
- Input validation
- Error handling
- Secure API structure

---

# Project Structure

```bash
cloud-media-hub/
│
├── backend/
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│
├── README.md