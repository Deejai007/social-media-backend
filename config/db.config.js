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
module.exports = {
  host: "dpg-d1c1bpeuk2gs73a82nn0-a",
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // only if using self-signed certs
    },
    keepAlive: true,
  },
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
    acquire: 30000,
  },
  logging: false,
};
