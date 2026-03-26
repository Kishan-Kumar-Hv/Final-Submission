import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import CropCard from "./CropCard.jsx";
import JobCard from "./JobCard.jsx";
import MarketRates from "./MarketRates.jsx";
import RequirementCard from "./RequirementCard.jsx";
import { StatCard, Empty } from "./UI.jsx";
import { CROPS_DATA, inferCropMeta } from "../data/constants.js";
import { uid, fmtP } from "../utils/helpers.js";
import { pick, tCategory, tCrop, tDistrict, tLocation, tVillage } from "../i18n.js";

export default function RetailerDashboard({
  user,
  crops,
  jobs,
  requirements,
  rates,
  onBid,
  onConfirmOrder,
  onPostRequirement,
  onDeleteRequirement,
  toast,
  addActivity,
  lang,
}) {
  const [view, setView]     = useState("browse");
  const [search, setSearch] = useState("");
  const [cat, setCat]       = useState("All");
  const [drafts, setDrafts] = useState({});
  const [needDraft, setNeedDraft] = useState({
    cropName: "",
    shopName: user.shopName || user.name || "",
    quantity: "",
    bidAmount: "",
    notes: "",
  });

  const myJobs   = jobs.filter(j => j.retailerId === user.id);
  const needOrderRank = { open: 0, matched: 1, confirmed: 2, fulfilled: 3 };
  const myRequirements = [...requirements.filter(item => item.retailerId === user.id)]
    .sort((a, b) => {
      const rankDiff = (needOrderRank[a.status] ?? 9) - (needOrderRank[b.status] ?? 9);
      if (rankDiff !== 0) return rankDiff;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
  const pendingConfirm = myJobs.filter(j => j.status === "awaiting-retailer").length;
  const liveBidCount = crops.filter(c => (c.bids || []).some(b => b.bidderId === user.id) && c.status !== "booked" && c.status !== "delivered").length;
  const openNeedCount = myRequirements.filter(item => item.status === "open").length;
  const matchedNeedCount = myRequirements.filter(item => item.status === "matched").length;
  const fulfilledNeedCount = myRequirements.filter(item => item.status === "fulfilled").length;
  const openNeedValue = myRequirements
    .filter(item => item.status === "open")
    .reduce((sum, item) => sum + Number(item.bidAmount || 0) * Number(item.quantity || 0), 0);
  const cats     = ["All", ...new Set(CROPS_DATA.map(c => c.cat))];

  const filtered = crops.filter(c => {
    const active = c.status === "open" || c.status === "bidding";
    const q = search.toLowerCase();
    const searchText = [c.cropName, c.district, c.village, tCrop(c.cropName, "kn"), tDistrict(c.district, "kn"), tVillage(c.village, "kn")].join(" ").toLowerCase();
    const mSearch = !search || searchText.includes(q);
    const mCat = cat === "All" || c.category === cat;
    return active && mSearch && mCat;
  });
  const filteredOrderValue = filtered.reduce((sum, crop) => sum + Number(crop.expectedPrice || crop.minBid || 0) * Number(crop.quantity || 0), 0);
  const confirmedOrders = myJobs.filter(j => j.status === "confirmed" || j.status === "on-the-way" || j.status === "picked-up" || j.status === "delivered").length;
  const deliveryOpen = myJobs.filter(j => !j.deliveryId && j.status === "confirmed").length;

  const nav = [
    { k: "browse",  i: "🔍", l: pick(lang, "Browse & Bid", "ಹುಡುಕಿ ಮತ್ತು ಬಿಡ್ ಮಾಡಿ")              },
    { k: "needs",   i: "🧾", l: pick(lang, "Crop Needs", "ಬೆಳೆ ಬೇಡಿಕೆಗಳು"), b: openNeedCount || null },
    { k: "orders",  i: "📋", l: pick(lang, "My Orders", "ನನ್ನ ಆದೇಶಗಳು"), b: pendingConfirm || null },
    { k: "rates",   i: "📊", l: pick(lang, "APMC Rates", "ಎಪಿಎಂಸಿ ದರಗಳು")                 },
  ];

  function getDraft(crop) {
    const myBid = (crop.bids || []).find(b => b.bidderId === user.id);
    const draft = drafts[crop.id] || {};
    return {
      shopName: draft.shopName ?? myBid?.shopName ?? user.shopName ?? user.name ?? "",
      amount: draft.amount ?? String(myBid?.amount ?? Number(crop.expectedPrice || crop.minBid || 0)),
      quantity: draft.quantity ?? String(myBid?.quantity ?? Number(crop.quantity || 0)),
    };
  }

  function updateDraft(cropId, patch) {
    setDrafts(current => ({
      ...current,
      [cropId]: {
        ...(current[cropId] || {}),
        ...patch,
      },
    }));
  }

  function updateNeedDraft(patch) {
    setNeedDraft(current => ({
      ...current,
      ...patch,
    }));
  }

  function handlePostRequirement() {
    const cropName = needDraft.cropName.trim();
    const shopName = (needDraft.shopName.trim() || user.shopName || user.name || "").trim();
    const quantity = Number(needDraft.quantity);
    const bidAmount = Number(needDraft.bidAmount);
    const notes = needDraft.notes.trim();

    if (!cropName) {
      toast({ msg: pick(lang, "Enter the crop you need.", "ನಿಮಗೆ ಬೇಕಾದ ಬೆಳೆಯನ್ನು ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (!shopName) {
      toast({ msg: pick(lang, "Enter your shop name before posting the need.", "ಬೇಡಿಕೆಯನ್ನು ಪೋಸ್ಟ್ ಮಾಡುವ ಮೊದಲು ನಿಮ್ಮ ಅಂಗಡಿ ಹೆಸರನ್ನು ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({ msg: pick(lang, "Enter a valid required quantity in kg.", "ಬೇಕಾದ ಪ್ರಮಾಣವನ್ನು ಮಾನ್ಯ ಕೆಜಿಯಲ್ಲಿ ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      toast({ msg: pick(lang, "Enter a valid bid amount per kg.", "ಪ್ರತಿ ಕೆಜಿಗೆ ಮಾನ್ಯ ಬಿಡ್ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }

    const meta = inferCropMeta(cropName) || {};
    const normalizedCropName = meta.c || cropName;

    onPostRequirement({
      id: uid(),
      retailerId: user.id,
      retailerName: shopName,
      retailerPhone: user.phone,
      retailerVillage: user.village,
      retailerDistrict: user.district,
      retailerPin: user.pin,
      cropName: normalizedCropName,
      emoji: meta.e || "🌾",
      category: meta.cat || "",
      quantity,
      bidAmount,
      notes,
      status: "open",
      createdAt: Date.now(),
    });

    setNeedDraft(current => ({
      ...current,
      cropName: "",
      quantity: "",
      bidAmount: "",
      notes: "",
      shopName,
    }));

    toast({
      msg: pick(lang, `✅ Need posted for ${normalizedCropName}. Farmers can now answer it from Live Bids.`, `✅ ${normalizedCropName}ಗಾಗಿ ಬೇಡಿಕೆ ಪೋಸ್ಟ್ ಮಾಡಲಾಗಿದೆ. ರೈತರು ಈಗ ಲೈವ್ ಬಿಡ್‌ಗಳಿಂದ ಉತ್ತರಿಸಬಹುದು.`),
      icon: "🧾",
      type: "gold",
    });
  }

  function handleDeleteRequirement(requirement) {
    const ok = window.confirm(
      pick(
        lang,
        `Remove the ${tCrop(requirement.cropName, lang)} need from your board?`,
        `${tCrop(requirement.cropName, lang)} ಬೇಡಿಕೆಯನ್ನು ನಿಮ್ಮ ಫಲಕದಿಂದ ಅಳಿಸಬೇಕೆ?`
      )
    );

    if (!ok) return;
    onDeleteRequirement(requirement.id);
    toast({
      msg: pick(lang, `Removed the ${tCrop(requirement.cropName, lang)} need.`, `${tCrop(requirement.cropName, lang)} ಬೇಡಿಕೆಯನ್ನು ಅಳಿಸಲಾಗಿದೆ.`),
      icon: "✕",
    });
  }

  function handlePlaceBid(crop) {
    const draft = getDraft(crop);
    const amount = Number(draft.amount);
    const quantity = Number(draft.quantity);
    const shopName = draft.shopName.trim();
    const existingBid = (crop.bids || []).find(b => b.bidderId === user.id);

    if (!shopName) {
      toast({ msg: pick(lang, "Enter your shop name before placing the bid.", "ಬಿಡ್ ಮಾಡುವ ಮೊದಲು ನಿಮ್ಮ ಅಂಗಡಿಯ ಹೆಸರನ್ನು ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (!Number.isFinite(amount) || amount < Number(crop.minBid || 0)) {
      toast({ msg: pick(lang, `Bid must be at least ${fmtP(Number(crop.minBid || 0))}/kg.`, `ಬಿಡ್ ಕನಿಷ್ಠ ${fmtP(Number(crop.minBid || 0))}/ಕೆಜಿ ಆಗಿರಬೇಕು.`), icon: "⚠️" });
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({ msg: pick(lang, "Enter a valid quantity in kg.", "ಮಾನ್ಯ ಕೆಜಿ ಪ್ರಮಾಣ ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (quantity > Number(crop.quantity || 0)) {
      toast({ msg: pick(lang, `Requested quantity cannot exceed ${crop.quantity}kg.`, `ಕೋರಿದ ಪ್ರಮಾಣ ${crop.quantity}ಕೆಜಿಗಿಂತ ಹೆಚ್ಚು ಇರಲು ಸಾಧ್ಯವಿಲ್ಲ.`), icon: "⚠️" });
      return;
    }

    onBid(crop.id, {
      id: existingBid?.id || uid(),
      bidderId: user.id,
      bidderName: shopName,
      shopName,
      bidderPhone: user.phone,
      bidderVillage: user.village,
      bidderDistrict: user.district,
      bidderPin: user.pin,
      district: user.district,
      amount,
      quantity,
      time: Date.now(),
    });

    toast({
      msg: pick(lang, `✅ Bid sent to farmer: ${fmtP(amount)}/kg for ${quantity}kg from ${shopName}.`, `✅ ರೈತನಿಗೆ ಬಿಡ್ ಕಳುಹಿಸಲಾಗಿದೆ: ${shopName} ರಿಂದ ${quantity}ಕೆಜಿಗೆ ${fmtP(amount)}/ಕೆಜಿ.`),
      icon: "💰",
      type: "gold",
    });
  }

  return (
    <div className="rr-dashboard-shell" style={{ display: "flex", minHeight: "calc(100vh - 100px)" }}>
      <Sidebar user={user} view={view} setView={setView} navItems={nav} lang={lang} />

      <main className="rr-dashboard-main" style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "calc(100vh - 100px)", background: "var(--bg)" }}>

        {/* ── BROWSE & ACCEPT ── */}
        {view === "browse" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginBottom: 18 }}>
              <div style={{ background: "linear-gradient(145deg,#fff8ec,#f7f5ef)", border: "1px solid #eadcc1", borderRadius: 22, padding: "20px 22px", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#fff", border: "1px solid #eadcc1", borderRadius: 999, padding: "5px 10px", fontSize: 10, fontWeight: 800, color: "#9a5523", textTransform: "uppercase", letterSpacing: .6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--gold)", animation: "pulse 1.4s infinite" }} />
                  Wholesale Desk
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", marginTop: 16, lineHeight: 1.08 }}>🔍 {pick(lang, "Browse & Bid on Crops", "ಬೆಳೆಗಳನ್ನು ನೋಡಿ ಮತ್ತು ಬಿಡ್ ಮಾಡಿ")}</h1>
                <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 10, lineHeight: 1.65 }}>{pick(lang, "Use this board to scan farm offers quickly, compare live values, and place quantity-based wholesale bids with your shop name.", "ಈ ಫಲಕವನ್ನು ಬಳಸಿ ಫಾರ್ಮ್ ಲಿಸ್ಟಿಂಗ್‌ಗಳನ್ನು ಬೇಗ ಪರಿಶೀಲಿಸಿ, ನೈಜ ಮೌಲ್ಯಗಳನ್ನು ಹೋಲಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಅಂಗಡಿ ಹೆಸರಿನೊಂದಿಗೆ ಪ್ರಮಾಣ ಆಧಾರಿತ ಸಗಟು ಬಿಡ್ ಮಾಡಿ.")}</p>
              </div>

              <div className="rr-grid-2-responsive" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12 }}>
                <div style={{ background: "#fff", border: "1px solid #eadcc1", borderRadius: 18, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Visible Listings", "ಗೋಚರ ಲಿಸ್ಟಿಂಗ್‌ಗಳು")}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#9a5523", marginTop: 8 }}>{filtered.length}</div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #d7e6ff", borderRadius: 18, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Visible Value", "ಗೋಚರ ಮೌಲ್ಯ")}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#305c92", marginTop: 8 }}>{filteredOrderValue ? fmtP(filteredOrderValue) : "₹0"}</div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #dce5b5", borderRadius: 18, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Live Bids Sent", "ಕಳುಹಿಸಿದ ಲೈವ್ ಬಿಡ್‌ಗಳು")}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--green)", marginTop: 8 }}>{liveBidCount}</div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #efe3c6", borderRadius: 18, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Awaiting You", "ನಿಮ್ಮ ದೃಢೀಕರಣ ಬಾಕಿ")}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--green)", marginTop: 8 }}>{pendingConfirm}</div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #efe3c6", borderRadius: 18, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55 }}>{pick(lang, "Confirmed Orders", "ದೃಢೀಕರಿಸಿದ ಆದೇಶಗಳು")}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#7b5c23", marginTop: 8 }}>{confirmedOrders}</div>
                </div>
              </div>
            </div>

            <div style={{ background: "#fff", border: "1px solid #e7deca", borderRadius: 18, padding: "14px", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={pick(lang, "Search by crop name, district, or village...", "ಬೆಳೆ ಹೆಸರು, ಜಿಲ್ಲೆ ಅಥವಾ ಗ್ರಾಮದಿಂದ ಹುಡುಕಿ...")}
                  style={{ width: "100%", padding: "12px 14px 12px 42px", border: "1.5px solid var(--border)", borderRadius: 14, fontSize: 14, fontFamily: "inherit", color: "var(--text)", background: "#fffdf8", outline: "none", transition: "border-color .15s" }}
                  onFocus={e => { e.target.style.borderColor = "var(--gold)"; e.target.style.boxShadow = "0 0 0 3px rgba(200,132,34,.08)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
              </div>

              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {cats.map(c => (
                  <button key={c} onClick={() => setCat(c)} style={{ padding: "6px 14px", borderRadius: 999, border: `1.5px solid ${cat === c ? "var(--gold)" : "var(--border)"}`, background: cat === c ? "var(--gold-pale)" : "#fff", color: cat === c ? "#9a5523" : "var(--text2)", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                    {tCategory(c, lang)}
                  </button>
                ))}
                <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, background: "#f7f5ef", border: "1px solid #eadcc1", padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 800, color: "#9a5523" }}>
                  🧾 {pick(lang, `${deliveryOpen} delivery-ready`, `${deliveryOpen} ವಿತರಣೆಗೆ ಸಿದ್ಧ`)}
                </span>
              </div>
            </div>

            {filtered.length === 0
              ? <Empty icon="🌿" title={pick(lang, "No listings match your search", "ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಹೊಂದುವ ಲಿಸ್ಟಿಂಗ್ ಇಲ್ಲ")} sub={pick(lang, "Try a different crop name or district", "ಬೇರೆ ಬೆಳೆ ಹೆಸರು ಅಥವಾ ಜಿಲ್ಲೆ ಪ್ರಯತ್ನಿಸಿ")} />
              : filtered.map(c => (
                <div key={c.id} style={{ marginBottom: 24 }}>
                  {(() => {
                    const draft = getDraft(c);
                    const myBid = (c.bids || []).find(b => b.bidderId === user.id);
                    const topBid = (c.bids || []).reduce((best, bid) => {
                      if (!best || bid.amount > best.amount) return bid;
                      return best;
                    }, null);
                    const draftAmount = Number(draft.amount || 0);
                    const draftQty = Number(draft.quantity || 0);
                    const requestTotal = draftAmount > 0 && draftQty > 0 ? draftAmount * draftQty : 0;
                    return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 16, marginBottom: 12 }}>
                    <CropCard crop={c} rates={rates} role="retailer" lang={lang}>
                      <div style={{ flex: "1 1 100%", display: "grid", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: 12, color: "var(--text3)" }}>
                              {pick(lang, "Send your wholesale bid here. The farmer sees your shop name, requested quantity, and bid instantly in the live bid dashboard.", "ನಿಮ್ಮ ಸಗಟು ಬಿಡ್ ಅನ್ನು ಇಲ್ಲಿ ಕಳುಹಿಸಿ. ರೈತರು ನಿಮ್ಮ ಅಂಗಡಿ ಹೆಸರು, ಕೋರಿದ ಪ್ರಮಾಣ ಮತ್ತು ಬಿಡ್ ಅನ್ನು ಲೈವ್ ಬಿಡ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ತಕ್ಷಣ ನೋಡುತ್ತಾರೆ.")}
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--green)", marginTop: 4 }}>
                              {pick(lang, "Listing value", "ಲಿಸ್ಟಿಂಗ್ ಮೌಲ್ಯ")}: {fmtP(Number(c.expectedPrice || c.minBid || 0) * Number(c.quantity || 0))}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            {topBid && (
                              <span style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #86efac", borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 800 }}>
                                {pick(lang, "Top bid", "ಉನ್ನತ ಬಿಡ್")}: {fmtP(topBid.amount)}/kg
                              </span>
                            )}
                            {myBid && (
                              <span style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 800 }}>
                                {pick(lang, "Your live bid", "ನಿಮ್ಮ ಲೈವ್ ಬಿಡ್")}: {fmtP(myBid.amount)}/kg · {myBid.quantity}kg
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55, display: "block", marginBottom: 5 }}>
                              {pick(lang, "Shop Name", "ಅಂಗಡಿ ಹೆಸರು")}
                            </label>
                            <input
                              value={draft.shopName}
                              onChange={(event) => updateDraft(c.id, { shopName: event.target.value })}
                              placeholder={pick(lang, "e.g. FreshKart Traders", "ಉದಾ. ಫ್ರೆಶ್‌ಕಾರ್ಟ್ ಟ್ರೇಡರ್ಸ್")}
                              style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fffdf8" }}
                              onFocus={(event) => { event.target.style.borderColor = "var(--gold)"; }}
                              onBlur={(event) => { event.target.style.borderColor = "var(--border)"; }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55, display: "block", marginBottom: 5 }}>
                              {pick(lang, "Bid Price (₹/kg)", "ಬಿಡ್ ಬೆಲೆ (₹/ಕೆಜಿ)")}
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={draft.amount}
                              onChange={(event) => updateDraft(c.id, { amount: event.target.value })}
                              placeholder={`Min ${fmtP(Number(c.minBid || 0))}`}
                              style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fffdf8" }}
                              onFocus={(event) => { event.target.style.borderColor = "var(--gold)"; }}
                              onBlur={(event) => { event.target.style.borderColor = "var(--border)"; }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55, display: "block", marginBottom: 5 }}>
                              {pick(lang, "Required Qty (kg)", "ಬೇಕಾದ ಪ್ರಮಾಣ (ಕೆಜಿ)")}
                            </label>
                            <input
                              type="number"
                              value={draft.quantity}
                              onChange={(event) => updateDraft(c.id, { quantity: event.target.value })}
                              placeholder={`${c.quantity}`}
                              style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fffdf8" }}
                              onFocus={(event) => { event.target.style.borderColor = "var(--gold)"; }}
                              onBlur={(event) => { event.target.style.borderColor = "var(--border)"; }}
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: 12, color: "var(--text3)" }}>
                              {pick(lang, "Requested total", "ಕೋರಿದ ಒಟ್ಟು")}: <strong style={{ color: "#9a5523" }}>{requestTotal > 0 ? fmtP(requestTotal) : "₹0"}</strong>
                            </div>
                            <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 4 }}>
                              {pick(lang, "Farmer can select your bid directly from the live bid dashboard.", "ರೈತರು ನಿಮ್ಮ ಬಿಡ್ ಅನ್ನು ಲೈವ್ ಬಿಡ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ನೇರವಾಗಿ ಆಯ್ಕೆ ಮಾಡಬಹುದು.")}
                            </div>
                          </div>
                          <button
                            onClick={() => handlePlaceBid(c)}
                            style={{ background: "linear-gradient(135deg,#9a5523,#c88422)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 10px 20px rgba(200,132,34,.18)" }}
                          >
                            💰 {myBid ? pick(lang, "Update Bid", "ಬಿಡ್ ನವೀಕರಿಸಿ") : pick(lang, "Place Bid", "ಬಿಡ್ ಮಾಡಿ")}
                          </button>
                        </div>
                      </div>
                    </CropCard>
                  </div>
                    );
                  })()}
                </div>
              ))
            }
          </div>
        )}

        {/* ── WHOLESALER NEEDS ── */}
        {view === "needs" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
              <StatCard icon="🧾" label={pick(lang, "Open Needs", "ತೆರೆದ ಬೇಡಿಕೆಗಳು")} value={openNeedCount} color="var(--gold)" />
              <StatCard icon="🤝" label={pick(lang, "Farmer Responses", "ರೈತರ ಪ್ರತಿಕ್ರಿಯೆಗಳು")} value={matchedNeedCount} color="var(--green)" />
              <StatCard icon="📦" label={pick(lang, "Awaiting You", "ನಿಮ್ಮ ದೃಢೀಕರಣ ಬಾಕಿ")} value={pendingConfirm} color="var(--blue)" />
              <StatCard icon="💰" label={pick(lang, "Open Need Value", "ತೆರೆದ ಬೇಡಿಕೆಯ ಮೌಲ್ಯ")} value={openNeedValue ? fmtP(openNeedValue) : "₹0"} color="var(--green)" />
            </div>

            <div className="rr-grid-split-responsive" style={{ display: "grid", gridTemplateColumns: "minmax(300px, 360px) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
              <div style={{ background: "#fff", border: "1px solid #e7deca", borderRadius: 18, padding: 18, boxShadow: "var(--shadow-sm)" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#9a5523", textTransform: "uppercase", letterSpacing: .6 }}>
                  {pick(lang, "Post A Need", "ಬೇಡಿಕೆಯನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ")}
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginTop: 6 }}>
                  🧾 {pick(lang, "Ask Farmers For Crop Supply", "ರೈತರಿಂದ ಬೆಳೆ ಪೂರೈಕೆ ಕೇಳಿ")}
                </h1>
                <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 10, lineHeight: 1.65 }}>
                  {pick(lang, "Post the crop you need, how much you need, and the price you are ready to bid. Farmers will see this in their Live Bids screen and can answer with their own offer.", "ನಿಮಗೆ ಬೇಕಾದ ಬೆಳೆ, ಪ್ರಮಾಣ, ಮತ್ತು ನೀವು ನೀಡಲು ಸಿದ್ಧವಾದ ಬೆಲೆಯನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ. ರೈತರು ಇದನ್ನು ತಮ್ಮ ಲೈವ್ ಬಿಡ್ ಪರದೆಯಲ್ಲಿ ನೋಡಿ ತಮ್ಮ ಆಫರ್‌ನ್ನು ಕಳುಹಿಸಬಹುದು.")}
                </p>

                <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55, display: "block", marginBottom: 5 }}>
                      {pick(lang, "Shop Name", "ಅಂಗಡಿ ಹೆಸರು")}
                    </label>
                    <input
                      value={needDraft.shopName}
                      onChange={(event) => updateNeedDraft({ shopName: event.target.value })}
                      placeholder={pick(lang, "e.g. FreshKart Traders", "ಉದಾ. ಫ್ರೆಶ್‌ಕಾರ್ಟ್ ಟ್ರೇಡರ್ಸ್")}
                      style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fffdf8" }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55, display: "block", marginBottom: 5 }}>
                      {pick(lang, "Crop Needed", "ಬೇಕಾದ ಬೆಳೆ")}
                    </label>
                    <input
                      value={needDraft.cropName}
                      onChange={(event) => updateNeedDraft({ cropName: event.target.value })}
                      placeholder={pick(lang, "e.g. Tomato", "ಉದಾ. ಟೊಮೇಟೊ")}
                      style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fffdf8" }}
                    />
                  </div>

                  <div className="rr-grid-2-responsive" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55, display: "block", marginBottom: 5 }}>
                        {pick(lang, "Required Qty (kg)", "ಬೇಕಾದ ಪ್ರಮಾಣ (ಕೆಜಿ)")}
                      </label>
                      <input
                        type="number"
                        value={needDraft.quantity}
                        onChange={(event) => updateNeedDraft({ quantity: event.target.value })}
                        style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fffdf8" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55, display: "block", marginBottom: 5 }}>
                        {pick(lang, "Bid Amount (₹/kg)", "ಬಿಡ್ ಮೊತ್ತ (₹/ಕೆಜಿ)")}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={needDraft.bidAmount}
                        onChange={(event) => updateNeedDraft({ bidAmount: event.target.value })}
                        style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fffdf8" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: .55, display: "block", marginBottom: 5 }}>
                      {pick(lang, "Notes (optional)", "ಸೂಚನೆಗಳು (ಐಚ್ಛಿಕ)")}
                    </label>
                    <textarea
                      rows={4}
                      value={needDraft.notes}
                      onChange={(event) => updateNeedDraft({ notes: event.target.value })}
                      placeholder={pick(lang, "Quality, schedule, or packing notes...", "ಗುಣಮಟ್ಟ, ಸಮಯ, ಅಥವಾ ಪ್ಯಾಕಿಂಗ್ ಸೂಚನೆಗಳು...")}
                      style={{ width: "100%", padding: "11px 12px", borderRadius: 12, border: "1.5px solid var(--border)", fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fffdf8", resize: "vertical" }}
                    />
                  </div>

                  <button
                    onClick={handlePostRequirement}
                    style={{ background: "linear-gradient(135deg,#9a5523,#c88422)", color: "#fff", border: "none", borderRadius: 12, padding: "11px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 10px 20px rgba(200,132,34,.18)" }}
                  >
                    🧾 {pick(lang, "Post Crop Need", "ಬೆಳೆ ಬೇಡಿಕೆಯನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ")}
                  </button>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#9a5523", textTransform: "uppercase", letterSpacing: .6 }}>
                      {pick(lang, "Need Board", "ಬೇಡಿಕೆ ಫಲಕ")}
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginTop: 4 }}>
                      {pick(lang, "Your Posted Crop Needs", "ನೀವು ಪೋಸ್ಟ್ ಮಾಡಿದ ಬೆಳೆ ಬೇಡಿಕೆಗಳು")}
                    </h2>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff8ec", border: "1px solid #eadcc1", borderRadius: 999, padding: "7px 12px", fontSize: 11, fontWeight: 800, color: "#9a5523" }}>
                    🤝 {pick(lang, `${matchedNeedCount} farmer replies`, `${matchedNeedCount} ರೈತರ ಉತ್ತರಗಳು`)}
                  </div>
                </div>

                {myRequirements.length === 0 ? (
                  <Empty
                    icon="🧾"
                    title={pick(lang, "No crop needs posted yet", "ಇನ್ನೂ ಯಾವುದೇ ಬೆಳೆ ಬೇಡಿಕೆ ಪೋಸ್ಟ್ ಮಾಡಿಲ್ಲ")}
                    sub={pick(lang, "Post a need here and farmers will see it in their Live Bids board", "ಇಲ್ಲಿ ಬೇಡಿಕೆಯನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ; ರೈತರು ಅದನ್ನು ತಮ್ಮ ಲೈವ್ ಬಿಡ್ ಫಲಕದಲ್ಲಿ ನೋಡುತ್ತಾರೆ")}
                  />
                ) : (
                  <div style={{ display: "grid", gap: 14 }}>
                    {myRequirements.map(requirement => (
                      <RequirementCard
                        key={requirement.id}
                        requirement={requirement}
                        role="retailer"
                        rates={rates}
                        lang={lang}
                        onDelete={() => handleDeleteRequirement(requirement)}
                      />
                    ))}
                  </div>
                )}

                {fulfilledNeedCount > 0 && (
                  <div style={{ marginTop: 14, fontSize: 12, color: "var(--text3)" }}>
                    ✅ {pick(lang, `${fulfilledNeedCount} need${fulfilledNeedCount > 1 ? "s are" : " is"} already completed.`, `${fulfilledNeedCount} ಬೇಡಿಕೆಗಳು ಈಗಾಗಲೇ ಪೂರ್ಣಗೊಂಡಿವೆ.`)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── MY ORDERS ── */}
        {view === "orders" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>📋 {pick(lang, "My Orders", "ನನ್ನ ಆದೇಶಗಳು")}</h1>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff8ec", border: "1px solid #eadcc1", borderRadius: 999, padding: "7px 12px", fontSize: 11, fontWeight: 800, color: "#9a5523" }}>
                📦 {pick(lang, `${myJobs.length} total orders`, `${myJobs.length} ಒಟ್ಟು ಆದೇಶಗಳು`)}
              </div>
            </div>
            {pendingConfirm > 0 && (
              <div style={{ background: "var(--gold-pale)", border: "1px solid #f5d090", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#92400e" }}>
                🛒 {pick(lang, `${pendingConfirm} wholesaler order${pendingConfirm > 1 ? "s" : ""} waiting for your confirmation. Once you confirm, bidding closes and delivery opens.`, `${pendingConfirm} ಸಗಟು ಆದೇಶ ದೃಢೀಕರಣಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ. ನೀವು ದೃಢೀಕರಿಸಿದ ಕೂಡಲೇ ಹರಾಜು ಮುಚ್ಚಿ ವಿತರಣೆ ತೆರೆಯುತ್ತದೆ.`)}
              </div>
            )}
            {myJobs.length === 0
              ? <Empty icon="📋" title={pick(lang, "No orders yet", "ಇನ್ನೂ ಯಾವುದೇ ಆದೇಶಗಳಿಲ್ಲ")} sub={pick(lang, "Place a bid and wait for the farmer to select it", "ಬಿಡ್ ಮಾಡಿ ಮತ್ತು ರೈತರು ಅದನ್ನು ಆಯ್ಕೆ ಮಾಡುವವರೆಗೆ ಕಾಯಿರಿ")} />
              : myJobs.map(j => (
                  <JobCard key={j.id} job={j} lang={lang}>
                    {j.status === "awaiting-retailer" && (
                      <button
                        onClick={() => {
                          onConfirmOrder(j.id);
                          toast({
                            msg: pick(
                              lang,
                              j.requirementId
                                ? `✅ Farmer offer confirmed for ${tCrop(j.cropName, lang)}. Delivery is now open.`
                                : `✅ Wholesale order confirmed for ${tCrop(j.cropName, lang)}. Bid closed and delivery opened.`,
                              j.requirementId
                                ? `✅ ${tCrop(j.cropName, lang)}ಗಾಗಿ ರೈತರ ಆಫರ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ವಿತರಣೆ ಈಗ ತೆರೆದಿದೆ.`
                                : `✅ ${tCrop(j.cropName, lang)}ಗಾಗಿ ಸಗಟು ಆದೇಶ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ಹರಾಜು ಮುಚ್ಚಿ ವಿತರಣೆ ತೆರೆಯಲಾಗಿದೆ.`
                            ),
                            icon: "✅",
                            type: "gold",
                          });
                          addActivity({
                            icon: "✅",
                            text: pick(
                              lang,
                              j.requirementId
                                ? `You confirmed a farmer response for ${tCrop(j.cropName, lang)}. Delivery payout ${fmtP(j.deliveryPayout)} is now available.`
                                : `You confirmed the order for ${tCrop(j.cropName, lang)}. Delivery payout ${fmtP(j.deliveryPayout)} is now available.`,
                              j.requirementId
                                ? `ನೀವು ${tCrop(j.cropName, lang)}ಗಾಗಿ ರೈತರ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ದೃಢೀಕರಿಸಿದ್ದೀರಿ. ${fmtP(j.deliveryPayout)} ಚಾಲಕ ಪಾವತಿ ಈಗ ಲಭ್ಯವಾಗಿದೆ.`
                                : `ನೀವು ${tCrop(j.cropName, lang)}ಗಾಗಿ ಆದೇಶವನ್ನು ದೃಢೀಕರಿಸಿದ್ದೀರಿ. ${fmtP(j.deliveryPayout)} ಚಾಲಕ ಪಾವತಿ ಈಗ ಲಭ್ಯವಾಗಿದೆ.`
                            ),
                            ts: Date.now(),
                          });
                        }}
                        style={{ background: "linear-gradient(135deg,#9a5523,#c88422)", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        ✅ {pick(lang, "Confirm Order", "ಆದೇಶ ದೃಢೀಕರಿಸಿ")}
                      </button>
                    )}
                  </JobCard>
                ))
            }
          </div>
        )}

        {/* ── APMC RATES ── */}
        {view === "rates" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
              <StatCard icon="📦" label={pick(lang, "Total Orders", "ಒಟ್ಟು ಆದೇಶಗಳು")} value={myJobs.length} color="var(--blue)" />
              <StatCard icon="🚛" label={pick(lang, "Delivery Open", "ವಿತರಣೆ ತೆರೆಯಲಾಗಿದೆ")} value={myJobs.filter(j => !j.deliveryId && j.status === "confirmed").length} color="var(--green)" />
              <StatCard icon="💰" label={pick(lang, "Order Value", "ಆದೇಶ ಮೌಲ್ಯ")} value={myJobs.length ? fmtP(myJobs.reduce((sum, job) => sum + job.winningBid * job.quantity, 0)) : "₹0"} color="var(--gold)" />
            </div>
            <MarketRates rates={rates} lang={lang} />
          </div>
        )}
      </main>
    </div>
  );
}
