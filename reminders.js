/**
 * Run this script manually (or on a schedule) to send SMS reminders
 * to everyone who has registered but not yet checked in.
 *
 * Usage:
 *   npm run reminders
 */

require("dotenv").config();
const AfricasTalking = require("africastalking");
const { getDb } = require("./db");

const AT_USERNAME = process.env.AT_USERNAME || "sandbox";
const AT_API_KEY = process.env.AT_API_KEY || "";
const EVENT_NAME = process.env.EVENT_NAME || "Our Hackathon Event";
const EVENT_DATE = process.env.EVENT_DATE || "TBA";
const EVENT_VENUE = process.env.EVENT_VENUE || "TBA";

const africastalking = AfricasTalking({
  apiKey: AT_API_KEY,
  username: AT_USERNAME,
});
const sms = africastalking.SMS;

async function sendReminders() {
  const db = await getDb();
  const pending = db.data.attendees.filter((a) => !a.checkedIn);

  if (pending.length === 0) {
    console.log("No pending attendees to remind.");
    return;
  }

  for (const attendee of pending) {
    const message = `Reminder: ${EVENT_NAME} is happening on ${EVENT_DATE} at ${EVENT_VENUE}. See you there, ${attendee.name}!`;
    try {
      await sms.send({ to: [attendee.phoneNumber], message });
      console.log(`Sent reminder to ${attendee.name} (${attendee.phoneNumber})`);
    } catch (e) {
      console.error(`Failed to send to ${attendee.phoneNumber}:`, e.message);
    }
  }
}

async function sendUrgentAlert(messageText) {
  const db = await getDb();
  const numbers = db.data.attendees.map((a) => a.phoneNumber);

  if (numbers.length === 0) {
    console.log("No attendees to alert.");
    return;
  }

  try {
    await sms.send({ to: numbers, message: messageText });
    console.log(`Alert sent to ${numbers.length} attendees.`);
  } catch (e) {
    console.error("Failed to send alert:", e.message);
  }
}

sendReminders();

// Example of an urgent alert (uncomment to use):
// sendUrgentAlert("Update: Venue has changed to Hall B. See you there!");
