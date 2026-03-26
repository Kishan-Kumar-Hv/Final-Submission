import { useState } from "react";
import { Btn } from "./UI.jsx";
import { pick, tRole } from "../i18n.js";

export default function Navbar({ page, setPage, user, onLogout, lang, setLang, notifications, setNotifications }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = notifications.filter(n => n.unread).length;
  const roleIcon      = { farmer: "🧑‍🌾", retailer: "🏪", delivery: "🚛" };
  const roleColor     = { farmer: "var(--green-pale)", retailer: "var(--gold-pale)", delivery: "var(--blue-pale)" };
  const roleTextColor = { farmer: "var(--green)",      retailer: "var(--gold)",      delivery: "var(--blue)" };

  function NavBtn({ label, active, onClick }) {
    return (
      <button onClick={onClick} style={{ background: active ? "rgba(102,122,47,.12)" : "transparent", color: active ? "var(--green)" : "var(--text2)", border: "none", padding: "7px 16px", borderRadius: 999, cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit", transition: "all .15s" }}
        onMouseOver={e => { if (!active) e.currentTarget.style.color = "var(--green)"; }}
        onMouseOut={e => { if (!active) e.currentTarget.style.color = "var(--text2)"; }}>
        {label}
      </button>
    );
  }

  return (
    <nav className="rr-navbar" onClick={() => setNotifOpen(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, minHeight: 64, background: "linear-gradient(90deg, rgba(251,248,238,.97), rgba(255,252,245,.97))", borderBottom: "1px solid rgba(200,132,34,.16)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", boxShadow: "0 6px 24px rgba(102,122,47,.08)", gap: 12, flexWrap: "wrap" }}>

      {/* Logo — always goes to dashboard if logged in, else home */}
      <div className="rr-navbar-brand" onClick={() => setPage(user ? "portal" : "home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, #9a5523 0%, #c88422 45%, #667a2f 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 8px 18px rgba(154,85,35,.22)" }}>🌾</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text)", lineHeight: 1 }}>{lang === "en" ? "Raitha Reach" : "ರೈತ ರೀಚ್"}</div>
          <div style={{ fontSize: 10, color: "#9a5523", fontWeight: 700, letterSpacing: .6 }}>{pick(lang, "FARM DIRECT MARKET", "ಕೃಷಿ ನೇರ ಮಾರುಕಟ್ಟೆ")}</div>
        </div>
      </div>

      {/* ── Center nav: LOGGED OUT — Home · About · Login ── */}
      {!user && (
        <div className="rr-navbar-center" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <NavBtn label={lang === "en" ? "Home"  : "ಮುಖಪುಟ"} active={page === "home"}  onClick={() => setPage("home")}  />
          <NavBtn label={lang === "en" ? "About" : "ಬಗ್ಗೆ"}   active={page === "about"} onClick={() => setPage("about")} />
          <NavBtn label={lang === "en" ? "Login" : "ಲಾಗಿನ್"}  active={page === "auth"}  onClick={() => setPage("auth")}  />
        </div>
      )}

      {/* ── Center nav: LOGGED IN — only Dashboard ── */}
      {user && (
        <div className="rr-navbar-center" style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <NavBtn label={lang === "en" ? "Dashboard" : "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್"} active={page === "portal"} onClick={() => setPage("portal")} />
        </div>
      )}

      {/* Right side */}
      <div className="rr-navbar-right" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>

        {/* Language */}
        <div className="rr-lang-switch" style={{ display: "inline-flex", alignItems: "center", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 3 }}>
          {[
            { value: "en", label: "English" },
            { value: "kn", label: "ಕನ್ನಡ" },
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setLang(option.value)}
              style={{
                background: lang === option.value ? "linear-gradient(135deg, rgba(102,122,47,.16), rgba(200,132,34,.16))" : "transparent",
                border: "none",
                color: lang === option.value ? "var(--text)" : "var(--text3)",
                padding: "6px 10px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 800,
                fontFamily: "inherit",
                minWidth: 74,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Notifications */}
        {user && (
          <div style={{ position: "relative" }}>
            <button onClick={() => setNotifOpen(o => !o)} style={{ position: "relative", width: 38, height: 38, borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
              🔔
              {unread > 0 && <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--red)", border: "2px solid #fff" }} />}
            </button>
            {notifOpen && (
              <div className="rr-notif-panel" style={{ position: "absolute", top: 46, right: 0, width: 300, background: "#fff", border: "1px solid var(--border)", borderRadius: 14, boxShadow: "var(--shadow-lg)", zIndex: 200, animation: "popIn .17s ease", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--bg2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                    {pick(lang, "Notifications", "ಅಧಿಸೂಚನೆಗಳು")} {unread > 0 && <span style={{ background: "var(--red)", color: "#fff", fontSize: 10, padding: "1px 6px", borderRadius: 10, marginLeft: 4 }}>{unread}</span>}
                  </span>
                  <span onClick={() => setNotifications(n => n.map(x => ({ ...x, unread: false })))} style={{ fontSize: 12, color: "var(--green)", cursor: "pointer", fontWeight: 600 }}>{pick(lang, "Mark all read", "ಎಲ್ಲವನ್ನು ಓದಿದಂತೆ ಗುರುತಿಸಿ")}</span>
                </div>
                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  {notifications.map(n => (
                    <div key={n.id} onClick={() => setNotifications(ns => ns.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                      style={{ padding: "10px 16px", borderBottom: "1px solid var(--bg2)", cursor: "pointer", background: n.unread ? "var(--green-xp)" : "#fff", display: "flex", gap: 10, alignItems: "flex-start" }}>
                      {n.unread && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", marginTop: 5, flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.45 }}>{n.text}</div>
                        <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 2 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User pill */}
        {user && (
          <div className="rr-user-pill" style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg)", border: "1px solid var(--border)", padding: "6px 14px 6px 8px", borderRadius: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: roleColor[user.role], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{roleIcon[user.role]}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", lineHeight: 1.1 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: roleTextColor[user.role], fontWeight: 600 }}>{tRole(user.role, lang)}</div>
            </div>
          </div>
        )}

        {/* Login button (logged out only) */}
        {!user && (
          <button onClick={() => setPage("auth")} style={{ background: "linear-gradient(135deg, var(--gold), var(--green))", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 999, cursor: "pointer", fontSize: 14, fontWeight: 800, fontFamily: "inherit", boxShadow: "0 10px 24px rgba(200,132,34,.2)" }}>
            {pick(lang, "Get Started", "ಪ್ರಾರಂಭಿಸಿ")}
          </button>
        )}

        {user && <Btn onClick={onLogout} variant="ghost" size="sm">{lang === "en" ? "Logout" : "ಲಾಗ್‌ಔಟ್"}</Btn>}
      </div>
    </nav>
  );
}
