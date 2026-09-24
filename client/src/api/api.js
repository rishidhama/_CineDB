export function movieKey(movie){
    return `${movie.mediaType} || "movie"-${movie.tmdbID}`;
}
