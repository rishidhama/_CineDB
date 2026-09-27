import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { getWatchlist, movieKey } from "../api/api.js";
import MovieCard from "../components/MovieCard.jsx";

export default function Watchlist() {
  const { user, ready } = useAuth();
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    if (!user) {
      setMovies([]);
      return;
    }
    getWatchlist().then(setMovies).catch(() => setMovies([]));
  }, [user]);

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
      {movies.length ? (
        <div className="grid">
          {movies.map((movie) => (
            <MovieCard key={movieKey(movie)} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>Your watchlist is empty.</p>
        </div>
      )}
    </div>
  );
}
