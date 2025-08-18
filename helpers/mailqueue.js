const { Queue } = require("bullmq");
require("dotenv").config();

const connection = {
  connection: {
    host: "127.0.0.1", // or your Redis host
    port: 6379,
  },
};

// Create the queue
const mailQueue = new Queue("mailQueue", connection);

module.exports = mailQueue;
