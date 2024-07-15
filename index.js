const { errorHandler } = require("./middleware/errorMiddleware");
const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const cookieParser = require("cookie-parser");
const path = require("path");
var routes = require("./router/routes");

const allowedOrigins = [
  "http://localhost:5173", // local
  "https://treiwo.netlify.app", // Netlify
];

const corsOptions = {
  origin: function (origin, callback) {
    //allow requests from no origin
    if (!origin) return callback(null, true);
    // console.log(origin);
    // Check if the origin is in the allowedOrigins array or if there is no origin (for non-browser requests)
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow credentials (cookies)
};
// const upload = require("../multerConfig");
app.use(cors(corsOptions));
app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const db = require("./models/index");
// db.sequelize.sync();
// // drop the table if it already exists
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });

// sample route
app.get("/", (req, res) => {
  res.json({ message: "Welcome!" });
});
// routes
app.use("/", routes);

// custom error
app.use(errorHandler);

// start server
const PORT = process.env.PORT || 8969;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
