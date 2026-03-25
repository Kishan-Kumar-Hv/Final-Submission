import { useState, useRef, useEffect } from "react";
import { uid, fmtP, timeAgo } from "../utils/helpers.js";
import { LiveDot } from "./UI.jsx";
import { BidInsight } from "./SmartPriceCalculator.jsx";

const HARVEST_TYPE_META = {
  regrows: {
    icon: "🌿",
    label: "Regrows after harvest",
    tone: "var(--green)",
  },
  single_harvest: {
    icon: "🌾",
    label: "Single harvest - replant needed",
    tone: "#92400e",
  },
};

export default function BidWars({ crop, user, onBid, onAccept }) {
  const [amt, setAmt]     = useState(crop.minBid + 1);
  const [qty, setQty]     = useState(Math.min(100, crop.quantity));
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
            <span>Min bid: {fmtP(crop.minBid)}/kg</span>
            <span>·</span>
            <span>{isRetailer ? (myBid ? "Your bid submitted" : "Place your bid") : `${sorted.length} bids received`}</span>
            {harvestType && <>
              <span>·</span>
              <span style={{ color: harvestType.tone, fontWeight: 700 }}>{harvestType.icon} {harvestType.label}</span>
            </>}
            {hasCost && <>
              <span>·</span>
              <span style={{ color: "#dc2626", fontWeight: 700 }}>📉 Cost: {fmtP(crop.costPerKg)}/kg</span>
            </>}
            {crop.expectedPrice > 0 && <>
              <span>·</span>
              <span style={{ color: "#16a34a", fontWeight: 700 }}>🎯 Farmer expects: {fmtP(crop.expectedPrice)}/kg</span>
            </>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--green)", background: "var(--green-pale)", padding: "4px 10px", borderRadius: 20 }}>
            <LiveDot />Live Auction
          </div>
          {hasAutoPricing && (
            <div style={{ fontSize: 10, color: "#15803d", background: "#dcfce7", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
              🧠 Auto effort model
            </div>
          )}
        </div>
      </div>

      {/* Retailer: cost transparency banner */}
      {isRetailer && hasCost && (
        <div style={{ padding: "10px 18px", background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#15803d", display: "flex", alignItems: "center", gap: 5 }}>
            🧠 Retailer transparency view
          </div>
          <div style={{ display: "flex", gap: 16, flex: 1, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>Production Cost</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#dc2626" }}>₹{Number(crop.costPerKg).toFixed(1)}/kg</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>Safe Floor</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#d97706" }}>₹{crop.minBid}/kg</div>
            </div>
            {crop.basePrice > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>APMC Rate</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#4b7a4e" }}>₹{Number(crop.basePrice).toFixed(1)}/kg</div>
              </div>
            )}
            {crop.demandInsights?.level && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>Demand</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: crop.demandInsights.tone || "#15803d" }}>{crop.demandInsights.level}</div>
              </div>
            )}
            {crop.expectedPrice > 0 && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#6b7280", textTransform: "uppercase" }}>Farmer Expects</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#16a34a" }}>₹{crop.expectedPrice}/kg</div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#4b7a4e", background: "#fff", padding: "5px 10px", borderRadius: 8, border: "1px solid #bbf7d0" }}>
            💡 {crop.demandInsights?.approxModel || `Bid above ₹${(Number(crop.costPerKg) * 1.2).toFixed(1)}/kg to protect farmer margin`}
          </div>
        </div>
      )}

      {isRetailer && !hasCost && crop.harvestType === "regrows" && (
        <div style={{ padding: "10px 18px", background: "#f8fffb", borderBottom: "1px solid #dcfce7", fontSize: 12, color: "#4b7a4e", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>🌿</span>
          <span>This is a regrowing crop. Farmer sets the floor price manually from the live market, so no replanting cost model is added here.</span>
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
            ? `No bid from you yet. Minimum: ${fmtP(crop.minBid)}/kg`
            : `No bids yet — be the first! Minimum: ${fmtP(crop.minBid)}/kg`}
          {hasCost && <div style={{ fontSize: 11, color: "#4b7a4e", marginTop: 6 }}>{isRetailer ? `Farmer's effort cost is ₹${Number(crop.costPerKg).toFixed(1)}/kg — place your offer above that.` : `Farmer's cost is ₹${Number(crop.costPerKg).toFixed(1)}/kg — bid fairly above that`}</div>}
        </div>
      )}

      {/* Bid list */}
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {visibleBids.map((b, i) => {
          const pc = profitColor(b.amount);
          const rank = sorted.findIndex(item => item.id === b.id);
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
                  {b.bidderName}
                  {b.bidderId === user?.id && <span style={{ fontSize: 10, fontWeight: 700, background: "var(--blue-pale)", color: "var(--blue)", padding: "1px 7px", borderRadius: 10 }}>You</span>}
                  {rank === 0 && <span style={{ fontSize: 10, fontWeight: 700, background: "var(--green-pale)", color: "var(--green)", padding: "1px 7px", borderRadius: 10 }}>Leading</span>}
                  {hasCost && pc && <span style={{ fontSize: 14 }}>{pc.dot}</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                  📍 {b.district} · 📞 {b.bidderPhone} · {timeAgo(b.time)} ago
                </div>
                {/* Profit insight for farmer view */}
                {isFarmer && hasCost && (
                  <div style={{ marginTop: 6 }}>
                    <BidInsight bidAmount={b.amount} crop={crop} role="farmer" />
                  </div>
                )}
              </div>

              {/* Amount */}
              <div style={{ textAlign: "right", flexShrink: 0, paddingTop: 2 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--gold)" }}>{fmtP(b.amount)}/kg</div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>{b.quantity}kg</div>
                <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 700 }}>= {fmtP(b.amount * b.quantity)}</div>
              </div>

              {/* Accept button for farmer */}
              {isFarmer && rank === 0 && crop.status !== "booked" && (
                <div style={{ marginLeft: 12, flexShrink: 0, paddingTop: 2 }}>
                  <button onClick={() => onAccept(crop, b)}
                    style={{ background: "linear-gradient(135deg,var(--gold),var(--gold2))", border: "none", color: "#1a0800", padding: "7px 14px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 800 }}>
                    ✅ Accept
                  </button>
                  {hasCost && (
                    <div style={{ fontSize: 9, color: "var(--text3)", textAlign: "center", marginTop: 3 }}>
                      {((b.amount - crop.costPerKg) / crop.costPerKg * 100).toFixed(0)}% profit
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Retailer bid input */}
      {isRetailer && crop.status !== "booked" && (
        <div>
          {/* Smart suggestion for retailer */}
          {hasCost && (
            <div style={{ padding: "8px 18px", background: "#fffbeb", borderTop: "1px solid #fde68a", fontSize: 12, color: "#92400e", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span>💡</span>
              <span>Farmer's cost: <strong>₹{Number(crop.costPerKg).toFixed(1)}/kg</strong></span>
              <span>·</span>
              <span>Fair bid (20% profit): <strong style={{ color: "#16a34a" }}>₹{(Number(crop.costPerKg) * 1.2).toFixed(1)}/kg</strong></span>
              {crop.expectedPrice > 0 && <>
                <span>·</span>
                <span>Farmer expects: <strong style={{ color: "#16a34a" }}>₹{crop.expectedPrice}/kg</strong></span>
              </>}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, padding: "12px 18px", background: "var(--bg)", borderTop: "1px solid var(--border)", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Your Bid (₹/kg)</label>
              <input type="number" step="0.5" value={amt} onChange={e => setAmt(e.target.value)}
                placeholder={`Min ₹${crop.minBid}`} style={inp}
                onFocus={e => e.target.style.borderColor = "var(--green)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <div style={{ width: 100 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4, textTransform: "uppercase" }}>Qty (kg)</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)} style={inp}
                onFocus={e => e.target.style.borderColor = "var(--green)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"} />
            </div>
            <button onClick={() => {
              if (Number(amt) < crop.minBid) return;
              onBid(crop.id, {
                id: uid(),
                bidderId: user.id,
                bidderName: user.name,
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
              💰 Place Bid
            </button>
          </div>

          {/* Live insight for retailer's current bid amount */}
          {hasCost && Number(amt) > 0 && (
            <div style={{ padding: "0 18px 12px" }}>
              <BidInsight bidAmount={Number(amt)} crop={crop} role="retailer" />
            </div>
          )}
        </div>
      )}

      {/* My bid status for retailer */}
      {isRetailer && myBid && (
        <div style={{ padding: "10px 18px", background: "var(--green-xp)", borderTop: "1px solid var(--green-mid)", fontSize: 13, color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Your bid: <strong style={{ color: "var(--green)" }}>{fmtP(myBid.amount)}/kg</strong></span>
          {sorted[0]?.bidderId === user?.id
            ? <span style={{ color: "var(--green)", fontWeight: 700 }}>🎉 You are leading!</span>
            : <span style={{ color: "var(--gold)", fontWeight: 700 }}>⬆️ Outbid — raise your offer</span>}
        </div>
      )}
    </div>
  );
}
