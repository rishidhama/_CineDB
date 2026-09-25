import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import movieRoutes from "./routes/movies.js";

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
app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});

async function start() {
    if (!MONGODB_URI || MONGODB_URI.includes("xxxxx")) {
        throw new Error("Add your MongoDB Atlas URI to server/.env as MONGODB_URI");
    }
    if (!process.env.TMDB_API_KEY || process.env.TMDB_API_KEY === "your_tmdb_api_key") {
        throw new Error("Add your TMDB API key to server/.env as TMDB_API_KEY");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB Atlas");

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
}

start().catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
});
