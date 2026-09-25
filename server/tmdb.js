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

async function tmdb(path, params = {}) {
    const url = new URL(`${BASE}${path}`);
    url.searchParams.set("api_key", apiKey());
    Object.entries(params).forEach(([key, value]) => {
        if(value !== undefined && value !== "") url.searchParams.set(key, value);
    });

    const res = await fetch(url);
    if(!res.ok)
        throw new Error("TMDB request failed");
    return res.json();
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

export async  function fetchPopular() {
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
export async function discoverByGenre(genreName) {
    const genreId = ID_BY_GENRE[genreName];
    if (!genreId) return fetchPopular();
    const data = await tmdb("/discover/movie", {
      with_genres: String(genreId),
      sort_by: "popularity.desc",
    });
    return data.results || [];
  }