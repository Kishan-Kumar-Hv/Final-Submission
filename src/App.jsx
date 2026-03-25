import { useState, useEffect, useCallback, useRef } from "react";

import Navbar              from "./components/Navbar.jsx";
import Ticker              from "./components/Ticker.jsx";
import HomePage            from "./components/HomePage.jsx";
import AboutPage           from "./components/AboutPage.jsx";
import AuthPage            from "./components/AuthPage.jsx";
import FarmerDashboard     from "./components/FarmerDashboard.jsx";
import RetailerDashboard   from "./components/RetailerDashboard.jsx";
import DeliveryDashboard   from "./components/DeliveryDashboard.jsx";
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

function broadcastCrops(crops) {
  try { channel.postMessage({ type: "CROPS_UPDATE", crops }); } catch (_) {}
}
function broadcastJobs(jobs) {
  try { channel.postMessage({ type: "JOBS_UPDATE", jobs }); } catch (_) {}
}

export default function App() {
  const [page, setPage]   = useState("home");
  const [user, setUser]   = useState(null);
  const [lang, setLang]   = useState(() => localStorage.getItem("rr-lang") || DEFAULT_LANG);
  const [crops, setCrops] = useState([]);
  const [jobs,  setJobs]  = useState([]);
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
        const [dc, dj] = await Promise.all([dbGetAll("crops"), dbGetAll("jobs")]);
        const realCrops = dc.filter(c => !c.id.startsWith("sc") && !c.id.startsWith("seed"));
        const realJobs  = dj.filter(j => !j.id.startsWith("sj") && !j.id.startsWith("seed")).map(normalizeJob);
        setCrops(realCrops);
        setJobs(realJobs);
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
      if (e.data.type === "NEW_BID") {
        // Show notification to farmer in another tab
        addNotification(pick(lang, `💰 New bid: ${fmtP(e.data.amount)}/kg on ${tCrop(e.data.cropName, lang)} from ${e.data.bidderName}`, `💰 ಹೊಸ ಬಿಡ್: ${tCrop(e.data.cropName, lang)} ಮೇಲೆ ${fmtP(e.data.amount)}/ಕೆಜಿ ದರಕ್ಕೆ ${e.data.bidderName} ಬಿಡ್ ಮಾಡಿದ್ದಾರೆ`));
        addActivity({ icon: "💰", text: pick(lang, `${e.data.bidderName} bid ${fmtP(e.data.amount)}/kg on ${tCrop(e.data.cropName, lang)}`, `${e.data.bidderName} ಅವರು ${tCrop(e.data.cropName, lang)} ಮೇಲೆ ${fmtP(e.data.amount)}/ಕೆಜಿ ಬಿಡ್ ಮಾಡಿದ್ದಾರೆ`), ts: Date.now() });
      }
      if (e.data.type === "BID_ACCEPTED") {
        addNotification(pick(lang, `🤝 Your bid for ${tCrop(e.data.cropName, lang)} was accepted. Confirm the order to close bidding.`, `🤝 ${tCrop(e.data.cropName, lang)}ಗಾಗಿ ನಿಮ್ಮ ಬಿಡ್ ಅಂಗೀಕರಿಸಲಾಗಿದೆ. ಹರಾಜು ಮುಚ್ಚಲು ಆದೇಶವನ್ನು ದೃಢೀಕರಿಸಿ.`));
        addActivity({ icon: "🤝", text: pick(lang, `Farmer accepted your bid for ${tCrop(e.data.cropName, lang)} @ ${fmtP(e.data.amount)}/kg`, `${tCrop(e.data.cropName, lang)}ಗಾಗಿ ನಿಮ್ಮ ${fmtP(e.data.amount)}/ಕೆಜಿ ಬಿಡ್ ರೈತರು ಅಂಗೀಕರಿಸಿದ್ದಾರೆ`), ts: Date.now() });
      }
      if (e.data.type === "ORDER_CONFIRMED") {
        if (e.data.direct) {
          addNotification(pick(
            lang,
            `✅ ${e.data.retailerName || "Retailer"} accepted ${tCrop(e.data.cropName, lang)}. Order confirmed and delivery is now open.`,
            `✅ ${e.data.retailerName || "ಖರೀದಿದಾರರು"} ${tCrop(e.data.cropName, lang)} ಅನ್ನು ಸ್ವೀಕರಿಸಿದ್ದಾರೆ. ಆದೇಶ ದೃಢೀಕರಿಸಲಾಗಿದೆ ಮತ್ತು ವಿತರಣೆ ಈಗ ತೆರೆಯಲಾಗಿದೆ.`
          ));
          addActivity({
            icon: "✅",
            text: pick(
              lang,
              `${e.data.retailerName || "Retailer"} accepted ${tCrop(e.data.cropName, lang)} @ ${fmtP(e.data.price || 0)}/kg · Delivery payout ${fmtP(e.data.deliveryPayout)}`,
              `${e.data.retailerName || "ಖರೀದಿದಾರರು"} ${tCrop(e.data.cropName, lang)} ಅನ್ನು ${fmtP(e.data.price || 0)}/ಕೆಜಿ ದರಕ್ಕೆ ಸ್ವೀಕರಿಸಿದ್ದಾರೆ · ಚಾಲಕರ ಪಾವತಿ ${fmtP(e.data.deliveryPayout)}`
            ),
            ts: Date.now(),
          });
        } else {
          addNotification(pick(lang, `✅ Retailer confirmed ${tCrop(e.data.cropName, lang)}. Bid accepted and delivery route is now open.`, `✅ ಖರೀದಿದಾರರು ${tCrop(e.data.cropName, lang)} ಅನ್ನು ದೃಢೀಕರಿಸಿದ್ದಾರೆ. ಬಿಡ್ ಅಂಗೀಕರಿಸಿ ವಿತರಣಾ ಮಾರ್ಗ ಈಗ ಲಭ್ಯವಾಗಿದೆ.`));
          addActivity({ icon: "✅", text: pick(lang, `Retailer confirmed ${tCrop(e.data.cropName, lang)} · Delivery payout ${fmtP(e.data.deliveryPayout)}`, `${tCrop(e.data.cropName, lang)}ಗಾಗಿ ಖರೀದಿದಾರರು ದೃಢೀಕರಿಸಿದ್ದಾರೆ · ಚಾಲಕರ ಪಾವತಿ ${fmtP(e.data.deliveryPayout)}`), ts: Date.now() });
        }
      }
      if (e.data.type === "JOB_CLAIMED") {
        addNotification(pick(lang, `🚛 Delivery partner claimed your pickup for ${tCrop(e.data.cropName, lang)}`, `🚛 ${tCrop(e.data.cropName, lang)}ಗಾಗಿ ನಿಮ್ಮ ಪಿಕಪ್ ಅನ್ನು ವಿತರಣಾ ಸಹಭಾಗಿ ಸ್ವೀಕರಿಸಿದ್ದಾರೆ`));
        addActivity({ icon: "🚛", text: pick(lang, `Delivery partner heading to farm for ${tCrop(e.data.cropName, lang)}`, `ವಿತರಣಾ ಸಹಭಾಗಿ ${tCrop(e.data.cropName, lang)}ಗಾಗಿ ಫಾರ್ಮ್ ಕಡೆ ಬರುತ್ತಿದ್ದಾರೆ`), ts: Date.now() });
      }
      if (e.data.type === "STATUS_UPDATE") {
        addNotification(pick(lang, `📦 ${tCrop(e.data.cropName, lang)}: ${tStatus(e.data.status, lang)}`, `📦 ${tCrop(e.data.cropName, lang)}: ${tStatus(e.data.status, lang)}`));
        addActivity({ icon: "📦", text: pick(lang, `${tCrop(e.data.cropName, lang)} delivery status: ${tStatus(e.data.status, lang)}`, `${tCrop(e.data.cropName, lang)} ವಿತರಣಾ ಸ್ಥಿತಿ: ${tStatus(e.data.status, lang)}`), ts: Date.now() });
      }
    }
    channel.addEventListener("message", onMessage);
    return () => channel.removeEventListener("message", onMessage);
  }, [addActivity, addNotification, lang]);

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
    addActivity({ icon: "🌾", text: pick(lang, `You posted ${tCrop(crop.cropName, lang)} (${crop.quantity}kg) for retailers to accept`, `ನೀವು ${tCrop(crop.cropName, lang)} (${crop.quantity}ಕೆಜಿ) ಅನ್ನು ಖರೀದಿದಾರರು ಸ್ವೀಕರಿಸಲು ಪೋಸ್ಟ್ ಮಾಡಿದ್ದೀರಿ`), ts: Date.now() });
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
    });

    addActivity({ icon: "💰", text: pick(lang, `You bid ${fmtP(bid.amount)}/kg on ${tCrop(crop?.cropName, lang)} from ${tVillage(crop?.village, lang)}`, `ನೀವು ${tVillage(crop?.village, lang)}ನ ${tCrop(crop?.cropName, lang)} ಮೇಲೆ ${fmtP(bid.amount)}/ಕೆಜಿ ಬಿಡ್ ಮಾಡಿದ್ದೀರಿ`), ts: Date.now() });
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
      retailerName:  bid.bidderName,
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

    addActivity({ icon: "🤝", text: pick(lang, `Bid accepted. Waiting for ${bid.bidderName} to confirm order for ${tCrop(crop.cropName, lang)}`, `${tCrop(crop.cropName, lang)}ಗಾಗಿ ${bid.bidderName} ಅವರು ಆದೇಶವನ್ನು ದೃಢೀಕರಿಸುವುದಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ`), ts: Date.now() });
  }

  async function onConfirmRetailerOrder(jobId) {
    const updated = jobs.map(j =>
      j.id === jobId ? { ...j, status: "confirmed", confirmedAt: Date.now() } : j
    );
    setJobs(updated);
    broadcastJobs(updated);

    const job = updated.find(j => j.id === jobId);
    try { await dbPut("jobs", job); } catch (_) {}

    channel.postMessage({
      type: "ORDER_CONFIRMED",
      cropName: job?.cropName,
      deliveryPayout: job?.deliveryPayout,
    });

    addActivity({ icon: "✅", text: pick(lang, `Retailer confirmed order for ${tCrop(job?.cropName, lang)}. Bid closed and delivery opened.`, `${tCrop(job?.cropName, lang)}ಗಾಗಿ ಖರೀದಿದಾರರು ಆದೇಶ ದೃಢೀಕರಿಸಿದ್ದಾರೆ. ಹರಾಜು ಮುಚ್ಚಿ ವಿತರಣೆ ತೆರೆದಿದೆ.`), ts: Date.now() });
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
    if (job) {
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
    const updated = jobs.map(j =>
      j.id === jobId
        ? { ...j, deliveryId: du.id, deliveryName: du.name, deliveryPhone: du.phone, status: "on-the-way" }
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
    });
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

    if (status === "delivered") {
      const updatedCrops = crops.map(c =>
        c.id === job?.cropId ? { ...c, status: "delivered" } : c
      );
      setCrops(updatedCrops);
      broadcastCrops(updatedCrops);
      try { await dbPut("crops", updatedCrops.find(c => c.id === job?.cropId)); } catch (_) {}
    }

    try { await dbPut("jobs", job); } catch (_) {}

    channel.postMessage({
      type:     "STATUS_UPDATE",
      cropName: job?.cropName,
      status,
    });
  }

  // ── Shared props ─────────────────────────────────────────────
  const shared = { user, crops, jobs, rates, toast, addActivity, addNotification, lang };

  return (
    <div style={{ paddingTop: 100, fontFamily: lang === "kn" ? "var(--font-kn)" : "var(--font)" }}>
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
          onDeleteCrop={onDeleteCrop}
          onDeleteJob={onDeleteJob}
        />
      )}
      {user && user.role === "retailer" && (
        <RetailerDashboard
          {...shared}
          onAcceptCrop={onRetailerAcceptCrop}
          onConfirmOrder={onConfirmRetailerOrder}
        />
      )}
      {user && user.role === "delivery" && (
        <DeliveryDashboard
          {...shared}
          onClaim={onClaim}
          onReleaseRoute={onReleaseDeliveryRoute}
          onUpdateStatus={onUpdateStatus}
          onDeleteJob={onDeleteJob}
        />
      )}

      {/* Live Activity Panel */}
      {user && <ActivityPanel activity={activity} open={actOpen} setOpen={setActOpen} lang={lang} />}

      <Toasts list={toasts} />
    </div>
  );
}
