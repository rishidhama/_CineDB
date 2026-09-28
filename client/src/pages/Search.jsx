import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getFeatured, getMovies, movieKey } from "../api/api.js";
import MovieCard from "../components/MovieCard.jsx";
import MovieRow from "../components/MovieRow.jsx";

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
  const [popular, setPopular] = useState([]);
  const [trending, setTrending] = useState([]);
  const [tv, setTv] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const browse = !q && genre === "All";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setMovies([]);

    async function load() {
      try {
        if (browse) {
          const [pop, trend, shows] = await Promise.all([
            getMovies(),
            getFeatured().catch(() => getMovies({ list: "trending" })),
            getMovies({ list: "tv_popular" }),
          ]);
          if (cancelled) return;
          setPopular(pop);
          setTrending(trend);
          setTv(shows);
        } else {
          const data = await getMovies({
            ...(q ? { q } : {}),
            ...(genre !== "All" ? { genre } : {}),
          });
          if (cancelled) return;
          setMovies(data);
          setPopular([]);
          setTrending([]);
          setTv([]);
        }
      } catch (err) {
        if (!cancelled) {
          setMovies([]);
          setPopular([]);
          setTrending([]);
          setTv([]);
          setError(err.message || "Search failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [q, genre, browse]);

  return (
    <div className="page container">
      <h1 className="page-title">{q ? `Results for “${q}”` : "Browse"}</h1>
      <p className="page-sub">
        {q
          ? "Search any movie, TV show, actor, or director on TMDB."
          : "Popular movies, trending titles, and TV — or pick a genre."}
      </p>

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

      {!loading && !error && browse && (
        <>
          <MovieRow title="Popular movies" movies={popular} />
          <MovieRow title="Trending this week" movies={trending} />
          <MovieRow title="Popular TV" movies={tv} />
        </>
      )}

      {!loading && !error && !browse && movies.length > 0 && (
        <div className="grid">
          {movies.map((movie) => (
            <MovieCard key={movie._id || movieKey(movie)} movie={movie} />
          ))}
        </div>
      )}
      {!loading && !error && !browse && movies.length === 0 && (
        <div className="empty">
          {q
            ? "Nothing matched that search. Try another title or name."
            : "Nothing in that genre right now."}
        </div>
      )}

      <style>{`
        .genre-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }
        .page .row {
          padding-left: 0;
          padding-right: 0;
        }
        .page .row .container {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
