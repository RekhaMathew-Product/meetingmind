# MeetingMind AI

> Voice-first meeting intelligence for project managers.
> Hackathon build — Track: Voice & Productivity (Gradium · TinyFish · Recall.ai)

MeetingMind AI joins your Google Meet as a named participant. It monitors the conversation in real time, fires spoken voice alerts when the meeting goes off-agenda or over time, and delivers an end-of-meeting summary with an efficiency score.

Team
Rekha Mathew
Oluwasen Oyagbile
Anousheh Arif
Theo Bailey

---

## Architecture

```
Recall.ai (listens + speaks)
    ↓ transcript webhook
Backend (Node.js/Express)
    ↓ 30s poll
TinyFish LLM (agenda check / summary)
    ↓ alert text
Gradium TTS (generate audio)
    ↓ audio URL
Recall.ai (bot speaks into call)
    ↓ SSE events
React Dashboard (live display)
```

## Features

| Priority | Feature | Description |
|---|---|---|
| P1 | Structure enforcer | Polls every 30s. Fires voice alert after 60s+ of digression. |
| P2 | Timekeeper | Warns when an agenda item runs 2+ minutes over budget. |
| P3 | Meeting summary | End-of-meeting transcript → decisions, action items, efficiency score 0–100. |
| P4 | Suggestions | 3 concrete improvements for the next meeting. |

## Quick Start

### Prerequisites
- Node.js 20+
- [ngrok](https://ngrok.com/) (or similar) for local webhook exposure
- API keys for [Recall.ai](https://www.recall.ai/), [TinyFish](https://www.tinyfish.ai/), [Gradium](https://gradium.ai/)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in your API keys and PUBLIC_BASE_URL (your ngrok URL)
npm install
npm run dev
```

### 2. Expose webhook with ngrok

```bash
ngrok http 3001
# Copy the https URL → paste as PUBLIC_BASE_URL in backend/.env
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# Open http://localhost:5173
```

### 4. Demo flow

1. Paste a Google Meet URL + set agenda items with time budgets
2. Click **Start Meeting** — bot joins as "MeetingMind AI"
3. Speak on-topic, then drift — voice alert fires after ~60s
4. Click **End Meeting** — summary card appears with efficiency score

## Project Structure

```
meetingmind/
├── backend/
│   ├── src/
│   │   ├── index.js      # Express server entrypoint
│   │   ├── state.js      # In-memory session state
│   │   ├── meeting.js    # Start/end/next-item API routes
│   │   ├── webhook.js    # Recall.ai webhook + SSE broadcast
│   │   ├── polling.js    # 30s poll loop, alert logic
│   │   ├── recallai.js   # Recall.ai API client
│   │   ├── tinyfish.js   # TinyFish LLM client
│   │   ├── gradium.js    # Gradium TTS client
│   │   └── audio.js      # Audio file serving
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── AgendaSetup.jsx
│   │       ├── Dashboard.jsx
│   │       ├── TranscriptFeed.jsx
│   │       ├── AlertFeed.jsx
│   │       └── SummaryCard.jsx
│   └── .env.example
└── README.md
```

## Built With

- **Recall.ai** — Bot infrastructure (joins call, diarization, TTS playback)
- **Gradium** — Natural-sounding voice for all spoken alerts
- **TinyFish** — LLM reasoning (agenda checks, summaries, suggestions)
- **React + Vite** — Live dashboard
- **Node.js + Express** — Webhook receiver, polling loop, API glue
