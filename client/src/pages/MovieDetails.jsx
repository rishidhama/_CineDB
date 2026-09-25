import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMovie, rateMovie, toggleWatchlist } from "../api/api.js";
import { useAuth } from "../AuthContext.jsx";
import "./MovieDetails.css";

export default function MovieDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [movie, setMovie] = useState(null);
  const [saved, setSaved] = useState(false);
  const [picked, setPicked] = useState(0);
  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMovie(null);
    setError("");
    getMovie(id)
      .then((data) => {
        setMovie(data);
        setSaved(Boolean(data.inWatchlist));
        setPicked(data.myRating || 0);
      })
      .catch((err) => setError(err.message || "Movie not found"));
  }, [id, user]);

  if (error) return <p className="loading">{error}</p>;
  if (!movie) return <p className="loading">Loading...</p>;

  async function onRate(score) {
    if (!user) {
      setMessage("Sign in to rate this movie.");
      return;
    }
    setPicked(score);
    await rateMovie(movie, score);
    setMovie((prev) => ({ ...prev, myRating: score }));
    setMessage("Thanks for rating!");
  }

  async function onWatchlist() {
    if (!user) {
      setMessage("Sign in to save a watchlist.");
      return;
    }
    const result = await toggleWatchlist(movie);
    setSaved(result.saved);
  }

  return (
    <div
      className="details"
      style={{ backgroundImage: `url(${movie.backdrop || movie.poster})` }}
    >
      <div className="details-shade" />
      <div className="container details-body">
        {movie.poster ? (
          <img className="details-poster" src={movie.poster} alt={movie.title} />
        ) : (
          <div className="details-poster fallback">{movie.title}</div>
        )}
        <div>
          <h1>
            {movie.title} <span>({movie.year})</span>
          </h1>
          <p className="facts">
            {[movie.runtime, (movie.genres || []).join(" • ")].filter(Boolean).join(" · ")}
          </p>
          <div className="score-box">
            <strong>★ {Number(movie.rating).toFixed(1)}</strong>
            <span>/ 10 · {Number(movie.votes || 0).toLocaleString()} votes</span>
          </div>
          <p className="story">{movie.plot}</p>
          {movie.director && (
            <p>
              <b>Director</b>{" "}
              <Link className="person-link" to={`/search?q=${encodeURIComponent(movie.director)}`}>
                {movie.director}
              </Link>
            </p>
          )}

          <div className="actions">
            <button className={`btn ${saved ? "btn-gold" : "btn-ghost"}`} onClick={onWatchlist}>
              {saved ? "In watchlist" : "+ Watchlist"}
            </button>
            {!user && (
              <Link className="btn btn-gold" to="/signin">
                Sign in
              </Link>
            )}
          </div>

          <div className="rate">
            <p>Rate this movie</p>
            <div className="stars">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={n <= picked ? "on" : ""}
                  onClick={() => onRate(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            {message && <small>{message}</small>}
          </div>
        </div>
      </div>

      <div className="container details-extra">
        {movie.cast?.length > 0 && (
          <section className="detail-block">
            <h2>Cast</h2>
            <div className="cast-row">
              {movie.cast.map((person) => {
                const name = person.name || person;
                const photo = person.photo || "";
                const character = person.character || "";
                return (
                  <Link
                    key={person.id || name}
                    className="cast-card"
                    to={`/search?q=${encodeURIComponent(name)}`}
                  >
                    <div className="cast-photo">
                      {photo ? (
                        <img src={photo} alt={name} referrerPolicy="no-referrer" />
                      ) : (
                        <div className="cast-fallback" aria-hidden="true">
                          {String(name)
                            .split(" ")
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")}
                        </div>
                      )}
                    </div>
                    <strong>{name}</strong>
                    {character ? <span>{character}</span> : null}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {movie.photos?.length > 0 && (
          <section className="detail-block">
            <h2>Photos</h2>
            <div className="photo-grid">
              {movie.photos.map((src) => (
                <button key={src} type="button" className="photo-btn" onClick={() => setPhoto(src)}>
                  <img src={src} alt={`${movie.title} still`} />
                </button>
              ))}
            </div>
          </section>
        )}

        {movie.parentsGuide && (
          <section className="detail-block">
            <h2>Parents guide</h2>
            <div className="guide-card">
              <div className="guide-rating">{movie.parentsGuide.certification}</div>
              <div>
                <p className="guide-summary">{movie.parentsGuide.summary}</p>
                {movie.parentsGuide.notes?.length > 0 ? (
                  <ul className="guide-notes">
                    {movie.parentsGuide.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="guide-empty">No extra content tags were listed for this title.</p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>

      {photo && (
        <button type="button" className="lightbox" onClick={() => setPhoto("")}>
          <img src={photo} alt="Full size still" />
        </button>
      )}
    </div>
  );
}
