// module.exports = {
//   dialect: "postgres",
//   logging: false,
//   pool: {
//     max: 5,
//     min: 0,
//     acquire: 30000,
//     idle: 10000,
//   },
// };
const isProduction = process.env.production === "true";

module.exports = {
  host: isProduction ? "dpg-d1c1bpeuk2gs73a82nn0-a" : "localhost",
  dialect: "postgres",
  dialectOptions: isProduction
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false, // only if using self-signed certs
        },
        keepAlive: true,
      }
    : {},
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
    acquire: 30000,
  },
  logging: false,
};
