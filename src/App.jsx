import { useState, useEffect, useCallback } from "react";

import Navbar              from "./components/Navbar.jsx";
import Ticker              from "./components/Ticker.jsx";
import HomePage            from "./components/HomePage.jsx";
import AboutPage           from "./components/AboutPage.jsx";
import AuthPage            from "./components/AuthPage.jsx";
import FarmerDashboard     from "./components/FarmerDashboard.jsx";
import RetailerDashboard   from "./components/RetailerDashboard.jsx";
import DeliveryDashboard   from "./components/DeliveryDashboard.jsx";
import ExporterDashboard   from "./components/ExporterDashboard.jsx";
import { Toasts, ActivityPanel } from "./components/UI.jsx";

import { useMarketRates }  from "./hooks/useMarketRates.js";
import { useToast }        from "./hooks/useToast.js";
import { dbGetAll, dbPut, dbDelete } from "./db/indexedDB.js";
import { uid, timeAgo, fmtP } from "./utils/helpers.js";
import { pick, tCrop, tStatus, tVillage } from "./i18n.js";
import { KA_LOCS } from "./data/constants.js";

// ─────────────────────────────────────────────────────────────────
//  CROSS-TAB SYNC
//  All tabs listen to the same BroadcastChannel "rr-sync"
//  Whenever crops or jobs change, we broadcast to all other tabs
//  so Farmer, Retailer and Delivery all see updates live
// ─────────────────────────────────────────────────────────────────
const channel = new BroadcastChannel("rr-sync");
const APP_TITLE = import.meta.env.VITE_APP_NAME || "Raitha Reach";
const DEFAULT_LANG = import.meta.env.VITE_DEFAULT_LANG === "kn" ? "kn" : "en";
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

function generatePickupOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function sendSmsNotice(payload) {
  try {
    await fetch(`${API_BASE}/notify/sms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (_) {}
}

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function getLocationPoint(village, district) {
  return KA_LOCS.find(loc => loc.n === village)
    || KA_LOCS.find(loc => loc.n === district)
    || KA_LOCS.find(loc => loc.d === district)
    || null;
}

function estimateRouteMetrics({ farmerVillage, farmerDistrict, retailerVillage, retailerDistrict }) {
  const from = getLocationPoint(farmerVillage, farmerDistrict);
  const to = getLocationPoint(retailerVillage, retailerDistrict);

  let routeKm = 0;
  if (from && to) {
    routeKm = Math.max(8, Math.round(haversineKm(from, to)));
  } else if (farmerDistrict && retailerDistrict && farmerDistrict === retailerDistrict) {
    routeKm = 18;
  } else {
    routeKm = 72;
  }

  const fuelAllowance = Math.round(routeKm * 2.5);
  const deliveryPayout = Math.round(35 + routeKm * 4.5 + fuelAllowance);

  return {
    routeKm,
    fuelAllowance,
    deliveryPayout,
    payoutRule: `Company payout = base ₹35 + ₹4.5/km + fuel allowance ₹${fuelAllowance}`,
  };
}

function normalizeJob(job) {
  const route = job.routeKm && job.deliveryPayout
    ? {
        routeKm: job.routeKm,
        fuelAllowance: job.fuelAllowance || 0,
        deliveryPayout: job.deliveryPayout,
        payoutRule: job.payoutRule || "",
      }
    : estimateRouteMetrics({
        farmerVillage: job.village,
        farmerDistrict: job.district,
        retailerVillage: job.retailerVillage,
        retailerDistrict: job.retailerDistrict,
      });

  return {
    ...job,
    status: job.status === "scheduled" ? "confirmed" : job.status,
    ...route,
  };
}

function normalizeExportRecord(record) {
  if (!record) return null;

  const kind = record.kind || "listing";
  const sellerId = record.sellerId || record.exportDeskId || record.wholesalerId || "";
  const sellerName = record.sellerName || record.exportDeskName || record.wholesalerName || "";
  const sellerCompany = record.sellerCompany || record.exportDeskName || record.wholesalerName || "";
  const sellerPhone = record.sellerPhone || record.exportDeskPhone || record.wholesalerPhone || "";

  return {
    ...record,
    kind,
    sellerId,
    sellerName,
    sellerCompany,
    sellerPhone,
    bids: Array.isArray(record.bids) ? record.bids : [],
    status: record.status || "open",
    updatedAt: record.updatedAt || record.createdAt || Date.now(),
  };
}

function broadcastCrops(crops) {
  try { channel.postMessage({ type: "CROPS_UPDATE", crops }); } catch (_) {}
}
function broadcastJobs(jobs) {
  try { channel.postMessage({ type: "JOBS_UPDATE", jobs }); } catch (_) {}
}
function broadcastRequirements(requirements) {
  try { channel.postMessage({ type: "REQUIREMENTS_UPDATE", requirements }); } catch (_) {}
}
function broadcastExports(exportRecords) {
  try { channel.postMessage({ type: "EXPORTS_UPDATE", exportRecords }); } catch (_) {}
}

export default function App() {
  const [page, setPage]   = useState("home");
  const [user, setUser]   = useState(null);
  const [lang, setLang]   = useState(() => localStorage.getItem("rr-lang") || DEFAULT_LANG);
  const [crops, setCrops] = useState([]);
  const [jobs,  setJobs]  = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [exportRecords, setExportRecords] = useState([]);
  const [actOpen, setActOpen] = useState(true);
  const [activity, setActivity]           = useState([]);
  const [notifications, setNotifications] = useState([]);

  const rates = useMarketRates();
  const { toasts, toast } = useToast();

  useEffect(() => {
    document.title = APP_TITLE;
  }, []);

  useEffect(() => {
    localStorage.setItem("rr-lang", lang);
    document.documentElement.lang = lang === "kn" ? "kn" : "en";
  }, [lang]);

  // ── 1. Load all data from IndexedDB on mount ─────────────────
  useEffect(() => {
    (async () => {
      try {
        const [dc, dj, dr, de] = await Promise.all([dbGetAll("crops"), dbGetAll("jobs"), dbGetAll("requirements"), dbGetAll("exports")]);
        const realCrops = dc.filter(c => !c.id.startsWith("sc") && !c.id.startsWith("seed"));
        const realJobs  = dj.filter(j => !j.id.startsWith("sj") && !j.id.startsWith("seed")).map(normalizeJob);
        const realRequirements = dr.filter(r => !r.id.startsWith("seed"));
        const realExports = de.filter(record => !String(record.id || "").startsWith("seed")).map(normalizeExportRecord).filter(Boolean);
        setCrops(realCrops);
        setJobs(realJobs);
        setRequirements(realRequirements);
        setExportRecords(realExports);
      } catch (_) {}
    })();
  }, []);

  // ── 3. Helpers ───────────────────────────────────────────────
  const addActivity = useCallback(item => {
    setActivity(a => [{ ...item, id: uid(), timeLabel: timeAgo(item.ts, lang) }, ...a].slice(0, 30));
  }, [lang]);

  const addNotification = useCallback(text => {
    setNotifications(n => [{ id: uid(), text, time: pick(lang, "just now", "ಈಗ ತಾನೇ"), unread: true }, ...n].slice(0, 20));
  }, [lang]);

  // ── 2. Listen for updates from OTHER tabs ────────────────────
  useEffect(() => {
    function onMessage(e) {
      if (e.data.type === "CROPS_UPDATE") {
        setCrops(e.data.crops);
      }
      if (e.data.type === "JOBS_UPDATE") {
        setJobs(e.data.jobs);
      }
      if (e.data.type === "REQUIREMENTS_UPDATE") {
        setRequirements(e.data.requirements);
      }
      if (e.data.type === "EXPORTS_UPDATE") {
        setExportRecords((e.data.exportRecords || []).map(normalizeExportRecord).filter(Boolean));
      }
      if (e.data.type === "NEW_BID") {
        const bidderLabel = e.data.shopName || e.data.bidderName;
        const qtyLabel = e.data.quantity ? ` for ${e.data.quantity}kg` : "";
        // Show notification to farmer in another tab
        addNotification(pick(lang, `💰 New bid: ${fmtP(e.data.amount)}/kg${qtyLabel} on ${tCrop(e.data.cropName, lang)} from ${bidderLabel}`, `💰 ಹೊಸ ಬಿಡ್: ${tCrop(e.data.cropName, lang)} ಮೇಲೆ ${fmtP(e.data.amount)}/ಕೆಜಿ ದರಕ್ಕೆ ${bidderLabel} ${e.data.quantity ? `${e.data.quantity}ಕೆಜಿ` : ""} ಬಿಡ್ ಮಾಡಿದ್ದಾರೆ`));
        addActivity({ icon: "💰", text: pick(lang, `${bidderLabel} bid ${fmtP(e.data.amount)}/kg${qtyLabel} on ${tCrop(e.data.cropName, lang)}`, `${bidderLabel} ಅವರು ${tCrop(e.data.cropName, lang)} ಮೇಲೆ ${fmtP(e.data.amount)}/ಕೆಜಿ ${e.data.quantity ? `${e.data.quantity}ಕೆಜಿ` : ""} ಬಿಡ್ ಮಾಡಿದ್ದಾರೆ`), ts: Date.now() });
      }
      if (e.data.type === "BID_ACCEPTED") {
        addNotification(pick(lang, `🤝 Your wholesaler bid for ${tCrop(e.data.cropName, lang)} was accepted. Confirm the order to close bidding.`, `🤝 ${tCrop(e.data.cropName, lang)}ಗಾಗಿ ನಿಮ್ಮ ಸಗಟು ಬಿಡ್ ಅಂಗೀಕರಿಸಲಾಗಿದೆ. ಹರಾಜು ಮುಚ್ಚಲು ಆದೇಶವನ್ನು ದೃಢೀಕರಿಸಿ.`));
        addActivity({ icon: "🤝", text: pick(lang, `Farmer accepted your bid for ${tCrop(e.data.cropName, lang)} @ ${fmtP(e.data.amount)}/kg`, `${tCrop(e.data.cropName, lang)}ಗಾಗಿ ನಿಮ್ಮ ${fmtP(e.data.amount)}/ಕೆಜಿ ಬಿಡ್ ರೈತರು ಅಂಗೀಕರಿಸಿದ್ದಾರೆ`), ts: Date.now() });
      }
      if (e.data.type === "NEW_REQUIREMENT") {
        addNotification(pick(
          lang,
          `🧾 ${e.data.retailerName || "Wholesaler"} needs ${tCrop(e.data.cropName, lang)}: ${e.data.quantity}kg @ ${fmtP(e.data.amount)}/kg`,
          `🧾 ${e.data.retailerName || "ಸಗಟು ಖರೀದಿದಾರ"} ಅವರಿಗೆ ${tCrop(e.data.cropName, lang)} ಬೇಕಾಗಿದೆ: ${e.data.quantity}ಕೆಜಿ @ ${fmtP(e.data.amount)}/ಕೆಜಿ`
        ));
        addActivity({
          icon: "🧾",
          text: pick(
            lang,
            `${e.data.retailerName || "Wholesaler"} posted a need for ${tCrop(e.data.cropName, lang)} (${e.data.quantity}kg)`,
            `${e.data.retailerName || "ಸಗಟು ಖರೀದಿದಾರ"} ಅವರು ${tCrop(e.data.cropName, lang)}ಗೆ ${e.data.quantity}ಕೆಜಿ ಬೇಡಿಕೆ ಪೋಸ್ಟ್ ಮಾಡಿದ್ದಾರೆ`
          ),
          ts: Date.now(),
        });
      }
      if (e.data.type === "REQUIREMENT_MATCHED") {
        addNotification(pick(
          lang,
          `🌾 ${e.data.farmerName} accepted your need for ${tCrop(e.data.cropName, lang)} at ${fmtP(e.data.amount)}/kg.`,
          `🌾 ${e.data.farmerName} ಅವರು ${tCrop(e.data.cropName, lang)}ಗಾಗಿ ನಿಮ್ಮ ಬೇಡಿಕೆಯನ್ನು ${fmtP(e.data.amount)}/ಕೆಜಿ ದರಕ್ಕೆ ಅಂಗೀಕರಿಸಿದ್ದಾರೆ.`
        ));
        addActivity({
          icon: "🌾",
          text: pick(
            lang,
            `${e.data.farmerName} matched your ${tCrop(e.data.cropName, lang)} requirement for ${e.data.quantity}kg`,
            `${e.data.farmerName} ಅವರು ${tCrop(e.data.cropName, lang)}ಗಾಗಿ ನಿಮ್ಮ ${e.data.quantity}ಕೆಜಿ ಬೇಡಿಕೆಗೆ ಹೊಂದಿಕೊಂಡಿದ್ದಾರೆ`
          ),
          ts: Date.now(),
        });
      }
      if (e.data.type === "ORDER_CONFIRMED") {
        if (e.data.direct) {
          addNotification(pick(
            lang,
            `✅ ${e.data.retailerName || "Wholesaler"} accepted ${tCrop(e.data.cropName, lang)}. Order confirmed and delivery is now open.`,
            `✅ ${e.data.retailerName || "ಸಗಟು ಖರೀದಿದಾರರು"} ${tCrop(e.data.cropName, lang)} ಅನ್ನು ಸ್ವೀಕರಿಸಿದ್ದಾರೆ. ಆದೇಶ ದೃಢೀಕರಿಸಲಾಗಿದೆ ಮತ್ತು ವಿತರಣೆ ಈಗ ತೆರೆಯಲಾಗಿದೆ.`
          ));
          addActivity({
            icon: "✅",
            text: pick(
              lang,
              `${e.data.retailerName || "Wholesaler"} accepted ${tCrop(e.data.cropName, lang)} @ ${fmtP(e.data.price || 0)}/kg · Delivery payout ${fmtP(e.data.deliveryPayout)}`,
              `${e.data.retailerName || "ಸಗಟು ಖರೀದಿದಾರರು"} ${tCrop(e.data.cropName, lang)} ಅನ್ನು ${fmtP(e.data.price || 0)}/ಕೆಜಿ ದರಕ್ಕೆ ಸ್ವೀಕರಿಸಿದ್ದಾರೆ · ಚಾಲಕರ ಪಾವತಿ ${fmtP(e.data.deliveryPayout)}`
            ),
            ts: Date.now(),
          });
        } else {
          addNotification(pick(lang, `✅ Wholesaler confirmed ${tCrop(e.data.cropName, lang)}. Bid accepted and delivery route is now open.`, `✅ ಸಗಟು ಖರೀದಿದಾರರು ${tCrop(e.data.cropName, lang)} ಅನ್ನು ದೃಢೀಕರಿಸಿದ್ದಾರೆ. ಬಿಡ್ ಅಂಗೀಕರಿಸಿ ವಿತರಣಾ ಮಾರ್ಗ ಈಗ ಲಭ್ಯವಾಗಿದೆ.`));
          addActivity({ icon: "✅", text: pick(lang, `Wholesaler confirmed ${tCrop(e.data.cropName, lang)} · Delivery payout ${fmtP(e.data.deliveryPayout)}`, `${tCrop(e.data.cropName, lang)}ಗಾಗಿ ಸಗಟು ಖರೀದಿದಾರರು ದೃಢೀಕರಿಸಿದ್ದಾರೆ · ಚಾಲಕರ ಪಾವತಿ ${fmtP(e.data.deliveryPayout)}`), ts: Date.now() });
        }
      }
      if (e.data.type === "JOB_CLAIMED") {
        addNotification(pick(
          lang,
          `🚛 ${e.data.driverName} is coming to collect ${tCrop(e.data.cropName, lang)}. Driver phone: ${e.data.driverPhone}`,
          `🚛 ${e.data.driverName} ಅವರು ${tCrop(e.data.cropName, lang)} ತೆಗೆದುಕೊಳ್ಳಲು ಬರುತ್ತಿದ್ದಾರೆ. ಚಾಲಕರ ಫೋನ್: ${e.data.driverPhone}`
        ));
        addActivity({
          icon: "🚛",
          text: pick(
            lang,
            `${e.data.driverName} is on the way to the farm for ${tCrop(e.data.cropName, lang)} · Call ${e.data.driverPhone}`,
            `${e.data.driverName} ಅವರು ${tCrop(e.data.cropName, lang)}ಗಾಗಿ ಫಾರ್ಮ್ ಕಡೆ ಬರುತ್ತಿದ್ದಾರೆ · ಕರೆ ಮಾಡಿ ${e.data.driverPhone}`
          ),
          ts: Date.now(),
        });
      }
      if (e.data.type === "STATUS_UPDATE") {
        addNotification(pick(lang, `📦 ${tCrop(e.data.cropName, lang)}: ${tStatus(e.data.status, lang)}`, `📦 ${tCrop(e.data.cropName, lang)}: ${tStatus(e.data.status, lang)}`));
        addActivity({ icon: "📦", text: pick(lang, `${tCrop(e.data.cropName, lang)} delivery status: ${tStatus(e.data.status, lang)}`, `${tCrop(e.data.cropName, lang)} ವಿತರಣಾ ಸ್ಥಿತಿ: ${tStatus(e.data.status, lang)}`), ts: Date.now() });
      }
      if (e.data.type === "NEW_EXPORT_LISTING" && user?.role === "exporter" && user?.exportAccess === "foreign") {
        const visibleMarkets = Array.isArray(user.marketAccess) && user.marketAccess.length ? user.marketAccess : [user.country].filter(Boolean);
        if (!visibleMarkets.includes(e.data.targetMarket)) return;
        addNotification(pick(
          lang,
          `🌍 New India export listing: ${tCrop(e.data.cropName, lang)} for ${e.data.targetMarket}.`,
          `🌍 ${e.data.targetMarket}ಗಾಗಿ ${tCrop(e.data.cropName, lang)} ಹೊಸ ಭಾರತ ರಫ್ತು ಲಿಸ್ಟಿಂಗ್ ಬಂದಿದೆ.`
        ));
        addActivity({
          icon: "🌍",
          text: pick(
            lang,
            `${e.data.sellerName} opened a fresh export listing for ${tCrop(e.data.cropName, lang)} in ${e.data.targetMarket}`,
            `${e.data.sellerName} ಅವರು ${e.data.targetMarket}ಗೆ ${tCrop(e.data.cropName, lang)}ಗಾಗಿ ಹೊಸ ರಫ್ತು ಲಿಸ್ಟಿಂಗ್ ತೆರೆಯಿದ್ದಾರೆ`
          ),
          ts: Date.now(),
        });
      }
      if (e.data.type === "EXPORT_BID_PLACED" && user?.role === "exporter" && user?.exportAccess === "india" && e.data.sellerId === user.id) {
        addNotification(pick(
          lang,
          `🌍 ${e.data.buyerName} bid ${fmtP(e.data.amount)}/kg for ${e.data.quantity}kg on your export lot.`,
          `🌍 ${e.data.buyerName} ಅವರು ನಿಮ್ಮ ರಫ್ತು ಲಾಟ್‌ಗೆ ${e.data.quantity}ಕೆಜಿಗೆ ${fmtP(e.data.amount)}/ಕೆಜಿ ಬಿಡ್ ಮಾಡಿದ್ದಾರೆ.`
        ));
      }
      if (e.data.type === "EXPORT_BID_ACCEPTED" && user?.role === "exporter" && e.data.buyerId === user.id) {
        addNotification(pick(
          lang,
          `✅ Your export bid for ${tCrop(e.data.cropName, lang)} was accepted by ${e.data.sellerName}.`,
          `✅ ${e.data.sellerName} ಅವರು ${tCrop(e.data.cropName, lang)}ಗಾಗಿ ನಿಮ್ಮ ರಫ್ತು ಬಿಡ್ ಅನ್ನು ಅಂಗೀಕರಿಸಿದ್ದಾರೆ.`
        ));
      }
      if (e.data.type === "NEW_EXPORT_REQUEST" && user?.role === "exporter" && user?.exportAccess === "india") {
        addNotification(pick(
          lang,
          `🧾 ${e.data.buyerName} requested ${tCrop(e.data.cropName, lang)} for ${e.data.targetMarket}.`,
          `🧾 ${e.data.buyerName} ಅವರು ${e.data.targetMarket}ಗಾಗಿ ${tCrop(e.data.cropName, lang)} ಬೇಡಿಕೆ ಹಾಕಿದ್ದಾರೆ.`
        ));
      }
      if (e.data.type === "EXPORT_REQUEST_ACCEPTED" && user?.role === "exporter" && e.data.buyerId === user.id) {
        addNotification(pick(
          lang,
          `✅ ${e.data.sellerName} accepted your request for ${tCrop(e.data.cropName, lang)}.`,
          `✅ ${e.data.sellerName} ಅವರು ${tCrop(e.data.cropName, lang)}ಗಾಗಿ ನಿಮ್ಮ ಬೇಡಿಕೆಯನ್ನು ಅಂಗೀಕರಿಸಿದ್ದಾರೆ.`
        ));
      }
    }
    channel.addEventListener("message", onMessage);
    return () => channel.removeEventListener("message", onMessage);
  }, [addActivity, addNotification, lang, user]);

  // Refresh time labels every minute
  useEffect(() => {
    const syncLabels = () => {
      setActivity(a => a.map(x => ({ ...x, timeLabel: timeAgo(x.ts, lang) })));
    };
    syncLabels();
    const iv = setInterval(() => {
      syncLabels();
    }, 60000);
    return () => clearInterval(iv);
  }, [lang]);

  // ── 4. Auth ──────────────────────────────────────────────────
  function onLogin(u)  { setUser(u); setPage("portal"); }
  function onLogout()  { setUser(null); setPage("home"); }

  // ── 5. CROP ACTIONS ──────────────────────────────────────────

  // Farmer posts a crop → save to DB → broadcast to all tabs
  async function onPost(crop) {
    const updated = [...crops, crop];
    setCrops(updated);
    broadcastCrops(updated);   // ← Retailer tab sees it immediately
    try { await dbPut("crops", crop); } catch (_) {}
    addActivity({ icon: "🌾", text: pick(lang, `You posted ${tCrop(crop.cropName, lang)} (${crop.quantity}kg) for wholesalers to bid on`, `ನೀವು ${tCrop(crop.cropName, lang)} (${crop.quantity}ಕೆಜಿ) ಮೇಲೆ ಸಗಟು ಖರೀದಿದಾರರು ಬಿಡ್ ಮಾಡಲು ಪೋಸ್ಟ್ ಮಾಡಿದ್ದೀರಿ`), ts: Date.now() });
  }

  async function onPostRequirement(requirement) {
    const updated = [requirement, ...requirements];
    setRequirements(updated);
    broadcastRequirements(updated);
    try { await dbPut("requirements", requirement); } catch (_) {}

    channel.postMessage({
      type: "NEW_REQUIREMENT",
      cropName: requirement.cropName,
      quantity: requirement.quantity,
      amount: requirement.bidAmount,
      retailerName: requirement.retailerName,
    });

    addActivity({
      icon: "🧾",
      text: pick(
        lang,
        `You posted a crop need for ${tCrop(requirement.cropName, lang)} (${requirement.quantity}kg) @ ${fmtP(requirement.bidAmount)}/kg`,
        `ನೀವು ${tCrop(requirement.cropName, lang)}ಗೆ ${requirement.quantity}ಕೆಜಿ ಬೇಡಿಕೆಯನ್ನು ${fmtP(requirement.bidAmount)}/ಕೆಜಿ ದರಕ್ಕೆ ಪೋಸ್ಟ್ ಮಾಡಿದ್ದೀರಿ`
      ),
      ts: Date.now(),
    });
  }

  async function onDeleteRequirement(requirementId) {
    const updated = requirements.filter(item => item.id !== requirementId);
    setRequirements(updated);
    broadcastRequirements(updated);
    try { await dbDelete("requirements", requirementId); } catch (_) {}
  }

  async function onPostExportListing(listing) {
    const nextListing = normalizeExportRecord(listing);
    const updated = [nextListing, ...exportRecords];
    setExportRecords(updated);
    broadcastExports(updated);
    try { await dbPut("exports", nextListing); } catch (_) {}

    channel.postMessage({
      type: "NEW_EXPORT_LISTING",
      cropName: nextListing.cropName,
      targetMarket: nextListing.targetMarket,
      sellerName: nextListing.sellerCompany || nextListing.sellerName,
    });
  }

  async function onPlaceExportBid(listingId, bid) {
    let changed = null;
    const updated = exportRecords.map((record) => {
      if (record.id !== listingId || record.kind !== "listing") return record;
      const existingIndex = (record.bids || []).findIndex((item) => item.buyerId === bid.buyerId);
      const nextBids = existingIndex >= 0
        ? (record.bids || []).map((item, index) => index === existingIndex ? bid : item)
        : [...(record.bids || []), bid];
      changed = normalizeExportRecord({
        ...record,
        bids: nextBids,
        updatedAt: Date.now(),
      });
      return changed;
    });

    if (!changed) return;

    setExportRecords(updated);
    broadcastExports(updated);
    try { await dbPut("exports", changed); } catch (_) {}

    channel.postMessage({
      type: "EXPORT_BID_PLACED",
      cropName: changed.cropName,
      quantity: bid.quantity,
      amount: bid.amount,
      buyerName: bid.buyerName,
      sellerId: changed.sellerId,
    });
  }

  async function onAcceptExportBid(listingId, bidId) {
    const currentListing = exportRecords.find((record) => record.id === listingId && record.kind === "listing");
    if (!currentListing || currentListing.sellerId !== user?.id) return;

    const acceptedBid = (currentListing.bids || []).find((bid) => bid.id === bidId);
    if (!acceptedBid) return;

    const updated = exportRecords.map((record) =>
      record.id === listingId
        ? normalizeExportRecord({
            ...record,
            status: "accepted",
            acceptedBidId: bidId,
            acceptedBid,
            acceptedAt: Date.now(),
            updatedAt: Date.now(),
          })
        : record
    );

    const changed = updated.find((record) => record.id === listingId);
    setExportRecords(updated);
    broadcastExports(updated);
    try { await dbPut("exports", changed); } catch (_) {}

    channel.postMessage({
      type: "EXPORT_BID_ACCEPTED",
      cropName: changed?.cropName,
      buyerId: acceptedBid.buyerId,
      sellerName: changed?.sellerCompany || changed?.sellerName,
    });
  }

  async function onPostExportRequest(request) {
    const nextRequest = normalizeExportRecord(request);
    const updated = [nextRequest, ...exportRecords];
    setExportRecords(updated);
    broadcastExports(updated);
    try { await dbPut("exports", nextRequest); } catch (_) {}

    channel.postMessage({
      type: "NEW_EXPORT_REQUEST",
      cropName: nextRequest.cropName,
      targetMarket: nextRequest.targetMarket,
      buyerName: nextRequest.buyerCompany || nextRequest.buyerName,
    });
  }

  async function onAcceptExportRequest(requestId, response) {
    const currentRequest = exportRecords.find((record) => record.id === requestId && record.kind === "request");
    if (!currentRequest || currentRequest.status !== "open") return;

    const updated = exportRecords.map((record) =>
      record.id === requestId
        ? normalizeExportRecord({
            ...record,
            status: "accepted",
            acceptedResponse: {
              ...response,
              acceptedAt: Date.now(),
            },
            updatedAt: Date.now(),
          })
        : record
    );

    const changed = updated.find((record) => record.id === requestId);
    setExportRecords(updated);
    broadcastExports(updated);
    try { await dbPut("exports", changed); } catch (_) {}

    channel.postMessage({
      type: "EXPORT_REQUEST_ACCEPTED",
      cropName: changed?.cropName,
      buyerId: changed?.buyerId,
      sellerName: response.sellerCompany || response.sellerName,
    });
  }

  // Retailer places a bid → save to DB → broadcast to all tabs
  async function onBid(cropId, bid) {
    const updated = crops.map(c => {
      if (c.id !== cropId) return c;
      const ei = c.bids.findIndex(b => b.bidderId === bid.bidderId);
      const newBids = ei >= 0
        ? c.bids.map((b, i) => i === ei ? bid : b)
        : [...c.bids, bid];
      return { ...c, bids: newBids, status: "bidding" };
    });
    setCrops(updated);
    broadcastCrops(updated);   // ← Farmer tab sees bid immediately

    const crop = updated.find(c => c.id === cropId);
    try { await dbPut("crops", crop); } catch (_) {}

    // Tell other tabs about this new bid
    channel.postMessage({
      type: "NEW_BID",
      cropName:   crop?.cropName,
      amount:     bid.amount,
      bidderName: bid.bidderName,
      shopName:   bid.shopName || bid.bidderName,
      quantity:   bid.quantity,
    });

    addActivity({ icon: "💰", text: pick(lang, `You placed a wholesale bid of ${fmtP(bid.amount)}/kg for ${bid.quantity}kg on ${tCrop(crop?.cropName, lang)} from ${tVillage(crop?.village, lang)}`, `ನೀವು ${tVillage(crop?.village, lang)}ನ ${tCrop(crop?.cropName, lang)} ಮೇಲೆ ${bid.quantity}ಕೆಜಿಗೆ ${fmtP(bid.amount)}/ಕೆಜಿ ಸಗಟು ಬಿಡ್ ಮಾಡಿದ್ದೀರಿ`), ts: Date.now() });
  }

  // Farmer accepts a bid → create job → broadcast to all tabs
  async function onAcceptBid(crop, bid) {
    const routeMetrics = estimateRouteMetrics({
      farmerVillage: crop.village,
      farmerDistrict: crop.district,
      retailerVillage: bid.bidderVillage,
      retailerDistrict: bid.bidderDistrict || bid.district,
    });
    const job = {
      id:            uid(),
      cropId:        crop.id,
      cropName:      crop.cropName,
      emoji:         crop.emoji,
      farmerId:      crop.farmerId,
      farmerName:    crop.farmerName,
      farmerPhone:   crop.farmerPhone,
      retailerId:    bid.bidderId,
      retailerName:  bid.shopName || bid.bidderName,
      retailerPhone: bid.bidderPhone,
      retailerVillage: bid.bidderVillage || "",
      retailerDistrict: bid.bidderDistrict || bid.district || "",
      retailerPin: bid.bidderPin || "",
      deliveryId:    null,
      deliveryName:  null,
      deliveryPhone: null,
      winningBid:    bid.amount,
      quantity:      bid.quantity,
      pickupAddress: crop.pickupAddress,
      village:       crop.village,
      district:      crop.district,
      status:        "awaiting-retailer",
      createdAt:     Date.now(),
      ...routeMetrics,
    };

    const updatedCrops = crops.map(c =>
      c.id === crop.id ? { ...c, status: "booked" } : c
    );
    const updatedJobs = [job, ...jobs];

    setCrops(updatedCrops);
    setJobs(updatedJobs);
    broadcastCrops(updatedCrops);  // ← Retailer sees crop is booked
    broadcastJobs(updatedJobs);    // ← Delivery tab sees the new job

    try {
      await dbPut("crops", updatedCrops.find(c => c.id === crop.id));
      await dbPut("jobs", job);
    } catch (_) {}

    // Tell retailer tab bid was accepted
    channel.postMessage({
      type:      "BID_ACCEPTED",
      cropName:  crop.cropName,
      amount:    bid.amount,
      retailerId: bid.bidderId,
    });

    addActivity({ icon: "🤝", text: pick(lang, `Bid accepted. Waiting for ${bid.shopName || bid.bidderName} to confirm order for ${tCrop(crop.cropName, lang)}`, `${tCrop(crop.cropName, lang)}ಗಾಗಿ ${bid.shopName || bid.bidderName} ಅವರು ಆದೇಶವನ್ನು ದೃಢೀಕರಿಸುವುದಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ`), ts: Date.now() });
  }

  async function onAcceptRequirement(requirement, response) {
    if (!requirement || requirement.status !== "open") return;

    const quantity = Number(response?.quantity || 0);
    const amount = Number(response?.amount || 0);

    if (!quantity || !amount) return;

    const now = Date.now();
    const routeMetrics = estimateRouteMetrics({
      farmerVillage: user?.village,
      farmerDistrict: user?.district,
      retailerVillage: requirement.retailerVillage,
      retailerDistrict: requirement.retailerDistrict,
    });

    const job = {
      id: uid(),
      sourceType: "requirement",
      requirementId: requirement.id,
      cropId: null,
      cropName: requirement.cropName,
      emoji: requirement.emoji || "🌾",
      farmerId: user.id,
      farmerName: user.name,
      farmerPhone: user.phone,
      retailerId: requirement.retailerId,
      retailerName: requirement.retailerName,
      retailerPhone: requirement.retailerPhone,
      retailerVillage: requirement.retailerVillage || "",
      retailerDistrict: requirement.retailerDistrict || "",
      retailerPin: requirement.retailerPin || "",
      deliveryId: null,
      deliveryName: null,
      deliveryPhone: null,
      winningBid: amount,
      quantity,
      pickupAddress: `${user.village || ""}, ${user.district || ""}, Karnataka ${user.pin || ""}`.replace(/^,\s*|,\s*$/g, "").replace(/\s+,/g, ","),
      village: user.village || "",
      district: user.district || "",
      status: "awaiting-retailer",
      createdAt: now,
      requirementNotes: requirement.notes || "",
      farmerPricingMode: response?.pricing?.pricingMode || "",
      farmerCostPerKg: Number(response?.pricing?.costPerKg || 0),
      farmerExpectedPrice: Number(response?.pricing?.expectedPrice || 0),
      wholesalerBidAmount: Number(requirement.bidAmount || 0),
      ...routeMetrics,
    };

    const updatedRequirements = requirements.map(item =>
      item.id === requirement.id
        ? {
            ...item,
            status: "matched",
            matchedAt: now,
            matchedByFarmerId: user.id,
            matchedByFarmerName: user.name,
            matchedByFarmerPhone: user.phone,
            matchedQuantity: quantity,
            farmerOfferPrice: amount,
          }
        : item
    );
    const updatedJobs = [job, ...jobs];

    setRequirements(updatedRequirements);
    setJobs(updatedJobs);
    broadcastRequirements(updatedRequirements);
    broadcastJobs(updatedJobs);

    try {
      await dbPut("requirements", updatedRequirements.find(item => item.id === requirement.id));
      await dbPut("jobs", job);
    } catch (_) {}

    channel.postMessage({
      type: "REQUIREMENT_MATCHED",
      cropName: requirement.cropName,
      amount,
      quantity,
      farmerName: user.name,
      retailerId: requirement.retailerId,
    });

    addActivity({
      icon: "🤝",
      text: pick(
        lang,
        `You accepted ${requirement.retailerName}'s need for ${tCrop(requirement.cropName, lang)} @ ${fmtP(amount)}/kg for ${quantity}kg`,
        `ನೀವು ${requirement.retailerName} ಅವರ ${tCrop(requirement.cropName, lang)} ಬೇಡಿಕೆಯನ್ನು ${fmtP(amount)}/ಕೆಜಿ ದರಕ್ಕೆ ${quantity}ಕೆಜಿಗೆ ಅಂಗೀಕರಿಸಿದ್ದೀರಿ`
      ),
      ts: now,
    });
  }

  async function onConfirmRetailerOrder(jobId) {
    const updated = jobs.map(j =>
      j.id === jobId ? { ...j, status: "confirmed", confirmedAt: Date.now() } : j
    );
    setJobs(updated);
    broadcastJobs(updated);

    const job = updated.find(j => j.id === jobId);
    try { await dbPut("jobs", job); } catch (_) {}

    if (job?.requirementId) {
      const updatedRequirements = requirements.map(item =>
        item.id === job.requirementId ? { ...item, status: "confirmed", confirmedAt: Date.now() } : item
      );
      setRequirements(updatedRequirements);
      broadcastRequirements(updatedRequirements);
      try { await dbPut("requirements", updatedRequirements.find(item => item.id === job.requirementId)); } catch (_) {}
    }

    channel.postMessage({
      type: "ORDER_CONFIRMED",
      cropName: job?.cropName,
      deliveryPayout: job?.deliveryPayout,
    });

    await sendSmsNotice({
      to: job?.farmerPhone,
      event: "retailer_confirmed_order",
      message: `Raitha Reach: Your ${job?.cropName} order is accepted by ${job?.retailerName}. Pickup order is confirmed.`,
    });

    addActivity({ icon: "✅", text: pick(lang, `Wholesaler confirmed order for ${tCrop(job?.cropName, lang)}. Bid closed and delivery opened.`, `${tCrop(job?.cropName, lang)}ಗಾಗಿ ಸಗಟು ಖರೀದಿದಾರರು ಆದೇಶ ದೃಢೀಕರಿಸಿದ್ದಾರೆ. ಹರಾಜು ಮುಚ್ಚಿ ವಿತರಣೆ ತೆರೆದಿದೆ.`), ts: Date.now() });
  }

  async function onRetailerAcceptCrop(crop, retailer) {
    if (!crop || crop.status === "booked" || crop.status === "delivered") return;
    if (jobs.some(job => job.cropId === crop.id)) return;

    const now = Date.now();
    const acceptedPrice = Number(crop.expectedPrice || crop.minBid || 0);
    const routeMetrics = estimateRouteMetrics({
      farmerVillage: crop.village,
      farmerDistrict: crop.district,
      retailerVillage: retailer.village,
      retailerDistrict: retailer.district,
    });

    const job = {
      id: uid(),
      cropId: crop.id,
      cropName: crop.cropName,
      emoji: crop.emoji,
      farmerId: crop.farmerId,
      farmerName: crop.farmerName,
      farmerPhone: crop.farmerPhone,
      retailerId: retailer.id,
      retailerName: retailer.name,
      retailerPhone: retailer.phone,
      retailerVillage: retailer.village || "",
      retailerDistrict: retailer.district || "",
      retailerPin: retailer.pin || "",
      deliveryId: null,
      deliveryName: null,
      deliveryPhone: null,
      winningBid: acceptedPrice,
      quantity: crop.quantity,
      pickupAddress: crop.pickupAddress,
      village: crop.village,
      district: crop.district,
      status: "confirmed",
      acceptedMode: "direct",
      createdAt: now,
      acceptedAt: now,
      ...routeMetrics,
    };

    const updatedCrops = crops.map(c =>
      c.id === crop.id
        ? {
            ...c,
            status: "booked",
            acceptedById: retailer.id,
            acceptedByName: retailer.name,
            acceptedPrice,
            acceptedAt: now,
          }
        : c
    );
    const updatedJobs = [job, ...jobs];

    setCrops(updatedCrops);
    setJobs(updatedJobs);
    broadcastCrops(updatedCrops);
    broadcastJobs(updatedJobs);

    try {
      await dbPut("crops", updatedCrops.find(c => c.id === crop.id));
      await dbPut("jobs", job);
    } catch (_) {}

    channel.postMessage({
      type: "ORDER_CONFIRMED",
      cropName: crop.cropName,
      deliveryPayout: job.deliveryPayout,
      retailerName: retailer.name,
      price: acceptedPrice,
      direct: true,
    });

    await sendSmsNotice({
      to: crop.farmerPhone,
      event: "retailer_accepted_crop",
      message: `Raitha Reach: ${retailer.name} accepted your ${crop.cropName}. Order is confirmed at ${fmtP(acceptedPrice)}/kg.`,
    });

    addActivity({
      icon: "🛒",
      text: pick(
        lang,
        `You accepted ${tCrop(crop.cropName, lang)} at ${fmtP(acceptedPrice)}/kg. Delivery is now open.`,
        `ನೀವು ${tCrop(crop.cropName, lang)} ಅನ್ನು ${fmtP(acceptedPrice)}/ಕೆಜಿ ದರಕ್ಕೆ ಸ್ವೀಕರಿಸಿದ್ದೀರಿ. ವಿತರಣೆ ಈಗ ತೆರೆಯಲಾಗಿದೆ.`
      ),
      ts: now,
    });
  }

  // Farmer deletes a crop
  async function onDeleteCrop(cropId) {
    const updated = crops.filter(c => c.id !== cropId);
    setCrops(updated);
    broadcastCrops(updated);
    try { await dbDelete("crops", cropId); } catch (_) {}
  }

  // Farmer cancels a job (only if not yet claimed)
  async function onDeleteJob(jobId) {
    const job = jobs.find(j => j.id === jobId);
    if (job?.requirementId) {
      const updatedRequirements = requirements.map(item =>
        item.id === job.requirementId
          ? {
              ...item,
              status: "open",
              matchedAt: null,
              matchedByFarmerId: null,
              matchedByFarmerName: null,
              matchedByFarmerPhone: null,
              matchedQuantity: null,
              farmerOfferPrice: null,
              confirmedAt: null,
            }
          : item
      );
      setRequirements(updatedRequirements);
      broadcastRequirements(updatedRequirements);
      try { await dbPut("requirements", updatedRequirements.find(item => item.id === job.requirementId)); } catch (_) {}
    } else if (job) {
      const updatedCrops = crops.map(c =>
        c.id === job.cropId ? { ...c, status: "open", bids: [] } : c
      );
      setCrops(updatedCrops);
      broadcastCrops(updatedCrops);
      try { await dbPut("crops", updatedCrops.find(c => c.id === job.cropId)); } catch (_) {}
    }
    const updatedJobs = jobs.filter(j => j.id !== jobId);
    setJobs(updatedJobs);
    broadcastJobs(updatedJobs);
    try { await dbDelete("jobs", jobId); } catch (_) {}
  }

  // Retailer withdraws their bid
  async function onWithdrawBid(cropId) {
    const updated = crops.map(c => {
      if (c.id !== cropId) return c;
      const newBids = c.bids.filter(b => b.bidderId !== user.id);
      return { ...c, bids: newBids, status: newBids.length > 0 ? "bidding" : "open" };
    });
    setCrops(updated);
    broadcastCrops(updated);
    try { await dbPut("crops", updated.find(c => c.id === cropId)); } catch (_) {}
  }

  // ── 6. JOB ACTIONS ───────────────────────────────────────────

  // Delivery claims a job
  async function onClaim(jobId, du) {
    const existingJob = jobs.find(j => j.id === jobId);
    const pickupOtp = existingJob?.pickupOtp || generatePickupOtp();
    const pickupOtpIssuedAt = existingJob?.pickupOtpIssuedAt || Date.now();

    const updated = jobs.map(j =>
      j.id === jobId
        ? {
            ...j,
            deliveryId: du.id,
            deliveryName: du.name,
            deliveryPhone: du.phone,
            status: "on-the-way",
            pickupOtp,
            pickupOtpIssuedAt,
            pickupOtpVerifiedAt: null,
          }
        : j
    );
    setJobs(updated);
    broadcastJobs(updated);   // ← Farmer + Retailer see driver is on the way

    const job = updated.find(j => j.id === jobId);
    try { await dbPut("jobs", job); } catch (_) {}

    channel.postMessage({
      type:       "JOB_CLAIMED",
      cropName:   job?.cropName,
      driverName: du.name,
      driverPhone: du.phone,
    });

    await sendSmsNotice({
      to: job?.farmerPhone,
      event: "delivery_partner_claimed",
      message: `Raitha Reach: Delivery partner ${du.name} (${du.phone}) is coming to collect your ${job?.cropName}. Pickup OTP: ${pickupOtp}. Share it only after arrival.`,
    });
  }

  async function onVerifyPickup(jobId, pickupOtp) {
    const job = jobs.find(j => j.id === jobId);
    if (!job) {
      return { ok: false, error: pick(lang, "Pickup job not found.", "ಪಿಕಪ್ ಕಾರ್ಯ ಸಿಗಲಿಲ್ಲ.") };
    }

    if (String(job.pickupOtp || "") !== String(pickupOtp || "").trim()) {
      return { ok: false, error: pick(lang, "Wrong farmer OTP. Please check and try again.", "ರೈತರ OTP ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.") };
    }

    const verifiedAt = Date.now();
    const updated = jobs.map(j =>
      j.id === jobId
        ? { ...j, status: "picked-up", pickupOtpVerifiedAt: verifiedAt }
        : j
    );

    setJobs(updated);
    broadcastJobs(updated);

    const verifiedJob = updated.find(j => j.id === jobId);
    try { await dbPut("jobs", verifiedJob); } catch (_) {}

    channel.postMessage({
      type: "STATUS_UPDATE",
      cropName: verifiedJob?.cropName,
      status: "picked-up",
    });

    await sendSmsNotice({
      to: verifiedJob?.farmerPhone,
      event: "pickup_proof_verified",
      message: `Raitha Reach: Pickup OTP verified for ${verifiedJob?.cropName}. ${verifiedJob?.deliveryName} has collected the order.`,
    });

    addActivity({
      icon: "🔐",
      text: pick(
        lang,
        `${tCrop(verifiedJob?.cropName, lang)} pickup proof verified. Order marked as picked up.`,
        `${tCrop(verifiedJob?.cropName, lang)} ಪಿಕಪ್ ದೃಢೀಕರಣ ಮುಗಿದಿದೆ. ಆದೇಶವನ್ನು ತೆಗೆದುಕೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.`
      ),
      ts: verifiedAt,
    });

    return { ok: true };
  }

  async function onReleaseDeliveryRoute(jobId) {
    const updated = jobs.map(j =>
      j.id === jobId
        ? { ...j, deliveryId: null, deliveryName: null, deliveryPhone: null, status: "confirmed" }
        : j
    );
    setJobs(updated);
    broadcastJobs(updated);
    try { await dbPut("jobs", updated.find(j => j.id === jobId)); } catch (_) {}
  }

  // Delivery updates status
  async function onUpdateStatus(jobId, status) {
    const updated = jobs.map(j => j.id === jobId ? { ...j, status } : j);
    setJobs(updated);
    broadcastJobs(updated);   // ← All tabs see the status change live

    const job = updated.find(j => j.id === jobId);

    if (status === "delivered" && job?.cropId) {
      const updatedCrops = crops.map(c =>
        c.id === job?.cropId ? { ...c, status: "delivered" } : c
      );
      setCrops(updatedCrops);
      broadcastCrops(updatedCrops);
      try { await dbPut("crops", updatedCrops.find(c => c.id === job?.cropId)); } catch (_) {}
    }

    if (status === "delivered" && job?.requirementId) {
      const updatedRequirements = requirements.map(item =>
        item.id === job.requirementId ? { ...item, status: "fulfilled", deliveredAt: Date.now() } : item
      );
      setRequirements(updatedRequirements);
      broadcastRequirements(updatedRequirements);
      try { await dbPut("requirements", updatedRequirements.find(item => item.id === job.requirementId)); } catch (_) {}
    }

    try { await dbPut("jobs", job); } catch (_) {}

    channel.postMessage({
      type:     "STATUS_UPDATE",
      cropName: job?.cropName,
      status,
    });
  }

  // ── Shared props ─────────────────────────────────────────────
  const exportListings = exportRecords.filter((record) => record.kind === "listing");
  const exportRequests = exportRecords.filter((record) => record.kind === "request");
  const shared = { user, crops, jobs, requirements, rates, toast, addActivity, addNotification, lang };

  return (
    <div className="rr-app-frame" style={{ fontFamily: lang === "kn" ? "var(--font-kn)" : "var(--font)" }}>
      <Navbar
        page={page} setPage={setPage}
        user={user} onLogout={onLogout}
        lang={lang} setLang={setLang}
        notifications={notifications}
        setNotifications={setNotifications}
      />

      <Ticker rates={rates} lang={lang} />

      {/* Public pages — only when NOT logged in */}
      {!user && page === "home"  && <HomePage  setPage={setPage} lang={lang} />}
      {!user && page === "about" && <AboutPage setPage={setPage} lang={lang} />}
      {!user && (page === "auth" || page === "home" && false) && null}
      {!user && page === "auth"  && <AuthPage  onLogin={onLogin} toast={toast} lang={lang} />}

      {/* Dashboards — only when logged in */}
      {user && user.role === "farmer"   && (
        <FarmerDashboard
          {...shared}
          onPost={onPost}
          onAcceptBid={onAcceptBid}
          onAcceptRequirement={onAcceptRequirement}
          onDeleteCrop={onDeleteCrop}
          onDeleteJob={onDeleteJob}
        />
      )}
      {user && user.role === "retailer" && (
        <RetailerDashboard
          {...shared}
          onAcceptCrop={onRetailerAcceptCrop}
          onConfirmOrder={onConfirmRetailerOrder}
          onBid={onBid}
          onPostRequirement={onPostRequirement}
          onDeleteRequirement={onDeleteRequirement}
        />
      )}
      {user && user.role === "delivery" && (
        <DeliveryDashboard
          {...shared}
          onClaim={onClaim}
          onVerifyPickup={onVerifyPickup}
          onReleaseRoute={onReleaseDeliveryRoute}
          onUpdateStatus={onUpdateStatus}
          onDeleteJob={onDeleteJob}
        />
      )}
      {user && user.role === "exporter" && (
        <ExporterDashboard
          user={user}
          exportListings={exportListings}
          exportRequests={exportRequests}
          toast={toast}
          addActivity={addActivity}
          lang={lang}
          onPostExportListing={onPostExportListing}
          onPlaceExportBid={onPlaceExportBid}
          onAcceptExportBid={onAcceptExportBid}
          onPostExportRequest={onPostExportRequest}
          onAcceptExportRequest={onAcceptExportRequest}
        />
      )}

      {/* Live Activity Panel */}
      {user && <ActivityPanel activity={activity} open={actOpen} setOpen={setActOpen} lang={lang} />}

      <Toasts list={toasts} />
    </div>
  );
}
