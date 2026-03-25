# Raitha Reach

Raitha Reach is a React + Vite farm marketplace demo focused on a simple flow:

- Farmers post crop listings
- Retailers browse and directly accept a crop
- Accepted orders move to delivery
- Delivery partners claim and complete the route

The app currently runs fully on the frontend and stores data in IndexedDB in the browser.

## Tech Stack

- React 18
- Vite
- IndexedDB for local demo persistence

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create your local env file if needed:

```bash
cp .env.example .env
```

3. Start the development server:

```bash
npm run dev
```

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
- This is a demo-style frontend app and does not require a backend to run
