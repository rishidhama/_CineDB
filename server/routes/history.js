import express from "express";
import { requireAuth } from "../Middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

function sameTitle(entry, movie) {
  return (
    Number(entry.tmdbId) === Number(movie.tmdbId) &&
    (entry.mediaType || "movie") === (movie.mediaType || "movie")
  );
}

function parseRef(id) {
  const match = /^(movie|tv)-(\d+)$/.exec(id);
  if (!match) return null;
  return { mediaType: match[1], tmdbId: Number(match[2]) };
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.history || []);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not load history" });
  }
});

router.delete("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.history = [];
    await user.save();
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not clear history" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const ref = parseRef(req.params.id);
    if (!ref) return res.status(400).json({ message: "Invalid movie id" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.history = (user.history || []).filter((item) => !sameTitle(item, ref));
    await user.save();
    res.json(user.history);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not remove from history" });
  }
});

export default router;
