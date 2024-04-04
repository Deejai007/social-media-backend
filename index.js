const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

var userRoutes = require("./routes/userRoutes");
var corsOptions = {
  origin: "http://localhost:8081", //frontend url
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(
  express.urlencoded({ extended: true })
); /* bodyParser.urlencoded() is deprecated */

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
app.use("/user", userRoutes);

const PORT = process.env.PORT || 8969;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
