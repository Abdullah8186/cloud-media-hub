require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

app.use("/uploads", express.static("uploads"));

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected");
    } catch (error) {
        console.log("MongoDB Connection Error:", error);
    }
}

connectDB();

const mediaSchema = new mongoose.Schema({
    title: String,
    description: String,
    fileName: String,
    imageUrl: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Media = mongoose.model("Media", mediaSchema);

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

        const extname = allowedTypes.test(
            path.extname(file.originalname).toLowerCase()
        );

        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG, JPEG and GIF images are allowed."));
        }
    }
});

app.get("/", (req, res) => {
    res.send("Cloud Media Hub API is running");
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Backend server is working"
    });
});

app.get("/api/media", async (req, res) => {
    try {
        const mediaItems = await Media.find().sort({ createdAt: -1 });
        res.json(mediaItems);
    } catch (error) {
        console.log("FETCH MEDIA ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
});

app.post("/api/media", (req, res) => {
    upload.single("mediaFile")(req, res, async function (err) {
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

        try {
            const newMedia = new Media({
                title: req.body.title,
                description: req.body.description,
                fileName: req.file.filename,
                imageUrl: `http://localhost:${PORT}/uploads/${req.file.filename}`
            });

            await newMedia.save();

            res.status(201).json({
                message: "Media uploaded successfully",
                media: newMedia
            });

        } catch (error) {
            console.log("UPLOAD ERROR:", error);

            res.status(500).json({
                message: error.message
            });
        }
    });
});

app.put("/api/media/:id", async (req, res) => {
    try {
        if (!req.body.title || !req.body.description) {
            return res.status(400).json({
                message: "Title and description are required."
            });
        }

        const updatedMedia = await Media.findByIdAndUpdate(
            req.params.id,
            {
                title: req.body.title,
                description: req.body.description
            },
            { new: true }
        );

        if (!updatedMedia) {
            return res.status(404).json({
                message: "Media not found."
            });
        }

        res.json({
            message: "Media updated successfully",
            media: updatedMedia
        });

    } catch (error) {
        console.log("UPDATE ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
});

app.delete("/api/media/:id", async (req, res) => {
    try {
        const mediaToDelete = await Media.findById(req.params.id);

        if (mediaToDelete) {
            const filePath = path.join(
                __dirname,
                "uploads",
                mediaToDelete.fileName
            );

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Media.findByIdAndDelete(req.params.id);

        res.json({
            message: "Media deleted successfully"
        });

    } catch (error) {
        console.log("DELETE ERROR:", error);

        res.status(500).json({
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});