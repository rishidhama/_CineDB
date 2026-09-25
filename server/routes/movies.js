import express from "express";
import User from "../models/User.js";
import { optionalAuth, requireAuth } from "../Middleware/auth.js";
import {
  fromTmdbMovie,
  fetchPopular,
  fetchTopRated,
  fetchTrending,
  searchTmdb,
  discoverByGenre,
  fetchTmdbDetails,
  extraDetails,
} from "../tmdb.js";

const router = express.Router();

function mapList(items, mediaType) {
  return (items || [])
    .map((item) => fromTmdbMovie({ ...item, media_type: item.media_type || mediaType || "movie" }))
    .filter((movie) => movie.title && movie.tmdbId);
}

function parseRef(id) {
  const match = /^(movie|tv)-(\d+)$/.exec(id);
  if (!match) return null;
  return { mediaType: match[1], tmdbId: Number(match[2]) };
}

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

router.get("/", async (req, res) => {
  try {
    const { q, genre, list } = req.query;

    if (q) {
      const results = (await searchTmdb(q)).map(fromTmdbMovie);
      const filtered =
        genre && genre !== "All" ? results.filter((m) => m.genres.includes(genre)) : results;
      return res.json(filtered);
    }

    if (genre && genre !== "All") {
      return res.json(mapList(await discoverByGenre(genre), "movie"));
    }

    if (list === "top_rated") {
      return res.json(mapList(await fetchTopRated(), "movie"));
    }

    res.json(mapList(await fetchPopular(), "movie"));
  } catch (err) {
    res.status(500).json({ message: err.message || "Could not load movies" });
  }
});

router.get("/featured", async (_req, res) => {
    try {
      res.json(mapList(await fetchTrending(), "movie"));
    } catch (err) {
      res.status(500).json({ message: err.message || "Could not load featured movies" });
    }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const ref = parseRef(req.params.id);
    if (!ref) return res.status(400).json({ message: "Invalid movie id" });

    const raw = await fetchTmdbDetails(ref.tmdbId, ref.mediaType);
    const movie = fromTmdbMovie({ ...raw, media_type: ref.mediaType });
    if (!movie?.title) return res.status(404).json({ message: "Movie not found" });

    let inWatchlist = false;
    let myRating = 0;

    if (req.userId && User.db?.readyState === 1) {
      const user = await User.findById(req.userId);
      if (user) {
        inWatchlist = user.watchlist.some((item) => sameTitle(item, movie));
        myRating = user.ratings.find((item) => sameTitle(item, movie))?.score || 0;
        user.history = [
          { ...snapshot(movie), viewedAt: new Date() },
          ...user.history.filter((item) => !sameTitle(item, movie)),
        ].slice(0, 40);
        user.save().catch(() => {});
      }
    }

    res.json({ ...movie, ...extraDetails(raw), inWatchlist, myRating });
  } catch (err) {
    res.status(400).json({ message: "Could not load movie" });
  }
});

router.post("/:id/rate", requireAuth, async (req, res) => {
  try {
    const score = Number(req.body.score);
    if (score < 1 || score > 10) {
      return res.status(400).json({ message: "Score must be 1 to 10" });
    }

    const ref = parseRef(req.params.id);
    if (!ref) return res.status(400).json({ message: "Invalid movie id" });

    const movie = fromTmdbMovie({
      ...(await fetchTmdbDetails(ref.tmdbId, ref.mediaType)),
      media_type: ref.mediaType,
    });

    const user = await User.findById(req.userId);
    const existing = user.ratings.find((item) => sameTitle(item, movie));
    if (existing) existing.score = score;
    else user.ratings.push({ tmdbId: movie.tmdbId, mediaType: movie.mediaType, score });
    await user.save();

    res.json({
      ...movie,
      inWatchlist: user.watchlist.some((item) => sameTitle(item, movie)),
      myRating: score,
    });
  } catch (err) {
    res.status(400).json({ message: "Could not save rating" });
  }
});

export default router;