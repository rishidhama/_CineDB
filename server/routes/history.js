import express from "express";
import { requireAuth } from "../Middleware/auth.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.history || []);
});

export default router;