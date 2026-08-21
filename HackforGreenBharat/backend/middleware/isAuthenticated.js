import jwt from "jsonwebtoken";

const isAuthenticated = (req, res, next) => {
  try {
    let token;

    // ✅ 1. Read from Authorization header (Bearer token)
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      const rawToken = req.headers.authorization.split(" ")[1];
      if (rawToken && rawToken !== "null" && rawToken !== "undefined") {
        token = rawToken;
      }
    }

    // ✅ 2. Fallback: read from cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // ❌ No token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to perform this action",
      });
    }

    // ✅ VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // ✅ Attach userId to request
    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid. Please login again.",
    });
  }
};

export default isAuthenticated;