import { useEffect, useState } from "react";

import { CROPS_DATA } from "../data/constants.js";

function round1(value) {
  return Math.round(Number(value) * 10) / 10;
}

function getDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDate(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function hashSeed(text) {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function dailyFactor(cropName, date) {
  const seed = hashSeed(`${cropName}:${getDayKey(date)}`);
  const ratio = (seed % 10000) / 10000;
  return 0.92 + ratio * 0.2;
}

function dailyPrice(crop, date) {
  const raw = crop.bp * dailyFactor(crop.c, date);
  return round1(Math.max(crop.bp * 0.52, raw));
}

function buildDailyRates(date = new Date()) {
  return CROPS_DATA.map((crop) => {
    const hist = Array.from({ length: 10 }, (_, index) =>
      dailyPrice(crop, shiftDate(date, index - 9))
    );

    return {
      ...crop,
      price: hist[hist.length - 1],
      prev: hist[hist.length - 2] || crop.bp,
      hist,
    };
  });
}

function msUntilNextDailyRefresh() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(24, 0, 5, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}

export function useMarketRates() {
  const [rates, setRates] = useState(() => buildDailyRates(new Date()));

  useEffect(() => {
    let timeoutId;

    function scheduleNextRefresh() {
      timeoutId = setTimeout(() => {
        setRates(buildDailyRates(new Date()));
        scheduleNextRefresh();
      }, msUntilNextDailyRefresh());
    }

    scheduleNextRefresh();
    return () => clearTimeout(timeoutId);
  }, []);

  return rates;
}
