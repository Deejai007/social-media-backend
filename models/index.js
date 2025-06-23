const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const dbConfig = require("../config/db.config.js");

const db = {};

console.log(process.env.DATABASE_URL);

let sequelize = new Sequelize(process.env.DATABASE_URL, dbConfig);

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}
console.log("Testing database connection...");
testConnection();

// Synchronize sequelize models with DB
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database synchronized successfully.");
  })
  .catch((error) => {
    console.error("Error synchronizing database:", error);
  });

// load models in the current directory and initialize them
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// Associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
// db.Sequelize = Sequelize;

// async function emptyDatabase() {
//   try {
//     // Get all table names
//     const tableNames = Object.keys(sequelize.models);

//     // Iterate over each table
//     for (const tableName of tableNames) {
//       // Delete all rows from the table
//       await sequelize.query(`DELETE FROM "${tableName}";`);
//     }

//     console.log("Database emptied successfully.");
//   } catch (error) {
//     console.error("Error emptying database:", error);
//   }
// }
// emptyDatabase();
module.exports = db;
