import MovieCard from "./MovieCard.jsx";
import "./MovieRow.css";

export default function MovieRow({ title, movies }) //movies-(array containing movie)
{
  if (!movies?.length) return null;

  return (
    <section className="row">
      <div className="container">
        <h2>{title}</h2>
        <div className="row-track">
          {movies.map((movie) => (
            <div className="row-item" key={`${movie.mediaType || "movie"}-${movie.tmdbId}`}>
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
