const BASE = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/';

const GENRE_BY_ID = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    27: "Horror",
    9648: "Mystery",
    10749: "Romance",
    878: "Sci-Fi",
    53: "Thriller",
};

const ID_BY_GENRE = Object.fromEntries(Object.entries(GENRE_BY_ID).map(([id, name]) => [name, Number(id)]));

function apiKey() {
    const key = process.env.TMDB_API_KEY;
    if (!key || key === "your_tmdb_api_key") {
        throw new Error("TMDB_API_KEY is not set");
    }
    return key;
}

const cache = new Map();
const CACHE_MS = 10 * 60 * 1000;

async function tmdb(path, params = {}) {
    const url = new URL(`${BASE}${path}`);
    url.searchParams.set("api_key", apiKey());
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== "") url.searchParams.set(key, value);
    });

    const cacheKey = url.toString();
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let res;
    try {
        res = await fetch(url, { signal: controller.signal });
    } catch (err) {
        if (err.name === "AbortError") throw new Error("TMDB request timed out");
        throw err;
    } finally {
        clearTimeout(timer);
    }
    if (!res.ok) throw new Error("TMDB request failed");
    const data = await res.json();
    cache.set(cacheKey, { at: Date.now(), data });
    return data;
}

function posterUrl(path) {
    return path ? `${IMG}/w500${path}` : "";
}
function backdropUrl(path) {
    return path ? `${IMG}/original${path}` : "";
}

function profileUrl(path) {
    return path ? `${IMG}/w185${path}` : "";
}

function mapCast(credits) {
    return (credits?.cast || []).slice(0, 12).map((person) => ({
        id: person.id,
        name: person.name,
        character: person.character || "",
        photo: profileUrl(person.profile_path),
    }));
}

