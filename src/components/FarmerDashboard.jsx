import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import CropCard from "./CropCard.jsx";
import BidWars from "./BidWars.jsx";
import JobCard from "./JobCard.jsx";
import PostCropForm from "./PostCropForm.jsx";
import MarketRates from "./MarketRates.jsx";
import { StatCard, SectionTitle, Empty, Card } from "./UI.jsx";
import { useWeather } from "../hooks/useWeather.js";
import { AGR_NEWS, HELPLINES } from "../data/constants.js";
import { fmtP } from "../utils/helpers.js";
import { pick, tCrop, tHelpline, tLocation, tNews, tWeather } from "../i18n.js";

export default function FarmerDashboard({ user, crops, jobs, rates, onPost, onAcceptBid, onDeleteCrop, onDeleteJob, addActivity, addNotification, toast, lang }) {
  const [view, setView] = useState("overview");
  const mine    = crops.filter(c => c.farmerId === user.id);
  const myJobs  = jobs.filter(j => j.farmerId === user.id);
  const biddingCrops = mine.filter(c => c.bids?.length > 0 && c.status !== "booked" && c.status !== "delivered");
  const totalBids = mine.reduce((s, c) => s + (c.bids?.length || 0), 0);
  const revenue   = myJobs.reduce((s, j) => s + j.winningBid * j.quantity, 0);
  const wx = useWeather(user.district);
  const newsItems = AGR_NEWS.map(n => tNews(n, lang));
  const helplines = HELPLINES.map(h => tHelpline(h, lang));

  const nav = [
    { k: "overview", i: "🏠", l: pick(lang, "Overview", "ಒವರ್‌ವ್ಯೂ")     },
    { k: "post",     i: "➕", l: pick(lang, "Post Crop", "ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡಿ")    },
    { k: "listings", i: "🌾", l: pick(lang, "My Crops", "ನನ್ನ ಬೆಳೆಗಳು")     },
    { k: "bids",     i: "🔥", l: pick(lang, "Live Bids", "ಲೈವ್ ಬಿಡ್‌ಗಳು"),   b: totalBids },
    { k: "jobs",     i: "📦", l: pick(lang, "Pickup Jobs", "ಪಿಕಪ್ ಕಾರ್ಯಗಳು")  },
    { k: "rates",    i: "📊", l: pick(lang, "APMC Rates", "ಎಪಿಎಂಸಿ ದರಗಳು")   },
    { k: "news",     i: "📰", l: pick(lang, "Agri News", "ಕೃಷಿ ಸುದ್ದಿ")    },
  ];

  function handleAccept(crop, bid) {
    onAcceptBid(crop, bid);
    toast({ msg: pick(lang, `✅ Deal accepted! ${bid.bidderName} @ ${fmtP(bid.amount)}/kg`, `✅ ಒಪ್ಪಂದ ಅಂಗೀಕರಿಸಲಾಗಿದೆ! ${bid.bidderName} @ ${fmtP(bid.amount)}/ಕೆಜಿ`), icon: "🤝", type: "gold" });
    addActivity({ icon: "🤝", text: pick(lang, `You accepted ${bid.bidderName}'s bid for ${tCrop(crop.cropName, lang)} @ ${fmtP(bid.amount)}/kg`, `ನೀವು ${tCrop(crop.cropName, lang)}ಗಾಗಿ ${bid.bidderName} ಅವರ ${fmtP(bid.amount)}/ಕೆಜಿ ಬಿಡ್ ಅಂಗೀಕರಿಸಿದ್ದೀರಿ`), ts: Date.now() });
  }

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 100px)" }}>
      <Sidebar user={user} view={view} setView={setView} navItems={nav} lang={lang} />

      <main style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "calc(100vh - 100px)", background: "var(--bg)" }}>

        {/* ── OVERVIEW ── */}
        {view === "overview" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ marginBottom: 22 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>{pick(lang, `Good morning, ${user.name.split(" ")[0]}! 👋`, `ಶುಭೋದಯ, ${user.name.split(" ")[0]}! 👋`)}</h1>
              <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 4 }}>{pick(lang, "Here's what's happening on your farm today.", "ಇಂದು ನಿಮ್ಮ ಫಾರ್ಮ್‌ನಲ್ಲಿ ಏನಾಗುತ್ತಿದೆ ನೋಡಿ.")}</p>
            </div>

            {/* Weather card */}
            {wx && (
              <div style={{ background: "linear-gradient(135deg,#e3f2fd,#e8f5e9)", border: "1px solid #b3e0f7", borderRadius: 16, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 40, flexShrink: 0 }}>{wx.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 3 }}>
                    <span style={{ fontSize: 28, fontWeight: 800, color: "var(--text)" }}>{wx.temp.toFixed(1)}°C</span>
                    <span style={{ fontSize: 14, color: "var(--text2)" }}>{tWeather(wx.desc, lang)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>📍 {tLocation(user.village, user.district, lang)} · {pick(lang, "Karnataka", "ಕರ್ನಾಟಕ")}</div>
                  <div style={{ display: "flex", gap: 14, marginTop: 5 }}>
                    {[["💧", pick(lang, `${wx.humidity}% humidity`, `${wx.humidity}% ತೇವಾಂಶ`)], ["🌬️", wx.wind], ["🌱", wx.humidity > 75 ? pick(lang, "⚠️ Humid — harvest soon", "⚠️ ಹೆಚ್ಚು ತೇವಾಂಶ — ಬೇಗ ಕೊಯ್ಲು ಮಾಡಿ") : pick(lang, "✅ Good harvest conditions", "✅ ಉತ್ತಮ ಕೊಯ್ಲು ಪರಿಸ್ಥಿತಿ")]].map(([ico, lbl]) => (
                      <span key={lbl} style={{ fontSize: 11, color: "var(--text3)", display: "flex", alignItems: "center", gap: 3 }}>{ico} {lbl}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
              <StatCard icon="🌾" label={pick(lang, "Active Listings", "ಸಕ್ರಿಯ ಲಿಸ್ಟಿಂಗ್‌ಗಳು")} value={mine.length} color="var(--green)" />
              <StatCard icon="🔥" label={pick(lang, "Bids Received", "ಬಂದ ಬಿಡ್‌ಗಳು")} value={totalBids} sub={pick(lang, `on ${mine.filter(c => c.bids?.length > 0).length} crops`, `${mine.filter(c => c.bids?.length > 0).length} ಬೆಳೆಗಳ ಮೇಲೆ`)} color="var(--gold)" />
              <StatCard icon="📦" label={pick(lang, "Pickup Jobs", "ಪಿಕಪ್ ಕಾರ್ಯಗಳು")} value={myJobs.length} color="var(--blue)" />
              <StatCard icon="💰" label={pick(lang, "Total Revenue", "ಒಟ್ಟು ಆದಾಯ")} value={revenue > 0 ? fmtP(revenue) : "₹0"} color="var(--green)" />
            </div>

            {/* Active auctions */}
            <SectionTitle>🔥 {pick(lang, "Active Auctions — Accept or Hold", "ಸಕ್ರಿಯ ಹರಾಜುಗಳು — ಸ್ವೀಕರಿಸಿ ಅಥವಾ ಕಾಯಿರಿ")}</SectionTitle>
            {biddingCrops.length === 0
              ? <Empty icon="🏷️" title={pick(lang, "No bids yet", "ಇನ್ನೂ ಬಿಡ್ ಇಲ್ಲ")} sub={pick(lang, "Post a crop to start receiving bids from retailers", "ಖರೀದಿದಾರರಿಂದ ಬಿಡ್ ಪಡೆಯಲು ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡಿ")} />
              : biddingCrops.map(c => <BidWars key={c.id} crop={c} user={user} onBid={() => {}} onAccept={handleAccept} lang={lang} />)
            }

            {/* Latest news */}
            <SectionTitle>📰 {pick(lang, "Agriculture News & Updates", "ಕೃಷಿ ಸುದ್ದಿ ಮತ್ತು ನವೀಕರಣಗಳು")}</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {newsItems.slice(0, 4).map(n => (
                <div key={n.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", transition: "all .15s", cursor: "default" }}
                  onMouseOver={e => e.currentTarget.style.borderColor = "var(--green-mid)"}
                  onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: n.col, textTransform: "uppercase", letterSpacing: .6 }}>{n.cat}</span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "4px 0", lineHeight: 1.45 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: "var(--text4)" }}>{n.meta}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── POST CROP ── */}
        {view === "post" && (
          <PostCropForm user={user} rates={rates} lang={lang}
            onPost={c => { onPost(c); setView("listings"); toast({ msg: pick(lang, `✅ ${tCrop(c.cropName, lang)} posted! Retailers can now view and accept it.`, `✅ ${tCrop(c.cropName, lang)} ಪೋಸ್ಟ್ ಮಾಡಲಾಗಿದೆ! ಖರೀದಿದಾರರು ಈಗ ನೋಡಿ ಸ್ವೀಕರಿಸಬಹುದು.`), icon: "🌾" }); addActivity({ icon: "🌾", text: pick(lang, `You posted ${tCrop(c.cropName, lang)} (${c.quantity}kg) for direct retailer orders — ${fmtP(c.minBid)}/kg floor`, `ನೀವು ${tCrop(c.cropName, lang)} (${c.quantity}ಕೆಜಿ) ಅನ್ನು ನೇರ ಖರೀದಿದಾರ ಆದೇಶಗಳಿಗಾಗಿ ಪೋಸ್ಟ್ ಮಾಡಿದ್ದೀರಿ — ${fmtP(c.minBid)}/ಕೆಜಿ ಕನಿಷ್ಠ ದರ`), ts: Date.now() }); }}
            onCancel={() => setView("overview")} />
        )}

        {/* ── MY CROPS ── */}
        {view === "listings" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>🌾 {pick(lang, `My Crops (${mine.length})`, `ನನ್ನ ಬೆಳೆಗಳು (${mine.length})`)}</h1>
              <button onClick={() => setView("post")} style={{ background: "var(--green)", color: "#fff", border: "none", padding: "9px 18px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700 }}>➕ {pick(lang, "Post New Crop", "ಹೊಸ ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡಿ")}</button>
            </div>
            {mine.length === 0
              ? <Empty icon="🌱" title={pick(lang, "No crops posted yet", "ಇನ್ನೂ ಯಾವುದೇ ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡಿಲ್ಲ")} sub={pick(lang, "Post your first crop to start receiving bids", "ಬಿಡ್‌ಗಳನ್ನು ಪಡೆಯಲು ನಿಮ್ಮ ಮೊದಲ ಬೆಳೆಯನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿ")} />
              : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 16 }}>
                  {mine.map(c => (
                    <div key={c.id} style={{ position: "relative" }}>
                      <CropCard crop={c} rates={rates} role="farmer" lang={lang} />
                      {/* Delete button — only if no bids and not booked */}
                      {c.bids?.length === 0 && c.status !== "booked" && c.status !== "delivered" && (
                        <button onClick={() => { if (window.confirm(pick(lang, `Delete "${tCrop(c.cropName, lang)}" listing?`, `"${tCrop(c.cropName, lang)}" ಲಿಸ್ಟಿಂಗ್ ಅಳಿಸಬೇಕೆ?`))) onDeleteCrop(c.id); }}
                          style={{ position: "absolute", top: 10, right: 10, background: "rgba(220,53,69,.9)", color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", zIndex: 10 }}>
                          🗑️ {pick(lang, "Delete", "ಅಳಿಸಿ")}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── LIVE BIDS ── */}
        {view === "bids" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>🔥 {pick(lang, "Live Auctions", "ಲೈವ್ ಹರಾಜುಗಳು")}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--green-pale)", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "var(--green)" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.4s infinite" }} />{pick(lang, "Real-time", "ರಿಯಲ್-ಟೈಮ್")}
              </div>
            </div>
            {mine.filter(c => c.status !== "booked" && c.status !== "delivered").map(c => (
              <BidWars key={c.id} crop={c} user={user} onBid={() => {}} onAccept={handleAccept} lang={lang} />
            ))}
            {mine.filter(c => c.status !== "booked" && c.status !== "delivered").length === 0 && (
              <Empty icon="🔥" title={pick(lang, "No active auctions", "ಯಾವುದೇ ಸಕ್ರಿಯ ಹರಾಜು ಇಲ್ಲ")} sub={pick(lang, "Post a crop to start an auction", "ಹರಾಜು ಪ್ರಾರಂಭಿಸಲು ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡಿ")} />
            )}
          </div>
        )}

        {/* ── PICKUP JOBS ── */}
        {view === "jobs" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>📦 {pick(lang, "Pickup Jobs", "ಪಿಕಪ್ ಕಾರ್ಯಗಳು")}</h1>
            {myJobs.length === 0
              ? <Empty icon="📦" title={pick(lang, "No pickup jobs yet", "ಇನ್ನೂ ಪಿಕಪ್ ಕಾರ್ಯಗಳಿಲ್ಲ")} sub={pick(lang, "A retailer acceptance will create your first pickup job", "ಖರೀದಿದಾರರ ಸ್ವೀಕೃತಿಯ ನಂತರ ನಿಮ್ಮ ಮೊದಲ ಪಿಕಪ್ ಕಾರ್ಯ ಸೃಷ್ಟಿಯಾಗುತ್ತದೆ")} />
              : myJobs.map(j => (
                  <JobCard key={j.id} job={j} lang={lang}>
                    {/* Cancel job — only if delivery not yet claimed */}
                    {!j.deliveryId && (
                      <button onClick={() => { if (window.confirm(pick(lang, "Cancel this job? The crop will go back to Open status.", "ಈ ಕಾರ್ಯವನ್ನು ರದ್ದುಮಾಡಬೇಕೆ? ಬೆಳೆ ಮತ್ತೆ ತೆರೆದ ಸ್ಥಿತಿಗೆ ಹೋಗುತ್ತದೆ."))) onDeleteJob(j.id); }}
                        style={{ background: "var(--red-pale)", color: "var(--red)", border: "1px solid #f5b8b4", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        ✕ {pick(lang, "Cancel Job", "ಕಾರ್ಯ ರದ್ದುಮಾಡಿ")}
                      </button>
                    )}
                  </JobCard>
                ))
            }
          </div>
        )}

        {/* ── APMC RATES ── */}
        {view === "rates" && <MarketRates rates={rates} lang={lang} />}

        {/* ── AGRI NEWS ── */}
        {view === "news" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>📰 {pick(lang, "Agriculture News & Updates", "ಕೃಷಿ ಸುದ್ದಿ ಮತ್ತು ನವೀಕರಣಗಳು")}</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {newsItems.map(n => (
                <div key={n.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 18px", boxShadow: "var(--shadow-sm)", transition: "all .15s" }}
                  onMouseOver={e => { e.currentTarget.style.borderLeft = `4px solid ${n.col}`; e.currentTarget.style.paddingLeft = "14px"; }}
                  onMouseOut={e => { e.currentTarget.style.borderLeft = "1px solid var(--border)"; e.currentTarget.style.paddingLeft = "18px"; }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: n.col, textTransform: "uppercase", letterSpacing: .6 }}>{n.cat}</span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "5px 0 4px", lineHeight: 1.5 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text4)" }}>{n.meta}</div>
                </div>
              ))}
            </div>

            {/* Helplines */}
            <SectionTitle>📞 {pick(lang, "Farmer Helplines", "ರೈತ ಸಹಾಯವಾಣಿಗಳು")}</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {helplines.map(h => (
                <div key={h.name} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--green-pale)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📞</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{h.name}</div>
                    <div style={{ fontSize: 12, color: "var(--green)", fontFamily: "monospace", fontWeight: 700 }}>{h.phone}</div>
                    <div style={{ fontSize: 11, color: "var(--text4)" }}>{h.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
