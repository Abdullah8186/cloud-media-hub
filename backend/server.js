const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

app.use("/uploads", express.static("uploads"));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG, JPEG and GIF images are allowed."));
        }
    }
});

let mediaItems = [];

app.get("/", (req, res) => {
    res.send("Cloud Media Hub API is running");
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Backend server is working"
    });
});

app.post("/api/media", (req, res) => {
    upload.single("mediaFile")(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                message: "File is too large. Maximum size is 5MB."
            });
        }

        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }

        if (!req.body.title || !req.body.description) {
            return res.status(400).json({
                message: "Title and description are required."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Please select an image file."
            });
        }

        const newMedia = {
            id: Date.now(),
            title: req.body.title,
            description: req.body.description,
            fileName: req.file.filename,
            imageUrl: `http://localhost:${PORT}/uploads/${req.file.filename}`
        };

        mediaItems.push(newMedia);

        res.status(201).json({
            message: "Media uploaded successfully",
            media: newMedia
        });
    });
});

app.get("/api/media", (req, res) => {
    res.json(mediaItems);
});

app.put("/api/media/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const mediaItem = mediaItems.find(item => item.id === id);

    if (!mediaItem) {
        return res.status(404).json({
            message: "Media not found."
        });
    }

    if (!req.body.title || !req.body.description) {
        return res.status(400).json({
            message: "Title and description are required."
        });
    }

    mediaItem.title = req.body.title;
    mediaItem.description = req.body.description;

    res.json({
        message: "Media updated successfully",
        media: mediaItem
    });
});

app.delete("/api/media/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const mediaToDelete = mediaItems.find(item => item.id === id);

    if (mediaToDelete) {
        const filePath = path.join(__dirname, "uploads", mediaToDelete.fileName);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    mediaItems = mediaItems.filter(item => item.id !== id);

    res.json({
        message: "Media deleted successfully"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});