const jwt = require("jsonwebtoken");
const getAccessToRoute = (req, res, next) => {
  try {
    let token = req.header("Authorization");
    console.log(token);
    if (!token)
      return res.status(401).json({ msg: "Please login to continue!" });
    token = token.replace(/^Bearer\s+/, "");
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err)
        return res.status(402).json({ msg: "Invalid Authentication token" });
      req.user = user;
      next();
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

module.exports = { getAccessToRoute };
