import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { getRatings, movieKey } from "../api/api.js";
import MovieCard from "../components/MovieCard.jsx";

export default function Ratings() {
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
    getRatings()
      .then(setMovies)
      .catch((err) => {
        setMovies([]);
        setError(err.message || "Could not load ratings");
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!ready) return <p className="loading">Loading...</p>;

  if (!user) {
    return (
      <div className="page container">
        <h1 className="page-title">My ratings</h1>
        <div className="empty">
          <p>Please sign in to rate titles and see them here.</p>
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
      <h1 className="page-title">My ratings</h1>
      <p className="page-sub">Your scores next to TMDB’s average for each title.</p>
      {loading && <p className="loading">Loading ratings...</p>}
      {error && <div className="empty">{error}</div>}
      {!loading && !error && movies.length ? (
        <div className="grid">
          {movies.map((movie) => (
            <MovieCard key={movieKey(movie)} movie={movie} myScore={movie.myRating} />
          ))}
        </div>
      ) : null}
      {!loading && !error && !movies.length && (
        <div className="empty">
          <p>You have not rated anything yet.</p>
        </div>
      )}
    </div>
  );
}
