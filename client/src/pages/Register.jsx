import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import "./Auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      await register(form.get("name"), form.get("email"), form.get("password"));
      navigate("/");
    } catch (err) {
      e.target.querySelector(".auth-error").textContent = err.message;
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Create account</h1>
        <p>Save a watchlist and rate titles from TMDB.</p>
        <label>
          Name
          <input name="name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength="6" required />
        </label>
        <p className="auth-error" />
        <button className="btn btn-gold" type="submit">
          Create account
        </button>
        <p className="auth-switch">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
