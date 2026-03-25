import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import JobCard from "./JobCard.jsx";
import { StatCard, Empty, Btn } from "./UI.jsx";
import { S_ICON, NEXT_S } from "../data/constants.js";
import { fmtP } from "../utils/helpers.js";
import { pick, tCrop, tLocation, tStatus } from "../i18n.js";

export default function DeliveryDashboard({ user, jobs, onClaim, onReleaseRoute, onUpdateStatus, onDeleteJob, toast, addActivity, lang }) {
  const [view, setView] = useState("available");

  const available = jobs.filter(j => !j.deliveryId && (j.status === "confirmed" || j.status === "scheduled"));
  const myJobs    = jobs.filter(j => j.deliveryId === user.id);
  const active    = myJobs.filter(j => j.status !== "delivered");
  const done      = myJobs.filter(j => j.status === "delivered");
  const payoutEarned = done.reduce((sum, job) => sum + (job.deliveryPayout || 0), 0);

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
    <div style={{ display: "flex", minHeight: "calc(100vh - 100px)" }}>
      <Sidebar user={user} view={view} setView={setView} navItems={nav} lang={lang} />

      <main style={{ flex: 1, padding: 28, overflowY: "auto", maxHeight: "calc(100vh - 100px)", background: "var(--bg)" }}>

        {/* ── AVAILABLE JOBS ── */}
        {view === "available" && (
          <div style={{ animation: "fadeUp .35s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)" }}>📋 {pick(lang, "Available Pickup Jobs", "ಲಭ್ಯ ಪಿಕಪ್ ಕಾರ್ಯಗಳು")}</h1>
                <p style={{ fontSize: 13, color: "var(--text3)", marginTop: 3 }}>{pick(lang, "Retailer-accepted crop orders waiting for a delivery partner to claim", "ಖರೀದಿದಾರರು ಸ್ವೀಕರಿಸಿದ ಬೆಳೆ ಆದೇಶಗಳನ್ನು ವಿತರಣಾ ಸಹಭಾಗಿಯು ಸ್ವೀಕರಿಸಲು ಕಾಯುತ್ತಿರುವ ಕಾರ್ಯಗಳು")}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--green-pale)", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "var(--green)" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.4s infinite" }} />
                {pick(lang, `${available.length} available`, `${available.length} ಲಭ್ಯವಿದೆ`)}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
              <StatCard icon="📋" label={pick(lang, "Available", "ಲಭ್ಯ")}   value={available.length} color="var(--green)" />
              <StatCard icon="🚛" label={pick(lang, "In Progress", "ಪ್ರಗತಿಯಲ್ಲಿ")} value={active.length}    color="var(--blue)"  />
              <StatCard icon="💸" label={pick(lang, "Payout Ready", "ಲಭ್ಯ ಪಾವತಿ")} value={available.length ? fmtP(available.reduce((sum, job) => sum + (job.deliveryPayout || 0), 0)) : "₹0"} color="var(--green)" />
              <StatCard icon="✅" label={pick(lang, "Completed", "ಪೂರ್ಣಗೊಂಡಿವೆ")}   value={done.length}      color="var(--gold)"  />
            </div>

            {available.length === 0
              ? <Empty icon="🛣️" title={pick(lang, "No jobs right now", "ಈಗ ಯಾವುದೇ ಕಾರ್ಯಗಳಿಲ್ಲ")} sub={pick(lang, "Check back soon — new jobs appear when retailers accept crop listings", "ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ — ಖರೀದಿದಾರರು ಬೆಳೆ ಲಿಸ್ಟಿಂಗ್‌ಗಳನ್ನು ಸ್ವೀಕರಿಸಿದಾಗ ಹೊಸ ಕಾರ್ಯಗಳು ಕಾಣಿಸುತ್ತವೆ")} />
              : available.map(j => (
                <JobCard key={j.id} job={j} lang={lang}>
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
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>🚛 {pick(lang, "My Active Routes", "ನನ್ನ ಸಕ್ರಿಯ ಮಾರ್ಗಗಳು")}</h1>

            {active.length === 0
              ? <Empty icon="🚛" title={pick(lang, "No active routes", "ಯಾವುದೇ ಸಕ್ರಿಯ ಮಾರ್ಗಗಳಿಲ್ಲ")} sub={pick(lang, "Claim an available job to get started", "ಪ್ರಾರಂಭಿಸಲು ಲಭ್ಯ ಕಾರ್ಯವನ್ನು ಸ್ವೀಕರಿಸಿ")} />
              : active.map(j => {
                  const nxt = NEXT_S[j.status];
                  return (
                    <JobCard key={j.id} job={j} lang={lang}>
                      {nxt && (
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
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 20 }}>✅ {pick(lang, "Completed Deliveries", "ಪೂರ್ಣಗೊಂಡ ವಿತರಣೆಗಳು")}</h1>

            {done.length === 0
              ? <Empty icon="✅" title={pick(lang, "No completed deliveries yet", "ಇನ್ನೂ ಪೂರ್ಣಗೊಂಡ ವಿತರಣೆಗಳಿಲ್ಲ")} sub={pick(lang, "Complete a route to see it here", "ಇಲ್ಲಿ ನೋಡಲು ಒಂದು ಮಾರ್ಗವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ")} />
              : (
                <>
                  <div style={{ background: "var(--green-pale)", border: "1px solid var(--green-mid)", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 28 }}>🏆</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "var(--green)", fontSize: 15 }}>
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
                  {done.map(j => <JobCard key={j.id} job={j} lang={lang} />)}
                </>
              )
            }
          </div>
        )}

      </main>
    </div>
  );
}
