const jwt = require("jsonwebtoken");
const getAccessToRoute = (req, res, next) => {
  try {
    // prefer cookie token
    let token = req.cookies && req.cookies.token;

    // fallback: Authorization header (Bearer token)
    if (!token) {
      const authHeader = req.header("Authorization") || req.header("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.replace(/^Bearer\s+/, "");
      }
    }

    if (!token)
      return res
        .status(401)
        .json({ message: "Please login first to continue!" });

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err)
        return res
          .status(402)
          .json({ message: "Invalid Authentication token" });

      if (user && user.verified == false) {
        return res
          .status(402)
          .json({ message: "Please verify user email to continue." });
      }

      req.user = user;
      next();
    });
  } catch (err) {
    console.log("++++++++++++++++++++++++");
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

const getUnverifiedAccessToRoute = (req, res, next) => {
  try {
    let token = req.header("Authorization");
    console.log(token);
    if (!token)
      return res.status(401).json({ message: "Please login to continue!" });
    token = token.replace(/^Bearer\s+/, "");
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err)
        return res
          .status(402)
          .json({ message: "Invalid Authentication token" });
      req.user = user;

      next();
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = { getAccessToRoute, getUnverifiedAccessToRoute };