function minutesToRuntime(mins) {
    if (!mins) return "";
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function fromTmdbMovie(movie) {
    const mediaType = movie.media_type === "tv" ? "tv" : "movie";
    const title = movie.title || movie.name || "";
    const date = movie.release_date || movie.first_air_date || "";
    const genres = movie.genres
        ? movie.genres.map((g) => GENRE_BY_ID[g.id] || g.name)
        : (movie.genre_ids || []).map((id) => GENRE_BY_ID[id]).filter(Boolean);

    const director =
        movie.credits?.crew?.find((person) => person.job === "Director")?.name ||
        movie.created_by?.[0]?.name ||
        "";
    const cast = mapCast(movie.credits);
    const runtimeMins = movie.runtime || movie.episode_run_time?.[0];

    return {
        tmdbId: movie.id,
        mediaType,
        title,
        year: date ? Number(date.slice(0, 4)) : 0,
        rating: Number((movie.vote_average || 0).toFixed(1)),
        votes: movie.vote_count || 0,
        runtime: minutesToRuntime(runtimeMins),
        genres,
        director,
        cast,
        plot: movie.overview || "",
        poster: posterUrl(movie.poster_path),
        backdrop: backdropUrl(movie.backdrop_path),
    };
}

export async function fetchPopular() {
    const data = await tmdb("/movie/popular");
    return data.results || [];
}

export async function fetchTopRated() {
    const data = await tmdb("/movie/top_rated");
    return data.results || [];
}


export async function fetchTrending() {
    const data = await tmdb("/trending/movie/week");
    return data.results || [];
}

export async function searchTmdb(query) {
    const [movies, people, shows] = await Promise.all([
        tmdb("/search/movie", { query }),
        tmdb("/search/person", { query }),
        tmdb("/search/tv", { query }),
    ]);

    const byKey = new Map();
    const skipTvGenres = new Set([10763, 10767]);

    function add(item, type, fromPerson = false) {
        const mediaType = type || (item.media_type === "tv" ? "tv" : "movie");
        if (!item?.id || mediaType === "person") return;
        const title = item.title || item.name;
        if (!title) return;
        if (mediaType === "tv") {
            if ((item.genre_ids || []).some((id) => skipTvGenres.has(id))) return;
            const role = (item.character || "").toLowerCase();
            if (role === "herself" || role === "himself" || role === "self") return;
        }
        const key = `${mediaType}-${item.id}`;
        const current = byKey.get(key);
        if (!current) {
            byKey.set(key, { ...item, media_type: mediaType, title, _fromPerson: fromPerson });
        } else if (fromPerson) {
            current._fromPerson = true;
        }
    }

    (movies.results || []).forEach((item) => add(item, "movie"));
    (shows.results || []).forEach((item) => add(item, "tv"));

    const q = query.toLowerCase().trim();
    const words = q.split(/\s+/).filter(Boolean);
    const person =
        (people.results || []).find((p) => words.every((word) => p.name.toLowerCase().includes(word))) ||
        people.results?.[0];

    if (person) {
        (person.known_for || []).forEach((item) => add(item, item.media_type, true));
        const credits = await tmdb(`/person/${person.id}/combined_credits`);
        const crewJobs = new Set(["Director", "Writer", "Screenplay", "Creator", "Novel"]);
        (credits.cast || []).forEach((item) => add(item, item.media_type, true));
        (credits.crew || [])
            .filter((item) => crewJobs.has(item.job))
            .forEach((item) => add(item, item.media_type, true));
    }

    return [...byKey.values()].sort((a, b) => {
        function score(item) {
            const title = (item.title || "").toLowerCase();
            let value = item.popularity || 0;
            if (title === q) value += 1000;
            else if (title.startsWith(q)) value += 200;
            else if (title.includes(q)) value += 20;
            if (item._fromPerson) value += 40;
            return value;
        }
        return score(b) - score(a);
    });
}

export async function discoverByGenre(genreName) {
    const genreId = ID_BY_GENRE[genreName];
    if (!genreId) return fetchPopular();
    const data = await tmdb("/discover/movie", {
        with_genres: String(genreId),
        sort_by: "popularity.desc",
    });
    return data.results || [];
}

export async function fetchTmdbDetails(tmdbId, mediaType = "movie") {
    const path = mediaType === "tv" ? `/tv/${tmdbId}` : `/movie/${tmdbId}`;
    const extra =
        mediaType === "tv"
            ? "credits,content_ratings,keywords"
            : "credits,release_dates,keywords";
    return tmdb(path, { append_to_response: extra });
}

const CERT_MEANING = {
    G: "All ages. Little or no content that parents would find objectionable.",
    PG: "Parental guidance suggested. Some material may not be suitable for children.",
    "PG-13": "Parents strongly cautioned. Some material may be inappropriate for children under 13.",
    R: "Restricted. Under 17 requires an accompanying parent or adult guardian.",
    "NC-17": "Adults only. No one 17 and under admitted.",
    NR: "No official rating is listed.",
    "TV-Y": "Suitable for all children.",
    "TV-Y7": "Directed to older children (7+).",
    "TV-G": "Suitable for a general audience.",
    "TV-PG": "Parental guidance suggested.",
    "TV-14": "Parents strongly cautioned. May be unsuitable for children under 14.",
    "TV-MA": "Mature audience only. May be unsuitable for children under 17.",
};

export function extraDetails(raw) {
    const images = raw.images || {};
    const seen = new Set();
    const photos = [...(images.backdrops || []), ...(images.posters || [])]
        .filter((img) => {
            if (!img?.file_path || seen.has(img.file_path)) return false;
            seen.add(img.file_path);
            return true;
        })
        .slice(0, 16)
        .map((img) => `${IMG}/w780${img.file_path}`);
    if (!photos.length && raw.backdrop_path) {
        photos.push(`${IMG}/w780${raw.backdrop_path}`);
    }

    let certification = "";
    if (raw.content_ratings?.results?.length) {
        certification =
            raw.content_ratings.results.find((row) => row.iso_3166_1 === "US")?.rating ||
            raw.content_ratings.results.find((row) => row.rating)?.rating ||
            "";
    } else if (raw.release_dates?.results?.length) {
        const us = raw.release_dates.results.find((row) => row.iso_3166_1 === "US");
        const dated = us?.release_dates || raw.release_dates.results.flatMap((row) => row.release_dates || []);
        certification = dated.find((row) => row.certification)?.certification || "";
    }
    certification = (certification || "NR").trim();

    const keywords = (raw.keywords?.keywords || raw.keywords?.results || []).map((item) =>
        String(item.name || "").toLowerCase()
    );

    const notes = [];
    function addNote(label, tests) {
        if (tests.some((word) => keywords.some((name) => name.includes(word)))) notes.push(label);
    }
    addNote("Nudity / sexual content", ["nudity", "sex", "sexual"]);
    addNote("Violence & gore", ["violence", "gore", "murder", "blood"]);
    addNote("Profanity", ["profanity", "swearing", "language"]);
    addNote("Alcohol, drugs & smoking", ["drug", "alcohol", "smoking", "marijuana"]);
    addNote("Frightening & intense scenes", ["horror", "suicide", "terror", "abuse", "jump scare"]);

    return {
        photos,
        cast: mapCast(raw.credits),
        parentsGuide: {
            certification,
            summary: CERT_MEANING[certification] || "Check the listed rating before watching with children.",
            notes,
        },
    };
}
