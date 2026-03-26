import { useEffect, useMemo, useState } from "react";
import { pick } from "../i18n.js";

const PROFILE_BY_CATEGORY = {
  Vegetables: {
    costShare: 0.57,
    floorShare: 0.42,
    overheadFloor: 4.2,
    replantingWeight: 1.15,
    breakdown: {
      landPrepReplant: 0.18,
      seedsNursery: 0.14,
      cropCare: 0.21,
      labourHarvest: 0.29,
      sortingTransport: 0.18,
    },
  },
  Fruits: {
    costShare: 0.49,
    floorShare: 0.38,
    overheadFloor: 5.4,
    replantingWeight: 0.75,
    breakdown: {
      landPrepReplant: 0.12,
      seedsNursery: 0.1,
      cropCare: 0.24,
      labourHarvest: 0.34,
      sortingTransport: 0.2,
    },
  },
  Grains: {
    costShare: 0.54,
    floorShare: 0.43,
    overheadFloor: 3.4,
    replantingWeight: 1.05,
    breakdown: {
      landPrepReplant: 0.22,
      seedsNursery: 0.16,
      cropCare: 0.18,
      labourHarvest: 0.24,
      sortingTransport: 0.2,
    },
  },
  Pulses: {
    costShare: 0.55,
    floorShare: 0.44,
    overheadFloor: 4.6,
    replantingWeight: 1.1,
    breakdown: {
      landPrepReplant: 0.2,
      seedsNursery: 0.16,
      cropCare: 0.18,
      labourHarvest: 0.25,
      sortingTransport: 0.21,
    },
  },
  Oilseeds: {
    costShare: 0.56,
    floorShare: 0.44,
    overheadFloor: 4.1,
    replantingWeight: 1.08,
    breakdown: {
      landPrepReplant: 0.19,
      seedsNursery: 0.15,
      cropCare: 0.2,
      labourHarvest: 0.26,
      sortingTransport: 0.2,
    },
  },
  Spices: {
    costShare: 0.58,
    floorShare: 0.46,
    overheadFloor: 6.2,
    replantingWeight: 1.18,
    breakdown: {
      landPrepReplant: 0.17,
      seedsNursery: 0.13,
      cropCare: 0.24,
      labourHarvest: 0.28,
      sortingTransport: 0.18,
    },
  },
  "Cash Crops": {
    costShare: 0.53,
    floorShare: 0.4,
    overheadFloor: 3.2,
    replantingWeight: 1.02,
    breakdown: {
      landPrepReplant: 0.2,
      seedsNursery: 0.14,
      cropCare: 0.19,
      labourHarvest: 0.25,
      sortingTransport: 0.22,
    },
  },
  default: {
    costShare: 0.55,
    floorShare: 0.42,
    overheadFloor: 4,
    replantingWeight: 1,
    breakdown: {
      landPrepReplant: 0.18,
      seedsNursery: 0.14,
      cropCare: 0.2,
      labourHarvest: 0.28,
      sortingTransport: 0.2,
    },
  },
};

const BREAKDOWN_LABELS = {
  landPrepReplant: "Land prep + replanting",
  seedsNursery: "Seeds / nursery",
  cropCare: "Fertilizer, water, crop care",
  labourHarvest: "Labour + harvesting",
  sortingTransport: "Sorting + transport",
};

