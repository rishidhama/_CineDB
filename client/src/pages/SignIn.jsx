import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import "./Auth.css";

export default function SignIn() {
  const { login } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.target);
    try {
      await login(form.get("email"), form.get("password"));
      navigate("/");
    } catch (err) {
      e.target.querySelector(".auth-error").textContent = err.message;
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Sign in</h1>
        <p>Use your CineDB account to rate movies and save a watchlist.</p>
        <label>
          Email
          <input name="email" type="email" required />
        </label>
        <label>
          Password
          <input name="password" type="password" required />
        </label>
        <p className="auth-error" />
        <button className="btn btn-gold" type="submit">
          Sign in
        </button>
        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
