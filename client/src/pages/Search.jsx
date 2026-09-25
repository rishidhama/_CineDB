import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getMovies, movieKey } from "../api/api.js";
import MovieCard from "../components/MovieCard.jsx";

const GENRES = [
  "All",
  "Action",
  "Drama",
  "Sci-Fi",
  "Comedy",
  "Animation",
  "Thriller",
  "Crime",
  "Horror",
  "Family",
];

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [genre, setGenre] = useState("All");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!q && genre === "All") {
      setMovies([]);
      return;
    }
    setLoading(true);
    setError("");
    getMovies({
      ...(q ? { q } : {}),
      ...(genre !== "All" ? { genre } : {}),
    })
      .then(setMovies)
      .catch((err) => {
        setMovies([]);
        setError(err.message || "Search failed");
      })
      .finally(() => setLoading(false));
  }, [q, genre]);

  return (
    <div className="page container">
      <h1 className="page-title">{q ? `Results for “${q}”` : "Browse"}</h1>
      <p className="page-sub">Search any movie, TV show, actor, or director on TMDB.</p>

      <div className="genre-bar">
        {GENRES.map((g) => (
          <button
            key={g}
            className={`btn btn-ghost ${genre === g ? "active" : ""}`}
            onClick={() => setGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {loading && <p className="loading">Searching...</p>}
      {error && <div className="empty">{error}</div>}
      {!loading && !error && movies.length > 0 && (
        <div className="grid">
          {movies.map((movie) => (
            <MovieCard key={movie._id || movieKey(movie)} movie={movie} />
          ))}
        </div>
      )}
      {!loading && !error && q && movies.length === 0 && (
        <div className="empty">Nothing matched that search. Try another title or name.</div>
      )}

      <style>{`
        .genre-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }
      `}</style>
    </div>
  );
}
