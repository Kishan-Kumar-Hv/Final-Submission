import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import CropCard from "./CropCard.jsx";
import BidWars from "./BidWars.jsx";
import JobCard from "./JobCard.jsx";
import PostCropForm from "./PostCropForm.jsx";
import MarketRates from "./MarketRates.jsx";
import RequirementCard from "./RequirementCard.jsx";
import { getEstimatedFarmerCostPerKg } from "./SmartPriceCalculator.jsx";
import { StatCard, SectionTitle, Empty, Card } from "./UI.jsx";
import { useWeather } from "../hooks/useWeather.js";
import { AGR_NEWS, HELPLINES, findMatchingCrop } from "../data/constants.js";
import { fmtP } from "../utils/helpers.js";
import { pick, tCrop, tHelpline, tLocation, tNews, tWeather } from "../i18n.js";

export default function FarmerDashboard({
  user,
  crops,
  jobs,
  requirements,
  rates,
  onPost,
  onAcceptBid,
  onAcceptRequirement,
  onDeleteCrop,
  onDeleteJob,
  addActivity,
  addNotification,
  toast,
  lang,
}) {
  const [view, setView] = useState("overview");
  const mine    = crops.filter(c => c.farmerId === user.id);
  const myJobs  = jobs.filter(j => j.farmerId === user.id);
  const liveAuctionCrops = mine.filter(c => c.status !== "booked" && c.status !== "delivered");
  const biddingCrops = liveAuctionCrops.filter(c => c.bids?.length > 0);
  const normalizeCropKey = (name) => String(findMatchingCrop(name)?.c || name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const shelfCropKeys = new Set(mine.filter(c => c.status !== "delivered").map(c => normalizeCropKey(c.cropName)));
  const requirementStatusOrder = { open: 0, matched: 1, confirmed: 2, fulfilled: 3 };
  const visibleRequirements = [...requirements.filter(item => item.status === "open" || item.matchedByFarmerId === user.id)]
    .sort((a, b) => {
      const rankDiff = (requirementStatusOrder[a.status] ?? 9) - (requirementStatusOrder[b.status] ?? 9);
      if (rankDiff !== 0) return rankDiff;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
  const openRequirementCount = visibleRequirements.filter(item => item.status === "open").length;
  const matchingRequirementCount = visibleRequirements.filter(item => item.status === "open" && shelfCropKeys.has(normalizeCropKey(item.cropName))).length;
  const totalBids = mine.reduce((s, c) => s + (c.bids?.length || 0), 0);
  const revenue   = myJobs.reduce((s, j) => s + j.winningBid * j.quantity, 0);
  const impact = myJobs.reduce((summary, job) => {
    const crop = crops.find(c => c.id === job.cropId);
    const floorPrice = Number(crop?.minBid || job.wholesalerBidAmount || 0);
    const costPerKg = crop ? getEstimatedFarmerCostPerKg(crop) : Number(job.farmerCostPerKg || 0);
    const exactProfit = costPerKg > 0 ? Math.max((job.winningBid - costPerKg) * job.quantity, 0) : 0;
    const aboveFloor = floorPrice > 0 ? Math.max((job.winningBid - floorPrice) * job.quantity, 0) : 0;

    summary.farmerGain += exactProfit > 0 ? exactProfit : aboveFloor;
    summary.transportSaved += Number(job.fuelAllowance || 0);
    summary.deliveryPayout += Number(job.deliveryPayout || 0);
    summary.delivered += job.status === "delivered" ? 1 : 0;
    return summary;
  }, { farmerGain: 0, transportSaved: 0, deliveryPayout: 0, delivered: 0 });
  const approxProfitPerOrder = myJobs.length ? impact.farmerGain / myJobs.length : 0;
  const wx = useWeather(user.district);
  const newsItems = AGR_NEWS.map(n => tNews(n, lang));
  const helplines = HELPLINES.map(h => tHelpline(h, lang));

  const nav = [
    { k: "overview", i: "🏠", l: pick(lang, "Overview", "ಒವರ್‌ವ್ಯೂ")     },
    { k: "post",     i: "➕", l: pick(lang, "Post Crop", "ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡಿ")    },
    { k: "listings", i: "🌾", l: pick(lang, "My Crops", "ನನ್ನ ಬೆಳೆಗಳು")     },
    { k: "bids",     i: "🔥", l: pick(lang, "Live Bids", "ಲೈವ್ ಬಿಡ್‌ಗಳು"),   b: totalBids + openRequirementCount },
    { k: "jobs",     i: "📦", l: pick(lang, "Pickup Jobs", "ಪಿಕಪ್ ಕಾರ್ಯಗಳು")  },
    { k: "rates",    i: "📊", l: pick(lang, "APMC Rates", "ಎಪಿಎಂಸಿ ದರಗಳು")   },
    { k: "news",     i: "📰", l: pick(lang, "Agri News", "ಕೃಷಿ ಸುದ್ದಿ")    },
  ];

  function handleAccept(crop, bid) {
    const bidderLabel = bid.shopName || bid.bidderName;
    onAcceptBid(crop, bid);
    toast({ msg: pick(lang, `✅ Deal accepted! ${bidderLabel} @ ${fmtP(bid.amount)}/kg for ${bid.quantity}kg`, `✅ ಒಪ್ಪಂದ ಅಂಗೀಕರಿಸಲಾಗಿದೆ! ${bidderLabel} ರಿಂದ ${bid.quantity}ಕೆಜಿಗೆ ${fmtP(bid.amount)}/ಕೆಜಿ`), icon: "🤝", type: "gold" });
    addActivity({ icon: "🤝", text: pick(lang, `You accepted ${bidderLabel}'s bid for ${tCrop(crop.cropName, lang)} @ ${fmtP(bid.amount)}/kg for ${bid.quantity}kg`, `ನೀವು ${tCrop(crop.cropName, lang)}ಗಾಗಿ ${bidderLabel} ಅವರ ${bid.quantity}ಕೆಜಿ ${fmtP(bid.amount)}/ಕೆಜಿ ಬಿಡ್ ಅಂಗೀಕರಿಸಿದ್ದೀರಿ`), ts: Date.now() });
  }

  function handleAcceptRequirementCard(requirement, offer) {
    const quantity = Number(offer?.quantity || 0);
    const amount = Number(offer?.amount || 0);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({ msg: pick(lang, "Enter a valid quantity before sending your offer.", "ನಿಮ್ಮ ಆಫರ್ ಕಳುಹಿಸುವ ಮೊದಲು ಮಾನ್ಯ ಪ್ರಮಾಣವನ್ನು ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }
    if (quantity > Number(requirement.quantity || 0)) {
      toast({ msg: pick(lang, `Your quantity cannot exceed the requested ${requirement.quantity}kg.`, `ನಿಮ್ಮ ಪ್ರಮಾಣವು ಕೇಳಿರುವ ${requirement.quantity}ಕೆಜಿಗಿಂತ ಹೆಚ್ಚಾಗಿರಬಾರದು.`), icon: "⚠️" });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ msg: pick(lang, "Enter a valid price per kg before sending your offer.", "ನಿಮ್ಮ ಆಫರ್ ಕಳುಹಿಸುವ ಮೊದಲು ಪ್ರತಿ ಕೆಜಿಗೆ ಮಾನ್ಯ ಬೆಲೆಯನ್ನು ನಮೂದಿಸಿ."), icon: "⚠️" });
      return;
    }

    onAcceptRequirement(requirement, { ...offer, quantity, amount });
    toast({
      msg: pick(lang, `✅ Offer sent to ${requirement.retailerName} for ${tCrop(requirement.cropName, lang)}.`, `✅ ${tCrop(requirement.cropName, lang)}ಗಾಗಿ ನಿಮ್ಮ ಆಫರ್ ${requirement.retailerName} ಅವರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.`),
      icon: "🧾",
      type: "gold",
    });
  }

  return (
    <div className="rr-dashboard-shell" style={{ display: "flex", minHeight: "calc(100vh - 100px)" }}>
      <Sidebar user={user} view={view} setView={setView} navItems={nav} lang={lang} />

      <main className="rr-dashboard-main" style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "calc(100vh - 100px)", background: "var(--bg)" }}>

        {/* ── OVERVIEW ── */}
        {view === "overview" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 22 }}>
              <div style={{ background: "linear-gradient(145deg,#fff9ee,#eef3d9)", border: "1px solid #e5dcbf", borderRadius: 22, padding: "20px 22px", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#7b5c23", textTransform: "uppercase", letterSpacing: .65 }}>{pick(lang, "Field Board", "ಕ್ಷೇತ್ರ ಫಲಕ")}</div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", marginTop: 8, lineHeight: 1.08 }}>{pick(lang, `Good morning, ${user.name.split(" ")[0]}!`, `ಶುಭೋದಯ, ${user.name.split(" ")[0]}!`)}</h1>
                <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 10, lineHeight: 1.65 }}>{pick(lang, "This is your working view for the day: current listings, live bids, order flow, and farm-side performance in one place.", "ಇದು ದಿನದ ಕೆಲಸದ ನೋಟ: ಪ್ರಸ್ತುತ ಲಿಸ್ಟಿಂಗ್‌ಗಳು, ಲೈವ್ ಬಿಡ್‌ಗಳು, ಆದೇಶಗಳ ಹರಿವು ಮತ್ತು ಫಾರ್ಮ್ ಫಲಿತಾಂಶಗಳೆಲ್ಲ ಒಂದೇ ಜಾಗದಲ್ಲಿ.")}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                  {[
                    pick(lang, `${mine.length} active listings`, `${mine.length} ಸಕ್ರಿಯ ಲಿಸ್ಟಿಂಗ್‌ಗಳು`),
                    pick(lang, `${biddingCrops.length} crops with bids`, `${biddingCrops.length} ಬಿಡ್ ಇರುವ ಬೆಳೆಗಳು`),
                    pick(lang, `${openRequirementCount} wholesaler needs open`, `${openRequirementCount} ಸಗಟು ಬೇಡಿಕೆಗಳು ತೆರೆಯಿವೆ`),
                    pick(lang, `${myJobs.length} pickup jobs`, `${myJobs.length} ಪಿಕಪ್ ಕಾರ್ಯಗಳು`),
                  ].map(item => (
                    <span key={item} style={{ background: "rgba(255,255,255,.7)", border: "1px solid #e6dcc6", borderRadius: 999, padding: "6px 11px", fontSize: 11, fontWeight: 700, color: "var(--text2)" }}>{item}</span>
                  ))}
                </div>
              </div>

              {wx && (
                <div style={{ background: "linear-gradient(145deg,#eef7ff,#f6f9ef)", border: "1px solid #cfe1ef", borderRadius: 22, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ fontSize: 40, flexShrink: 0 }}>{wx.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#36566f", textTransform: "uppercase", letterSpacing: .65 }}>{pick(lang, "Farm Weather", "ಫಾರ್ಮ್ ಹವಾಮಾನ")}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: "var(--text)" }}>{wx.temp.toFixed(1)}°C</span>
                      <span style={{ fontSize: 14, color: "var(--text2)" }}>{tWeather(wx.desc, lang)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text3)" }}>📍 {tLocation(user.village, user.district, lang)} · {pick(lang, "Karnataka", "ಕರ್ನಾಟಕ")}</div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
                      {[["💧", pick(lang, `${wx.humidity}% humidity`, `${wx.humidity}% ತೇವಾಂಶ`)], ["🌬️", wx.wind], ["🌱", wx.humidity > 75 ? pick(lang, "Humid - harvest soon", "ಹೆಚ್ಚು ತೇವಾಂಶ - ಬೇಗ ಕೊಯ್ಲು ಮಾಡಿ") : pick(lang, "Good harvest window", "ಉತ್ತಮ ಕೊಯ್ಲು ಸಮಯ")]].map(([ico, lbl]) => (
                        <span key={lbl} style={{ fontSize: 11, color: "var(--text3)", display: "flex", alignItems: "center", gap: 4 }}>{ico} {lbl}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
              <StatCard icon="🌾" label={pick(lang, "Active Listings", "ಸಕ್ರಿಯ ಲಿಸ್ಟಿಂಗ್‌ಗಳು")} value={mine.length} color="var(--green)" />
              <StatCard icon="🔥" label={pick(lang, "Bids Received", "ಬಂದ ಬಿಡ್‌ಗಳು")} value={totalBids} sub={pick(lang, `on ${mine.filter(c => c.bids?.length > 0).length} crops`, `${mine.filter(c => c.bids?.length > 0).length} ಬೆಳೆಗಳ ಮೇಲೆ`)} color="var(--gold)" />
              <StatCard icon="🧾" label={pick(lang, "Crop Needs Visible", "ಗೋಚರ ಬೇಡಿಕೆಗಳು")} value={openRequirementCount} sub={pick(lang, `${matchingRequirementCount} match your shelf`, `${matchingRequirementCount} ನಿಮ್ಮ ಬೆಳೆಗಳಿಗೆ ಹೊಂದುತ್ತವೆ`)} color="var(--blue)" />
              <StatCard icon="📦" label={pick(lang, "Pickup Jobs", "ಪಿಕಪ್ ಕಾರ್ಯಗಳು")} value={myJobs.length} color="var(--blue)" />
              <StatCard icon="💰" label={pick(lang, "Total Revenue", "ಒಟ್ಟು ಆದಾಯ")} value={revenue > 0 ? fmtP(revenue) : "₹0"} color="var(--green)" />
            </div>

            <SectionTitle>📈 {pick(lang, "Impact Snapshot", "ಪ್ರಭಾವದ ಸಂಕ್ಷಿಪ್ತ ಚಿತ್ರ")}</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
              <StatCard icon="💵" label={pick(lang, "Approx Profit", "ಅಂದಾಜು ಲಾಭ")} value={impact.farmerGain > 0 ? fmtP(impact.farmerGain) : "₹0"} sub={pick(lang, approxProfitPerOrder > 0 ? `${fmtP(approxProfitPerOrder)} per order` : "based on accepted orders", approxProfitPerOrder > 0 ? `ಪ್ರತಿ ಆದೇಶಕ್ಕೆ ${fmtP(approxProfitPerOrder)}` : "ಸ್ವೀಕರಿಸಿದ ಆದೇಶಗಳ ಆಧಾರದಲ್ಲಿ")} color="var(--gold)" />
              <StatCard icon="⛽" label={pick(lang, "Transport Saved", "ಉಳಿಸಿದ ಸಾರಿಗೆ")} value={impact.transportSaved > 0 ? fmtP(impact.transportSaved) : "₹0"} color="var(--green)" />
              <StatCard icon="🚛" label={pick(lang, "Delivery Enabled", "ಸಕ್ರಿಯಗೊಂಡ ವಿತರಣೆ")} value={impact.deliveryPayout > 0 ? fmtP(impact.deliveryPayout) : "₹0"} color="var(--blue)" />
              <StatCard icon="✅" label={pick(lang, "Delivered Orders", "ಪೂರ್ಣಗೊಂಡ ಆದೇಶಗಳು")} value={impact.delivered} color="var(--green)" />
            </div>
            <Card style={{ padding: "14px 16px", marginBottom: 20, background: "#fffdf7", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
                {pick(
                  lang,
                  "This summary shows the direct value created for farmers: approximate profit, transport cost avoided, delivery payout opened for partners, and orders completed. For auto-priced crops it uses estimated production cost, and for manual crops it measures value above your floor price, so the profit number stays approximate and easy to understand.",
                  "ಈ ಸಂಕ್ಷಿಪ್ತ ಚಿತ್ರ ರೈತರಿಗೆ ಸೃಷ್ಟಿಯಾದ ನೇರ ಮೌಲ್ಯವನ್ನು ತೋರಿಸುತ್ತದೆ: ಅಂದಾಜು ಲಾಭ, ಉಳಿಸಿದ ಸಾರಿಗೆ ವೆಚ್ಚ, ವಿತರಣಾ ಸಹಭಾಗಿಗಳಿಗೆ ತೆರೆಯಲಾದ ಪಾವತಿ, ಮತ್ತು ಪೂರ್ಣಗೊಂಡ ಆದೇಶಗಳು. ಸ್ವಯಂ ದರದ ಬೆಳೆಗಳಿಗೆ ಅಂದಾಜು ಉತ್ಪಾದನಾ ವೆಚ್ಚವನ್ನು ಮತ್ತು ಕೈಯಾರೆ ದರದ ಬೆಳೆಗಳಿಗೆ ನಿಮ್ಮ ಕನಿಷ್ಠ ದರಕ್ಕಿಂತ ಮೇಲಿನ ಮೌಲ್ಯವನ್ನು ಬಳಸುತ್ತದೆ. ಆದ್ದರಿಂದ ಲಾಭದ ಸಂಖ್ಯೆ ಅಂದಾಜಿನದ್ದಾಗಿದ್ದು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸುಲಭವಾಗಿದೆ."
                )}
              </div>
            </Card>

            {/* Active auctions */}
            <SectionTitle>🔥 {pick(lang, "Active Auctions — Accept or Hold", "ಸಕ್ರಿಯ ಹರಾಜುಗಳು — ಸ್ವೀಕರಿಸಿ ಅಥವಾ ಕಾಯಿರಿ")}</SectionTitle>
            {biddingCrops.length === 0
              ? <Empty icon="🏷️" title={pick(lang, "No bids yet", "ಇನ್ನೂ ಬಿಡ್ ಇಲ್ಲ")} sub={pick(lang, "Post a crop to start receiving bids from wholesalers", "ಸಗಟು ಖರೀದಿದಾರರಿಂದ ಬಿಡ್ ಪಡೆಯಲು ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡಿ")} />
              : biddingCrops.map(c => <BidWars key={c.id} crop={c} user={user} onBid={() => {}} onAccept={handleAccept} lang={lang} />)
            }

            <SectionTitle>🧾 {pick(lang, "Open Wholesaler Needs", "ತೆರೆದ ಸಗಟು ಬೇಡಿಕೆಗಳು")}</SectionTitle>
            {openRequirementCount === 0
              ? <Empty icon="🧾" title={pick(lang, "No wholesaler needs yet", "ಇನ್ನೂ ಯಾವುದೇ ಸಗಟು ಬೇಡಿಕೆಗಳಿಲ್ಲ")} sub={pick(lang, "When wholesalers post crop needs, they will show up here", "ಸಗಟು ಖರೀದಿದಾರರು ಬೆಳೆ ಬೇಡಿಕೆಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಿದಾಗ ಅವು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ")} />
              : (
                <div style={{ display: "grid", gap: 14 }}>
                  {visibleRequirements.filter(item => item.status === "open").map(requirement => (
                    <RequirementCard
                      key={requirement.id}
                      requirement={requirement}
                      role="farmer"
                      rates={rates}
                      onAccept={handleAcceptRequirementCard}
                      lang={lang}
                      showMatchHint={shelfCropKeys.has(normalizeCropKey(requirement.cropName))}
                    />
                  ))}
                </div>
              )
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
            onPost={c => { onPost(c); setView("listings"); toast({ msg: pick(lang, `✅ ${tCrop(c.cropName, lang)} posted! Wholesalers can now view it and bid.`, `✅ ${tCrop(c.cropName, lang)} ಪೋಸ್ಟ್ ಮಾಡಲಾಗಿದೆ! ಸಗಟು ಖರೀದಿದಾರರು ಈಗ ನೋಡಿ ಬಿಡ್ ಮಾಡಬಹುದು.`), icon: "🌾" }); addActivity({ icon: "🌾", text: pick(lang, `You posted ${tCrop(c.cropName, lang)} (${c.quantity}kg) for live wholesaler bids — ${fmtP(c.minBid)}/kg floor`, `ನೀವು ${tCrop(c.cropName, lang)} (${c.quantity}ಕೆಜಿ) ಅನ್ನು ಲೈವ್ ಸಗಟು ಬಿಡ್‌ಗಳಿಗಾಗಿ ಪೋಸ್ಟ್ ಮಾಡಿದ್ದೀರಿ — ${fmtP(c.minBid)}/ಕೆಜಿ ಕನಿಷ್ಠ ದರ`), ts: Date.now() }); }}
            onCancel={() => setView("overview")} />
        )}

        {/* ── MY CROPS ── */}
        {view === "listings" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 20, background: "linear-gradient(145deg,#fffaf1,#ffffff)", border: "1px solid #e7deca", borderRadius: 18, padding: "16px 18px", boxShadow: "var(--shadow-sm)" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#7b5c23", textTransform: "uppercase", letterSpacing: .6 }}>{pick(lang, "Crop Shelf", "ಬೆಳೆ ಪಟ್ಟಿಕೆ")}</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginTop: 4 }}>🌾 {pick(lang, `My Crops (${mine.length})`, `ನನ್ನ ಬೆಳೆಗಳು (${mine.length})`)}</h1>
              </div>
              <button onClick={() => setView("post")} style={{ background: "linear-gradient(135deg,var(--green),var(--green-l))", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 800, boxShadow: "0 8px 20px rgba(102,122,47,.16)" }}>➕ {pick(lang, "Post New Crop", "ಹೊಸ ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡಿ")}</button>
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
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>🔥 {pick(lang, "Live Wholesaler Bids", "ಲೈವ್ ಸಗಟು ಬಿಡ್‌ಗಳು")}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--green-pale)", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "var(--green)" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.4s infinite" }} />{pick(lang, "Real-time", "ರಿಯಲ್-ಟೈಮ್")}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 18 }}>
              <StatCard icon="🔥" label={pick(lang, "Live Crop Auctions", "ಲೈವ್ ಬೆಳೆ ಹರಾಜುಗಳು")} value={liveAuctionCrops.length} color="var(--gold)" />
              <StatCard icon="🧾" label={pick(lang, "Wholesaler Needs", "ಸಗಟು ಬೇಡಿಕೆಗಳು")} value={openRequirementCount} color="var(--blue)" />
              <StatCard icon="✅" label={pick(lang, "Shelf Matches", "ಬೆಳೆ ಹೊಂದಿಕೆಗಳು")} value={matchingRequirementCount} color="var(--green)" />
            </div>

            <SectionTitle>🔥 {pick(lang, "Crop Auctions", "ಬೆಳೆ ಹರಾಜುಗಳು")}</SectionTitle>
            {liveAuctionCrops.map(c => (
              <BidWars key={c.id} crop={c} user={user} onBid={() => {}} onAccept={handleAccept} lang={lang} />
            ))}
            {liveAuctionCrops.length === 0 && (
              <Empty icon="🔥" title={pick(lang, "No active auctions", "ಯಾವುದೇ ಸಕ್ರಿಯ ಹರಾಜು ಇಲ್ಲ")} sub={pick(lang, "Post a crop to start an auction", "ಹರಾಜು ಪ್ರಾರಂಭಿಸಲು ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡಿ")} />
            )}

            <SectionTitle>🧾 {pick(lang, "Wholesaler Crop Needs", "ಸಗಟು ಬೆಳೆ ಬೇಡಿಕೆಗಳು")}</SectionTitle>
            <Card style={{ padding: "14px 16px", marginBottom: 16, background: "#fffdf7", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
                {pick(
                  lang,
                  "This board shows what wholesalers are asking for right now. If you have the crop, send your farmer offer here with your own quantity and price. Once the wholesaler confirms it, the normal delivery flow opens.",
                  "ಈ ಫಲಕವು ಸಗಟು ಖರೀದಿದಾರರು ಈಗ ಕೇಳುತ್ತಿರುವ ಬೇಡಿಕೆಗಳನ್ನು ತೋರಿಸುತ್ತದೆ. ನಿಮ್ಮ ಬಳಿ ಆ ಬೆಳೆ ಇದ್ದರೆ, ನಿಮ್ಮ ಪ್ರಮಾಣ ಮತ್ತು ಬೆಲೆಯೊಂದಿಗೆ ನಿಮ್ಮ ರೈತರ ಆಫರ್ ಅನ್ನು ಇಲ್ಲಿ ಕಳುಹಿಸಿ. ಸಗಟು ಖರೀದಿದಾರರು ದೃಢೀಕರಿಸಿದ ನಂತರ ಸಾಮಾನ್ಯ ವಿತರಣಾ ಹರಿವು ಆರಂಭವಾಗುತ್ತದೆ."
                )}
              </div>
            </Card>
            {visibleRequirements.length === 0 ? (
              <Empty icon="🧾" title={pick(lang, "No wholesaler needs visible yet", "ಇನ್ನೂ ಯಾವುದೇ ಸಗಟು ಬೇಡಿಕೆಗಳು ಕಾಣಿಸುತ್ತಿಲ್ಲ")} sub={pick(lang, "They will appear here as soon as wholesalers post them", "ಸಗಟು ಖರೀದಿದಾರರು ಪೋಸ್ಟ್ ಮಾಡಿದ ತಕ್ಷಣ ಅವು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ")} />
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {visibleRequirements.map(requirement => (
                  <RequirementCard
                    key={requirement.id}
                    requirement={requirement}
                    role="farmer"
                    rates={rates}
                    onAccept={handleAcceptRequirementCard}
                    lang={lang}
                    showMatchHint={requirement.status === "open" && shelfCropKeys.has(normalizeCropKey(requirement.cropName))}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PICKUP JOBS ── */}
        {view === "jobs" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>📦 {pick(lang, "Pickup Jobs", "ಪಿಕಪ್ ಕಾರ್ಯಗಳು")}</h1>
            {myJobs.length === 0
              ? <Empty icon="📦" title={pick(lang, "No pickup jobs yet", "ಇನ್ನೂ ಪಿಕಪ್ ಕಾರ್ಯಗಳಿಲ್ಲ")} sub={pick(lang, "A wholesaler selection will create your first pickup job", "ಸಗಟು ಖರೀದಿದಾರರ ಆಯ್ಕೆಯ ನಂತರ ನಿಮ್ಮ ಮೊದಲ ಪಿಕಪ್ ಕಾರ್ಯ ಸೃಷ್ಟಿಯಾಗುತ್ತದೆ")} />
              : myJobs.map(j => (
                  <JobCard key={j.id} job={j} lang={lang} role="farmer">
                    {/* Cancel job — only if delivery not yet claimed */}
                    {!j.deliveryId && (
                      <button onClick={() => {
                        const message = j.requirementId
                          ? pick(lang, "Cancel this job? The wholesaler need will reopen.", "ಈ ಕಾರ್ಯವನ್ನು ರದ್ದುಮಾಡಬೇಕೆ? ಸಗಟು ಬೇಡಿಕೆ ಮತ್ತೆ ತೆರೆಯುತ್ತದೆ.")
                          : pick(lang, "Cancel this job? The crop will go back to Open status.", "ಈ ಕಾರ್ಯವನ್ನು ರದ್ದುಮಾಡಬೇಕೆ? ಬೆಳೆ ಮತ್ತೆ ತೆರೆದ ಸ್ಥಿತಿಗೆ ಹೋಗುತ್ತದೆ.");
                        if (window.confirm(message)) onDeleteJob(j.id);
                      }}
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