const REGROWTH_PRESETS = [
  {
    key: "competitive",
    label: "Competitive",
    hint: "Quick sale and repeat harvest cycle",
    multiplier: 0.95,
  },
  {
    key: "market",
    label: "Match APMC",
    hint: "Stay near the live mandi reference",
    multiplier: 1,
  },
  {
    key: "premium",
    label: "Premium",
    hint: "For fresh quality or stronger demand",
    multiplier: 1.07,
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

function average(list) {
  if (!list?.length) return 0;
  return list.reduce((sum, item) => sum + Number(item || 0), 0) / list.length;
}

function money(value) {
  const num = Number(value || 0);
  return `₹${num % 1 ? num.toFixed(1) : num}`;
}

function tDemandLevel(level, lang) {
  return pick(
    lang,
    level,
    {
      "Stable demand": "ಸ್ಥಿರ ಬೇಡಿಕೆ",
      "High demand": "ಹೆಚ್ಚಿನ ಬೇಡಿಕೆ",
      "Soft demand": "ಮಂದ ಬೇಡಿಕೆ",
    }[level] || level
  );
}

function tDemandPulse(pulse, lang) {
  return pick(
    lang,
    pulse,
    {
      "Steady today": "ಇಂದು ಸ್ಥಿರವಾಗಿದೆ",
      "Rising now": "ಈಗ ಏರುತ್ತಿದೆ",
      "Cooling now": "ಈಗ ಇಳಿಯುತ್ತಿದೆ",
    }[pulse] || pulse
  );
}

function tBreakdownLabel(label, lang) {
  return pick(
    lang,
    label,
    {
      "Land prep + replanting": "ನೆಲ ಸಿದ್ಧತೆ + ಮರು ನೆಡುವಿಕೆ",
      "Seeds / nursery": "ಬೀಜ / ನರ್ಸರಿ",
      "Fertilizer, water, crop care": "ರಸಗೊಬ್ಬರ, ನೀರು, ಬೆಳೆ ಆರೈಕೆ",
      "Labour + harvesting": "ಕಾರ್ಮಿಕರು + ಕೊಯ್ಲು",
      "Sorting + transport": "ವಿಂಗಡಣೆ + ಸಾರಿಗೆ",
    }[label] || label
  );
}

function tPresetLabel(label, lang) {
  return pick(
    lang,
    label,
    {
      Competitive: "ಸ್ಪರ್ಧಾತ್ಮಕ",
      "Match APMC": "ಎಪಿಎಂಸಿಗೆ ಹೊಂದಿಸಿ",
      Premium: "ಪ್ರೀಮಿಯಂ",
    }[label] || label
  );
}

function tPresetHint(hint, lang) {
  return pick(
    lang,
    hint,
    {
      "Quick sale and repeat harvest cycle": "ವೇಗದ ಮಾರಾಟ ಮತ್ತು ಮರು ಕೊಯ್ಲು ಚಕ್ರ",
      "Stay near the live mandi reference": "ಲೈವ್ ಮಂಡಿ ದರದ ಹತ್ತಿರದಲ್ಲಿರಿ",
      "For fresh quality or stronger demand": "ತಾಜಾ ಗುಣಮಟ್ಟ ಅಥವಾ ಹೆಚ್ಚಿನ ಬೇಡಿಕೆಗಾಗಿ",
    }[hint] || hint
  );
}

function getDemandInsight(marketRate, apmcPrice) {
  const livePrice = Number(marketRate?.price || apmcPrice || 0);
  const baselinePrice = Number(marketRate?.bp || apmcPrice || livePrice || 1);
  const prevPrice = Number(marketRate?.prev || baselinePrice || livePrice || 1);
  const histAvg = Number(average(marketRate?.hist) || baselinePrice || livePrice || 1);

  const vsBase = baselinePrice > 0 ? (livePrice - baselinePrice) / baselinePrice : 0;
  const vsPrev = prevPrice > 0 ? (livePrice - prevPrice) / prevPrice : 0;
  const vsHist = histAvg > 0 ? (livePrice - histAvg) / histAvg : 0;

  const score = clamp(0.58 + vsBase * 1.15 + vsPrev * 0.65 + vsHist * 0.7, 0.25, 1.35);

  let level = "Stable demand";
  let pulse = "Steady today";
  let profitTarget = 18;
  let pricingLift = 0.02;
  let tone = "#92400e";
  let bg = "#fffbeb";
  let border = "#fde68a";

  if (score >= 0.95) {
    level = "High demand";
    profitTarget = 26;
    pricingLift = 0.08;
    tone = "#15803d";
    bg = "#f0fdf4";
    border = "#86efac";
  } else if (score <= 0.5) {
    level = "Soft demand";
    profitTarget = 14;
    pricingLift = -0.02;
    tone = "#1d4ed8";
    bg = "#eff6ff";
    border = "#bfdbfe";
  }

  if (vsPrev >= 0.03) pulse = "Rising now";
  if (vsPrev <= -0.03) pulse = "Cooling now";

  return {
    livePrice: round2(livePrice),
    baselinePrice: round2(baselinePrice),
    prevPrice: round2(prevPrice),
    histAvg: round2(histAvg),
    score: round2(score),
    level,
    pulse,
    profitTarget,
    pricingLift,
    tone,
    bg,
    border,
    vsBasePct: round2(vsBase * 100),
    vsPrevPct: round2(vsPrev * 100),
  };
}

function buildBreakdown(totalProductionCost, quantity, profile) {
  const qty = Math.max(1, Number(quantity) || 1);
  return Object.fromEntries(
    Object.entries(profile.breakdown).map(([key, share]) => {
      const total = round2(totalProductionCost * share);
      return [
        key,
        {
          total,
          perKg: round2(total / qty),
          sharePct: Math.round(share * 100),
        },
      ];
    })
  );
}

export function getSingleHarvestEstimate({ quantity, category, marketRate, apmcPrice }) {
  const qty = Math.max(1, Number(quantity) || 0);
  const profile = PROFILE_BY_CATEGORY[category] || PROFILE_BY_CATEGORY.default;
  const demand = getDemandInsight(marketRate, apmcPrice);
  const referencePrice = Number(demand.livePrice || apmcPrice || 1);

  const qtyFactor =
    qty < 100 ? 1.12 :
    qty < 250 ? 1.06 :
    qty < 500 ? 1 :
    qty < 1000 ? 0.95 : 0.91;

  const handlingFloor = profile.overheadFloor + Math.min(3.5, 180 / qty);
  const rawCostPerKg = Math.max(
    referencePrice * profile.costShare * qtyFactor,
    demand.baselinePrice * profile.floorShare,
    handlingFloor
  );
  const replantingBuffer = 1 + profile.replantingWeight * 0.08 + (demand.level === "Soft demand" ? 0.03 : 0);

  const costPerKg = round2(rawCostPerKg * replantingBuffer);
  const totalProductionCost = round2(costPerKg * qty);
  const costBreakdown = buildBreakdown(totalProductionCost, qty, profile);

  const fairFloor = round2(costPerKg * (1 + demand.profitTarget / 100));
  const demandAlignedFloor = round2(referencePrice * (1 + demand.pricingLift));
  const minBid = Math.ceil(Math.max(fairFloor, demandAlignedFloor, costPerKg * 1.12));
  const expectedPrice = Math.ceil(
    Math.max(
      minBid * 1.06,
      costPerKg * 1.32,
      referencePrice * (1 + Math.max(demand.pricingLift, 0.04))
    )
  );

  return {
    pricingMode: "auto_single_harvest",
    costPerKg,
    totalProductionCost,
    minBid,
    expectedPrice,
    profitTarget: demand.profitTarget,
    costBreakdown,
    demandInsights: {
      ...demand,
      recommendedFloor: minBid,
      targetClose: expectedPrice,
      approxModel: "Auto-estimated from crop type, quantity and live market demand",
    },
  };
}

function getRegrowthEstimate({ quantity, category, marketRate, apmcPrice }) {
  const qty = Math.max(1, Number(quantity) || 0);
  const profile = PROFILE_BY_CATEGORY[category] || PROFILE_BY_CATEGORY.default;
  const demand = getDemandInsight(marketRate, apmcPrice);
  const referencePrice = Number(demand.livePrice || apmcPrice || 1);
  const handlingFloor = profile.overheadFloor * 0.68 + Math.min(2.2, 110 / qty);
  const recurringCostShare = profile.costShare * 0.46;
  const recurringFloorShare = profile.floorShare * 0.58;
  const rawCostPerKg = Math.max(
    referencePrice * recurringCostShare,
    demand.baselinePrice * recurringFloorShare,
    handlingFloor
  );

  const costPerKg = round2(rawCostPerKg * (demand.level === "Soft demand" ? 1.03 : 0.98));
  const totalProductionCost = round2(costPerKg * qty);

  return {
    demand,
    referencePrice,
    estimatedCostPerKg: costPerKg,
    estimatedRecurringCost: totalProductionCost,
    presets: REGROWTH_PRESETS.map(preset => ({
      ...preset,
      price: Math.max(1, Math.round(referencePrice * preset.multiplier)),
    })),
  };
}

function getRegrowthGuidance(marketRate, apmcPrice) {
  const demand = getDemandInsight(marketRate, apmcPrice);
  const referencePrice = Number(demand.livePrice || apmcPrice || 0);

  return {
    demand,
    referencePrice,
    presets: REGROWTH_PRESETS.map(preset => ({
      ...preset,
      price: Math.max(1, Math.round(referencePrice * preset.multiplier)),
    })),
  };
}

function getTopBreakdownItems(costBreakdown) {
  return Object.entries(costBreakdown || {})
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 3);
}

export function getEstimatedFarmerCostPerKg(crop, marketRate) {
  const explicitCost = Number(crop?.estimatedCostPerKg || crop?.costPerKg || 0);
  if (explicitCost > 0) return explicitCost;

  if (crop?.harvestType === "regrows") {
    const regrowthEstimate = getRegrowthEstimate({
      quantity: crop?.quantity,
      category: crop?.category,
      marketRate,
      apmcPrice: Number(crop?.demandInsights?.livePrice || crop?.basePrice || crop?.minBid || 0),
    });

    return Number(regrowthEstimate.estimatedCostPerKg || 0);
  }

  return 0;
}

export function SmartPriceCalculator({
  harvestType,
  quantity,
  category,
  marketRate,
  apmcPrice,
  onResult,
  lang = "en",
}) {
  const [open, setOpen] = useState(false);

  const singleHarvestEstimate = useMemo(() => {
    if (harvestType !== "single_harvest" || !Number(quantity)) return null;
    return getSingleHarvestEstimate({ quantity, category, marketRate, apmcPrice });
  }, [harvestType, quantity, category, marketRate, apmcPrice]);

  const regrowthGuidance = useMemo(() => {
    if (harvestType !== "regrows") return null;
    return getRegrowthEstimate({ quantity, category, marketRate, apmcPrice });
  }, [harvestType, quantity, category, marketRate, apmcPrice]);

  useEffect(() => {
    if (harvestType) setOpen(true);
  }, [harvestType]);

  function applyRegrowthPrice(price, preset) {
    onResult({
      pricingMode: "manual_regrows",
      minBid: price,
      expectedPrice: 0,
      costPerKg: 0,
      estimatedCostPerKg: regrowthGuidance?.estimatedCostPerKg || 0,
      totalProductionCost: regrowthGuidance?.estimatedRecurringCost || 0,
      profitTarget: 0,
      costBreakdown: null,
      demandInsights: regrowthGuidance
        ? {
            ...regrowthGuidance.demand,
            recurringCostPerKg: regrowthGuidance.estimatedCostPerKg,
            approxModel: `Manual market guidance for regrowing crop (${preset.label.toLowerCase()})`,
          }
        : null,
    });
    setOpen(false);
  }

  function applySingleHarvestPrice() {
    if (!singleHarvestEstimate) return;
    onResult(singleHarvestEstimate);
    setOpen(false);
  }

  const headerText =
    harvestType === "single_harvest"
      ? singleHarvestEstimate
        ? pick(lang, `Auto cost ${money(singleHarvestEstimate.costPerKg)}/kg · Safe floor ${money(singleHarvestEstimate.minBid)}/kg`, `ಸ್ವಯಂ ವೆಚ್ಚ ${money(singleHarvestEstimate.costPerKg)}/ಕೆಜಿ · ಸುರಕ್ಷಿತ ನೆಲೆಬೆಲೆ ${money(singleHarvestEstimate.minBid)}/ಕೆಜಿ`)
        : pick(lang, "Enter crop and quantity to auto-estimate safe pricing", "ಸುರಕ್ಷಿತ ಬೆಲೆಯನ್ನು ಸ್ವಯಂ ಲೆಕ್ಕಿಸಲು ಬೆಳೆ ಮತ್ತು ಪ್ರಮಾಣವನ್ನು ನಮೂದಿಸಿ")
      : harvestType === "regrows"
        ? regrowthGuidance?.referencePrice
          ? pick(lang, `Manual price mode around live market ${money(regrowthGuidance.referencePrice)}/kg`, `ಲೈವ್ ಮಾರುಕಟ್ಟೆ ${money(regrowthGuidance.referencePrice)}/ಕೆಜಿ ಸುತ್ತ ಕೈಯಾರೆ ಬೆಲೆ ವಿಧಾನ`)
          : pick(lang, "Set your own price using live market guidance", "ಲೈವ್ ಮಾರುಕಟ್ಟೆ ಮಾರ್ಗದರ್ಶನದಿಂದ ನಿಮ್ಮದೇ ಬೆಲೆಯನ್ನು ನಿಗದಿಪಡಿಸಿ")
        : pick(lang, "Choose a harvest type first", "ಮೊದಲು ಕೊಯ್ಲಿನ ರೀತಿಯನ್ನು ಆರಿಸಿ");

  return (
    <div style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)", border: "1.5px solid #86efac", borderRadius: 14, overflow: "hidden" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>
            {harvestType === "single_harvest" ? "🧠" : "📊"}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#15803d" }}>
              {harvestType === "single_harvest"
                ? pick(lang, "Auto Effort Pricing", "ಸ್ವಯಂ ಶ್ರಮ ಬೆಲೆಗಣನೆ")
                : pick(lang, "Manual Market Guidance", "ಕೈಯಾರೆ ಮಾರುಕಟ್ಟೆ ಮಾರ್ಗದರ್ಶನ")}
            </div>
            <div style={{ fontSize: 11, color: "#4b7a4e", marginTop: 1 }}>{headerText}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {harvestType === "single_harvest" && singleHarvestEstimate && (
            <span style={{ fontSize: 11, fontWeight: 800, background: "#16a34a", color: "#fff", padding: "2px 9px", borderRadius: 10 }}>
              {money(singleHarvestEstimate.minBid)}/{pick(lang, "kg safe", "ಕೆಜಿ ಸುರಕ್ಷಿತ")}
            </span>
          )}
          <span style={{ fontSize: 16, color: "#16a34a", transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▼</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: "0 16px 18px", borderTop: "1px solid #bbf7d0" }}>
          {!harvestType && (
            <div style={{ padding: "16px 0 2px", fontSize: 13, color: "#4b7a4e", lineHeight: 1.55 }}>
              {pick(lang, "Select a harvest type first. Regrowing crops stay in manual pricing mode, while single-harvest crops get automatic effort-cost estimation.", "ಮೊದಲು ಕೊಯ್ಲಿನ ರೀತಿಯನ್ನು ಆರಿಸಿ. ಮರುಬೆಳೆಯುವ ಬೆಳೆಗಳು ಕೈಯಾರೆ ಬೆಲೆ ವಿಧಾನದಲ್ಲೇ ಇರುತ್ತವೆ; ಒಮ್ಮೆ ಕೊಯ್ಲು ಬೆಳೆಗಳಿಗೆ ಸ್ವಯಂ ಶ್ರಮ ವೆಚ್ಚ ಲೆಕ್ಕ ಬರುತ್ತದೆ.")}
            </div>
          )}

          {harvestType === "regrows" && regrowthGuidance && (
            <div style={{ paddingTop: 14 }}>
              <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 7 }}>
                  {pick(lang, "Regrowing Crop Mode", "ಮರುಬೆಳೆಯುವ ಬೆಳೆ ವಿಧಾನ")}
                </div>
                <div style={{ fontSize: 13, color: "#1a2e1c", lineHeight: 1.55 }}>
                  {pick(lang, "Since this crop can bear again from the same plant, the app does not add replanting cost. The farmer sets the minimum bid directly, and we only show live market guidance.", "ಈ ಬೆಳೆ ಅದೇ ಸಸ್ಯದಿಂದ ಮತ್ತೆ ಫಲ ಕೊಡಬಹುದಾದ್ದರಿಂದ, ಅಪ್ಲಿಕೇಶನ್ ಮರು ನೆಡುವ ವೆಚ್ಚವನ್ನು ಸೇರಿಸುವುದಿಲ್ಲ. ರೈತರು ಕನಿಷ್ಠ ಬಿಡ್ ಅನ್ನು ನೇರವಾಗಿ ನಿಗದಿಪಡಿಸುತ್ತಾರೆ; ನಾವು ಲೈವ್ ಮಾರುಕಟ್ಟೆ ಮಾರ್ಗದರ್ಶನವನ್ನಷ್ಟೇ ತೋರಿಸುತ್ತೇವೆ.")}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#4b7a4e", textTransform: "uppercase", letterSpacing: 0.5 }}>{pick(lang, "Live market", "ಲೈವ್ ಮಾರುಕಟ್ಟೆ")}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#15803d", marginTop: 5 }}>{money(regrowthGuidance.referencePrice)}</div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{pick(lang, "per kg reference", "ಪ್ರತಿ ಕೆಜಿ ಸೂಚಕ")}</div>
                </div>
                <div style={{ background: regrowthGuidance.demand.bg, border: `1px solid ${regrowthGuidance.demand.border}`, borderRadius: 12, padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: regrowthGuidance.demand.tone, textTransform: "uppercase", letterSpacing: 0.5 }}>{pick(lang, "Demand", "ಬೇಡಿಕೆ")}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: regrowthGuidance.demand.tone, marginTop: 6 }}>{tDemandLevel(regrowthGuidance.demand.level, lang)}</div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{tDemandPulse(regrowthGuidance.demand.pulse, lang)}</div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#4b7a4e", textTransform: "uppercase", letterSpacing: 0.5 }}>{pick(lang, "Baseline shift", "ಆಧಾರ ಬದಲಾವಣೆ")}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: regrowthGuidance.demand.vsBasePct >= 0 ? "#15803d" : "#dc2626", marginTop: 5 }}>
                    {regrowthGuidance.demand.vsBasePct >= 0 ? "+" : ""}{regrowthGuidance.demand.vsBasePct}%
                  </div>
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{pick(lang, "vs base market price", "ಆಧಾರ ಮಾರುಕಟ್ಟೆ ದರದ ವಿರುದ್ಧ")}</div>
                </div>
              </div>

              <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 14px", marginBottom: 14, fontSize: 12, color: "#4b7a4e", lineHeight: 1.55 }}>
                {pick(lang, "Approx recurring farm cost for profit tracking", "ಲಾಭದ ದಾಖಲೆಗೆ ಅಂದಾಜು ಮರುಕಳಿಸುವ ಕೃಷಿ ವೆಚ್ಚ")}: <strong>{money(regrowthGuidance.estimatedCostPerKg)}/{pick(lang, "kg", "ಕೆಜಿ")}</strong>. {pick(lang, "This keeps seed and full replanting cost out, but still counts labour, crop care and harvest effort.", "ಇದು ಬೀಜ ಮತ್ತು ಸಂಪೂರ್ಣ ಮರು ನೆಡುವ ವೆಚ್ಚವನ್ನು ಹೊರಗಿಡುತ್ತದೆ, ಆದರೆ ಕಾರ್ಮಿಕ, ಬೆಳೆ ಆರೈಕೆ ಮತ್ತು ಕೊಯ್ಲಿನ ಶ್ರಮವನ್ನು ಲೆಕ್ಕಿಸುತ್ತದೆ.")}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {regrowthGuidance.presets.map(preset => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyRegrowthPrice(preset.price, preset)}
                    style={{ background: "#fff", border: "1.5px solid #86efac", borderRadius: 12, padding: "14px 12px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#15803d" }}>{tPresetLabel(preset.label, lang)}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#1a2e1c", margin: "6px 0 5px" }}>{money(preset.price)}/{pick(lang, "kg", "ಕೆಜಿ")}</div>
                    <div style={{ fontSize: 11, color: "#4b7a4e", lineHeight: 1.45 }}>{tPresetHint(preset.hint, lang)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {harvestType === "single_harvest" && (
            <div style={{ paddingTop: 14 }}>
              {!singleHarvestEstimate && (
                <div style={{ fontSize: 13, color: "#4b7a4e", lineHeight: 1.55 }}>
                  {pick(lang, "Enter the crop quantity to generate the automatic effort-cost model.", "ಸ್ವಯಂ ಶ್ರಮ ವೆಚ್ಚ ಮಾದರಿಯನ್ನು ರಚಿಸಲು ಬೆಳೆಯ ಪ್ರಮಾಣವನ್ನು ನಮೂದಿಸಿ.")}
                </div>
              )}

              {singleHarvestEstimate && (
                <>
                  <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 7 }}>
                      {pick(lang, "Single Harvest Auto Model", "ಒಮ್ಮೆ ಕೊಯ್ಲು ಸ್ವಯಂ ಮಾದರಿ")}
                    </div>
                    <div style={{ fontSize: 13, color: "#1a2e1c", lineHeight: 1.55 }}>
                      {pick(lang, "This crop needs replanting for the next cycle, so the farmer does not enter costs manually. The app estimates effort cost from crop type, quantity and live market demand, then calculates a safe profitable floor price.", "ಈ ಬೆಳೆ ಮುಂದಿನ ಚಕ್ರಕ್ಕೆ ಮರು ನೆಡುವಿಕೆಯನ್ನು ಅಗತ್ಯಪಡಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ರೈತರು ವೆಚ್ಚವನ್ನು ಕೈಯಾರೆ ನಮೂದಿಸುವುದಿಲ್ಲ. ಅಪ್ಲಿಕೇಶನ್ ಬೆಳೆ ಪ್ರಕಾರ, ಪ್ರಮಾಣ ಮತ್ತು ಲೈವ್ ಮಾರುಕಟ್ಟೆ ಬೇಡಿಕೆಯ ಆಧಾರದ ಮೇಲೆ ಶ್ರಮ ವೆಚ್ಚವನ್ನು ಅಂದಾಜಿಸಿ, ಸುರಕ್ಷಿತ ಲಾಭದಾಯಕ ನೆಲೆಬೆಲೆಯನ್ನು ಲೆಕ್ಕಿಸುತ್ತದೆ.")}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                    <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{pick(lang, "Effort cost", "ಶ್ರಮ ವೆಚ್ಚ")}</div>
                      <div style={{ fontSize: 21, fontWeight: 800, color: "#dc2626", marginTop: 5 }}>{money(singleHarvestEstimate.costPerKg)}</div>
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{pick(lang, "per kg", "ಪ್ರತಿ ಕೆಜಿ")}</div>
                    </div>
                    <div style={{ background: singleHarvestEstimate.demandInsights.bg, border: `1px solid ${singleHarvestEstimate.demandInsights.border}`, borderRadius: 12, padding: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: singleHarvestEstimate.demandInsights.tone, textTransform: "uppercase", letterSpacing: 0.5 }}>{pick(lang, "Demand", "ಬೇಡಿಕೆ")}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: singleHarvestEstimate.demandInsights.tone, marginTop: 6 }}>{tDemandLevel(singleHarvestEstimate.demandInsights.level, lang)}</div>
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{tDemandPulse(singleHarvestEstimate.demandInsights.pulse, lang)}</div>
                    </div>
                    <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{pick(lang, "Safe floor", "ಸುರಕ್ಷಿತ ನೆಲೆಬೆಲೆ")}</div>
                      <div style={{ fontSize: 21, fontWeight: 800, color: "#15803d", marginTop: 5 }}>{money(singleHarvestEstimate.minBid)}</div>
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{pick(lang, "No-loss profitable bid", "ನಷ್ಟವಿಲ್ಲದ ಲಾಭದ ಬಿಡ್")}</div>
                    </div>
                    <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{pick(lang, "Expected close", "ನಿರೀಕ್ಷಿತ ಅಂತಿಮ ಬೆಲೆ")}</div>
                      <div style={{ fontSize: 21, fontWeight: 800, color: "#d97706", marginTop: 5 }}>{money(singleHarvestEstimate.expectedPrice)}</div>
                      <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{pick(lang, "Healthy target price", "ಆರೋಗ್ಯಕರ ಗುರಿ ದರ")}</div>
                    </div>
                  </div>

                  <div style={{ background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#15803d" }}>{pick(lang, "Approximate effort breakdown", "ಅಂದಾಜು ಶ್ರಮ ವಿಭಾಗ")}</div>
                      <div style={{ fontSize: 11, color: "#4b7a4e" }}>
                        {pick(lang, "Total season effort", "ಒಟ್ಟು ಹಂಗಾಮಿನ ಶ್ರಮ")}: <strong>{money(singleHarvestEstimate.totalProductionCost)}</strong>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {Object.entries(singleHarvestEstimate.costBreakdown).map(([key, item]) => (
                        <div key={key} style={{ background: "#f8fffb", border: "1px solid #dcfce7", borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#1a2e1c" }}>{tBreakdownLabel(BREAKDOWN_LABELS[key], lang)}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#15803d", marginTop: 4 }}>{money(item.perKg)}/{pick(lang, "kg", "ಕೆಜಿ")}</div>
                          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{money(item.total)} {pick(lang, "total", "ಒಟ್ಟು")} · {item.sharePct}% {pick(lang, "share", "ಹಂಚಿಕೆ")}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={applySingleHarvestPrice}
                    style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    {pick(lang, "Apply safe floor", "ಸುರಕ್ಷಿತ ನೆಲೆಬೆಲೆ ಅನ್ವಯಿಸಿ")} {money(singleHarvestEstimate.minBid)}/{pick(lang, "kg", "ಕೆಜಿ")} {pick(lang, "and save wholesaler transparency", "ಮತ್ತು ಸಗಟು ಪಾರದರ್ಶಕತೆಯನ್ನು ಉಳಿಸಿ")}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function BidInsight({ bidAmount, crop, role, lang = "en" }) {
  if (!crop.costPerKg || crop.costPerKg === 0) return null;

  const costPkg = Number(crop.costPerKg);
  const apmcPrice = Number(crop.basePrice) || 0;
  const safeFloor = Number(crop.demandInsights?.recommendedFloor || crop.minBid || 0);
  const targetClose = Number(crop.demandInsights?.targetClose || crop.expectedPrice || 0);
  const profitAmt = bidAmount - costPkg;
  const profitPct = (profitAmt / costPkg) * 100;
  const gapToSafe = bidAmount - safeFloor;
  const vsApmc = apmcPrice > 0 ? ((bidAmount - apmcPrice) / apmcPrice) * 100 : null;

  let color = "#15803d";
  let bg = "#f0fdf4";
  let border = "#86efac";
  let icon = "🟢";
  let msg = pick(lang, `${profitPct.toFixed(0)}% profit - great deal for farmer`, `${profitPct.toFixed(0)}% ಲಾಭ - ರೈತನಿಗೆ ಒಳ್ಳೆಯ ಒಪ್ಪಂದ`);

  if (profitPct < 25) {
    color = "#92400e";
    bg = "#fffbeb";
    border = "#fde68a";
    icon = "🟡";
    msg = pick(lang, `${profitPct.toFixed(0)}% profit - fair but not strong`, `${profitPct.toFixed(0)}% ಲಾಭ - ನ್ಯಾಯವಾದರೂ ಬಹಳ ಬಲವಾಗಿಲ್ಲ`);
  }
  if (profitPct < 10) {
    color = "#c2410c";
    bg = "#fff7ed";
    border = "#fed7aa";
    icon = "🟠";
    msg = pick(lang, "Close to cost price - little safety for farmer", "ವೆಚ್ಚದ ದರದ ಹತ್ತಿರ - ರೈತನಿಗೆ ಕಡಿಮೆ ರಕ್ಷಣೆ");
  }
  if (profitPct < 0) {
    color = "#dc2626";
    bg = "#fef2f2";
    border = "#fca5a5";
    icon = "🔴";
    msg = pick(lang, `Below effort cost by ${money(Math.abs(profitAmt))}/kg`, `${money(Math.abs(profitAmt))}/ಕೆಜಿ ಮಟ್ಟಿಗೆ ಶ್ರಮ ವೆಚ್ಚಕ್ಕಿಂತ ಕಡಿಮೆ`);
  }

  if (role === "retailer") {
    return (
      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 14px", marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>
          {icon} {pick(lang, "Farmer effort transparency", "ರೈತರ ಶ್ರಮ ಪಾರದರ್ಶಕತೆ")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>{pick(lang, "Cost/kg", "ವೆಚ್ಚ/ಕೆಜಿ")}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#dc2626" }}>{money(costPkg)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>{pick(lang, "Safe floor", "ಸುರಕ್ಷಿತ ನೆಲೆಬೆಲೆ")}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#15803d" }}>{money(safeFloor)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>{pick(lang, "Target close", "ಗುರಿ ಅಂತಿಮ ದರ")}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#d97706" }}>{money(targetClose || safeFloor)}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>{pick(lang, "This bid", "ಈ ಬಿಡ್")}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color }}>{money(bidAmount)}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#4b7a4e", marginTop: 8, lineHeight: 1.5 }}>
          {gapToSafe >= 0 ? pick(lang, `This bid is ${money(gapToSafe)} above the safe floor.`, `ಈ ಬಿಡ್ ಸುರಕ್ಷಿತ ನೆಲೆಬೆಲೆಯಿಗಿಂತ ${money(gapToSafe)} ಹೆಚ್ಚು.`) : pick(lang, `This bid is ${money(Math.abs(gapToSafe))} below the safe floor.`, `ಈ ಬಿಡ್ ಸುರಕ್ಷಿತ ನೆಲೆಬೆಲೆಯಿಗಿಂತ ${money(Math.abs(gapToSafe))} ಕಡಿಮೆ.`)}
          {crop.demandInsights?.level ? pick(lang, ` Demand right now: ${crop.demandInsights.level}.`, ` ಈಗಿನ ಬೇಡಿಕೆ: ${tDemandLevel(crop.demandInsights.level, lang)}.`) : ""}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 10, padding: "9px 13px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color }}>{msg}</div>
        <div style={{ fontSize: 11, color: "#6b8f6e", marginTop: 2 }}>
          {gapToSafe >= 0 ? pick(lang, `Above safe floor by ${money(gapToSafe)}`, `ಸುರಕ್ಷಿತ ನೆಲೆಬೆಲೆಯಿಗಿಂತ ${money(gapToSafe)} ಮೇಲೆ`) : pick(lang, `Below safe floor by ${money(Math.abs(gapToSafe))}`, `ಸುರಕ್ಷಿತ ನೆಲೆಬೆಲೆಯಿಗಿಂತ ${money(Math.abs(gapToSafe))} ಕೆಳಗೆ`)}
          {vsApmc !== null ? pick(lang, ` · ${vsApmc >= 0 ? "+" : ""}${vsApmc.toFixed(0)}% vs APMC`, ` · ಎಪಿಎಂಸಿಗೆ ಹೋಲಿಸಿ ${vsApmc >= 0 ? "+" : ""}${vsApmc.toFixed(0)}%`) : ""}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color }}>{profitAmt >= 0 ? "+" : "-"}{money(Math.abs(profitAmt))}</div>
        <div style={{ fontSize: 9, color: "#6b7280" }}>{pick(lang, "per kg margin", "ಪ್ರತಿ ಕೆಜಿ ಲಾಭಾಂಶ")}</div>
      </div>
    </div>
  );
}

export function CostBadge({ crop, lang = "en" }) {
  if (!crop.costPerKg) return null;

  const costPkg = Number(crop.costPerKg);
  const safeFloor = Number(crop.demandInsights?.recommendedFloor || crop.minBid || 0);
  const targetClose = Number(crop.demandInsights?.targetClose || crop.expectedPrice || 0);
  const minProfit = ((safeFloor - costPkg) / costPkg) * 100;
  const topItems = getTopBreakdownItems(crop.costBreakdown);

  return (
    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 9, padding: "8px 11px", marginBottom: 8 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
        🧠 {pick(lang, "Auto effort model for wholesaler", "ಸಗಟುಗಾಗಿ ಸ್ವಯಂ ಶ್ರಮ ಮಾದರಿ")}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, color: "#6b7280" }}>{pick(lang, "Cost/kg", "ವೆಚ್ಚ/ಕೆಜಿ")}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#dc2626" }}>{money(costPkg)}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#6b7280" }}>{pick(lang, "Safe floor", "ಸುರಕ್ಷಿತ ನೆಲೆಬೆಲೆ")}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#15803d" }}>{money(safeFloor)}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#6b7280" }}>{pick(lang, "Demand", "ಬೇಡಿಕೆ")}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: crop.demandInsights?.tone || "#1a2e1c" }}>{crop.demandInsights?.level ? tDemandLevel(crop.demandInsights.level, lang) : pick(lang, "Live", "ಲೈವ್")}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "#6b7280" }}>{pick(lang, "Target close", "ಗುರಿ ಅಂತಿಮ ದರ")}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#d97706" }}>{money(targetClose || safeFloor)}</div>
        </div>
      </div>

      {topItems.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          {topItems.map(([key, item]) => (
            <span key={key} style={{ background: "#fff", border: "1px solid #dcfce7", borderRadius: 999, padding: "3px 8px", fontSize: 10, color: "#4b7a4e" }}>
              {tBreakdownLabel(BREAKDOWN_LABELS[key], lang)} {money(item.perKg)}/{pick(lang, "kg", "ಕೆಜಿ")}
            </span>
          ))}
        </div>
      )}

      <div style={{ fontSize: 10, color: "#4b7a4e", marginTop: 7, lineHeight: 1.5 }}>
        {pick(lang, `Safe floor protects roughly ${minProfit.toFixed(0)}% margin above estimated effort cost.`, `ಸುರಕ್ಷಿತ ನೆಲೆಬೆಲೆ ಅಂದಾಜು ಶ್ರಮ ವೆಚ್ಚದ ಮೇಲೆ ಸುಮಾರು ${minProfit.toFixed(0)}% ಲಾಭಾಂಶವನ್ನು ಕಾಪಾಡುತ್ತದೆ.`)}
        {crop.demandInsights?.approxModel ? ` ${pick(lang, crop.demandInsights.approxModel, "ಲೈವ್ ಮಾರುಕಟ್ಟೆ ಬೇಡಿಕೆ, ಬೆಳೆ ಪ್ರಕಾರ ಮತ್ತು ಪ್ರಮಾಣದ ಆಧಾರದ ಮೇಲೆ ಲೆಕ್ಕಿಸಲಾಗಿದೆ")}.` : ""}
      </div>
    </div>
  );
}

export function FarmerProfitHint({ crop, marketRate, lang = "en" }) {
  const qty = Math.max(1, Number(crop.quantity) || 0);
  const safeFloor = Number(crop.demandInsights?.recommendedFloor || crop.minBid || 0);
  const acceptedPrice = Number(crop.acceptedPrice || 0);
  const livePrice = Number(crop.demandInsights?.livePrice || marketRate?.price || crop.basePrice || 0);
  const estimatedCost = getEstimatedFarmerCostPerKg(crop, marketRate);
  const targetPrice = Number(
    acceptedPrice ||
    crop.demandInsights?.targetClose ||
    crop.expectedPrice ||
    safeFloor ||
    crop.minBid ||
    livePrice ||
    0
  );

  if (!qty || !targetPrice) return null;

  let tone = "#15803d";
  let bg = "#f0fdf4";
  let border = "#86efac";
  let badge = pick(lang, "Good", "ಉತ್ತಮ");
  let headline = "";
  let detail = "";
  let amount = 0;
  let amountLabel = pick(lang, "expected gain", "ನಿರೀಕ್ಷಿತ ಲಾಭ");

  if (estimatedCost > 0) {
    const costPkg = estimatedCost;
    const gainPerKg = targetPrice - costPkg;
    const marginPct = costPkg > 0 ? (gainPerKg / costPkg) * 100 : 0;

    amount = Math.max(gainPerKg * qty, 0);
    headline = acceptedPrice
      ? pick(lang, `This order may earn about ${money(amount)} for you`, `ಈ ಆದೇಶವು ನಿಮಗೆ ಸುಮಾರು ${money(amount)} ಲಾಭ ತಂದುಕೊಡಬಹುದು`)
      : pick(lang, `Near this price, you may earn about ${money(amount)}`, `ಈ ದರದ ಬಳಿ ನೀವು ಸುಮಾರು ${money(amount)} ಗಳಿಸಬಹುದು`);
    detail = acceptedPrice
      ? pick(lang, `Accepted at ${money(targetPrice)}/kg. Try to stay above ${money(safeFloor)}/kg on similar crops.`, `${money(targetPrice)}/ಕೆಜಿ ದರದಲ್ಲಿ ಅಂಗೀಕರಿಸಲಾಗಿದೆ. ಇಂತಹ ಬೆಳೆಗಳಲ್ಲಿ ${money(safeFloor)}/ಕೆಜಿ ಮೇಲಾಗಿರಲು ಪ್ರಯತ್ನಿಸಿ.`)
      : pick(lang, `Good to accept near ${money(targetPrice)}/kg. Try not to go below ${money(safeFloor)}/kg.`, `${money(targetPrice)}/ಕೆಜಿ ಹತ್ತಿರ ಅಂಗೀಕರಿಸುವುದು ಚೆನ್ನಾಗಿದೆ. ${money(safeFloor)}/ಕೆಜಿ ಕೆಳಗೆ ಹೋಗಬೇಡಿ.`);

    if (marginPct < 25) {
      tone = "#92400e";
      bg = "#fffbeb";
      border = "#fde68a";
      badge = pick(lang, "Fair", "ಸರಿ");
    }
    if (marginPct < 10) {
      tone = "#c2410c";
      bg = "#fff7ed";
      border = "#fed7aa";
      badge = pick(lang, "Low", "ಕಡಿಮೆ");
      detail = acceptedPrice
        ? pick(lang, `Accepted close to cost. Try to stay above ${money(safeFloor)}/kg next time.`, `ವೆಚ್ಚದ ಹತ್ತಿರ ಅಂಗೀಕರಿಸಲಾಗಿದೆ. ಮುಂದಿನ ಬಾರಿ ${money(safeFloor)}/ಕೆಜಿ ಮೇಲಾಗಿರಲು ಪ್ರಯತ್ನಿಸಿ.`)
        : pick(lang, `This is close to cost. Try to stay near ${money(safeFloor)}/kg or above.`, `ಇದು ವೆಚ್ಚದ ಹತ್ತಿರವಾಗಿದೆ. ${money(safeFloor)}/ಕೆಜಿ ಹತ್ತಿರ ಅಥವಾ ಮೇಲಾಗಿರಲು ಪ್ರಯತ್ನಿಸಿ.`);
    }
    if (marginPct < 0) {
      tone = "#dc2626";
      bg = "#fef2f2";
      border = "#fca5a5";
      badge = pick(lang, "Risk", "ಅಪಾಯ");
      amount = Math.abs(gainPerKg * qty);
      amountLabel = pick(lang, "possible loss", "ಸಂಭವನೀಯ ನಷ್ಟ");
      headline = acceptedPrice
        ? pick(lang, `This order is about ${money(amount)} below effort cost`, `ಈ ಆದೇಶವು ಶ್ರಮ ವೆಚ್ಚಕ್ಕಿಂತ ಸುಮಾರು ${money(amount)} ಕಡಿಮೆಯಾಗಿದೆ`)
        : pick(lang, `This price can drop about ${money(amount)} below effort cost`, `ಈ ಬೆಲೆ ಶ್ರಮ ವೆಚ್ಚಕ್ಕಿಂತ ಸುಮಾರು ${money(amount)} ಕಡಿಮೆಯಾಗಬಹುದು`);
      detail = pick(lang, `Try to stay above ${money(safeFloor)}/kg before accepting.`, `ಅಂಗೀಕರಿಸುವ ಮೊದಲು ${money(safeFloor)}/ಕೆಜಿ ಮೇಲಾಗಿರಲು ಪ್ರಯತ್ನಿಸಿ.`);
    }
  } else {
    const floorPrice = Number(crop.minBid || 0);
    const extraAboveFloor = Math.max((targetPrice - floorPrice) * qty, 0);
    const premiumPct = floorPrice > 0 ? ((targetPrice - floorPrice) / floorPrice) * 100 : 0;

    amount = extraAboveFloor;
    amountLabel = pick(lang, "above your floor", "ನಿಮ್ಮ ನೆಲೆಬೆಲೆಯ ಮೇಲೆ");
    headline = extraAboveFloor > 0
      ? acceptedPrice
        ? pick(lang, `This order is about ${money(extraAboveFloor)} above your floor`, `ಈ ಆದೇಶವು ನಿಮ್ಮ ನೆಲೆಬೆಲೆಯಿಗಿಂತ ಸುಮಾರು ${money(extraAboveFloor)} ಹೆಚ್ಚು`)
        : pick(lang, `This price can add about ${money(extraAboveFloor)} above your floor`, `ಈ ಬೆಲೆ ನಿಮ್ಮ ನೆಲೆಬೆಲೆಯಿಗಿಂತ ಸುಮಾರು ${money(extraAboveFloor)} ಹೆಚ್ಚಿಸಬಹುದು`)
      : pick(lang, "This price stays close to your floor", "ಈ ಬೆಲೆ ನಿಮ್ಮ ನೆಲೆಬೆಲೆಯ ಹತ್ತಿರದಲ್ಲೇ ಇರುತ್ತದೆ");
    detail = livePrice > 0
      ? pick(lang, `Live mandi is around ${money(livePrice)}/kg.`, `ಲೈವ್ ಮಂಡಿ ದರ ಸುಮಾರು ${money(livePrice)}/ಕೆಜಿ.`)
      : pick(lang, "Set near the live market for a faster sale.", "ವೇಗವಾದ ಮಾರಾಟಕ್ಕಾಗಿ ಲೈವ್ ಮಾರುಕಟ್ಟೆ ಹತ್ತಿರದಲ್ಲೇ ನಿಗದಿಪಡಿಸಿ.");

    if (premiumPct < 8) {
      tone = "#92400e";
      bg = "#fffbeb";
      border = "#fde68a";
      badge = pick(lang, "Fair", "ಸರಿ");
    }
    if (premiumPct < 3) {
      tone = "#6b7280";
      bg = "#f8fafc";
      border = "#dbe5ef";
      badge = pick(lang, "Near floor", "ನೆಲೆಬೆಲೆ ಹತ್ತಿರ");
    }
  }

  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: "11px 12px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: tone, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {pick(lang, "Farmer profit guide", "ರೈತರ ಲಾಭ ಮಾರ್ಗದರ್ಶಿ")}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 5, lineHeight: 1.45 }}>
            {headline}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4, lineHeight: 1.5 }}>
            {detail}
          </div>
        </div>

        <div style={{ minWidth: 92, textAlign: "right", flexShrink: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#fff", border: `1px solid ${border}`, borderRadius: 999, padding: "4px 9px", fontSize: 10, fontWeight: 800, color: tone }}>
            {badge}
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: tone, marginTop: 7 }}>
            {money(amount)}
          </div>
          <div style={{ fontSize: 9, color: "#6b7280" }}>{amountLabel}</div>
        </div>
      </div>
    </div>
  );
}
