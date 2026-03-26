import { useEffect, useMemo, useState } from "react";

import { findMatchingCrop, guessHarvestTypeForCrop, inferCropMeta } from "../data/constants.js";
import { fmtP } from "../utils/helpers.js";
import { pick, tCrop, tLocation } from "../i18n.js";
import { SmartPriceCalculator } from "./SmartPriceCalculator.jsx";

function statusTone(status) {
  if (status === "matched") {
    return { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8", label: "Matched" };
  }
  if (status === "confirmed") {
    return { bg: "#f0fdf4", border: "#86efac", color: "#15803d", label: "Confirmed" };
  }
  if (status === "fulfilled") {
    return { bg: "#f5f3ff", border: "#d8b4fe", color: "#7c3aed", label: "Fulfilled" };
  }
  return { bg: "#fff8eb", border: "#f5d090", color: "#9a5523", label: "Open Need" };
}

export default function RequirementCard({
  requirement,
  role,
  rates,
  onAccept,
  onDelete,
  lang,
  showMatchHint = false,
}) {
  const cropMeta = useMemo(
    () => inferCropMeta(requirement.cropName) || findMatchingCrop(requirement.cropName, rates) || {},
    [requirement.cropName, rates]
  );
  const marketRate = useMemo(
    () => findMatchingCrop(requirement.cropName, rates),
    [requirement.cropName, rates]
  );
  const harvestType = requirement.harvestType || guessHarvestTypeForCrop(requirement.cropName, requirement.category || cropMeta.cat || "");
  const tone = statusTone(requirement.status);
  const [reply, setReply] = useState({
    quantity: String(requirement.quantity || ""),
    amount: String(requirement.bidAmount || ""),
    pricing: null,
  });

  useEffect(() => {
    setReply({
      quantity: String(requirement.quantity || ""),
      amount: String(requirement.bidAmount || ""),
      pricing: null,
    });
  }, [requirement.id, requirement.quantity, requirement.bidAmount]);

  const askTotal = Number(requirement.bidAmount || 0) * Number(requirement.quantity || 0);
  const replyTotal = Number(reply.amount || 0) * Number(reply.quantity || 0);
  const canFarmerReply = role === "farmer" && requirement.status === "open";

  function applyPricing(result) {
    setReply(current => ({
      ...current,
      amount: String(result?.minBid || current.amount),
      pricing: result,
    }));
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 18, padding: 18, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
            {(requirement.emoji || cropMeta.e || "🌾")} {tCrop(requirement.cropName, lang)}
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3 }}>
            🏪 {requirement.retailerName} · 📍 {tLocation(requirement.retailerVillage, requirement.retailerDistrict, lang)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {showMatchHint && (
            <span style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #86efac", borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 800 }}>
              {pick(lang, "Matches your crop shelf", "ನಿಮ್ಮ ಬೆಳೆ ಪಟ್ಟಿಕೆಗೆ ಹೊಂದುತ್ತದೆ")}
            </span>
          )}
          <span style={{ background: tone.bg, color: tone.color, border: `1px solid ${tone.border}`, borderRadius: 999, padding: "5px 10px", fontSize: 11, fontWeight: 800 }}>
            {pick(lang, tone.label, tone.label === "Open Need" ? "ತೆರೆದ ಬೇಡಿಕೆ" : tone.label === "Matched" ? "ಹೊಂದಿಕೆಯಾಗಿದೆ" : tone.label === "Confirmed" ? "ದೃಢೀಕರಿಸಲಾಗಿದೆ" : "ಪೂರ್ಣಗೊಂಡಿದೆ")}
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginTop: 14 }}>
        <div style={{ background: "var(--bg)", borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>
            {pick(lang, "Required Qty", "ಬೇಕಾದ ಪ್ರಮಾಣ")}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginTop: 4 }}>{requirement.quantity}kg</div>
        </div>
        <div style={{ background: "var(--bg)", borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>
            {pick(lang, "Wholesaler Bid", "ಸಗಟು ಬಿಡ್")}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#9a5523", marginTop: 4 }}>{fmtP(requirement.bidAmount)}/kg</div>
        </div>
        <div style={{ background: "var(--bg)", borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>
            {pick(lang, "Need Value", "ಬೇಡಿಕೆಯ ಮೌಲ್ಯ")}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--green)", marginTop: 4 }}>{askTotal ? fmtP(askTotal) : "₹0"}</div>
        </div>
        <div style={{ background: "var(--bg)", borderRadius: 12, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>
            {pick(lang, "Contact", "ಸಂಪರ್ಕ")}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{requirement.retailerPhone}</div>
        </div>
      </div>

      {requirement.notes && (
        <div style={{ marginTop: 12, background: "#fffaf1", border: "1px solid #f5d090", borderRadius: 12, padding: "10px 12px", fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
          📝 {requirement.notes}
        </div>
      )}

      {role === "retailer" && requirement.status !== "open" && (
        <div
          style={{
            marginTop: 12,
            background: requirement.status === "matched" ? "#eef6ff" : requirement.status === "confirmed" ? "#f0fdf4" : "#f5f3ff",
            border: requirement.status === "matched" ? "1px solid #bfdbfe" : requirement.status === "confirmed" ? "1px solid #86efac" : "1px solid #d8b4fe",
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 12,
            color: "var(--text2)",
            lineHeight: 1.6,
          }}
        >
          🌾 {pick(lang, `${requirement.matchedByFarmerName || "A farmer"} responded at ${fmtP(requirement.farmerOfferPrice || 0)}/kg for ${requirement.matchedQuantity || 0}kg.`, `${requirement.matchedByFarmerName || "ಒಬ್ಬ ರೈತ"} ${fmtP(requirement.farmerOfferPrice || 0)}/ಕೆಜಿ ದರಕ್ಕೆ ${requirement.matchedQuantity || 0}ಕೆಜಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸಿದ್ದಾರೆ.`)}
          <div style={{ marginTop: 4, color: requirement.status === "matched" ? "#1d4ed8" : requirement.status === "confirmed" ? "#15803d" : "#7c3aed", fontWeight: 700 }}>
            {pick(
              lang,
              requirement.status === "matched"
                ? "Confirm it from My Orders to open delivery."
                : requirement.status === "confirmed"
                  ? "Confirmed. Delivery is now following the usual flow."
                  : "Completed. This need has already been delivered.",
              requirement.status === "matched"
                ? "ವಿತರಣೆಯನ್ನು ತೆರೆಯಲು ನನ್ನ ಆದೇಶಗಳಿಂದ ಇದನ್ನು ದೃಢೀಕರಿಸಿ."
                : requirement.status === "confirmed"
                  ? "ದೃಢೀಕರಿಸಲಾಗಿದೆ. ವಿತರಣೆ ಈಗ ಸಾಮಾನ್ಯ ಹರಿವನ್ನು ಅನುಸರಿಸುತ್ತಿದೆ."
                  : "ಪೂರ್ಣಗೊಂಡಿದೆ. ಈ ಬೇಡಿಕೆ ಈಗಾಗಲೇ ವಿತರಿಸಲಾಗಿದೆ."
            )}
          </div>
        </div>
      )}

      {role === "farmer" && requirement.status !== "open" && (
        <div
          style={{
            marginTop: 12,
            background: requirement.status === "matched" ? "#fff8eb" : requirement.status === "confirmed" ? "#f0fdf4" : "#f5f3ff",
            border: requirement.status === "matched" ? "1px solid #f5d090" : requirement.status === "confirmed" ? "1px solid #86efac" : "1px solid #d8b4fe",
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 12,
            color: "var(--text2)",
            lineHeight: 1.6,
          }}
        >
          🤝 {pick(
            lang,
            requirement.status === "matched"
              ? `Your offer ${fmtP(requirement.farmerOfferPrice || 0)}/kg for ${requirement.matchedQuantity || 0}kg is waiting for wholesaler confirmation.`
              : requirement.status === "confirmed"
                ? `Wholesaler confirmed your ${tCrop(requirement.cropName, lang)} offer. Delivery will now continue as usual.`
                : `${tCrop(requirement.cropName, lang)} need completed. Delivery is finished for this request.`,
            requirement.status === "matched"
              ? `ನಿಮ್ಮ ${fmtP(requirement.farmerOfferPrice || 0)}/ಕೆಜಿ ದರದ ${requirement.matchedQuantity || 0}ಕೆಜಿ ಆಫರ್ ಸಗಟು ಖರೀದಿದಾರರ ದೃಢೀಕರಣಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ.`
              : requirement.status === "confirmed"
                ? `${tCrop(requirement.cropName, lang)}ಗಾಗಿ ನಿಮ್ಮ ಆಫರ್ ಅನ್ನು ಸಗಟು ಖರೀದಿದಾರರು ದೃಢೀಕರಿಸಿದ್ದಾರೆ. ವಿತರಣೆ ಈಗ ಸಾಮಾನ್ಯವಾಗಿ ಮುಂದುವರಿಯುತ್ತದೆ.`
                : `${tCrop(requirement.cropName, lang)} ಬೇಡಿಕೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಈ ವಿನಂತಿಗೆ ವಿತರಣೆ ಮುಗಿದಿದೆ.`
          )}
        </div>
      )}

      {role === "retailer" && requirement.status === "open" && onDelete && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button
            onClick={() => onDelete(requirement.id)}
            style={{ background: "#fff1f2", color: "#be123c", border: "1px solid #fda4af", borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
          >
            ✕ {pick(lang, "Remove Need", "ಬೇಡಿಕೆ ಅಳಿಸಿ")}
          </button>
        </div>
      )}

      {canFarmerReply && (
        <div style={{ marginTop: 14, borderTop: "1px solid var(--bg2)", paddingTop: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#15803d", marginBottom: 10 }}>
            {pick(lang, "Have this crop? Send your farmer offer here.", "ಈ ಬೆಳೆ ಇದೆಯೆ? ನಿಮ್ಮ ರೈತರ ಆಫರ್ ಅನ್ನು ಇಲ್ಲಿ ಕಳುಹಿಸಿ.")}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55, display: "block", marginBottom: 5 }}>
                {pick(lang, "Your Qty (kg)", "ನಿಮ್ಮ ಪ್ರಮಾಣ (ಕೆಜಿ)")}
              </label>
              <input
                type="number"
                value={reply.quantity}
                onChange={(event) => setReply(current => ({ ...current, quantity: event.target.value }))}
                style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55, display: "block", marginBottom: 5 }}>
                {pick(lang, "Your Price (₹/kg)", "ನಿಮ್ಮ ಬೆಲೆ (₹/ಕೆಜಿ)")}
              </label>
              <input
                type="number"
                step="0.5"
                value={reply.amount}
                onChange={(event) => setReply(current => ({ ...current, amount: event.target.value }))}
                style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fff" }}
              />
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#15803d", textTransform: "uppercase", letterSpacing: .55 }}>
                {pick(lang, "Your Offer Value", "ನಿಮ್ಮ ಆಫರ್ ಮೌಲ್ಯ")}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#15803d", marginTop: 4 }}>{replyTotal ? fmtP(replyTotal) : "₹0"}</div>
            </div>
          </div>

          <SmartPriceCalculator
            harvestType={harvestType}
            quantity={reply.quantity}
            category={requirement.category || cropMeta.cat || ""}
            marketRate={marketRate}
            apmcPrice={Number(marketRate?.price || requirement.bidAmount || 0)}
            onResult={applyPricing}
            lang={lang}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              onClick={() => onAccept(requirement, {
                quantity: Number(reply.quantity),
                amount: Number(reply.amount),
                pricing: reply.pricing,
              })}
              style={{ background: "linear-gradient(135deg,var(--green),var(--green-l))", color: "#fff", border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
            >
              🤝 {pick(lang, "Accept Need & Send Offer", "ಬೇಡಿಕೆಯನ್ನು ಅಂಗೀಕರಿಸಿ ಮತ್ತು ಆಫರ್ ಕಳುಹಿಸಿ")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
