const { Worker } = require("bullmq");
const nodemailer = require("nodemailer");
require("dotenv").config();

const connection = {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
};

const mailWorker = new Worker(
  "mailQueue",
  async (job) => {
    if (job.name === "sendMail") {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.m_email,
          pass: process.env.m_password,
        },
      });

      await transporter.sendMail(job.data);
      console.log(`✅ Email sent to ${job.data.to}`);
    }
  },
  connection
);

mailWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err);
});
