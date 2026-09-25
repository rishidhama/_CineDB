import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken, requireAuth } from "../Middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || password.length < 6) {
      return res.status(400).json({ message: "Name, email, and a password of 6+ characters are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "An account with that email already exists" });

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      watchlist: [],
      ratings: [],
      history: [],
    });

    res.status(201).json({
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Register failed:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "An account with that email already exists" });
    }
    res.status(400).json({ message: err.message || "Could not create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Email or password is incorrect" });
    }

    res.json({
      token: signToken(user._id),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(400).json({ message: "Could not sign in" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ id: user._id, name: user.name, email: user.email });
});

export default router;
