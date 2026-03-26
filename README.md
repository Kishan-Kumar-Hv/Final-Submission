# Raitha Reach

Raitha Reach is a bilingual, mobile-friendly agri-commerce platform built to connect farmers directly with wholesalers, delivery partners, and a separate export marketplace. The project focuses on better price discovery, transparent crop trading, simpler logistics, and wider market access for Indian farmers.

## Overview

Raitha Reach is designed around two clearly separated operating models:

1. Domestic marketplace
   Farmers post crops, wholesalers browse listings or raise crop requirements, and delivery partners complete pickup and drop workflows.
2. Export marketplace
   A dedicated exporting desk handles India export supply and foreign demand from Gulf nations and Singapore without mixing that workflow into the domestic marketplace.

The platform supports English and Kannada, responsive layouts for desktop and mobile devices, OTP-based access for domestic users, and demo access for export users.

## Key Features

- Bilingual interface with English and Kannada support
- Responsive UI for desktop, tablet, and mobile use
- Farmer crop posting with live bidding
- Wholesaler demand board for posting crop requirements
- Delivery workflow with route claiming, status updates, and OTP-based pickup verification
- Separate export portal for India supply, foreign bids, and crop demand requests
- Gulf nations and Singapore export market support
- Local persistence using SQLite through the API server
- IndexedDB fallback when the API is unavailable
- Optional AI-based crop photo scan using OpenAI or Gemini
- Optional weather and mandi-rate guidance
- Optional OTP and alert delivery through MSG91 or Twilio

## User Roles

### Farmer

- Post crop listings
- View live bids from wholesalers
- Accept bids and create order flow
- Track delivery progress

### Wholesaler

- Browse listed crops
- Place quantity-based bids
- Post crop requirements for farmers
- Confirm accepted orders and open delivery

### Delivery Partner

- Claim available pickup jobs
- Verify farm pickup using OTP
- Update route status until delivery completion

### Exporting Desk

- India export desk can publish export lots for Gulf nations and Singapore
- Foreign desks can place bids on Indian export lots
- Foreign desks can post crop demand requests
- India export desk can review and accept foreign demand responses

## Core Workflow

1. A farmer posts a crop listing with quantity, pricing, photos, and pickup details.
2. A wholesaler either bids on that crop or posts a separate crop requirement.
3. Once a deal is accepted, the delivery flow opens automatically.
4. A delivery partner claims the route, verifies pickup, and completes the order.
5. In parallel, the export desk supports international trade through a separate workflow for India, Gulf buyers, and Singapore buyers.

## Demo Access

Domestic users log in with phone number and OTP. Export users log in with client ID and password.

When `SMS_ENABLED=false`, OTP stays in demo mode and auto-fills for local testing.

| Role | Login Method | Demo Access |
| --- | --- | --- |
| Farmer | Phone + OTP | `9876543210` |
| Wholesaler | Phone + OTP | `9876501234` |
| Delivery Partner | Phone + OTP | `9876509876` |
| India Export Desk | Client ID + Password | `IND-EXPORT-01` / `demo123` |
| Gulf Import Desk | Client ID + Password | `GULF-IMPORT-01` / `demo123` |
| Singapore Import Desk | Client ID + Password | `SGP-IMPORT-01` / `demo123` |

## Technology Stack

- React 18
- Vite
- Node.js
- Express
- SQLite with `better-sqlite3`
- IndexedDB fallback for local persistence
- OpenWeather API for district weather
- OpenAI or Gemini for crop image analysis
- MSG91 or Twilio for OTP and SMS delivery

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` as needed. The full list of supported variables is available in `.env.example`.

### 3. Start the development environment

```bash
npm run dev
```

By default, this starts:

- Frontend: `http://127.0.0.1:5199`
- API server: `http://127.0.0.1:8787`

### 4. Build for production

```bash
npm run build
```

### 5. Preview the production build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - starts the frontend and backend together
- `npm run dev:client` - starts the Vite client
- `npm run dev:server` - starts the local Node.js API server
- `npm run build` - creates the production build
- `npm run preview` - previews the production build locally
- `npm run server` - runs only the backend server

## Configuration Notes

The project supports the following configuration groups:

- Frontend configuration: app title, default language, API base URL, weather API key
- AI configuration: OpenAI or Gemini crop photo scan settings
- Server configuration: local port and SQLite database path
- SMS configuration: mock mode, MSG91, or Twilio for OTP and notifications

See `.env.example` for the full variable list.

## Project Structure

```text
.
├── server/
├── src/
│   ├── components/
│   ├── data/
│   ├── db/
│   ├── hooks/
│   ├── styles/
│   └── utils/
├── data/
├── package.json
└── README.md
```

## Persistence Model

- Primary persistence uses SQLite through the local Express API
- If the API is unavailable, the frontend falls back to IndexedDB
- This makes the project easier to demo locally without losing basic usability

## Current Scope

- Domestic role onboarding supports farmer, wholesaler, and delivery through phone-based OTP
- Exporter onboarding is intentionally kept separate and is available as demo login for now
- The export interface currently targets Gulf nations and Singapore

## Why This Project Matters

Raitha Reach is built around a practical goal: reduce friction between production and market access. By combining direct crop listing, transparent bidding, delivery coordination, export opportunity, and local-language usability, the platform aims to help farmers reach stronger buyers and improve their profit potential.
