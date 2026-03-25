import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import CropCard from "./CropCard.jsx";
import JobCard from "./JobCard.jsx";
import MarketRates from "./MarketRates.jsx";
import { StatCard, Empty } from "./UI.jsx";
import { CROPS_DATA } from "../data/constants.js";
import { fmtP } from "../utils/helpers.js";
import { pick, tCategory, tCrop, tDistrict, tVillage } from "../i18n.js";

export default function RetailerDashboard({ user, crops, jobs, rates, onAcceptCrop, onConfirmOrder, toast, addActivity, lang }) {
  const [view, setView]     = useState("browse");
  const [search, setSearch] = useState("");
  const [cat, setCat]       = useState("All");

  const myJobs   = jobs.filter(j => j.retailerId === user.id);
  const pendingConfirm = myJobs.filter(j => j.status === "awaiting-retailer").length;
  const cats     = ["All", ...new Set(CROPS_DATA.map(c => c.cat))];

  const filtered = crops.filter(c => {
    const active = c.status === "open" || c.status === "bidding";
    const q = search.toLowerCase();
    const searchText = [c.cropName, c.district, c.village, tCrop(c.cropName, "kn"), tDistrict(c.district, "kn"), tVillage(c.village, "kn")].join(" ").toLowerCase();
    const mSearch = !search || searchText.includes(q);
    const mCat = cat === "All" || c.category === cat;
    return active && mSearch && mCat;
  });

  const nav = [
    { k: "browse",  i: "🔍", l: pick(lang, "Browse & Accept", "ಹುಡುಕಿ ಮತ್ತು ಸ್ವೀಕರಿಸಿ")           },
    { k: "orders",  i: "📋", l: pick(lang, "My Orders", "ನನ್ನ ಆದೇಶಗಳು"), b: pendingConfirm || null },
    { k: "rates",   i: "📊", l: pick(lang, "APMC Rates", "ಎಪಿಎಂಸಿ ದರಗಳು")                 },
  ];

  function handleAcceptCrop(crop) {
    const acceptedPrice = Number(crop.expectedPrice || crop.minBid || 0);
    const totalValue = acceptedPrice * Number(crop.quantity || 0);
    const confirmed = window.confirm(
      pick(
        lang,
        `Accept ${tCrop(crop.cropName, lang)} at ${fmtP(acceptedPrice)}/kg for ${crop.quantity}kg? Delivery will open immediately.`,
        `${tCrop(crop.cropName, lang)} ಅನ್ನು ${fmtP(acceptedPrice)}/ಕೆಜಿ ದರಕ್ಕೆ ${crop.quantity}ಕೆಜಿ ಸ್ವೀಕರಿಸಬೇಕೆ? ವಿತರಣೆ ತಕ್ಷಣ ತೆರೆಯುತ್ತದೆ.`
      )
    );
    if (!confirmed) return;

    onAcceptCrop(crop, user);
    toast({ msg: pick(lang, `✅ ${tCrop(crop.cropName, lang)} accepted. Total ${fmtP(totalValue)} and delivery is now open.`, `✅ ${tCrop(crop.cropName, lang)} ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ಒಟ್ಟು ${fmtP(totalValue)} ಮತ್ತು ವಿತರಣೆ ಈಗ ತೆರೆಯಲಾಗಿದೆ.`), icon: "✅", type: "gold" });
    addActivity({ icon: "🛒", text: pick(lang, `You accepted ${tCrop(crop.cropName, lang)} at ${fmtP(acceptedPrice)}/kg from ${tVillage(crop.village, lang)}`, `ನೀವು ${tVillage(crop.village, lang)}ನ ${tCrop(crop.cropName, lang)} ಅನ್ನು ${fmtP(acceptedPrice)}/ಕೆಜಿ ದರಕ್ಕೆ ಸ್ವೀಕರಿಸಿದ್ದೀರಿ`), ts: Date.now() });
    setView("orders");
  }

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 100px)" }}>
      <Sidebar user={user} view={view} setView={setView} navItems={nav} lang={lang} />

      <main style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "calc(100vh - 100px)", background: "var(--bg)" }}>

        {/* ── BROWSE & ACCEPT ── */}
        {view === "browse" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>🔍 {pick(lang, "Browse & Accept Crops", "ಬೆಳೆಗಳನ್ನು ನೋಡಿ ಮತ್ತು ಸ್ವೀಕರಿಸಿ")}</h1>
                <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 3 }}>{pick(lang, `${filtered.length} listings ready for direct retailer acceptance`, `ನೇರ ಖರೀದಿದಾರ ಸ್ವೀಕೃತಿಗೆ ${filtered.length} ಲಿಸ್ಟಿಂಗ್‌ಗಳು ಸಿದ್ಧವಾಗಿವೆ`)}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--green-pale)", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "var(--green)" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.4s infinite" }} />{pick(lang, "Live", "ಲೈವ್")}
              </div>
            </div>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, pointerEvents: "none" }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={pick(lang, "Search by crop name, district, or village...", "ಬೆಳೆ ಹೆಸರು, ಜಿಲ್ಲೆ ಅಥವಾ ಗ್ರಾಮದಿಂದ ಹುಡುಕಿ...")}
                style={{ width: "100%", padding: "11px 14px 11px 42px", border: "1.5px solid var(--border)", borderRadius: 12, fontSize: 14, fontFamily: "inherit", color: "var(--text)", background: "#fff", outline: "none", transition: "border-color .15s" }}
                onFocus={e => { e.target.style.borderColor = "var(--green)"; e.target.style.boxShadow = "0 0 0 3px rgba(45,122,58,.1)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
            </div>

            {/* Category filter */}
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
              {cats.map(c => (
                <button key={c} onClick={() => setCat(c)} style={{ padding: "5px 14px", borderRadius: 20, border: `1.5px solid ${cat === c ? "var(--green)" : "var(--border)"}`, background: cat === c ? "var(--green-pale)" : "#fff", color: cat === c ? "var(--green)" : "var(--text2)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>
                  {tCategory(c, lang)}
                </button>
              ))}
            </div>

            {filtered.length === 0
              ? <Empty icon="🌿" title={pick(lang, "No listings match your search", "ನಿಮ್ಮ ಹುಡುಕಾಟಕ್ಕೆ ಹೊಂದುವ ಲಿಸ್ಟಿಂಗ್ ಇಲ್ಲ")} sub={pick(lang, "Try a different crop name or district", "ಬೇರೆ ಬೆಳೆ ಹೆಸರು ಅಥವಾ ಜಿಲ್ಲೆ ಪ್ರಯತ್ನಿಸಿ")} />
              : filtered.map(c => (
                <div key={c.id} style={{ marginBottom: 24 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 16, marginBottom: 12 }}>
                    <CropCard crop={c} rates={rates} role="retailer" lang={lang}>
                      <div style={{ flex: "1 1 100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 12, color: "var(--text3)" }}>
                            {pick(lang, "Direct accept closes this listing and sends it to delivery immediately.", "ನೇರ ಸ್ವೀಕೃತಿ ಈ ಲಿಸ್ಟಿಂಗ್ ಅನ್ನು ಮುಚ್ಚಿ ತಕ್ಷಣ ವಿತರಣೆಗೆ ಕಳುಹಿಸುತ್ತದೆ.")}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--green)", marginTop: 4 }}>
                            {pick(lang, "Full order total", "ಒಟ್ಟು ಆದೇಶ ಮೌಲ್ಯ")}: {fmtP(Number(c.expectedPrice || c.minBid || 0) * Number(c.quantity || 0))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleAcceptCrop(c)}
                          style={{ background: "var(--green)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          ✅ {pick(lang, `Accept at ${fmtP(Number(c.expectedPrice || c.minBid || 0))}/kg`, `${fmtP(Number(c.expectedPrice || c.minBid || 0))}/ಕೆಜಿ ದರಕ್ಕೆ ಸ್ವೀಕರಿಸಿ`)}
                        </button>
                      </div>
                    </CropCard>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* ── MY ORDERS ── */}
        {view === "orders" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>📋 {pick(lang, "My Orders", "ನನ್ನ ಆದೇಶಗಳು")}</h1>
            {pendingConfirm > 0 && (
              <div style={{ background: "var(--gold-pale)", border: "1px solid #f5d090", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#92400e" }}>
                🛒 {pick(lang, `${pendingConfirm} order${pendingConfirm > 1 ? "s" : ""} waiting for your confirmation. Once you confirm, bidding closes and delivery opens.`, `${pendingConfirm} ಆದೇಶ ದೃಢೀಕರಣಕ್ಕಾಗಿ ಕಾಯುತ್ತಿದೆ. ನೀವು ದೃಢೀಕರಿಸಿದ ಕೂಡಲೇ ಹರಾಜು ಮುಚ್ಚಿ ವಿತರಣೆ ತೆರೆಯುತ್ತದೆ.`)}
              </div>
            )}
            {myJobs.length === 0
              ? <Empty icon="📋" title={pick(lang, "No orders yet", "ಇನ್ನೂ ಯಾವುದೇ ಆದೇಶಗಳಿಲ್ಲ")} sub={pick(lang, "Accept a crop to see your orders here", "ಇಲ್ಲಿ ಆದೇಶಗಳನ್ನು ನೋಡಲು ಒಂದು ಬೆಳೆಯನ್ನು ಸ್ವೀಕರಿಸಿ")} />
              : myJobs.map(j => (
                  <JobCard key={j.id} job={j} lang={lang}>
                    {j.status === "awaiting-retailer" && (
                      <button
                        onClick={() => {
                          onConfirmOrder(j.id);
                          toast({ msg: pick(lang, `✅ Order confirmed for ${tCrop(j.cropName, lang)}. Bid closed and delivery opened.`, `✅ ${tCrop(j.cropName, lang)}ಗಾಗಿ ಆದೇಶ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ಹರಾಜು ಮುಚ್ಚಿ ವಿತರಣೆ ತೆರೆಯಲಾಗಿದೆ.`), icon: "✅", type: "gold" });
                          addActivity({ icon: "✅", text: pick(lang, `You confirmed the order for ${tCrop(j.cropName, lang)}. Delivery payout ${fmtP(j.deliveryPayout)} is now available.`, `ನೀವು ${tCrop(j.cropName, lang)}ಗಾಗಿ ಆದೇಶವನ್ನು ದೃಢೀಕರಿಸಿದ್ದೀರಿ. ${fmtP(j.deliveryPayout)} ಚಾಲಕ ಪಾವತಿ ಈಗ ಲಭ್ಯವಾಗಿದೆ.`), ts: Date.now() });
                        }}
                        style={{ background: "var(--green)", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
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
