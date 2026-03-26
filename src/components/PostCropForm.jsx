import { useState } from "react";
import { KA_LOCS, findMatchingCrop, guessHarvestTypeForCrop, inferCropMeta } from "../data/constants.js";
import { uid, fmtP } from "../utils/helpers.js";
import { dbPut } from "../db/indexedDB.js";
import { getSingleHarvestEstimate, SmartPriceCalculator } from "./SmartPriceCalculator.jsx";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

const HARVEST_TYPE_OPTIONS = [
  {
    value: "regrows",
    label: "Regrows after harvest",
    sub: "Plant remains and can bear again",
  },
  {
    value: "single_harvest",
    label: "Single harvest, replant needed",
    sub: "Plant is cut and must be planted again",
  },
];

function getHarvestTypeLabel(value) {
  return HARVEST_TYPE_OPTIONS.find(option => option.value === value)?.label || "Not set";
}

function emptyPricingState(mode = "") {
  return {
    pricingMode: mode,
    costPerKg: 0,
    estimatedCostPerKg: 0,
    expectedPrice: 0,
    totalProductionCost: 0,
    profitTarget: 20,
    costBreakdown: null,
    demandInsights: null,
  };
}

function getTodayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => resolve(ev.target.result);
    reader.onerror = () => reject(new Error("Could not read this photo."));
    reader.readAsDataURL(file);
  });
}

