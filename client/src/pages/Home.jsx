import { useEffect, useState } from "react";
import { getMovies, getFeatured } from "../api/api.js";
import Hero from "../components/Hero.jsx";
import MovieRow from "../components/MovieRow.jsx";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [action, setAction] = useState([]);
  const [drama, setDrama] = useState([]);
  const [animation, setAnimation] = useState([]);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const first = await getFeatured();
        if (cancelled) return;
        setFeatured(first);
        setStarted(true);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }

      getMovies({ list: "top_rated" })
        .then((data) => {
          if (!cancelled) {
            setTopRated(data);
            setStarted(true);
          }
        })
        .catch(() => {});

      getMovies({ genre: "Action" }).then((data) => !cancelled && setAction(data)).catch(() => {});
      getMovies({ genre: "Drama" }).then((data) => !cancelled && setDrama(data)).catch(() => {});
      getMovies({ genre: "Animation" }).then((data) => !cancelled && setAnimation(data)).catch(() => {});
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error && !featured.length && !topRated.length) {
    return <p className="loading">{error}</p>;
  }
  if (!started && !featured.length && !topRated.length) {
    return <p className="loading">Loading movies...</p>;
  }

  return (
    <>
      <Hero movie={featured[0] || topRated[0]} />
      <MovieRow title="Trending this week" movies={featured} />
      <MovieRow title="Top rated" movies={topRated} />
      <MovieRow title="Action" movies={action} />
      <MovieRow title="Drama" movies={drama} />
      <MovieRow title="Animation" movies={animation} />
    </>
  );
}
