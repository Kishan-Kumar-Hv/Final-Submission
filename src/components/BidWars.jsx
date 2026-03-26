import { useState, useRef, useEffect } from "react";
import { uid, fmtP, timeAgo } from "../utils/helpers.js";
import { LiveDot } from "./UI.jsx";
import { BidInsight } from "./SmartPriceCalculator.jsx";
import { pick } from "../i18n.js";

const HARVEST_TYPE_META = {
  regrows: {
    icon: "🌿",
    label: "Regrows after harvest",
    knLabel: "ಕೊಯ್ಲಿನ ಬಳಿಕ ಮತ್ತೆ ಬರುತ್ತದೆ",
    tone: "var(--green)",
  },
  single_harvest: {
    icon: "🌾",
    label: "Single harvest - replant needed",
    knLabel: "ಒಮ್ಮೆ ಕೊಯ್ಲು - ಮರು ನೆಡುವುದು ಬೇಕು",
    tone: "#92400e",
  },
};

export default function BidWars({ crop, user, onBid, onAccept, lang = "en" }) {
  const initialShopName = user?.shopName || user?.name || "";
  const [shopName, setShopName] = useState(initialShopName);
  const [amt, setAmt]     = useState(crop.minBid + 1);
  const [qty, setQty]     = useState(crop.quantity);
  const [flash, setFlash] = useState(new Set());
  const prevLen = useRef(crop.bids?.length || 0);

  const sorted     = [...(crop.bids || [])].sort((a, b) => b.amount - a.amount);
  const isFarmer   = user?.id === crop.farmerId;
  const isRetailer = user?.role === "retailer";
  const myBid      = sorted.find(b => b.bidderId === user?.id);
  const visibleBids = isRetailer ? sorted.filter(b => b.bidderId === user?.id) : sorted;
  const topAmt     = sorted[0]?.amount || 0;
  const progress   = topAmt > crop.minBid ? Math.min(100, ((topAmt - crop.minBid) / (crop.minBid * 0.6)) * 100) : 0;
  const hasCost    = crop.costPerKg > 0;
  const hasAutoPricing = crop.pricingMode === "auto_single_harvest";
  const harvestType = HARVEST_TYPE_META[crop.harvestType] || null;

  useEffect(() => {
    if ((crop.bids?.length || 0) > prevLen.current) {
      const nb = new Set(crop.bids.slice(prevLen.current).map(b => b.id));
      setFlash(nb);
      setTimeout(() => setFlash(new Set()), 900);
    }
    prevLen.current = crop.bids?.length || 0;
  }, [crop.bids?.length]);

  useEffect(() => {
    if (!myBid) {
      setShopName(user?.shopName || user?.name || "");
      return;
    }
    setShopName(myBid.shopName || myBid.bidderName || user?.shopName || user?.name || "");
    setAmt(myBid.amount);
    setQty(myBid.quantity);
  }, [myBid?.id, myBid?.amount, myBid?.quantity, myBid?.shopName, myBid?.bidderName, user?.shopName, user?.name]);

  const inp = {
    padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 10,
    fontSize: 14, fontFamily: "inherit", color: "var(--text)", background: "#fff", outline: "none", width: "100%",
  };

  // Profit color for a given bid amount
  function profitColor(amount) {
    if (!hasCost) return null;
    const pct = ((amount - crop.costPerKg) / crop.costPerKg) * 100;
    if (pct >= 25) return { bg: "#f0fdf4", dot: "🟢" };
    if (pct >= 10) return { bg: "#fffbeb", dot: "🟡" };
    if (pct >= 0)  return { bg: "#fff7ed", dot: "🟠" };
    return { bg: "#fef2f2", dot: "🔴" };
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", marginBottom: 16, boxShadow: "var(--shadow-sm)" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,var(--green-pale),#fff)", padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>{crop.emoji} {crop.cropName} — {crop.quantity}kg · {crop.village}, {crop.district}</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span>{pick(lang, "Min bid", "ಕನಿಷ್ಠ ಬಿಡ್")}: {fmtP(crop.minBid)}/{pick(lang, "kg", "ಕೆಜಿ")}</span>
            <span>·</span>
            <span>{isRetailer ? (myBid ? pick(lang, "Your wholesale bid is live", "ನಿಮ್ಮ ಸಗಟು ಬಿಡ್ ಸಕ್ರಿಯವಾಗಿದೆ") : pick(lang, "Place your wholesale bid", "ನಿಮ್ಮ ಸಗಟು ಬಿಡ್ ಮಾಡಿ")) : `${sorted.length} ${pick(lang, "bids received", "ಬಿಡ್‌ಗಳು ಬಂದಿವೆ")}`}</span>
            {harvestType && <>
              <span>·</span>
              <span style={{ color: harvestType.tone, fontWeight: 700 }}>{harvestType.icon} {pick(lang, harvestType.label, harvestType.knLabel)}</span>
            </>}
            {hasCost && <>
              <span>·</span>
              <span style={{ color: "#dc2626", fontWeight: 700 }}>📉 {pick(lang, "Cost", "ವೆಚ್ಚ")}: {fmtP(crop.costPerKg)}/{pick(lang, "kg", "ಕೆಜಿ")}</span>
            </>}
            {crop.expectedPrice > 0 && <>
              <span>·</span>
              <span style={{ color: "#16a34a", fontWeight: 700 }}>🎯 {pick(lang, "Farmer expects", "ರೈತರ ನಿರೀಕ್ಷೆ")}: {fmtP(crop.expectedPrice)}/{pick(lang, "kg", "ಕೆಜಿ")}</span>
            </>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--green)", background: "var(--green-pale)", padding: "4px 10px", borderRadius: 20 }}>
            <LiveDot />{pick(lang, "Live Auction", "ಲೈವ್ ಹರಾಜು")}
          </div>
          {hasAutoPricing && (
            <div style={{ fontSize: 10, color: "#15803d", background: "#dcfce7", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
              🧠 {pick(lang, "Auto effort model", "ಸ್ವಯಂ ಶ್ರಮ ಮಾದರಿ")}
            </div>
          )}
        </div>
      </div>

      {/* Wholesaler: cost transparency banner */}
      {isRetailer && hasCost && (
        <div style={{ padding: "10px 18px", background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#15803d", display: "flex", alignItems: "center", gap: 5 }}>
            🧠 {pick(lang, "Wholesaler transparency view", "ಸಗಟು ಪಾರದರ್ಶಕತೆ ನೋಟ")}
          </div>
          <div style={{ display: "flex", gap: 16, flex: 1, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>{pick(lang, "Production Cost", "ಉತ್ಪಾದನಾ ವೆಚ್ಚ")}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#dc2626" }}>₹{Number(crop.costPerKg).toFixed(1)}/{pick(lang, "kg", "ಕೆಜಿ")}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>{pick(lang, "Safe Floor", "ಸುರಕ್ಷಿತ ನೆಲೆಬೆಲೆ")}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#d97706" }}>₹{crop.minBid}/{pick(lang, "kg", "ಕೆಜಿ")}</div>
            </div>
            {crop.basePrice > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>{pick(lang, "APMC Rate", "ಎಪಿಎಂಸಿ ದರ")}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#4b7a4e" }}>₹{Number(crop.basePrice).toFixed(1)}/{pick(lang, "kg", "ಕೆಜಿ")}</div>
              </div>
            )}
            {crop.demandInsights?.level && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>{pick(lang, "Demand", "ಬೇಡಿಕೆ")}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: crop.demandInsights.tone || "#15803d" }}>{crop.demandInsights.level}</div>
              </div>
            )}
            {crop.expectedPrice > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>{pick(lang, "Farmer Expects", "ರೈತರ ನಿರೀಕ್ಷೆ")}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>₹{crop.expectedPrice}/{pick(lang, "kg", "ಕೆಜಿ")}</div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#4b7a4e", background: "#fff", padding: "5px 10px", borderRadius: 8, border: "1px solid #bbf7d0" }}>
            💡 {crop.demandInsights?.approxModel || pick(lang, `Bid above ₹${(Number(crop.costPerKg) * 1.2).toFixed(1)}/kg to protect farmer margin`, `ರೈತರ ಲಾಭವನ್ನು ಕಾಪಾಡಲು ₹${(Number(crop.costPerKg) * 1.2).toFixed(1)}/ಕೆಜಿ ಮೇಲಾಗಿಯೇ ಬಿಡ್ ಮಾಡಿ`)}
          </div>
        </div>
      )}

      {isRetailer && !hasCost && crop.harvestType === "regrows" && (
        <div style={{ padding: "10px 18px", background: "#f8fffb", borderBottom: "1px solid #dcfce7", fontSize: 12, color: "#4b7a4e", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>🌿</span>
          <span>{pick(lang, "This is a regrowing crop. Farmer sets the floor price manually from the live market, so no replanting cost model is added here.", "ಇದು ಮರುಬೆಳೆಯುವ ಬೆಳೆ. ರೈತರು ಲೈವ್ ಮಾರುಕಟ್ಟೆಯಿಂದಲೇ ನೆಲೆಬೆಲೆಯನ್ನು ಕೈಯಾರೆ ನಿಗದಿಪಡಿಸುತ್ತಾರೆ, ಆದ್ದರಿಂದ ಇಲ್ಲಿ ಮರು ನೆಡುವ ವೆಚ್ಚ ಮಾದರಿಯನ್ನು ಸೇರಿಸಲಾಗುವುದಿಲ್ಲ.")}</span>
        </div>
      )}

      {/* Progress bar */}
      <div style={{ height: 4, background: "var(--bg2)" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg,var(--green),var(--gold))", width: `${progress}%`, transition: "width .5s", borderRadius: 2 }} />
      </div>

      {/* Empty state */}
      {visibleBids.length === 0 && (
        <div style={{ padding: "20px", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🏷️</div>
          {isRetailer
            ? pick(lang, `No wholesale bid from you yet. Minimum: ${fmtP(crop.minBid)}/kg`, `ನಿಮ್ಮಿಂದ ಇನ್ನೂ ಸಗಟು ಬಿಡ್ ಇಲ್ಲ. ಕನಿಷ್ಠ: ${fmtP(crop.minBid)}/ಕೆಜಿ`)
            : pick(lang, `No bids yet — be the first! Minimum: ${fmtP(crop.minBid)}/kg`, `ಇನ್ನೂ ಬಿಡ್ ಇಲ್ಲ — ಮೊದಲಿಗರಾಗಿರಿ! ಕನಿಷ್ಠ: ${fmtP(crop.minBid)}/ಕೆಜಿ`)}
          {hasCost && <div style={{ fontSize: 11, color: "#4b7a4e", marginTop: 6 }}>{isRetailer ? pick(lang, `Farmer's effort cost is ₹${Number(crop.costPerKg).toFixed(1)}/kg — place your wholesale offer above that.`, `ರೈತರ ಶ್ರಮ ವೆಚ್ಚ ₹${Number(crop.costPerKg).toFixed(1)}/ಕೆಜಿ — ಅದಕ್ಕಿಂತ ಮೇಲೆ ನಿಮ್ಮ ಸಗಟು ಆಫರ್ ಮಾಡಿ.`) : pick(lang, `Farmer's cost is ₹${Number(crop.costPerKg).toFixed(1)}/kg — bid fairly above that`, `ರೈತರ ವೆಚ್ಚ ₹${Number(crop.costPerKg).toFixed(1)}/ಕೆಜಿ — ಅದಕ್ಕಿಂತ ಮೇಲೆ ನ್ಯಾಯವಾಗಿ ಬಿಡ್ ಮಾಡಿ`)}</div>}
        </div>
      )}

      {/* Bid list */}
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {visibleBids.map((b, i) => {
          const pc = profitColor(b.amount);
          const rank = sorted.findIndex(item => item.id === b.id);
          const bidderLabel = b.shopName || b.bidderName;
          return (
            <div key={b.id}
              style={{ display: "flex", alignItems: "flex-start", padding: "11px 18px", borderBottom: "1px solid var(--bg2)", transition: "background .3s", background: flash.has(b.id) ? "#fffde7" : pc ? pc.bg : i === 0 ? "var(--green-xp)" : b.bidderId === user?.id ? "#f0f7ff" : "#fff" }}>

              {/* Rank */}
              <div style={{ fontSize: 18, width: 28, flexShrink: 0, paddingTop: 2 }}>
                {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `#${rank + 1}`}
              </div>

              {/* Buyer info */}
              <div style={{ flex: 1, padding: "0 10px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  {bidderLabel}
                  {b.bidderId === user?.id && <span style={{ fontSize: 10, fontWeight: 700, background: "var(--blue-pale)", color: "var(--blue)", padding: "1px 7px", borderRadius: 10 }}>{pick(lang, "You", "ನೀವು")}</span>}
                  {rank === 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "var(--green-pale)", color: "var(--green)", padding: "1px 7px", borderRadius: 10 }}>{pick(lang, "Leading", "ಮುನ್ನಡೆ")}</span>}
                  {hasCost && pc && <span style={{ fontSize: 14 }}>{pc.dot}</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                  🏪 {bidderLabel} · 📍 {b.district} · 📞 {b.bidderPhone} · {timeAgo(b.time, lang)} {pick(lang, "ago", "ಹಿಂದೆ")}
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                  📦 {pick(lang, "Requested quantity", "ಕೋರಿದ ಪ್ರಮಾಣ")}: {b.quantity}{pick(lang, "kg", "ಕೆಜಿ")}
                </div>
                {/* Profit insight for farmer view */}
                {isFarmer && hasCost && (
                  <div style={{ marginTop: 6 }}>
                    <BidInsight bidAmount={b.amount} crop={crop} role="farmer" lang={lang} />
                  </div>
                )}
              </div>

              {/* Amount */}
              <div style={{ textAlign: "right", flexShrink: 0, paddingTop: 2 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--gold)" }}>{fmtP(b.amount)}/{pick(lang, "kg", "ಕೆಜಿ")}</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{b.quantity}{pick(lang, "kg", "ಕೆಜಿ")}</div>
                <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 700 }}>= {fmtP(b.amount * b.quantity)}</div>
              </div>

              {/* Accept button for farmer */}
              {isFarmer && crop.status !== "booked" && (
                <div style={{ marginLeft: 12, flexShrink: 0, paddingTop: 2 }}>
                  <button onClick={() => onAccept(crop, b)}
                    style={{ background: "linear-gradient(135deg,var(--gold),var(--gold2))", border: "none", color: "#1a0800", padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 800 }}>
                    ✅ {pick(lang, "Select Bid", "ಬಿಡ್ ಆಯ್ಕೆ ಮಾಡಿ")}
                  </button>
                  {hasCost && (
                    <div style={{ fontSize: 9, color: "var(--text3)", textAlign: "center", marginTop: 3 }}>
                      {((b.amount - crop.costPerKg) / crop.costPerKg * 100).toFixed(0)}% {pick(lang, "profit", "ಲಾಭ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Wholesaler bid input */}
      {isRetailer && crop.status !== "booked" && (
        <div>
          {/* Smart suggestion for wholesaler */}
          {hasCost && (
            <div style={{ padding: "8px 18px", background: "#fffbeb", borderTop: "1px solid #fde68a", fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span>💡</span>
              <span>{pick(lang, "Farmer's cost", "ರೈತರ ವೆಚ್ಚ")}: <strong>₹{Number(crop.costPerKg).toFixed(1)}/{pick(lang, "kg", "ಕೆಜಿ")}</strong></span>
              <span>·</span>
              <span>{pick(lang, "Fair bid (20% profit)", "ನ್ಯಾಯ ಬಿಡ್ (20% ಲಾಭ)")}: <strong style={{ color: "#16a34a" }}>₹{(Number(crop.costPerKg) * 1.2).toFixed(1)}/{pick(lang, "kg", "ಕೆಜಿ")}</strong></span>
              {crop.expectedPrice > 0 && <>
                <span>·</span>
                <span>{pick(lang, "Farmer expects", "ರೈತರ ನಿರೀಕ್ಷೆ")}: <strong style={{ color: "#16a34a" }}>₹{crop.expectedPrice}/{pick(lang, "kg", "ಕೆಜಿ")}</strong></span>
              </>}
            </div>
          )}
          <div style={{ display: "grid", gap: 10, padding: "12px 18px", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4, textTransform: "uppercase" }}>{pick(lang, "Shop Name", "ಅಂಗಡಿ ಹೆಸರು")}</label>
              <input value={shopName} onChange={e => setShopName(e.target.value)}
                placeholder={pick(lang, "e.g. FreshKart Traders", "ಉದಾ. ಫ್ರೆಶ್‌ಕಾರ್ಟ್ ಟ್ರೇಡರ್ಸ್")} style={inp}
                onFocus={e => e.target.style.borderColor = "var(--green)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4, textTransform: "uppercase" }}>{pick(lang, "Your Bid (₹/kg)", "ನಿಮ್ಮ ಬಿಡ್ (₹/ಕೆಜಿ)")}</label>
              <input type="number" step="0.5" value={amt} onChange={e => setAmt(e.target.value)}
                placeholder={`Min ₹${crop.minBid}`} style={inp}
                onFocus={e => e.target.style.borderColor = "var(--green)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <div style={{ width: 100 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4, textTransform: "uppercase" }}>{pick(lang, "Qty (kg)", "ಪ್ರಮಾಣ (ಕೆಜಿ)")}</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} style={inp}
                onFocus={e => e.target.style.borderColor = "var(--green)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <button onClick={() => {
              if (!shopName.trim() || Number(amt) < crop.minBid || Number(qty) <= 0 || Number(qty) > Number(crop.quantity || 0)) return;
              onBid(crop.id, {
                id: myBid?.id || uid(),
                bidderId: user.id,
                bidderName: shopName.trim(),
                shopName: shopName.trim(),
                bidderPhone: user.phone,
                bidderVillage: user.village,
                bidderDistrict: user.district,
                bidderPin: user.pin,
                district: user.district,
                amount: Number(amt),
                quantity: Number(qty),
                time: Date.now()
              });
              setAmt(n => Number(n) + 1);
            }}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "var(--gold)", color: "#1a0800", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
              💰 {myBid ? pick(lang, "Update Bid", "ಬಿಡ್ ನವೀಕರಿಸಿ") : pick(lang, "Place Bid", "ಬಿಡ್ ಮಾಡಿ")}
            </button>
          </div>
          </div>

          {/* Live insight for wholesaler's current bid amount */}
          {hasCost && Number(amt) > 0 && (
            <div style={{ padding: "0 18px 12px" }}>
              <BidInsight bidAmount={Number(amt)} crop={crop} role="retailer" lang={lang} />
            </div>
          )}
        </div>
      )}

      {/* My bid status for wholesaler */}
      {isRetailer && myBid && (
        <div style={{ padding: "10px 18px", background: "var(--green-xp)", borderTop: "1px solid var(--green-mid)", fontSize: 13, color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{pick(lang, "Your bid as", "ನಿಮ್ಮ ಬಿಡ್ ಹೆಸರು")} <strong style={{ color: "var(--green)" }}>{myBid.shopName || myBid.bidderName}</strong>: <strong style={{ color: "var(--green)" }}>{fmtP(myBid.amount)}/{pick(lang, "kg", "ಕೆಜಿ")}</strong> {pick(lang, "for", "ಗೆ")} {myBid.quantity}{pick(lang, "kg", "ಕೆಜಿ")}</span>
          {sorted[0]?.bidderId === user?.id
            ? <span style={{ color: "var(--green)", fontWeight: 700 }}>🎉 {pick(lang, "You are leading!", "ನೀವು ಮುನ್ನಡೆದಲ್ಲಿದ್ದೀರಿ!")}</span>
            : <span style={{ color: "var(--gold)", fontWeight: 700 }}>⬆️ {pick(lang, "Outbid — raise your offer", "ಮೀರಿ ಹೋಗಿದ್ದಾರೆ — ನಿಮ್ಮ ಆಫರ್ ಹೆಚ್ಚಿಸಿ")}</span>}
        </div>
      )}
    </div>
  );
}
