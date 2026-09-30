/**
 * EventHub - Inclusive Event Registration & Communication System
 * Built for Africa's Talking Hackathon (Node.js / bolt.new version)
 *
 * Handles:
 *   - USSD registration & check-in (no smartphone/data needed)
 *   - SMS confirmations and reminders
 *   - Simple organizer dashboard
 */

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const AfricasTalking = require("africastalking");
const { getDb, initDb } = require("./db");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ---- Africa's Talking setup ----
const AT_USERNAME = process.env.AT_USERNAME || "sandbox";
const AT_API_KEY = process.env.AT_API_KEY || "";

let sms = null;
if (AT_API_KEY && AT_API_KEY !== "your_sandbox_api_key_here") {
  const africastalking = AfricasTalking({
    apiKey: AT_API_KEY,
    username: AT_USERNAME,
  });
  sms = africastalking.SMS;
} else {
  console.warn("[WARN] AT_API_KEY not set — SMS features disabled. USSD and dashboard will still work.");
}

const EVENT_NAME = process.env.EVENT_NAME || "Our Hackathon Event";
const EVENT_DATE = process.env.EVENT_DATE || "TBA";
const EVENT_VENUE = process.env.EVENT_VENUE || "TBA";

async function sendSmsSafe(message, recipients) {
  if (!sms) return;
  try {
    await sms.send({ to: recipients, message });
  } catch (e) {
    console.error("[SMS ERROR] Could not send SMS:", e.message);
  }
}

// ---------- USSD endpoint ----------

app.post("/ussd", async (req, res) => {
  const phoneNumber = req.body.phoneNumber || "";
  const text = req.body.text || "";
  const steps = text ? text.split("*") : [];

  const db = await getDb();
  let response;

  // Main menu
  if (text === "") {
    response =
      `CON Welcome to ${EVENT_NAME}\n` +
      "1. Register\n" +
      "2. Check in\n" +
      "3. My registration status";
  }

  // ---- Registration flow ----
  else if (steps[0] === "1" && steps.length === 1) {
    response = "CON Enter your full name:";
  } else if (steps[0] === "1" && steps.length === 2) {
    const name = steps[1].trim();
    const existing = db.data.attendees.find((a) => a.phoneNumber === phoneNumber);

    if (existing) {
      response = "END You're already registered for this event!";
    } else {
      db.data.attendees.push({
        phoneNumber,
        name,
        registeredAt: new Date().toISOString(),
        checkedIn: false,
        checkedInAt: null,
      });
      await db.write();

      await sendSmsSafe(
        `Hi ${name}! You're registered for ${EVENT_NAME} on ${EVENT_DATE} at ${EVENT_VENUE}. See you there!`,
        [phoneNumber]
      );
      response = "END Registration complete! Check your SMS for confirmation.";
    }
  }

  // ---- Check-in flow ----
  else if (steps[0] === "2") {
    const attendee = db.data.attendees.find((a) => a.phoneNumber === phoneNumber);

    if (!attendee) {
      response = "END No registration found for this number. Please register first (option 1).";
    } else if (attendee.checkedIn) {
      response = "END You're already checked in. Welcome back!";
    } else {
      attendee.checkedIn = true;
      attendee.checkedInAt = new Date().toISOString();
      await db.write();
      response = `END Checked in successfully. Welcome, ${attendee.name}!`;
    }
  }

  // ---- Status flow ----
  else if (steps[0] === "3") {
    const attendee = db.data.attendees.find((a) => a.phoneNumber === phoneNumber);

    if (!attendee) {
      response = "END You are not registered yet. Dial in again and choose option 1.";
    } else {
      const status = attendee.checkedIn ? "Checked in" : "Registered, not yet checked in";
      response = `END ${attendee.name} - ${status}`;
    }
  } else {
    response = "END Invalid option. Please try again.";
  }

  res.set("Content-Type", "text/plain");
  res.send(response);
});

// ---------- Organizer dashboard ----------

app.get("/dashboard", async (req, res) => {
  const db = await getDb();
  const attendees = [...db.data.attendees].sort(
    (a, b) => new Date(b.registeredAt) - new Date(a.registeredAt)
  );

  const total = attendees.length;
  const checkedIn = attendees.filter((a) => a.checkedIn).length;

  const rows = attendees
    .map(
      (a) => `
    <tr>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.phoneNumber)}</td>
      <td>${new Date(a.registeredAt).toLocaleString()}</td>
      <td>${
        a.checkedIn
          ? '<span class="badge in">Checked In</span>'
          : '<span class="badge out">Pending</span>'
      }</td>
    </tr>`
    )
    .join("");

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(EVENT_NAME)} - Organizer Dashboard</title>
<style>
    body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; color: #222; }
    h1 { margin-bottom: 4px; }
    .stats { display: flex; gap: 20px; margin: 20px 0; }
    .card { background: white; border-radius: 8px; padding: 16px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card .number { font-size: 28px; font-weight: bold; }
    .card .label { color: #666; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
    th, td { text-align: left; padding: 10px 14px; border-bottom: 1px solid #eee; }
    th { background: #333; color: white; }
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; }
    .badge.in { background: #d4f5dd; color: #1a7f37; }
    .badge.out { background: #fdeaea; color: #b02a2a; }
</style>
</head>
<body>
    <h1>${escapeHtml(EVENT_NAME)}</h1>
    <p>Organizer Dashboard</p>

    <div class="stats">
        <div class="card"><div class="number">${total}</div><div class="label">Total Registered</div></div>
        <div class="card"><div class="number">${checkedIn}</div><div class="label">Checked In</div></div>
        <div class="card"><div class="number">${total - checkedIn}</div><div class="label">Pending Check-in</div></div>
    </div>

    <table>
        <tr><th>Name</th><th>Phone Number</th><th>Registered At</th><th>Status</th></tr>
        ${rows}
    </table>
</body>
</html>`);
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- Start server ----------

const PORT = process.env.PORT || 5000;

initDb().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`EventHub running on port ${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
  });
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use. Set the PORT env var to a free port.`);
      process.exit(1);
    } else {
      throw err;
    }
  });
});
