import express from "express";
import {
  fromTmdbMovie,
  fetchPopular,
  fetchTopRated,
  fetchTrending,
  discoverByGenre,
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

export default router;