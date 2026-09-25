import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import movieRoutes from "./routes/movies.js";
import authRoutes from "./routes/auth.js";
// import watchlistRoutes from "./routes/watchlist.js";
// import historyRoutes from "./routes/history.js";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid request body" });
  }
  next(err);
});
app.use("/api/movies", movieRoutes);
app.use("/api/auth", authRoutes);
// app.use("/api/watchlist", watchlistRoutes);
// app.use("/api/history", historyRoutes);  

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

async function start() {
  if (!process.env.TMDB_API_KEY || process.env.TMDB_API_KEY === "your_tmdb_api_key") {
    throw new Error("Add your TMDB API key to server/.env as TMDB_API_KEY");
  }

  const server = app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Stop the other API process and try again.`);
      process.exit(1);
    }
    throw err;
  });

  if (!MONGODB_URI || MONGODB_URI.includes("xxxxx")) {
    console.warn("MONGODB_URI missing — movie lists still work, auth will not.");
    return;
  }

  mongoose
    .connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((err) => console.error("MongoDB connect failed:", err.message));
}

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
