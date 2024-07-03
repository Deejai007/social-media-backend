const jwt = require("jsonwebtoken");
const getAccessToRoute = (req, res, next) => {
  try {
    // let token = req.header("Authorization");
    let token = req.cookies.token;
    console.log(token);
    if (!token)
      return res.status(401).json({ message: "Please login to continue!" });
    token = token.replace(/^Bearer\s+/, "");
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err)
        return res
          .status(402)
          .json({ message: "Invalid Authentication token" });
      if (user.verified == false) {
        return res
          .status(402)
          .json({ message: "Please verify user email to continue." });
      }
      req.user = user;
      next();
    });
  } catch (err) {
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
