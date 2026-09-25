import { useEffect, useState } from "react";
import { getMovies, getFeatured } from "../api/api.js";
import Hero from "../components/Hero.jsx";
// import MovieRow from "../components/MovieRow.jsx";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [action, setAction] = useState([]);
  const [drama, setDrama] = useState([]);
  const [animation, setAnimation] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getFeatured().then(setFeatured).catch((err) => setError(err.message));
    getMovies({ list: "top_rated" }).then(setTopRated).catch(() => {});
    getMovies({ genre: "Action" }).then(setAction).catch(() => {});
    getMovies({ genre: "Drama" }).then(setDrama).catch(() => {});
    getMovies({ genre: "Animation" }).then(setAnimation).catch(() => {});
  }, []);

  if (error && !featured.length && !topRated.length) {
    return <p className="loading">{error}</p>;
  }
  if (!featured.length && !topRated.length) return <p className="loading">Loading movies...</p>;

  return (
    <>
      <Hero movie={featured[0] || topRated[0]} />
      {/* <MovieRow title="Trending this week" movies={featured} />
      <MovieRow title="Top rated" movies={topRated} />
      <MovieRow title="Action" movies={action} />
      <MovieRow title="Drama" movies={drama} />
      <MovieRow title="Animation" movies={animation} /> */}
    </>
  );
}
