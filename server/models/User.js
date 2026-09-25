import mongoose from "mongoose";

const titleSchema = new mongoose.Schema(
  {
    tmdbId: Number,
    mediaType: { type: String, default: "movie" },
    title: String,
    poster: String,
    rating: Number,
    year: Number,
    genres: [String],
  },
  { _id: false }
);

const ratingSchema = new mongoose.Schema(
  {
    tmdbId: Number,
    mediaType: { type: String, default: "movie" },
    score: Number,
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    tmdbId: Number,
    mediaType: { type: String, default: "movie" },
    title: String,
    poster: String,
    rating: Number,
    year: Number,
    genres: [String],
    viewedAt: Date,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    watchlist: { type: [titleSchema], default: () => [] },
    ratings: { type: [ratingSchema], default: () => [] },
    history: { type: [historySchema], default: () => [] },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

export default mongoose.model("User", userSchema);
