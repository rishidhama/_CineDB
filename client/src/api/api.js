export function movieKey(movie) {
    return `${movie.mediaType || "movie"}-${movie.tmdbId}`;
}

const API = (
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? "https://cinedb-5kbh.onrender.com" : "")
).replace(/\/$/, "");
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

async function apiFetch(url, options = {}, timeoutMs = 25000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        return res;
    } catch (err) {
        if (err.name === "AbortError") {
            throw new Error("The server took too long. Render may be waking up — try again.");
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

export async function getMovies(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await apiFetch(`${MOVIES}${query ? `?${query}` : ""}`);
    if (!res.ok) await readError(res, "Could not load movies");
    return res.json();
}

export async function getFeatured() {
    const res = await apiFetch(`${MOVIES}/featured`);
    if (!res.ok) await readError(res, "Could not load featured movies");
    return res.json();
}

export async function getMovie(id) {
    const res = await apiFetch(`${MOVIES}/${id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Movie not found");
    return res.json();
}

export async function rateMovie(movie, score) {
    const res = await apiFetch(`${MOVIES}/${movieKey(movie)}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ score }),
    });
    if (!res.ok) await readError(res, "Could not save rating");
    return res.json();
}

export async function getWatchlist() {
    const res = await apiFetch(WATCHLIST, { headers: authHeaders() });
    if (!res.ok) await readError(res, "Please sign in to view your watchlist");
    return res.json();
}

export async function toggleWatchlist(movie) {
    const res = await apiFetch(WATCHLIST, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(movie),
    });
    if (!res.ok) await readError(res, "Please sign in to use the watchlist");
    return res.json();
}

export async function getHistory() {
    const res = await apiFetch(HISTORY, { headers: authHeaders() });
    if (!res.ok) await readError(res, "Please sign in to view history");
    return res.json();
}

export async function loginRequest(email, password) {
    const res = await apiFetch(`${AUTH}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) await readError(res, "Could not sign in");
    return res.json();
}

export async function registerRequest(name, email, password) {
    const res = await apiFetch(`${AUTH}/register`, {
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
    const res = await apiFetch(`${AUTH}/me`, { headers: authHeaders() }, 8000);
    if (!res.ok) throw new Error("Please sign in");
    return res.json();
}