async function fileToListingDataUrl(file, { maxSide = 1600, quality = 0.82 } = {}) {
  const originalDataUrl = await readFileAsDataUrl(file);

  if (!String(file?.type || "").startsWith("image/")) {
    return originalDataUrl;
  }

  try {
    const image = await new Promise((resolve, reject) => {
      const preview = new Image();
      preview.onload = () => resolve(preview);
      preview.onerror = () => reject(new Error("Could not open this image."));
      preview.src = originalDataUrl;
    });

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    const longestSide = Math.max(width, height);

    if (!longestSide || longestSide <= maxSide) {
      return originalDataUrl;
    }

    const scale = maxSide / longestSide;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const context = canvas.getContext("2d");
    if (!context) {
      return originalDataUrl;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  } catch (_) {
    return originalDataUrl;
  }
}

export default function PostCropForm({ user, rates, onPost, onCancel, lang = "en" }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    cropName: "",
    emoji: "🌾",
    category: "",
    quantity: "",
    basePrice: "",
    minBid: "",
    harvestType: "",
    readyDate: getTodayInputValue(),
    village: user.village || "",
    district: user.district || "",
    pin: user.pin || "",
    pickupAddress: `${user.village || ""}, ${user.district || ""}, Karnataka ${user.pin || ""}`,
    notes: "",
    ...emptyPricingState(),
  });
  const [photos, setPhotos] = useState([]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [locs, setLocs] = useState([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanErr, setScanErr] = useState("");
  const [scanResult, setScanResult] = useState(null);

  function applyPricingToDraft(draft, result) {
    return {
      ...draft,
      pricingMode: result.pricingMode || "",
      minBid: result.minBid,
      costPerKg: result.costPerKg || 0,
      estimatedCostPerKg: result.estimatedCostPerKg || result.costPerKg || 0,
      totalProductionCost: result.totalProductionCost || 0,
      profitTarget: result.profitTarget || 0,
      expectedPrice: result.expectedPrice || 0,
      costBreakdown: result.costBreakdown || null,
      demandInsights: result.demandInsights || null,
    };
  }

  function derivePricingDraft(draft, { keepManualRegrowBid = false } = {}) {
    const marketRate = findMatchingCrop(draft.cropName, rates);
    const apmcRate = Number(marketRate?.price || draft.basePrice || 0);

    if (draft.harvestType === "single_harvest") {
      if (Number(draft.quantity) > 0 && draft.category) {
        return applyPricingToDraft(
          draft,
          getSingleHarvestEstimate({
            quantity: draft.quantity,
            category: draft.category,
            marketRate,
            apmcPrice: apmcRate,
          })
        );
      }

      return {
        ...draft,
        ...emptyPricingState(""),
        minBid: "",
      };
    }

    if (draft.harvestType === "regrows") {
      const defaultMinBid = apmcRate ? Math.round(apmcRate * 0.85) : draft.minBid;
      return {
        ...draft,
        ...emptyPricingState("manual_regrows"),
        minBid: keepManualRegrowBid && Number(draft.minBid) > 0 ? draft.minBid : defaultMinBid,
      };
    }

    return draft;
  }

  function h(e) {
    const { name, value } = e.target;

    if (name === "cropName") {
      const meta = inferCropMeta(value);
      const liveRate = findMatchingCrop(value, rates);
      setForm(f => derivePricingDraft({
        ...f,
        cropName: value,
        emoji: meta?.e || "🌾",
        category: meta?.cat || "",
        basePrice: meta ? Math.round(liveRate?.price || meta.bp) : (value ? f.basePrice : ""),
      }));
      setScanResult(null);
      return;
    }

    if (name === "quantity") {
      setForm(f => derivePricingDraft({ ...f, quantity: value }, { keepManualRegrowBid: true }));
      return;
    }

    if (name === "basePrice") {
      setForm(f => derivePricingDraft({ ...f, basePrice: value }));
      return;
    }

    setForm(f => ({ ...f, [name]: value }));
  }

  function selCrop(rate) {
    setForm(f => derivePricingDraft({
      ...f,
      cropName: rate.c,
      emoji: rate.e,
      category: rate.cat,
      basePrice: Math.round(rate.price),
      harvestType: guessHarvestTypeForCrop(rate.c, rate.cat),
    }));
    setScanResult(null);
  }

  function searchLoc(value) {
    setForm(f => ({ ...f, village: value }));
    setLocs(
      value.length > 1
        ? KA_LOCS.filter(loc => loc.n.toLowerCase().includes(value.toLowerCase()) || loc.d.toLowerCase().includes(value.toLowerCase())).slice(0, 7)
        : []
    );
  }

  function selLoc(loc) {
    setForm(f => ({
      ...f,
      village: loc.n,
      district: loc.d,
      pin: loc.pin,
      pickupAddress: `${loc.n}, ${loc.d}, Karnataka ${loc.pin}`,
    }));
    setLocs([]);
  }

  async function addPhoto(e) {
    const file = e.target.files[0];
    if (!file || photos.length >= 4) {
      e.target.value = "";
      return;
    }

    const imageDataUrl = await fileToListingDataUrl(file);
    setPhotos(list => [...list, imageDataUrl].slice(0, 4));
    e.target.value = "";
  }

  function selectHarvestType(value) {
    setForm(f => derivePricingDraft({
      ...f,
      harvestType: value,
    }));
    setErr("");
  }

  function onSmartPrice(result) {
    setForm(f => ({
      ...f,
      pricingMode: result.pricingMode || "",
      minBid: result.minBid,
      costPerKg: result.costPerKg || 0,
      estimatedCostPerKg: result.estimatedCostPerKg || result.costPerKg || 0,
      totalProductionCost: result.totalProductionCost || 0,
      profitTarget: result.profitTarget || 0,
      expectedPrice: result.expectedPrice || 0,
      costBreakdown: result.costBreakdown || null,
      demandInsights: result.demandInsights || null,
    }));
    setErr("");
  }

  async function scanCropPhoto(e) {
    const file = e.target.files[0];
    e.target.value = "";

    if (!file) return;

    setScanLoading(true);
    setScanErr("");

    try {
      const imageDataUrl = await fileToListingDataUrl(file, { maxSide: 1400, quality: 0.8 });
      setPhotos(list => (list.includes(imageDataUrl) ? list : [imageDataUrl, ...list].slice(0, 4)));

      const response = await fetch(`${API_BASE}/ai/crop-photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Could not analyze this crop photo.");
      }

      setForm(current => {
        const meta = inferCropMeta(payload.cropName);
        const liveRate = findMatchingCrop(payload.cropName, rates);
        const resolvedHarvestType = payload.harvestType || guessHarvestTypeForCrop(payload.cropName, meta?.cat || payload.category);

        return derivePricingDraft({
          ...current,
          cropName: meta?.c || payload.cropName || current.cropName,
          emoji: meta?.e || payload.emoji || "🌾",
          category: meta?.cat || payload.category || current.category,
          harvestType: resolvedHarvestType,
          basePrice: Math.round(liveRate?.price || meta?.bp || current.basePrice || 0) || current.basePrice,
          readyDate: current.readyDate || getTodayInputValue(),
        });
      });

      setScanResult({
        cropName: payload.cropName,
        emoji: payload.emoji,
        category: payload.category,
        harvestType: payload.harvestType,
        confidence: payload.confidence,
        summary: payload.summary,
        visibleFeatures: payload.visibleFeatures || [],
        scanPath: payload.scanPath || "primary",
        provider: payload.provider || "",
        model: payload.model || "",
      });
      setErr("");
    } catch (error) {
      const message = String(error?.message || "");
      setScanErr(
        message.includes("fetch")
          ? "Crop scan needs the local API server running. Start the app with npm run dev and try again."
          : message
      );
    } finally {
      setScanLoading(false);
    }
  }

  async function submit() {
    if (!form.cropName || !form.quantity || !form.minBid || !form.harvestType || !form.readyDate || !form.village || !form.pickupAddress) {
      setErr("Please fill all required fields.");
      return;
    }
    if (Number(form.minBid) <= 0) {
      setErr("Minimum bid must be greater than 0.");
      return;
    }
    if (form.harvestType === "single_harvest" && Number(form.costPerKg) <= 0) {
      setErr("Run Smart Pricing once for single-harvest crops so the app can generate the safe automatic floor price.");
      return;
    }

    setSaving(true);
    const crop = {
      id: uid(),
      farmerId: user.id,
      farmerName: user.name,
      farmerPhone: user.phone,
      ...form,
      quantity: Number(form.quantity),
      basePrice: Number(form.basePrice) || Number(form.minBid),
      minBid: Number(form.minBid),
      costPerKg: Number(form.costPerKg) || 0,
      estimatedCostPerKg: Number(form.estimatedCostPerKg) || Number(form.costPerKg) || 0,
      expectedPrice: Number(form.expectedPrice) || 0,
      totalProductionCost: Number(form.totalProductionCost) || 0,
      profitTarget: Number(form.profitTarget) || 20,
      costBreakdown: form.costBreakdown || null,
      demandInsights: form.demandInsights || null,
      photos,
      status: "open",
      bids: [],
      postedAt: Date.now(),
    };

    try {
      await dbPut("crops", crop);
    } catch (_) {}

    setSaving(false);
    onPost(crop);
  }

  const marketRate = findMatchingCrop(form.cropName, rates);
  const apmcRate = marketRate?.price || Number(form.basePrice) || 0;
  const suggestions = rates
    .filter(rate => {
      if (!form.cropName) return true;
      const q = form.cropName.toLowerCase();
      return [rate.c, ...(rate.aliases || [])].some(term => term.toLowerCase().includes(q));
    })
    .slice(0, 10);

  const inp = {
    padding: "9px 12px",
    border: "1.5px solid var(--border)",
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "inherit",
    color: "var(--text)",
    background: "#fff",
    outline: "none",
    transition: "border-color .15s",
    width: "100%",
  };

  const stepConfig = [
    { n: 1, label: "Crop Details" },
    { n: 2, label: "Pricing" },
    { n: 3, label: "Location & Photos" },
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>🌾 Post Crop for Auction</h1>
          <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 3 }}>
            Choose the crop type, set pricing, then go live
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24, background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: 4 }}>
        {stepConfig.map((stepItem, i) => (
          <div key={stepItem.n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <button
              onClick={() => setStep(stepItem.n)}
              style={{ flex: 1, padding: "9px 8px", borderRadius: 9, border: "none", background: step === stepItem.n ? "var(--green)" : "transparent", color: step === stepItem.n ? "#fff" : step > stepItem.n ? "var(--green)" : "var(--text3)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: step === stepItem.n ? "rgba(255,255,255,.25)" : step > stepItem.n ? "var(--green-pale)" : "var(--bg)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: step > stepItem.n ? "var(--green)" : "inherit" }}>
                {step > stepItem.n ? "✓" : stepItem.n}
              </span>
              {stepItem.label}
            </button>
            {i < stepConfig.length - 1 && <div style={{ width: 1, height: 24, background: "var(--border)", flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 20, padding: 24, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "linear-gradient(135deg, #fff7ed, #fefce8)", border: "1px solid #fde68a", borderRadius: 16, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#b45309", textTransform: "uppercase", letterSpacing: 0.6 }}>
                    AI Crop Photo Scan
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginTop: 4 }}>
                    Upload one crop photo and we’ll fill the crop details automatically
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 5, lineHeight: 1.55 }}>
                    Best for common vegetables, fruits, grains, pulses, oilseeds, spices and cash crops in your catalog. You mostly just add quantity and continue.
                  </div>
                </div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 12, background: scanLoading ? "#fed7aa" : "#ea580c", color: "#fff", fontSize: 13, fontWeight: 800, cursor: scanLoading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: scanLoading ? 0.85 : 1 }}>
                  {scanLoading ? "⏳ Scanning crop..." : "📷 Scan crop photo"}
                  <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={scanCropPhoto} disabled={scanLoading} />
                </label>
              </div>

              {scanResult && (
                <div style={{ marginTop: 14, background: "#fff", border: "1px solid #fed7aa", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#b45309", textTransform: "uppercase", letterSpacing: 0.6 }}>
                        Detected Crop
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)", marginTop: 4 }}>
                        {scanResult.emoji || "🌾"} {scanResult.cropName}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ background: scanResult.scanPath === "fallback" ? "#eff6ff" : "#ecfdf5", color: scanResult.scanPath === "fallback" ? "#1d4ed8" : "#166534", border: `1px solid ${scanResult.scanPath === "fallback" ? "#93c5fd" : "#86efac"}`, borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>
                        {scanResult.scanPath === "fallback" ? "Fallback scan used" : "Primary AI scan"}
                      </span>
                      <span style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fdba74", borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>
                        {Math.round(Number(scanResult.confidence || 0) * 100)}% confidence
                      </span>
                      <span style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 700 }}>
                        {getHarvestTypeLabel(scanResult.harvestType)}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 8, lineHeight: 1.55 }}>
                    {scanResult.summary}
                  </div>
                  {(scanResult.provider || scanResult.model) && (
                    <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 6 }}>
                      {scanResult.provider ? `Provider: ${scanResult.provider}` : ""}
                      {scanResult.provider && scanResult.model ? " · " : ""}
                      {scanResult.model ? `Model: ${scanResult.model}` : ""}
                    </div>
                  )}
                  {scanResult.visibleFeatures?.length > 0 && (
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                      {scanResult.visibleFeatures.map(feature => (
                        <span key={feature} style={{ background: "#fffaf0", color: "#9a3412", border: "1px solid #fdba74", borderRadius: 999, padding: "4px 8px", fontSize: 10, fontWeight: 700 }}>
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {scanErr && (
                <div style={{ marginTop: 12, background: "#fff1f2", border: "1px solid #fda4af", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "#be123c", lineHeight: 1.5 }}>
                  ⚠️ {scanErr}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                Quick select crop (APMC price auto-fills)
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {suggestions.map(rate => (
                  <button
                    key={rate.c}
                    onClick={() => selCrop(rate)}
                    style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${form.cropName === rate.c ? "var(--green)" : "var(--border)"}`, background: form.cropName === rate.c ? "var(--green-pale)" : "#fff", color: form.cropName === rate.c ? "var(--green)" : "var(--text2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
                  >
                    {rate.e} {rate.c} - {fmtP(rate.price)}/kg
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                  Crop Name *
                </label>
                <input style={inp} name="cropName" value={form.cropName} onChange={h} placeholder="e.g. Tomato" onFocus={e => e.target.style.borderColor = "var(--green)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                  Quantity (kg) *
                </label>
                <input style={inp} name="quantity" type="number" value={form.quantity} onChange={h} placeholder="e.g. 200" onFocus={e => e.target.style.borderColor = "var(--green)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
                Harvest Type *
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {HARVEST_TYPE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectHarvestType(option.value)}
                    style={{ textAlign: "left", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${form.harvestType === option.value ? "var(--green)" : "var(--border)"}`, background: form.harvestType === option.value ? "var(--green-xp)" : "#fff", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: form.harvestType === option.value ? "var(--green)" : "var(--text)" }}>{option.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4, lineHeight: 1.45 }}>{option.sub}</div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 6 }}>
                Regrowing crops stay in manual pricing mode. Single-harvest crops use automatic effort-cost estimation.
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                  APMC Rate (₹/kg)
                </label>
                <input style={inp} name="basePrice" type="number" value={form.basePrice} onChange={h} placeholder="auto-filled" onFocus={e => e.target.style.borderColor = "var(--green)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                <div style={{ fontSize: 10, color: "var(--text4)", marginTop: 3 }}>Live mandi reference</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                  Minimum Bid (₹/kg) *
                </label>
                <input style={{ ...inp, background: form.costPerKg > 0 ? "#f0fdf4" : "#fff", borderColor: form.costPerKg > 0 ? "var(--green)" : "var(--border)" }} name="minBid" type="number" step="0.5" value={form.minBid} onChange={h} onFocus={e => e.target.style.borderColor = "var(--green)"} onBlur={e => e.target.style.borderColor = form.costPerKg > 0 ? "var(--green)" : "var(--border)"} />
                {form.costPerKg > 0 && <div style={{ fontSize: 10, color: "var(--green)", marginTop: 3, fontWeight: 600 }}>✓ Set by auto pricing</div>}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                  Ready Date *
                </label>
                <input style={inp} name="readyDate" type="date" value={form.readyDate} onChange={h} onFocus={e => e.target.style.borderColor = "var(--green)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                Crop Notes
              </label>
              <textarea style={{ ...inp, resize: "vertical", minHeight: 76, lineHeight: 1.5 }} name="notes" value={form.notes} onChange={h} placeholder="Variety, quality, storage info..." onFocus={e => e.target.style.borderColor = "var(--green)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={onCancel} style={{ ...inp, width: "auto", padding: "9px 20px", cursor: "pointer", borderRadius: 10, fontWeight: 700 }}>
                Cancel
              </button>
              <button onClick={() => setStep(2)} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "var(--green)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                Next: Pricing →
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {form.minBid > 0 && (
            <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5 }}>Crop</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>{form.emoji} {form.cropName || "-"} · {form.quantity || "?"}kg</div>
              </div>
              <div style={{ width: 1, height: 32, background: "var(--border)" }} />
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5 }}>Current Min Bid</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--gold)" }}>{fmtP(form.minBid)}/kg</div>
              </div>
              <div style={{ width: 1, height: 32, background: "var(--border)" }} />
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5 }}>Pricing Path</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>
                  {form.harvestType === "single_harvest" ? "Auto effort pricing" : "Manual price mode"}
                </div>
              </div>
              {apmcRate > 0 && (
                <>
                  <div style={{ width: 1, height: 32, background: "var(--border)" }} />
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5 }}>Live APMC Rate</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--green)" }}>{fmtP(apmcRate)}/kg</div>
                  </div>
                </>
              )}
              {form.costPerKg > 0 && (
                <>
                  <div style={{ width: 1, height: 32, background: "var(--border)" }} />
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.5 }}>Effort Cost</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--red)" }}>{fmtP(form.costPerKg)}/kg</div>
                  </div>
                </>
              )}
            </div>
          )}

          <SmartPriceCalculator
            harvestType={form.harvestType}
            quantity={form.quantity}
            category={form.category}
            marketRate={marketRate}
            apmcPrice={apmcRate}
            onResult={onSmartPrice}
            lang={lang}
          />

          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.55 }}>
              {form.harvestType === "single_harvest"
                ? "Single-harvest crops must use the auto effort model so the app can protect farmer margin and show wholesaler-facing transparency."
                : "Regrowing crops stay manual. Use the market guidance if you want, or continue with your own floor price."}
            </div>
            <button
              onClick={() => {
                if (form.harvestType === "single_harvest" && Number(form.costPerKg) <= 0) {
                  setErr("Apply the automatic safe price first for single-harvest crops.");
                  return;
                }
                setStep(3);
              }}
              style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: form.harvestType === "single_harvest" ? (form.costPerKg > 0 ? "var(--green)" : "var(--border)") : "var(--green)", color: form.harvestType === "single_harvest" ? (form.costPerKg > 0 ? "#fff" : "var(--text3)") : "#fff", fontSize: 13, fontWeight: 700, cursor: form.harvestType === "single_harvest" ? (form.costPerKg > 0 ? "pointer" : "not-allowed") : "pointer", fontFamily: "inherit", flexShrink: 0 }}
            >
              {form.harvestType === "single_harvest"
                ? (form.costPerKg > 0 ? "Next: Location →" : "Apply auto pricing first")
                : "Continue with manual price →"}
            </button>
          </div>

          {err && <div style={{ background: "var(--red-pale)", border: "1px solid #f5b8b4", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--red)" }}>⚠️ {err}</div>}
        </div>
      )}

      {step === 3 && (
        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 20, padding: 24, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "var(--green-xp)", border: "1px solid var(--green-mid)", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--green)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>📋 Crop Summary</div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  ["Crop", `${form.emoji} ${form.cropName || "Not set"}`],
                  ["Quantity", form.quantity ? `${form.quantity}kg` : "Not set"],
                  ["Min Bid", form.minBid ? `₹${form.minBid}/kg` : "Not set"],
                  ["Harvest", getHarvestTypeLabel(form.harvestType)],
                  ["Mode", form.harvestType === "single_harvest" ? "Auto effort pricing" : "Manual price"],
                  form.costPerKg > 0 ? ["Cost/kg", `₹${Number(form.costPerKg).toFixed(1)}`] : null,
                  form.costPerKg > 0 ? ["Profit Target", `${form.profitTarget}%`] : null,
                ].filter(Boolean).map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: "var(--text3)" }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                Village / Town *
              </label>
              <input style={inp} value={form.village} onChange={e => searchLoc(e.target.value)} placeholder="Type to search Karnataka..." onFocus={e => e.target.style.borderColor = "var(--green)"} onBlur={() => { setTimeout(() => setLocs([]), 180); }} />
              {locs.length > 0 && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid var(--border)", borderRadius: 12, zIndex: 70, maxHeight: 175, overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
                  {locs.map(loc => (
                    <div key={loc.n} onMouseDown={() => selLoc(loc)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, borderBottom: "1px solid var(--bg2)", display: "flex", alignItems: "center", gap: 7 }} onMouseOver={e => e.currentTarget.style.background = "var(--green-xp)"} onMouseOut={e => e.currentTarget.style.background = "#fff"}>
                      <span>📍</span>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--text)" }}>{loc.n}</div>
                        <div style={{ fontSize: 11, color: "var(--text3)" }}>{loc.d} · {loc.pin}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                Full Pickup Address *
              </label>
              <input style={inp} name="pickupAddress" value={form.pickupAddress} onChange={h} placeholder="Landmark, road, town, pincode..." onFocus={e => e.target.style.borderColor = "var(--green)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                Crop Photos (up to 4) - More photos = More bids!
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {photos.map((photo, i) => (
                  <div key={i} style={{ width: 88, height: 88, borderRadius: 12, overflow: "hidden", position: "relative", border: "2px solid var(--border)" }}>
                    <img src={photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                    <button onClick={() => setPhotos(list => list.filter((_, j) => j !== i))} style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, background: "var(--red)", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 10, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      ×
                    </button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <label style={{ width: 88, height: 88, border: "2px dashed var(--border)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--bg)", gap: 4, transition: "all .15s" }} onMouseOver={e => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.background = "var(--green-xp)"; }} onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg)"; }}>
                    <span style={{ fontSize: 22 }}>📷</span>
                    <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>Add photo</span>
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={addPhoto} />
                  </label>
                )}
              </div>
              <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 6 }}>📸 Listings with photos get 3× more bids on average</div>
            </div>

            {err && <div style={{ background: "var(--red-pale)", border: "1px solid #f5b8b4", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--red)" }}>⚠️ {err}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid var(--border)", background: "#fff", color: "var(--text2)", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ← Back
              </button>
              <button onClick={submit} disabled={saving} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: saving ? "var(--border)" : "var(--green)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {saving ? "⏳ Posting..." : "🚀 Post Crop for Auction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
