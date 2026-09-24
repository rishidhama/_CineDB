import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

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

        <form className="search" onSubmit={onSearch}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search movies, TV, actors, directors"
          />

          <button type="submit">Search</button>
        </form>

      </div>
    </header>
  );
}