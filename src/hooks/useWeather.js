import { useEffect, useState } from "react";

const WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || "";
const WEATHER_CACHE_TTL = 20 * 60 * 1000;

const DISTRICT_QUERY = {
  Hassan: "Hassan, Karnataka, IN",
  Mysuru: "Mysuru, Karnataka, IN",
  Mandya: "Mandya, Karnataka, IN",
  "Bengaluru Rural": "Bengaluru, Karnataka, IN",
  Tumakuru: "Tumakuru, Karnataka, IN",
  Shivamogga: "Shivamogga, Karnataka, IN",
  Davangere: "Davangere, Karnataka, IN",
  Dharwad: "Dharwad, Karnataka, IN",
  Raichur: "Raichur, Karnataka, IN",
  Bidar: "Bidar, Karnataka, IN",
  Chikkamagaluru: "Chikkamagaluru, Karnataka, IN",
  Ramanagara: "Ramanagara, Karnataka, IN",
  Kolar: "Kolar, Karnataka, IN",
};

const FALLBACK_WEATHER = {
  Hassan: { icon: "⛅", temp: 24, desc: "Partly cloudy", humidity: 72, wind: "12 km/h" },
  Mysuru: { icon: "☀️", temp: 28, desc: "Clear sky", humidity: 58, wind: "8 km/h" },
  Mandya: { icon: "🌤️", temp: 26, desc: "Mild overcast", humidity: 68, wind: "10 km/h" },
  "Bengaluru Rural": { icon: "🌦️", temp: 22, desc: "Light showers", humidity: 82, wind: "15 km/h" },
  Tumakuru: { icon: "☀️", temp: 30, desc: "Sunny & hot", humidity: 52, wind: "6 km/h" },
  Shivamogga: { icon: "🌧️", temp: 21, desc: "Heavy showers", humidity: 88, wind: "18 km/h" },
};

function fallbackWeather(district) {
  return FALLBACK_WEATHER[district] || {
    icon: "🌤️",
    temp: 25,
    desc: "Partly cloudy",
    humidity: 65,
    wind: "10 km/h",
  };
}

function weatherEmoji(main, iconCode) {
  if (main === "Thunderstorm") return "⛈️";
  if (main === "Drizzle") return "🌦️";
  if (main === "Rain") return iconCode?.includes("n") ? "🌧️" : "🌦️";
  if (main === "Snow") return "❄️";
  if (main === "Clear") return iconCode?.includes("n") ? "🌙" : "☀️";
  if (main === "Clouds") return iconCode?.includes("n") ? "☁️" : "⛅";
  if (["Mist", "Smoke", "Haze", "Fog"].includes(main)) return "🌫️";
  return "🌤️";
}

function normalizeDescription(main, cloudiness, rainAmount) {
  if (main === "Clear") return "Clear sky";
  if (main === "Clouds") return cloudiness >= 70 ? "Mild overcast" : "Partly cloudy";
  if (main === "Rain" || main === "Drizzle" || main === "Thunderstorm") {
    return rainAmount >= 5 ? "Heavy showers" : "Light showers";
  }
  return "Partly cloudy";
}

function cacheKey(district) {
  return `rr-weather:${district}`;
}

function readCachedWeather(district) {
  try {
    const raw = localStorage.getItem(cacheKey(district));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.ts || !parsed?.data) return null;
    if (Date.now() - parsed.ts > WEATHER_CACHE_TTL) return null;
    return parsed.data;
  } catch (_) {
    return null;
  }
}

function writeCachedWeather(district, data) {
  try {
    localStorage.setItem(cacheKey(district), JSON.stringify({ ts: Date.now(), data }));
  } catch (_) {}
}

function mapWeatherResponse(data) {
  const main = data?.weather?.[0]?.main || "";
  const iconCode = data?.weather?.[0]?.icon || "";
  const rainAmount = Number(data?.rain?.["1h"] || data?.rain?.["3h"] || 0);
  const windKmh = Number(data?.wind?.speed || 0) * 3.6;

  return {
    icon: weatherEmoji(main, iconCode),
    temp: Number(data?.main?.temp || 25),
    desc: normalizeDescription(main, Number(data?.clouds?.all || 0), rainAmount),
    humidity: Number(data?.main?.humidity || 65),
    wind: `${Math.round(windKmh || 10)} km/h`,
  };
}

async function fetchWeather(district, signal) {
  const query = DISTRICT_QUERY[district] || `${district}, Karnataka, IN`;
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("q", query);
  url.searchParams.set("appid", WEATHER_API_KEY);
  url.searchParams.set("units", "metric");

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Weather request failed: ${response.status}`);
  }

  const data = await response.json();
  return mapWeatherResponse(data);
}

export function useWeather(district) {
  const [wx, setWx] = useState(() => fallbackWeather(district));

  useEffect(() => {
    const fallback = fallbackWeather(district);
    const cached = readCachedWeather(district);
    const controller = new AbortController();
    let intervalId;

    setWx(cached || fallback);

    async function loadWeather() {
      if (!WEATHER_API_KEY) {
        setWx(fallback);
        return;
      }

      try {
        const liveWeather = await fetchWeather(district, controller.signal);
        setWx(liveWeather);
        writeCachedWeather(district, liveWeather);
      } catch (_) {
        setWx(current => current || cached || fallback);
      }
    }

    loadWeather();
    intervalId = setInterval(loadWeather, WEATHER_CACHE_TTL);

    return () => {
      controller.abort();
      clearInterval(intervalId);
    };
  }, [district]);

  return wx;
}
