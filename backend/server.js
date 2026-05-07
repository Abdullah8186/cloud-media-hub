require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* =========================
   USER MODEL
========================= */

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String
});

const User = mongoose.model("User", userSchema);

/* =========================
   MEDIA MODEL
========================= */

const mediaSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  createdBy: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Media = mongoose.model("Media", mediaSchema);

/* =========================
   MULTER
========================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/* =========================
   AUTH MIDDLEWARE
========================= */

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    const verified = jwt.verify(token, "secretkey");
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

/* =========================
   AUTH ROUTES
========================= */

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.json({
      message: "User registered successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        message: "Invalid password"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email
      },
      "secretkey"
    );

    res.json({
      token,
      username: user.username
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   MEDIA ROUTES
========================= */

app.get("/api/media", async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });
    res.json(media);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post(
  "/api/media",
  verifyToken,
  upload.single("image"),
  async (req, res) => {

    try {

      const newMedia = new Media({
        title: req.body.title,
        description: req.body.description,
        imageUrl: `http://localhost:5001/uploads/${req.file.filename}`,
        createdBy: req.user.email
      });

      await newMedia.save();

      res.json(newMedia);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.put("/api/media/:id", verifyToken, async (req, res) => {

  try {

    const updatedMedia = await Media.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description
      },
      { new: true }
    );

    res.json(updatedMedia);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/media/:id", verifyToken, async (req, res) => {

  try {

    await Media.findByIdAndDelete(req.params.id);

    res.json({
      message: "Media deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   SERVER
========================= */

const PORT = 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});