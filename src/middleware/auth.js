import jwt from "jsonwebtoken";

export function authRequired(config) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
    const token = bearer || req.cookies?.[config.cookieName];

    if (!token) {
      return res.status(401).json({ error: "Authentication required." });
    }

    try {
      req.auth = jwt.verify(token, config.jwtSecret);
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired session." });
    }
  };
}
