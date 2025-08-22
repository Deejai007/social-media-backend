const { Queue } = require("bullmq");
require("dotenv").config();

const connection = {
  connection: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  },
};

// Create the queue
const mailQueue = new Queue("mailQueue", connection);

module.exports = mailQueue;
