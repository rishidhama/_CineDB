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

function snapshot(movie) {
  return {
    tmdbId: movie.tmdbId,
    mediaType: movie.mediaType || "movie",
    title: movie.title,
    poster: movie.poster,
    rating: movie.rating,
    year: movie.year,
    genres: movie.genres || [],
  };
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.watchlist || []);
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not load watchlist" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const movie = snapshot(req.body);
    if (!movie.tmdbId) return res.status(400).json({ message: "Invalid movie" });

    const exists = user.watchlist.some((item) => sameTitle(item, movie));
    if (exists) {
      user.watchlist = user.watchlist.filter((item) => !sameTitle(item, movie));
    } else {
      user.watchlist.unshift(movie);
    }
    await user.save();
    res.json({ saved: !exists, watchlist: user.watchlist });
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not update watchlist" });
  }
});

function parseRef(id) {
  const match = /^(movie|tv)-(\d+)$/.exec(id);
  if (!match) return null;
  return { mediaType: match[1], tmdbId: Number(match[2]) };
}

router.delete("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.watchlist = [];
    await user.save();
    res.json({ saved: false, watchlist: [] });
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not clear watchlist" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const ref = parseRef(req.params.id);
    if (!ref) return res.status(400).json({ message: "Invalid movie id" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.watchlist = (user.watchlist || []).filter((item) => !sameTitle(item, ref));
    await user.save();
    res.json({ saved: false, watchlist: user.watchlist });
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not remove from watchlist" });
  }
});

export default router;
