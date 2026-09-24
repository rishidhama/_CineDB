import { Link } from "react-router-dom";
import { movieKey } from "../api.js";
import "./Hero.css";

export default function Hero({ movie }) {
  if (!movie) return null;

  return (
    <section
      className="hero"
      style={{ backgroundImage: `url(${movie.backdrop || movie.poster})` }}
    >
      <div className="hero-overlay" />
      <div className="hero-content">
        <p className="eyebrow">Featured tonight</p>
        <h1>{movie.title}</h1>
        <p className="meta">
          ★ {Number(movie.rating).toFixed(1)}
          {movie.year ? ` · ${movie.year}` : ""}
          {movie.runtime ? ` · ${movie.runtime}` : ""}
          {movie.genres?.length ? ` · ${movie.genres.join(" • ")}` : ""}
        </p>
        <p className="plot">{movie.plot}</p>
        <Link className="btn btn-gold" to={`/movie/${movieKey(movie)}`}>
          View details
        </Link>
      </div>
    </section>
  );
}
