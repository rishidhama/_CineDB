import express from "express";
import User from "../models/User.js";
import { optionalAuth, requireAuth } from "../Middleware/auth.js";
import {
  fromTmdbMovie,
  fetchPopular,
  fetchTopRated,
  fetchTrending,
  fetchPopularTv,
  fetchTrendingTv,
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

    if (list === "trending") {
      return res.json(mapList(await fetchTrending(), "movie"));
    }

    if (list === "tv" || list === "tv_popular") {
      return res.json(mapList(await fetchPopularTv(), "tv"));
    }

    if (list === "tv_trending") {
      return res.json(mapList(await fetchTrendingTv(), "tv"));
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

router.get("/ratings", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const items = await Promise.all(
      [...(user.ratings || [])].reverse().map(async (entry) => {
        const base = {
          tmdbId: entry.tmdbId,
          mediaType: entry.mediaType || "movie",
          title: entry.title || "",
          poster: entry.poster || "",
          rating: entry.rating || 0,
          year: entry.year || 0,
          genres: entry.genres || [],
          myRating: entry.score,
        };
        if (base.title || !base.tmdbId) return base;
        try {
          const raw = await fetchTmdbDetails(base.tmdbId, base.mediaType);
          return { ...fromTmdbMovie({ ...raw, media_type: base.mediaType }), myRating: entry.score };
        } catch {
          return base;
        }
      })
    );

    res.json(items.filter((movie) => movie.tmdbId));
  } catch (err) {
    res.status(400).json({ message: "Could not load ratings" });
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
    const snap = { ...snapshot(movie), score };
    const existing = user.ratings.find((item) => sameTitle(item, movie));
    if (existing) Object.assign(existing, snap);
    else user.ratings.push(snap);
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