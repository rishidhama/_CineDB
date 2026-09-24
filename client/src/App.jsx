import './App.css'
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Movie from './pages/movie.jsx';
import Search from './pages/Search.jsx';
import Watchlist from './pages/Watchlist.jsx';
import History from './pages/History.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';

export default function App() {

  return (
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:id" element={<h1>Movie</h1>} />
          <Route path="/search" element={<h1>Search</h1>} />
          <Route path="/watchlist" element={<h1>Watchlist</h1>} />
          <Route path="/history" element={<h1>History</h1>} />
          <Route path="/signin" element={<h1>SignIn</h1>} />
          <Route path="/signup" element={<h1>SignUp</h1>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}