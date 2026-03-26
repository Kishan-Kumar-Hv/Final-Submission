# Raitha Reach

Raitha Reach is a React + Vite farm marketplace demo focused on a simple flow:

- Farmers post crop listings
- Retailers browse and directly accept a crop
- Accepted orders move to delivery
- Delivery partners claim and complete the route

The app now supports a local SQLite database for users, crops, and jobs through a small Node API. If the local API is not running, the frontend safely falls back to IndexedDB in the browser.

## Tech Stack

- React 18
- Vite
- Express
- SQLite (`better-sqlite3`)
- IndexedDB fallback for offline/local demo persistence

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create your local env file if needed:

```bash
cp .env.example .env
```

3. Start the full local app:

```bash
npm run dev
```

This starts:

- the React app
- the local Node + SQLite API server

4. Build for production:

```bash
npm run build
```

5. Preview the production build:

```bash
npm run preview
```

## Environment Variables

The project supports these Vite env values:

- `VITE_APP_NAME`: App title shown in the browser tab
- `VITE_DEFAULT_LANG`: Default app language (`en` or `kn`)
- `VITE_API_BASE_URL`: Frontend API base path
- `VITE_OPENWEATHER_API_KEY`: OpenWeather API key for live district weather

Server env values:

- `OPENAI_API_KEY`: Enables AI crop-photo scan in the crop post form
- `OPENAI_VISION_MODEL`: Primary vision model used for crop-photo scan (`gpt-4.1-mini` by default)
- `OPENAI_VISION_FALLBACK_MODEL`: Secondary vision model used when the primary scan fails or is too weak (`gpt-4o-mini` by default)
- `OPENAI_VISION_MIN_CONFIDENCE`: Minimum confidence before the app automatically retries with the fallback model (`0.45` by default)
- `PORT`: Local API server port
- `DB_PATH`: SQLite database file path
- `SMS_ENABLED`: Set `true` to send live SMS
- `SMS_PROVIDER`: `msg91` or `twilio`
- `MSG91_AUTH_KEY`: MSG91 auth key
- `MSG91_SENDER_ID`: Approved sender ID/header
- `MSG91_COUNTRY_CODE`: Usually `91` for India
- `MSG91_SMS_ROUTE`: MSG91 SMS route
- `MSG91_SMS_API_URL`: MSG91 SMS API endpoint
- `MSG91_OTP_API_URL`: MSG91 OTP API endpoint
- `MSG91_OTP_TEMPLATE_ID`: Approved MSG91 OTP template id
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_VERIFY_SERVICE_SID`: Twilio Verify service SID for OTP
- `TWILIO_FROM_NUMBER`: Twilio phone number for alert SMS
- `TWILIO_MESSAGING_SERVICE_SID`: Optional Twilio messaging service for alerts
- `TWILIO_COUNTRY_CODE`: Usually `91` for India

## Demo Accounts

- Farmer: `farmer.demo@raithareach.app` / `demo123`
- Retailer: `retailer.demo@raithareach.app` / `demo123`
- Delivery: `delivery.demo@raithareach.app` / `demo123`

## Project Structure

```text
src/
  components/
  data/
  db/
  hooks/
  styles/
  utils/
```

## Notes

- `node_modules` and `dist` are ignored through `.gitignore`
- `.env` is local-only and `.env.example` is safe to push
- SQLite data is stored locally when the API server is running
- If the API server is down, the app falls back to IndexedDB so it still opens
- When `SMS_ENABLED=false`, OTP and alerts stay in mock/demo mode
- For live India SMS with MSG91, keep your sender ID and DLT-approved template ready
- For live Twilio OTP, add a Verify service SID (`VA...`) before switching `SMS_PROVIDER` to `twilio`
- Crop photo scan needs the local API server running plus `OPENAI_API_KEY` in `.env`
- Crop photo scan now tries the primary OpenAI model first and automatically falls back to the secondary model when needed
