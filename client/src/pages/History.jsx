import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getHistory, movieKey } from "../api/api.js";
import MovieCard from "../components/MovieCard";

export default function History() {
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
    getHistory()
      .then(setMovies)
      .catch((err) => {
        setMovies([]);
        setError(err.message || "Could not load history");
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!ready) return <p className="loading">Loading...</p>;

  if (!user) {
    return (
      <div className="page container">
        <h1 className="page-title">Watch history</h1>
        <div className="empty">
          <p>Please login to see your history.</p>
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
      <h1 className="page-title">Watch history</h1>
      <p className="page-sub">Titles you opened while signed in.</p>
      {loading && <p className="loading">Loading history...</p>}
      {error && <div className="empty">{error}</div>}
      {!loading && !error && movies.length ? (
        <div className="grid">
          {movies.map((movie) => (
            <MovieCard key={movieKey(movie)} movie={movie} />
          ))}
        </div>
      ) : null}
      {!loading && !error && !movies.length && (
        <div className="empty">
          <p>No history yet.</p>
        </div>
      )}
    </div>
  );
}
