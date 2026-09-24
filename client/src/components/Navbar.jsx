import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  // const { user, logout } = useAuth();

  function onSearch(e) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="logo">
          <span className="logo-badge">Cine</span>
          <span>DB</span>
        </Link>
{/* 
        <form className="search" onSubmit={onSearch}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search movies, TV, actors, directors"
          />
          <button type="submit">Search</button>
        </form> */}

        <nav className="links">
          <Link to="/watchlist">Watchlist</Link>
          {/* {user && <Link to="/history">History</Link>}
          {user ? (
            <>
                <span className="user-name">John Doe</span>
              <button className="signout" type="button" onClick={() => {}}>
                Sign out
              </button>
            </>
          ) : (
            <Link to="/signin" className="signin-link">
              Sign in
            </Link>
          )} */}
        </nav>
      </div>
    </header>
  );
}
