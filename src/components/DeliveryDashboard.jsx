import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import JobCard from "./JobCard.jsx";
import { Empty, Btn } from "./UI.jsx";
import { S_ICON, NEXT_S } from "../data/constants.js";
import { fmtP } from "../utils/helpers.js";
import { pick, tCrop, tLocation, tStatus } from "../i18n.js";

function DispatchStat({ label, value, sub, tone = "#41546f", bg = "#fff", border = "#d8deea" }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 18, padding: "14px 16px", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text4)", textTransform: "uppercase", letterSpacing: 0.55 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: tone, marginTop: 8, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6, lineHeight: 1.45 }}>{sub}</div>}
    </div>
  );
}

export default function DeliveryDashboard({ user, jobs, onClaim, onVerifyPickup, onReleaseRoute, onUpdateStatus, onDeleteJob, toast, addActivity, lang }) {
  const [view, setView] = useState("available");
  const [pickupOtpInputs, setPickupOtpInputs] = useState({});

  const available = jobs.filter(j => !j.deliveryId && (j.status === "confirmed" || j.status === "scheduled"));
  const myJobs    = jobs.filter(j => j.deliveryId === user.id);
  const active    = myJobs.filter(j => j.status !== "delivered");
  const done      = myJobs.filter(j => j.status === "delivered");
  const payoutEarned = done.reduce((sum, job) => sum + (job.deliveryPayout || 0), 0);
  const payoutReady = available.reduce((sum, job) => sum + (job.deliveryPayout || 0), 0);
  const avgPayout = available.length ? fmtP(Math.round(payoutReady / available.length)) : "₹0";
  const totalRouteKm = active.reduce((sum, job) => sum + Number(job.routeKm || 0), 0);
  const avgRouteKm = active.length ? `${Math.round(totalRouteKm / active.length)} km` : pick(lang, "No live route", "ಸಕ್ರಿಯ ಮಾರ್ಗವಿಲ್ಲ");

  const nav = [
    { k: "available", i: "📋", l: pick(lang, "Available Jobs", "ಲಭ್ಯ ಕಾರ್ಯಗಳು"), b: available.length },
    { k: "active",    i: "🚛", l: pick(lang, "Active Routes", "ಸಕ್ರಿಯ ಮಾರ್ಗಗಳು")                        },
    { k: "done",      i: "✅", l: pick(lang, "Completed", "ಪೂರ್ಣಗೊಂಡವು")                            },
  ];

  const btnLabel = {
    "on-the-way": pick(lang, "🚛 Mark On the Way", "🚛 ಮಾರ್ಗದಲ್ಲಿದೆ ಎಂದು ಗುರುತಿಸಿ"),
    "picked-up":  pick(lang, "📦 Mark Picked Up", "📦 ತೆಗೆದುಕೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಿ"),
    "delivered":  pick(lang, "✅ Mark Delivered", "✅ ವಿತರಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ"),
  };

  return (
    <div className="rr-dashboard-shell" style={{ display: "flex", minHeight: "calc(100vh - 100px)" }}>
      <Sidebar user={user} view={view} setView={setView} navItems={nav} lang={lang} />

      <main className="rr-dashboard-main" style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "calc(100vh - 100px)", background: "var(--bg)" }}>

        {/* ── AVAILABLE JOBS ── */}
        {view === "available" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "linear-gradient(140deg,#293548 0%,#42546f 55%,#c88422 140%)", color: "#fff", borderRadius: 24, padding: "22px 24px", boxShadow: "var(--shadow)" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 999, padding: "5px 10px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f9d45b", animation: "pulse 1.4s infinite" }} />
                  Dispatch Board
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 18, lineHeight: 1.1 }}>🚛 {pick(lang, "Available Pickup Jobs", "ಲಭ್ಯ ಪಿಕಪ್ ಕಾರ್ಯಗಳು")}</h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.8)", marginTop: 10, maxWidth: 560, lineHeight: 1.6 }}>
                  {pick(lang, "Wholesaler-approved farm pickups ready to be claimed. The goal here is speed: pick a route, contact the farmer, verify pickup, and keep the lane moving.", "ಸಗಟು ಖರೀದಿದಾರರಿಂದ ಅನುಮೋದಿತ ಫಾರ್ಮ್ ಪಿಕಪ್ ಕಾರ್ಯಗಳು ಸ್ವೀಕರಿಸಲು ಸಿದ್ಧವಾಗಿವೆ. ಇಲ್ಲಿ ಗುರಿ ವೇಗ: ಮಾರ್ಗವನ್ನು ಆರಿಸಿ, ರೈತರನ್ನು ಸಂಪರ್ಕಿಸಿ, ಪಿಕಪ್ ದೃಢೀಕರಿಸಿ ಮತ್ತು ಸಾಗಣೆ ಮುಂದುವರಿಸಿ.")}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
                  {[
                    pick(lang, `${available.length} open routes`, `${available.length} ತೆರೆಯಿರುವ ಮಾರ್ಗಗಳು`),
                    pick(lang, `${active.length} already live`, `${active.length} ಈಗಾಗಲೇ ಸಕ್ರಿಯ`),
                    pick(lang, `${done.length} closed cleanly`, `${done.length} ಪೂರ್ಣಗೊಂಡಿವೆ`),
                  ].map((item) => (
                    <span key={item} style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "6px 11px", fontSize: 11, fontWeight: 700 }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                <DispatchStat label={pick(lang, "Open Routes", "ತೆರೆದ ಮಾರ್ಗಗಳು")} value={available.length} sub={pick(lang, "Ready for immediate claim", "ತಕ್ಷಣ ಸ್ವೀಕರಿಸಲು ಸಿದ್ಧ")} tone="#41546f" bg="#f5f7fb" />
                <DispatchStat label={pick(lang, "Payout Ready", "ಲಭ್ಯ ಪಾವತಿ")} value={payoutReady ? fmtP(payoutReady) : "₹0"} sub={pick(lang, `Avg ${avgPayout} per route`, `ಪ್ರತಿ ಮಾರ್ಗಕ್ಕೆ ಸರಾಸರಿ ${avgPayout}`)} tone="#7b5c23" bg="#fff8eb" border="#eadcc1" />
                <DispatchStat label={pick(lang, "Live Now", "ಸಕ್ರಿಯ ಮಾರ್ಗಗಳು")} value={active.length} sub={pick(lang, avgRouteKm, avgRouteKm)} tone="#305c92" bg="#eef5ff" border="#d7e6ff" />
                <DispatchStat label={pick(lang, "Completed", "ಪೂರ್ಣಗೊಂಡಿವೆ")} value={done.length} sub={pick(lang, "Closed and paid out", "ಪೂರ್ಣಗೊಂಡು ಪಾವತಿಸಲಾಗಿದೆ")} tone="var(--green)" bg="#f3f8ee" border="#dce5b5" />
              </div>
            </div>

            {available.length === 0
              ? <Empty icon="🛣️" title={pick(lang, "No jobs right now", "ಈಗ ಯಾವುದೇ ಕಾರ್ಯಗಳಿಲ್ಲ")} sub={pick(lang, "Check back soon — new jobs appear when wholesalers confirm selected bids", "ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ — ಸಗಟು ಖರೀದಿದಾರರು ಆಯ್ಕೆಯಾದ ಬಿಡ್‌ಗಳನ್ನು ದೃಢೀಕರಿಸಿದಾಗ ಹೊಸ ಕಾರ್ಯಗಳು ಕಾಣಿಸುತ್ತವೆ")} />
              : available.map(j => (
                <JobCard key={j.id} job={j} lang={lang} role="delivery">
                  <Btn variant="primary" size="md" onClick={() => {
                    onClaim(j.id, user);
                    setView("active");
                    toast({ msg: pick(lang, `🚛 Route claimed! Company payout ${fmtP(j.deliveryPayout)}.`, `🚛 ಮಾರ್ಗ ಸ್ವೀಕರಿಸಲಾಗಿದೆ! ಕಂಪನಿ ಪಾವತಿ ${fmtP(j.deliveryPayout)}.`), icon: "🚛" });
                    addActivity({ icon: "🚛", text: pick(lang, `You claimed pickup for ${tCrop(j.cropName, lang)} in ${tLocation(j.village, j.district, lang)} with payout ${fmtP(j.deliveryPayout)}`, `ನೀವು ${tLocation(j.village, j.district, lang)}ನ ${tCrop(j.cropName, lang)}ಗಾಗಿ ${fmtP(j.deliveryPayout)} ಪಾವತಿಯೊಂದಿಗೆ ಪಿಕಪ್ ಸ್ವೀಕರಿಸಿದ್ದೀರಿ`), ts: Date.now() });
                  }}>
                    🚛 {pick(lang, "Claim This Route", "ಈ ಮಾರ್ಗವನ್ನು ಸ್ವೀಕರಿಸಿ")}
                  </Btn>
                </JobCard>
              ))
            }
          </div>
        )}

        {/* ── ACTIVE ROUTES ── */}
        {view === "active" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ background: "linear-gradient(145deg,#fff8ec,#eef5ff)", border: "1px solid #ddd7c7", borderRadius: 22, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#7b5c23", textTransform: "uppercase", letterSpacing: .6 }}>{pick(lang, "Route Control", "ಮಾರ್ಗ ನಿಯಂತ್ರಣ")}</div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginTop: 6 }}>🚛 {pick(lang, "My Active Routes", "ನನ್ನ ಸಕ್ರಿಯ ಮಾರ್ಗಗಳು")}</h1>
                  <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 6 }}>{pick(lang, "Keep pickup proof tight, then move each route cleanly from farm gate to wholesaler drop.", "ಪಿಕಪ್ ದೃಢೀಕರಣವನ್ನು ಸರಿಯಾಗಿ ಮಾಡಿ, ನಂತರ ಪ್ರತಿಯೊಂದು ಮಾರ್ಗವನ್ನೂ ಫಾರ್ಮ್‌ನಿಂದ ಸಗಟು ಖರೀದಿದಾರರ ಸ್ಥಳಕ್ಕೆ ಸುವ್ಯವಸ್ಥಿತವಾಗಿ ಕರೆದೊಯ್ಯಿರಿ.")}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ background: "#fff", border: "1px solid #eadcc1", borderRadius: 999, padding: "7px 12px", fontSize: 11, fontWeight: 800, color: "#7b5c23" }}>{pick(lang, `${active.length} active`, `${active.length} ಸಕ್ರಿಯ`)}</span>
                  <span style={{ background: "#fff", border: "1px solid #d7e6ff", borderRadius: 999, padding: "7px 12px", fontSize: 11, fontWeight: 800, color: "#305c92" }}>{pick(lang, `Avg route ${avgRouteKm}`, `ಸರಾಸರಿ ಮಾರ್ಗ ${avgRouteKm}`)}</span>
                </div>
              </div>
            </div>

            {active.length === 0
              ? <Empty icon="🚛" title={pick(lang, "No active routes", "ಯಾವುದೇ ಸಕ್ರಿಯ ಮಾರ್ಗಗಳಿಲ್ಲ")} sub={pick(lang, "Claim an available job to get started", "ಪ್ರಾರಂಭಿಸಲು ಲಭ್ಯ ಕಾರ್ಯವನ್ನು ಸ್ವೀಕರಿಸಿ")} />
              : active.map(j => {
                  const nxt = NEXT_S[j.status];
                  const needsPickupProof = j.status === "on-the-way" && !j.pickupOtpVerifiedAt;
                  return (
                    <JobCard key={j.id} job={j} lang={lang} role="delivery">
                      {needsPickupProof && (
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexWrap: "wrap" }}>
                          <div style={{ minWidth: 180 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "var(--text2)", display: "block", marginBottom: 4, textTransform: "uppercase" }}>
                              {pick(lang, "Farmer OTP", "ರೈತರ OTP")}
                            </label>
                            <input
                              value={pickupOtpInputs[j.id] || ""}
                              onChange={(e) => setPickupOtpInputs((prev) => ({ ...prev, [j.id]: e.target.value }))}
                              placeholder={pick(lang, "Enter 4-digit OTP", "4 ಅಂಕೆಯ OTP ನಮೂದಿಸಿ")}
                              style={{ padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: 10, fontSize: 14, fontFamily: "inherit", color: "var(--text)", background: "#fff", outline: "none", width: "100%" }}
                            />
                          </div>
                          <Btn variant="secondary" size="md" onClick={async () => {
                            const result = await onVerifyPickup(j.id, pickupOtpInputs[j.id]);
                            if (!result?.ok) {
                              toast({ msg: result?.error || pick(lang, "Could not verify pickup OTP", "ಪಿಕಪ್ OTP ದೃಢೀಕರಿಸಲಾಗಲಿಲ್ಲ"), icon: "⚠️", type: "error" });
                              return;
                            }

                            setPickupOtpInputs((prev) => ({ ...prev, [j.id]: "" }));
                            toast({ msg: pick(lang, `🔐 Pickup OTP verified for ${tCrop(j.cropName, lang)}.`, `🔐 ${tCrop(j.cropName, lang)}ಗಾಗಿ ಪಿಕಪ್ OTP ದೃಢೀಕರಿಸಲಾಗಿದೆ.`), icon: "🔐" });
                            addActivity({ icon: "🔐", text: pick(lang, `Farmer OTP verified for ${tCrop(j.cropName, lang)}. Crop marked picked up.`, `${tCrop(j.cropName, lang)}ಗಾಗಿ ರೈತರ OTP ದೃಢೀಕರಿಸಲಾಗಿದೆ. ಬೆಳೆಯನ್ನು ತೆಗೆದುಕೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.`), ts: Date.now() });
                          }}>
                            🔐 {pick(lang, "Verify Pickup OTP", "ಪಿಕಪ್ OTP ದೃಢೀಕರಿಸಿ")}
                          </Btn>
                        </div>
                      )}
                      {!needsPickupProof && nxt && (
                        <Btn variant="gold" size="md" onClick={() => {
                          onUpdateStatus(j.id, nxt);
                          toast({ msg: pick(lang, `📲 Status updated: ${tStatus(nxt, lang)}`, `📲 ಸ್ಥಿತಿ ನವೀಕರಿಸಲಾಗಿದೆ: ${tStatus(nxt, lang)}`), icon: S_ICON[nxt], type: nxt === "delivered" ? "gold" : "" });
                          addActivity({ icon: S_ICON[nxt], text: pick(lang, `${tCrop(j.cropName, lang)} status: ${tStatus(nxt, lang)}`, `${tCrop(j.cropName, lang)} ಸ್ಥಿತಿ: ${tStatus(nxt, lang)}`), ts: Date.now() });
                        }}>
                          {btnLabel[nxt]}
                        </Btn>
                      )}
                      {j.status === "on-the-way" && (
                        <button
                          onClick={() => {
                            if (window.confirm(pick(lang, "Release this route? It will go back to available jobs.", "ಈ ಮಾರ್ಗವನ್ನು ಬಿಡುಗಡೆ ಮಾಡಬೇಕೆ? ಇದು ಮತ್ತೆ ಲಭ್ಯ ಕಾರ್ಯಗಳಿಗೆ ಮರಳುತ್ತದೆ."))) {
                              onReleaseRoute(j.id);
                              toast({ msg: pick(lang, "Route released back to available", "ಮಾರ್ಗವನ್ನು ಬಿಡುಗಡೆ ಮಾಡಿ ಮತ್ತೆ ಲಭ್ಯವಾಗುವಂತೆ ಮಾಡಲಾಗಿದೆ"), icon: "↩️" });
                            }
                          }}
                          style={{ background: "var(--red-pale)", color: "var(--red)", border: "1px solid #f5b8b4", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          ↩️ {pick(lang, "Release Route", "ಮಾರ್ಗ ಬಿಡುಗಡೆ")}
                        </button>
                      )}
                    </JobCard>
                  );
                })
            }
          </div>
        )}

        {/* ── COMPLETED ── */}
        {view === "done" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ background: "linear-gradient(145deg,#f3f8ee,#fffaf1)", border: "1px solid #dce5b5", borderRadius: 22, padding: "18px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--green)", textTransform: "uppercase", letterSpacing: .6 }}>{pick(lang, "Closed Trips", "ಪೂರ್ಣಗೊಂಡ ಪ್ರಯಾಣಗಳು")}</div>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", marginTop: 6 }}>✅ {pick(lang, "Completed Deliveries", "ಪೂರ್ಣಗೊಂಡ ವಿತರಣೆಗಳು")}</h1>
                <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 6 }}>{pick(lang, "Finished routes stay here as your clean delivery record and payout history.", "ಪೂರ್ಣಗೊಂಡ ಮಾರ್ಗಗಳು ಇಲ್ಲಿ ನಿಮ್ಮ ವಿತರಣಾ ದಾಖಲೆ ಮತ್ತು ಪಾವತಿ ಇತಿಹಾಸವಾಗಿ ಉಳಿಯುತ್ತವೆ.")}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 10 }}>
                <DispatchStat label={pick(lang, "Completed", "ಪೂರ್ಣಗೊಂಡಿವೆ")} value={done.length} tone="var(--green)" bg="#fff" border="#dce5b5" />
                <DispatchStat label={pick(lang, "Payout Earned", "ಪಾವತಿ ಗಳಿಕೆ")} value={payoutEarned ? fmtP(payoutEarned) : "₹0"} tone="#7b5c23" bg="#fff" border="#eadcc1" />
              </div>
            </div>

            {done.length === 0
              ? <Empty icon="✅" title={pick(lang, "No completed deliveries yet", "ಇನ್ನೂ ಪೂರ್ಣಗೊಂಡ ವಿತರಣೆಗಳಿಲ್ಲ")} sub={pick(lang, "Complete a route to see it here", "ಇಲ್ಲಿ ನೋಡಲು ಒಂದು ಮಾರ್ಗವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ")} />
              : (
                <>
                  <div style={{ background: "linear-gradient(145deg,#fffaf1,#f3f8ee)", border: "1px solid #eadcc1", borderRadius: 16, padding: "16px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28 }}>🏆</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#7b5c23", fontSize: 15 }}>
                        {pick(lang, `Great work! ${done.length} delivery${done.length > 1 ? "s" : ""} completed`, `ಶಾಭಾಷ್! ${done.length} ವಿತರಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ`)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>
                        {pick(lang, "Total value delivered", "ಒಟ್ಟು ವಿತರಿಸಿದ ಮೌಲ್ಯ")}: {fmtP(done.reduce((s, j) => s + j.winningBid * j.quantity, 0))}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--green)", marginTop: 2 }}>
                        {pick(lang, "Company payout earned", "ಕಂಪನಿ ಪಾವತಿ ಗಳಿಕೆ")}: {fmtP(payoutEarned)}
                      </div>
                    </div>
                  </div>
                  {done.map(j => <JobCard key={j.id} job={j} lang={lang} role="delivery" />)}
                </>
              )
            }
          </div>
        )}

      </main>
    </div>
  );
}
