import jwt from "jsonwebtoken";

const secret = () => process.env.JWT_SECRET || "cinedb-dev-secret";

export function signToken(userId) {
    return jwt.sign({ id: userId }, secret(), { expiresIn: "7d" });
}

export function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Please sign in" });

    try {
        req.userId = jwt.verify(token, secret()).id;
        next();
    } catch {
        res.status(401).json({ message: "Please sign in again" });
    }
}

export function optionalAuth(req, _res, next) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return next();

    try {
        req.userId = jwt.verify(token, secret()).id;
    } catch {
        req.userId = null;
    }
    next();
}
