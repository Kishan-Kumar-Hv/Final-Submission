import { useEffect, useRef, useState } from "react";
import { uid } from "../utils/helpers.js";
import { dbPut, dbGetAll } from "../db/indexedDB.js";
import { DEMO_USERS } from "../data/constants.js";
import { pick } from "../i18n.js";

export default function AuthPage({ onLogin, toast, lang }) {
  const authImage = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1400&q=80";
  const otpTimerRef = useRef(null);

  const [tab, setTab] = useState("login");
  const [loginMode, setLoginMode] = useState("farmer");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "farmer",
    district: "",
    village: "",
    phone: "",
    pin: "",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpMeta, setOtpMeta] = useState(null);
  const [otpCode, setOtpCode] = useState("");

  const roles = {
    farmer: { icon: "🧑‍🌾", label: pick(lang, "Farmer", "ರೈತ"), short: pick(lang, "Farmer", "ರೈತ"), desc: pick(lang, "Post crops & get bids", "ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡಿ ಮತ್ತು ಬಿಡ್ ಪಡೆಯಿರಿ"), color: "var(--green)", bg: "var(--green-pale)" },
    retailer: { icon: "🏪", label: pick(lang, "Retailer / Buyer", "ಖರೀದಿದಾರ"), short: pick(lang, "Buyer", "ಖರೀದಿದಾರ"), desc: pick(lang, "Browse & bid on crops", "ಬೆಳೆಗಳನ್ನು ನೋಡಿ ಮತ್ತು ಬಿಡ್ ಮಾಡಿ"), color: "var(--gold)", bg: "var(--gold-pale)" },
    delivery: { icon: "🚛", label: pick(lang, "Delivery Partner", "ವಿತರಣಾ ಸಹಭಾಗಿ"), short: pick(lang, "Delivery", "ವಿತರಣಾ"), desc: pick(lang, "Pickup & deliver crops", "ಬೆಳೆಗಳನ್ನು ತೆಗೆದುಕೊಂಡು ವಿತರಿಸಿ"), color: "var(--blue)", bg: "var(--blue-pale)" },
  };

  const inp = {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid var(--border)",
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "inherit",
    color: "var(--text)",
    background: "#fff",
    outline: "none",
  };

  const isFarmerLogin = tab === "login" && loginMode === "farmer";
  const isFarmerRegister = tab === "register" && form.role === "farmer";

  function h(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function normalizePhone(value) {
    return value.replace(/\D/g, "").slice(-10);
  }

  function clearOtpTimer() {
    if (otpTimerRef.current) {
      clearTimeout(otpTimerRef.current);
      otpTimerRef.current = null;
    }
  }

  function resetOtp() {
    clearOtpTimer();
    setOtpMeta(null);
    setOtpCode("");
  }

  async function useDemoAccount(user) {
    setErr("");
    setLoading(true);
    resetOtp();
    try {
      await dbPut("users", user);
      toast({ msg: pick(lang, `⚡ Demo ${roles[user.role].short} ready`, `⚡ ಡೆಮೊ ${roles[user.role].short} ಸಿದ್ಧವಾಗಿದೆ`), icon: roles[user.role].icon });
      onLogin(user);
    } catch (_) {
      setErr(pick(lang, "Could not open the demo account. Please try again.", "ಡೆಮೊ ಖಾತೆ ತೆರೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."));
    }
    setLoading(false);
  }

  function startOtp(meta) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    clearOtpTimer();
    setOtpMeta({ ...meta, code });
    setOtpCode("");
    toast({ msg: pick(lang, `📲 OTP sent to ${meta.phone}. Auto-detecting for demo...`, `📲 OTP ಅನ್ನು ${meta.phone} ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ಡೆಮೋಗಾಗಿ ಸ್ವಯಂ ಪತ್ತೆ ಮಾಡಲಾಗುತ್ತಿದೆ...`), icon: "📲" });
    otpTimerRef.current = setTimeout(() => {
      setOtpCode(code);
      otpTimerRef.current = null;
    }, 1200);
  }

  async function finalizeOtp(auto = false) {
    if (!otpMeta) return;

    setErr("");
    setLoading(true);

    if (otpCode.trim() !== otpMeta.code) {
      setErr(pick(lang, "Please enter the correct 6-digit OTP.", "ದಯವಿಟ್ಟು ಸರಿಯಾದ 6 ಅಂಕೆಯ OTP ನಮೂದಿಸಿ."));
      setLoading(false);
      return;
    }

    try {
      if (otpMeta.mode === "login") {
        toast({ msg: auto ? pick(lang, "✅ OTP detected. Logging you in...", "✅ OTP ಪತ್ತೆಯಾಗಿದೆ. ನಿಮ್ಮನ್ನು ಲಾಗಿನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...") : pick(lang, "✅ OTP verified. Welcome back!", "✅ OTP ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಮತ್ತೆ ಸ್ವಾಗತ!"), icon: "✅" });
        onLogin(otpMeta.user);
      } else {
        await dbPut("users", otpMeta.user);
        toast({ msg: auto ? pick(lang, `🎉 OTP detected. Welcome, ${otpMeta.user.name}!`, `🎉 OTP ಪತ್ತೆಯಾಗಿದೆ. ಸ್ವಾಗತ, ${otpMeta.user.name}!`) : pick(lang, `🎉 Welcome, ${otpMeta.user.name}! Account created.`, `🎉 ಸ್ವಾಗತ, ${otpMeta.user.name}! ಖಾತೆ ರಚಿಸಲಾಗಿದೆ.`), icon: "🎉" });
        onLogin(otpMeta.user);
      }
      resetOtp();
    } catch (_) {
      setErr(pick(lang, "Could not complete OTP login. Please try again.", "OTP ಲಾಗಿನ್ ಪೂರ್ಣಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."));
    }

    setLoading(false);
  }

  async function handleFarmerLogin() {
    if (normalizePhone(form.phone).length !== 10) {
      setErr(pick(lang, "Please enter a valid 10-digit phone number.", "ದಯವಿಟ್ಟು ಮಾನ್ಯ 10 ಅಂಕೆಯ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ."));
      setLoading(false);
      return;
    }

    try {
      const allUsers = await dbGetAll("users");
      const found = allUsers.find(
        (u) => u.role === "farmer" && normalizePhone(u.phone || "") === normalizePhone(form.phone)
      );

      if (!found) {
        setErr(pick(lang, "No farmer account found with that phone number. Please register first.", "ಈ ಫೋನ್ ಸಂಖ್ಯೆಗೆ ರೈತ ಖಾತೆ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೊದಲು ನೋಂದಣಿ ಮಾಡಿ."));
      } else {
        startOtp({ mode: "login", phone: form.phone.trim(), user: found });
      }
    } catch (_) {
      setErr(pick(lang, "Something went wrong. Please try again.", "ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."));
    }

    setLoading(false);
  }

  async function handleStandardLogin() {
    try {
      const allUsers = await dbGetAll("users");
      const found = allUsers.find(
        (u) =>
          (u.email || "").trim().toLowerCase() === form.email.trim().toLowerCase() &&
          u.password === form.password
      );

      if (found) {
        onLogin(found);
      } else {
        setErr(pick(lang, "No account found with that email and password. Please register first.", "ಈ ಇಮೇಲ್ ಮತ್ತು ಪಾಸ್ವರ್ಡ್‌ಗೆ ಖಾತೆ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೊದಲು ನೋಂದಣಿ ಮಾಡಿ."));
      }
    } catch (_) {
      setErr(pick(lang, "Something went wrong. Please try again.", "ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."));
    }

    setLoading(false);
  }

  async function handleFarmerRegister() {
    if (!form.name.trim()) {
      setErr(pick(lang, "Please enter your full name.", "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ."));
      setLoading(false);
      return;
    }

    if (normalizePhone(form.phone).length !== 10) {
      setErr(pick(lang, "Please enter a valid 10-digit phone number.", "ದಯವಿಟ್ಟು ಮಾನ್ಯ 10 ಅಂಕೆಯ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ."));
      setLoading(false);
      return;
    }

    try {
      const allUsers = await dbGetAll("users");
      const exists = allUsers.find(
        (u) => u.role === "farmer" && normalizePhone(u.phone || "") === normalizePhone(form.phone)
      );

      if (exists) {
        setErr(pick(lang, "This phone number is already registered. Please log in instead.", "ಈ ಫೋನ್ ಸಂಖ್ಯೆ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ."));
        setLoading(false);
        return;
      }

      const newUser = {
        id: uid(),
        name: form.name.trim(),
        email: "",
        password: "",
        role: form.role,
        district: form.district.trim(),
        village: form.village.trim(),
        phone: form.phone.trim(),
        pin: form.pin.trim(),
      };

      startOtp({ mode: "register", phone: form.phone.trim(), user: newUser });
    } catch (_) {
      setErr(pick(lang, "Could not start OTP registration. Please try again.", "OTP ನೋಂದಣಿ ಪ್ರಾರಂಭಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."));
    }

    setLoading(false);
  }

  async function handleStandardRegister() {
    if (!form.name.trim()) {
      setErr(pick(lang, "Please enter your full name.", "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ."));
      setLoading(false);
      return;
    }
    if (!form.email.trim()) {
      setErr(pick(lang, "Please enter your email.", "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ."));
      setLoading(false);
      return;
    }
    if (!form.password.trim()) {
      setErr(pick(lang, "Please enter a password.", "ದಯವಿಟ್ಟು ಪಾಸ್ವರ್ಡ್ ನಮೂದಿಸಿ."));
      setLoading(false);
      return;
    }
    if (!form.phone.trim()) {
      setErr(pick(lang, "Please enter your phone number.", "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ."));
      setLoading(false);
      return;
    }

    try {
      const allUsers = await dbGetAll("users");
      const exists = allUsers.find(
        (u) => (u.email || "").trim().toLowerCase() === form.email.trim().toLowerCase()
      );

      if (exists) {
        setErr(pick(lang, "This email is already registered. Please login instead.", "ಈ ಇಮೇಲ್ ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ."));
        setLoading(false);
        return;
      }

      const newUser = {
        id: uid(),
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        district: form.district.trim(),
        village: form.village.trim(),
        phone: form.phone.trim(),
        pin: form.pin.trim(),
      };

      await dbPut("users", newUser);
      toast({ msg: pick(lang, `🎉 Welcome, ${newUser.name}! Account created.`, `🎉 ಸ್ವಾಗತ, ${newUser.name}! ಖಾತೆ ರಚಿಸಲಾಗಿದೆ.`), icon: "🎉" });
      onLogin(newUser);
    } catch (_) {
      setErr(pick(lang, "Could not save account. Please try again.", "ಖಾತೆಯನ್ನು ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."));
    }

    setLoading(false);
  }

  async function submit() {
    setErr("");
    setLoading(true);

    if (otpMeta) {
      await finalizeOtp();
      return;
    }

    if (tab === "login") {
      if (isFarmerLogin) {
        await handleFarmerLogin();
      } else {
        await handleStandardLogin();
      }
      return;
    }

    if (isFarmerRegister) {
      await handleFarmerRegister();
    } else {
      await handleStandardRegister();
    }
  }

  useEffect(() => {
    resetOtp();
    setErr("");
  }, [tab, loginMode, form.role]);

  useEffect(() => {
    if (!otpMeta || otpCode.length !== 6 || otpCode !== otpMeta.code) return;
    const timer = setTimeout(() => {
      finalizeOtp(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [otpCode, otpMeta]);

  useEffect(() => {
    (async () => {
      try {
        await Promise.all(DEMO_USERS.map((user) => dbPut("users", user)));
      } catch (_) {}
    })();
  }, []);

  useEffect(() => () => clearOtpTimer(), []);

  return (
    <div style={{ minHeight: "calc(100vh - 100px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 460, animation: "fadeUp .4s ease" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 14px", boxShadow: "0 4px 20px rgba(45,122,58,.3)" }}>🌿</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>Raitha Reach</h1>
          <p style={{ fontSize: 14, color: "var(--text3)" }}>{pick(lang, "Karnataka's farm-direct auction platform", "ಕರ್ನಾಟಕದ ಕೃಷಿ ನೇರ ಹರಾಜು ವೇದಿಕೆ")}</p>
        </div>

        <div style={{ marginBottom: 20, borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 28px rgba(0,0,0,.12)", border: "1px solid var(--border)" }}>
          <img
            src={authImage}
            alt="Fresh farm produce"
            style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
          />
        </div>

        <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 20, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}>

          {/* Tabs */}
          <div style={{ display: "flex", background: "var(--bg)", borderRadius: 12, padding: 4, marginBottom: 18, border: "1px solid var(--border)" }}>
            {["login", "register"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setErr("");
                }}
                style={{ flex: 1, padding: 9, borderRadius: 9, border: "none", background: tab === t ? "#fff" : "transparent", color: tab === t ? "var(--green)" : "var(--text3)", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all .15s", boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}
              >
                {t === "login" ? pick(lang, "🔓 Login", "🔓 ಲಾಗಿನ್") : pick(lang, "✅ Register", "✅ ನೋಂದಣಿ")}
              </button>
            ))}
          </div>

          {tab === "login" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
              <button
                onClick={() => setLoginMode("farmer")}
                style={{ padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${loginMode === "farmer" ? "var(--green)" : "var(--border)"}`, background: loginMode === "farmer" ? "var(--green-pale)" : "#fff", color: loginMode === "farmer" ? "var(--green)" : "var(--text2)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                {pick(lang, "🧑‍🌾 Farmer OTP Login", "🧑‍🌾 ರೈತ OTP ಲಾಗಿನ್")}
              </button>
              <button
                onClick={() => setLoginMode("standard")}
                style={{ padding: "10px 12px", borderRadius: 12, border: `1.5px solid ${loginMode === "standard" ? "var(--green)" : "var(--border)"}`, background: loginMode === "standard" ? "var(--green-pale)" : "#fff", color: loginMode === "standard" ? "var(--green)" : "var(--text2)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                {pick(lang, "✉️ Email Login", "✉️ ಇಮೇಲ್ ಲಾಗಿನ್")}
              </button>
            </div>
          )}

          {/* How it works info box */}
          <div style={{ background: "var(--green-xp)", border: "1px solid var(--green-mid)", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", marginBottom: 8 }}>
              {otpMeta
                ? pick(lang, "📲 OTP sent. We are detecting it automatically for demo.", "📲 OTP ಕಳುಹಿಸಲಾಗಿದೆ. ಡೆಮೋಗಾಗಿ ನಾವು ಅದನ್ನು ಸ್ವಯಂ ಪತ್ತೆ ಮಾಡುತ್ತಿದ್ದೇವೆ.")
                : isFarmerLogin
                  ? pick(lang, "👋 Farmers can log in with just a phone number", "👋 ರೈತರು ಕೇವಲ ಫೋನ್ ಸಂಖ್ಯೆಯಿಂದಲೇ ಲಾಗಿನ್ ಮಾಡಬಹುದು")
                  : isFarmerRegister
                    ? pick(lang, "👋 Farmer signup uses phone + OTP with no password", "👋 ರೈತ ನೋಂದಣಿಗೆ ಪಾಸ್ವರ್ಡ್ ಬೇಡ, ಫೋನ್ + OTP ಸಾಕು")
                    : tab === "login"
                      ? pick(lang, "👋 Welcome back!", "👋 ಮತ್ತೆ ಸ್ವಾಗತ!")
                      : pick(lang, "👋 Choose your role and get started", "👋 ನಿಮ್ಮ ಪಾತ್ರ ಆಯ್ಕೆ ಮಾಡಿ ಮತ್ತು ಪ್ರಾರಂಭಿಸಿ")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {Object.values(roles).map((r) => (
                <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text2)" }}>
                  <span>{r.icon}</span><span><strong>{r.label}</strong> — {r.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {tab === "login" && (
            <div style={{ background: "#fff8e7", border: "1px solid #f5d090", borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#b45309", marginBottom: 10 }}>
                {pick(lang, "⚡ Presenter Demo Access", "⚡ ಪ್ರೆಸೆಂಟರ್ ಡೆಮೊ ಪ್ರವೇಶ")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DEMO_USERS.map((demoUser) => {
                  const roleMeta = roles[demoUser.role];
                  return (
                    <button
                      key={demoUser.id}
                      type="button"
                      disabled={loading}
                      onClick={() => useDemoAccount(demoUser)}
                      style={{ textAlign: "left", border: `1.5px solid ${roleMeta.color}`, background: "#fff", borderRadius: 12, padding: "10px 12px", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{roleMeta.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{demoUser.name}</span>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: roleMeta.color, textTransform: "uppercase", letterSpacing: .5 }}>{pick(lang, "Instant Demo", "ತಕ್ಷಣದ ಡೆಮೊ")}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 5 }}>
                        {roleMeta.label} · {demoUser.village}, {demoUser.district}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text4)", marginTop: 4 }}>
                        {demoUser.email} · {pick(lang, "password", "ಪಾಸ್ವರ್ಡ್")}: {demoUser.password}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* REGISTER ONLY FIELDS */}
            {tab === "register" && (
              <>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{pick(lang, "Full Name *", "ಪೂರ್ಣ ಹೆಸರು *")}</label>
                  <input style={inp} name="name" value={form.name} onChange={h} placeholder={pick(lang, "e.g. Ramu Gowda", "ಉದಾ. ರಾಮು ಗೌಡ")}
                    onFocus={(e) => e.target.style.borderColor = "var(--green)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border)"} />
                </div>

                {/* Role selector */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 8 }}>{pick(lang, "I am a *", "ನಾನು *")}</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {Object.entries(roles).map(([key, r]) => (
                      <div key={key} onClick={() => setForm((f) => ({ ...f, role: key }))}
                        style={{ padding: "12px 8px", borderRadius: 12, border: `2px solid ${form.role === key ? r.color : "var(--border)"}`, background: form.role === key ? r.bg : "#fff", cursor: "pointer", textAlign: "center", transition: "all .15s" }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{r.icon}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: form.role === key ? r.color : "var(--text3)" }}>{r.short}</div>
                        <div style={{ fontSize: 10, color: "var(--text4)", marginTop: 2 }}>{r.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{pick(lang, "Phone *", "ಫೋನ್ *")}</label>
                    <input style={inp} name="phone" value={form.phone} onChange={h} placeholder={pick(lang, "+91 XXXXX XXXXX", "+91 XXXXX XXXXX")}
                      onFocus={(e) => e.target.style.borderColor = "var(--green)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border)"} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{pick(lang, "District", "ಜಿಲ್ಲೆ")}</label>
                    <input style={inp} name="district" value={form.district} onChange={h} placeholder={pick(lang, "e.g. Hassan", "ಉದಾ. ಹಾಸನ")}
                      onFocus={(e) => e.target.style.borderColor = "var(--green)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border)"} />
                  </div>
                </div>
              </>
            )}

            {isFarmerLogin && !otpMeta && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{pick(lang, "Phone Number *", "ಫೋನ್ ಸಂಖ್ಯೆ *")}</label>
                <input style={inp} name="phone" value={form.phone} onChange={h} placeholder={pick(lang, "+91 XXXXX XXXXX", "+91 XXXXX XXXXX")}
                  onFocus={(e) => e.target.style.borderColor = "var(--green)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"} />
              </div>
            )}

            {/* STANDARD LOGIN / REGISTER FIELDS */}
            {!isFarmerLogin && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{pick(lang, "Email *", "ಇಮೇಲ್ *")}</label>
                <input style={inp} name="email" type="email" value={form.email} onChange={h} placeholder={pick(lang, "you@example.com", "you@example.com")}
                  onFocus={(e) => e.target.style.borderColor = "var(--green)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"} />
              </div>
            )}

            {!isFarmerLogin && (tab === "login" || !isFarmerRegister) && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{pick(lang, "Password *", "ಪಾಸ್ವರ್ಡ್ *")}</label>
                <input style={inp} name="password" type="password" value={form.password} onChange={h} placeholder={pick(lang, "Min 6 characters", "ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳು")}
                  onFocus={(e) => e.target.style.borderColor = "var(--green)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"} />
              </div>
            )}

            {otpMeta && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>{pick(lang, "OTP Verification", "OTP ಪರಿಶೀಲನೆ")}</label>
                <input style={{ ...inp, letterSpacing: 6, textAlign: "center", fontWeight: 800 }} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="------"
                  onFocus={(e) => e.target.style.borderColor = "var(--green)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"} />
                <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 6 }}>
                  {pick(lang, `Sent to ${otpMeta.phone}. For demo, OTP auto-detects and signs in automatically.`, `${otpMeta.phone} ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ಡೆಮೋಗಾಗಿ OTP ಸ್ವಯಂ ಪತ್ತೆ ಆಗಿ ಸ್ವಯಂ ಲಾಗಿನ್ ಆಗುತ್ತದೆ.`)}
                </div>
              </div>
            )}

            {/* Error */}
            {err && (
              <div style={{ background: "#fdecea", border: "1px solid #f5b8b4", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--red)", display: "flex", alignItems: "center", gap: 8 }}>
                ⚠️ {err}
              </div>
            )}

            {/* Submit button */}
            <button onClick={submit} disabled={loading}
              style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: loading ? "var(--border)" : "var(--green)", color: "#fff", fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all .15s" }}>
              {loading
                ? pick(lang, "⏳ Please wait...", "⏳ ದಯವಿಟ್ಟು ಕಾಯಿರಿ...")
                : otpMeta
                  ? pick(lang, "✅ Verify OTP", "✅ OTP ಪರಿಶೀಲಿಸಿ")
                  : isFarmerLogin
                    ? pick(lang, "📲 Send OTP", "📲 OTP ಕಳುಹಿಸಿ")
                    : isFarmerRegister
                      ? pick(lang, "📲 Create Account with OTP", "📲 OTP ಮೂಲಕ ಖಾತೆ ರಚಿಸಿ")
                      : tab === "login"
                        ? pick(lang, "🔓 Login to My Account", "🔓 ನನ್ನ ಖಾತೆಗೆ ಲಾಗಿನ್")
                        : pick(lang, "✅ Create My Account", "✅ ನನ್ನ ಖಾತೆ ರಚಿಸಿ")}
            </button>

            {/* Switch tab hint */}
            <div style={{ textAlign: "center", fontSize: 13, color: "var(--text3)" }}>
              {tab === "login"
                ? <>{pick(lang, "Don't have an account?", "ಖಾತೆ ಇಲ್ಲವೇ?")} <span onClick={() => { setTab("register"); setErr(""); }} style={{ color: "var(--green)", fontWeight: 700, cursor: "pointer" }}>{pick(lang, "Register here", "ಇಲ್ಲಿ ನೋಂದಣಿ ಮಾಡಿ")}</span></>
                : <>{pick(lang, "Already have an account?", "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?")} <span onClick={() => { setTab("login"); setErr(""); }} style={{ color: "var(--green)", fontWeight: 700, cursor: "pointer" }}>{pick(lang, "Login here", "ಇಲ್ಲಿ ಲಾಗಿನ್ ಮಾಡಿ")}</span></>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
