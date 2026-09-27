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
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.watchlist || []);
});

router.post("/", requireAuth, async (req, res) => {
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
});

export default router;
