# EventHub — Inclusive Event Registration & Communication System

A hackathon project built on Africa's Talking APIs. Lets attendees register
and check in to an event using **USSD** (no smartphone or data needed), get
**SMS** confirmations and reminders, and gives organizers a simple dashboard
to track registrations and check-ins in real time.

This is the **Node.js version**, built to run inside **bolt.new** (which only
executes JavaScript/WebAssembly in its browser-based container — it cannot
run Python). Storage uses `lowdb`, a pure-JavaScript JSON database, instead
of SQLite, since SQLite needs native compiled bindings that won't work in
bolt.new's container.

## Features

- **USSD registration & check-in** — works on any phone, no internet required
- **SMS confirmations & reminders** — automatic on registration, plus a script
  for bulk reminders and urgent broadcast alerts
- **Organizer dashboard** — live view of who's registered and checked in
- **lowdb (JSON file) storage** — no database server to set up

## Option A: Run it inside bolt.new

1. Go to [bolt.new](https://bolt.new)
2. Import this project — the most reliable way is to push these files to a
   **GitHub repo** first, then in bolt.new choose **Import from GitHub** and
   paste your repo URL. (You can also drag the unzipped folder in if bolt.new
   offers a folder/zip import option in your version.)
3. Once imported, bolt.new will detect `package.json` and can run
   `npm install` and `npm run dev` for you — or open its terminal and run
   those commands yourself.
4. bolt.new gives you a **public preview URL** for the running server
   (something like `https://xxxx.webcontainer-api.io`). That URL is what you
   paste into Africa's Talking as your USSD callback — **no ngrok needed**.
5. Before adding real credentials, create a `.env` file in the bolt.new file
   explorer (copy `.env.example`) and fill in your Africa's Talking sandbox
   username/API key.

## Option B: Run it locally in VS Code (works identically)

```bash
cd eventhub-node
npm install
cp .env.example .env
# edit .env with your Africa's Talking sandbox credentials
npm run dev
```

Then use `ngrok http 5000` to get a public URL for USSD testing, exactly as
with the bolt.new preview URL above.

## Configure your USSD channel

1. Go to your [Africa's Talking sandbox dashboard](https://account.africastalking.com/)
2. Under **USSD**, create a channel and paste in your public URL + `/ussd`
   (e.g. `https://your-preview-url/ussd`)
3. Use the simulator provided in the sandbox to test dialing your USSD code

## View the dashboard

Visit `/dashboard` on your running server's URL (locally:
`http://localhost:5000/dashboard`) to see live registration and check-in
stats.

## Send reminders or urgent alerts

```bash
npm run reminders
```

To send an urgent broadcast (e.g. venue change), open `reminders.js`,
uncomment the `sendUrgentAlert(...)` line at the bottom, edit the message,
and run the script again.

## Project structure

```
eventhub-node/
├── server.js         # Main Express app (USSD + dashboard)
├── db.js              # lowdb setup (pure-JS JSON storage)
├── reminders.js        # Standalone script for SMS reminders/alerts
├── package.json
├── .env.example        # Template for your API keys/config
└── eventhub.json       # Created automatically on first run
```

## Ideas to extend for the hackathon

- **Voice API**: play a recorded announcement instead of/alongside SMS alerts
- **Airtime API**: reward the first N registrants with a small airtime top-up
- **Insights API**: show organizers a breakdown of attendee network/device
  data on the dashboard, to plan future outreach
- **Chat API**: add a WhatsApp-based help channel for attendees who do have
  data, as a fallback alongside USSD

## Going live (real, non-sandbox credentials)

Build and test everything on **sandbox first** — it's instant, free, and
behaves identically to live. When you're ready to switch:

1. Apply for a real USSD short code through Africa's Talking as early as
   possible — approval isn't instant
2. Generate a **live API key** from your live app dashboard
3. Update `AT_USERNAME` and `AT_API_KEY` in `.env` — no code changes needed

## Security note

Never commit your real `.env` file or hardcode API keys directly into
`server.js`. Keep `.env` out of version control (it's already in
`.gitignore`).
