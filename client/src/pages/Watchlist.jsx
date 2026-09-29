import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { getWatchlist, movieKey, removeFromWatchlist } from "../api/api.js";
import MovieCard from "../components/MovieCard.jsx";

export default function Watchlist() {
  const { user, ready } = useAuth();
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setMovies([]);
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    getWatchlist()
      .then(setMovies)
      .catch((err) => {
        setMovies([]);
        setError(err.message || "Could not load watchlist");
      })
      .finally(() => setLoading(false));
  }, [user]);

  async function onRemove(movie) {
    const key = movieKey(movie);
    const previous = movies;
    setMovies((list) => list.filter((item) => movieKey(item) !== key));
    try {
      await removeFromWatchlist(movie);
    } catch (err) {
      setMovies(previous);
      setError(err.message || "Could not remove from watchlist");
    }
  }

  if (!ready) return <p className="loading">Loading...</p>;

  if (!user) {
    return (
      <div className="page container">
        <h1 className="page-title">Watchlist</h1>
        <div className="empty">
          <p>Please sign in to save titles.</p>
          <p style={{ marginTop: 16 }}>
            <Link className="btn btn-gold" to="/signin">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page container">
      <h1 className="page-title">Watchlist</h1>
      <p className="page-sub">Titles you saved to watch later.</p>
      {loading && <p className="loading">Loading watchlist...</p>}
      {error && <div className="empty">{error}</div>}
      {!loading && !error && movies.length ? (
        <div className="grid">
          {movies.map((movie) => (
            <div className="list-card" key={movieKey(movie)}>
              <MovieCard movie={movie} />
              <button
                type="button"
                className="list-card-remove"
                onClick={() => onRemove(movie)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {!loading && !error && !movies.length && (
        <div className="empty">
          <p>Your watchlist is empty.</p>
        </div>
      )}
    </div>
  );
}
