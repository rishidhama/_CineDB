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
  const [messageKind, setMessageKind] = useState("");
  const [photo, setPhoto] = useState("");
  const [showTrailer, setShowTrailer] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMovie(null);
    setError("");
    setShowTrailer(false);
    setPhoto("");
    setMessage("");
    setMessageKind("");
    getMovie(id)
      .then((data) => {
        setMovie(data);
        setSaved(Boolean(data.inWatchlist));
        setPicked(data.myRating || 0);
      })
      .catch((err) => setError(err.message || "Movie not found"));
  }, [id, user]);

  useEffect(() => {
    if (!showTrailer) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setShowTrailer(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showTrailer]);

  if (error) return <p className="loading">{error}</p>;
  if (!movie) return <p className="loading">Loading...</p>;

  async function onRate(score) {
    if (!user) {
      setMessageKind("error");
      setMessage("Sign in to rate this movie.");
      return;
    }
    const previous = picked;
    setPicked(score);
    try {
      await rateMovie(movie, score);
      setMovie((prev) => ({ ...prev, myRating: score }));
      setMessageKind("");
      setMessage("Saved to My ratings.");
    } catch (err) {
      setPicked(previous);
      setMessageKind("error");
      setMessage(err.message || "Could not save rating.");
    }
  }

  async function onWatchlist() {
    if (!user) {
      setMessageKind("error");
      setMessage("Sign in to save a watchlist.");
      return;
    }
    try {
      const result = await toggleWatchlist(movie);
      setSaved(result.saved);
      setMessageKind("");
      setMessage(result.saved ? "Added to watchlist." : "Removed from watchlist.");
    } catch (err) {
      setMessageKind("error");
      setMessage(err.message || "Could not update watchlist.");
    }
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
            <span>/ 10 TMDB · {Number(movie.votes || 0).toLocaleString()} votes</span>
          </div>
          {picked > 0 && (
            <p className="my-score">Your rating · {picked} / 10</p>
          )}
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
            {movie.trailer && (
              <button className="btn btn-gold" type="button" onClick={() => setShowTrailer(true)}>
                ▶ Watch trailer
              </button>
            )}
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
            {message && <small className={messageKind === "error" ? "is-error" : ""}>{message}</small>}
            {user && (
              <p className="ratings-link">
                <Link className="person-link" to="/ratings">
                  View my ratings
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container details-extra">
        {movie.trailer && (
          <section className="detail-block">
            <h2>Trailer</h2>
            <div className="trailer-frame">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${movie.trailer}`}
                title={`${movie.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </section>
        )}

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

      {showTrailer && movie.trailer && (
        <div
          className="lightbox trailer-lightbox"
          onClick={() => setShowTrailer(false)}
          role="presentation"
        >
          <div className="trailer-modal" onClick={(event) => event.stopPropagation()}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${movie.trailer}?autoplay=1`}
              title={`${movie.title} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
