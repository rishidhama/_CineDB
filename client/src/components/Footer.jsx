import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link to="/" className="logo">
            <span className="logo-badge">Cine</span>
            <span>DB</span>
          </Link>
          <p>An IMDb-style browser for movies and TV, powered by TMDB.</p>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/search">Browse</Link>
          <Link to="/watchlist">Watchlist</Link>
          <Link to="/signin">Sign in</Link>
        </nav>

        <p className="footer-note">
          This product uses the TMDB API but is not endorsed or certified by TMDB.
          <br />
          © {year} CineDB
        </p>
      </div>
    </footer>
  );
}
