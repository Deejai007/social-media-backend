const { Worker } = require("bullmq");
require("dotenv").config();

const connection = {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
};

// Sends mail via Brevo's HTTPS API instead of SMTP (SMTP ports 465/587 are blocked on this host).
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendViaBrevo({ from, to, subject, html }) {
  const senderEmail = process.env.BREVO_FROM_EMAIL || from;

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: process.env.pro_name || "Treiwo" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      `Brevo API error (${res.status}): ${data.message || JSON.stringify(data)}`
    );
  }

  return data;
}

const mailWorker = new Worker(
  "mailQueue",
  async (job) => {
    if (job.name === "sendMail") {
      const { from, to, subject, html } = job.data;
      const data = await sendViaBrevo({ from, to, subject, html });
      console.log(`✅ Email sent to ${to} (messageId: ${data.messageId})`);
    }
  },
  connection
);

mailWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err);
});
