import { Link } from "react-router-dom";
import { movieKey } from "../api/api.js";
import "./MovieCard.css";

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movie/${movieKey(movie)}`} className="card">
      <div className="poster-wrap">
        {movie.poster ? (
          <img src={movie.poster} alt={movie.title} />
        ) : (
          <div className="poster-fallback">{movie.title}</div>
        )}
        <div className="rating-chip">★ {Number(movie.rating).toFixed(1)}</div>
      </div>
      <h3>{movie.title}</h3>
      <p>
        {movie.year}
        {movie.mediaType === "tv" ? " · TV" : movie.genres?.[0] ? ` · ${movie.genres[0]}` : ""}
      </p>
    </Link>
  );
}
