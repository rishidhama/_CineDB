export function movieKey(movie) {
    return `${movie.mediaType} || "movie"-${movie.tmdbID}`;
}

const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const MOVIES = `${API}/api/movies`;
const AUTH = `${API}/api/auth`;
const WATCHLIST = `${API}/api/watchlist`;
const HISTORY = `${API}/api/history`;

function authHeaders() {
    const token = localStorage.getItem("cinedb-token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function readError(res, fallback) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || fallback);
}

export async function getMovies(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${MOVIES}${query ? `?${query}` : ""}`);
    if (!res.ok) await readError(res, "Could not load movies");
    return res.json();
}

export async function getFeatured() {
    const res = await fetch(`${MOVIES}/featured`);
    if (!res.ok) await readError(res, "Could not load featured movies");
    return res.json();
}

export async function loginRequest(email, password) {
    const res = await fetch(`${AUTH}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) await readError(res, "Could not sign in");
    return res.json();
}

export async function registerRequest(name, email, password) {
    const res = await fetch(`${AUTH}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) await readError(res, "Could not create account");
    return res.json();
}

export async function getMe() {
    const token = localStorage.getItem("cinedb-token");
    if (!token) throw new Error("No session");
    const res = await fetch(`${AUTH}/me`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Please sign in");
    return res.json();
}