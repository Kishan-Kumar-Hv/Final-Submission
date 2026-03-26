import { useEffect, useRef, useState } from "react";

import { uid } from "../utils/helpers.js";
import { dbClear, dbGetAll, dbPut } from "../db/indexedDB.js";
import { DEMO_USERS } from "../data/constants.js";
import { pick } from "../i18n.js";

const RESET_MARKER = "rr-fresh-start-v1";
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

export default function AuthPage({ onLogin, toast, lang }) {
  const authImage = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1400&q=80";
  const produceImage = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80";
  const otpTimerRef = useRef(null);

  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    role: "farmer",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpMeta, setOtpMeta] = useState(null);
  const [otpCode, setOtpCode] = useState("");

  const roles = {
    farmer: {
      icon: "🧑‍🌾",
      label: pick(lang, "Farmer", "ರೈತ"),
      short: pick(lang, "Farmer", "ರೈತ"),
      desc: pick(lang, "Post crops and confirm pickup safely", "ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡಿ ಮತ್ತು ಸುರಕ್ಷಿತವಾಗಿ ಪಿಕಪ್ ದೃಢೀಕರಿಸಿ"),
      color: "var(--green)",
      bg: "var(--green-pale)",
    },
    retailer: {
      icon: "🏪",
      label: pick(lang, "Retailer / Buyer", "ಖರೀದಿದಾರ"),
      short: pick(lang, "Buyer", "ಖರೀದಿದಾರ"),
      desc: pick(lang, "Browse crops and accept orders fast", "ಬೆಳೆಗಳನ್ನು ನೋಡಿ ಮತ್ತು ಆದೇಶಗಳನ್ನು ಬೇಗ ಸ್ವೀಕರಿಸಿ"),
      color: "var(--gold)",
      bg: "var(--gold-pale)",
    },
    delivery: {
      icon: "🚛",
      label: pick(lang, "Delivery Partner", "ವಿತರಣಾ ಸಹಭಾಗಿ"),
      short: pick(lang, "Delivery", "ವಿತರಣಾ"),
      desc: pick(lang, "Collect from farm and verify with OTP", "ಫಾರ್ಮ್‌ನಿಂದ ತೆಗೆದುಕೊಂಡು OTP ಮೂಲಕ ದೃಢೀಕರಿಸಿ"),
      color: "var(--blue)",
      bg: "var(--blue-pale)",
    },
  };

  function normalizePhone(value) {
    return value.replace(/\D/g, "").slice(-10);
  }

  function h(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
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

  async function requestOtp(phone, purpose) {
    try {
      const response = await fetch(`${API_BASE}/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          purpose,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not send OTP.");
      }
      return data;
    } catch (error) {
      return { ok: false, mode: "error", error: error.message || "Could not send OTP." };
    }
  }

  async function verifyOtp(phone, otp, purpose) {
    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp,
          purpose,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not verify OTP.");
      }
      return data;
    } catch (error) {
      return { ok: false, error: error.message || "Could not verify OTP." };
    }
  }

  async function useDemoAccount(user) {
    setErr("");
    setLoading(true);
    resetOtp();
    try {
      await dbPut("users", user);
      toast({
        msg: pick(lang, `⚡ Demo ${roles[user.role].short} ready`, `⚡ ಡೆಮೊ ${roles[user.role].short} ಸಿದ್ಧವಾಗಿದೆ`),
        icon: roles[user.role].icon,
      });
      onLogin(user);
    } catch (_) {
      setErr(pick(lang, "Could not open the demo account. Please try again.", "ಡೆಮೊ ಖಾತೆ ತೆರೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."));
    }
    setLoading(false);
  }

  async function startOtp(meta) {
    const result = await requestOtp(meta.phone, meta.mode);

    if (!result?.ok) {
      throw new Error(result?.error || "Could not send OTP right now.");
    }

    const deliveryMode = result?.mode === "live" ? "live" : "mock";

    clearOtpTimer();
    setOtpMeta({ ...meta, deliveryMode, provider: result?.provider || "mock" });
    setOtpCode("");
    toast({
      msg: deliveryMode === "live"
        ? pick(lang, `📲 OTP sent to ${meta.phone}. Enter the code from SMS.`, `📲 OTP ಅನ್ನು ${meta.phone} ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. SMS ನಲ್ಲಿರುವ ಕೋಡ್ ನಮೂದಿಸಿ.`)
        : pick(lang, `📲 OTP sent to ${meta.phone}. It will auto-fill for demo.`, `📲 OTP ಅನ್ನು ${meta.phone} ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ಡೆಮೋಗಾಗಿ ಅದು ಸ್ವಯಂ ತುಂಬುತ್ತದೆ.`),
      icon: "📲",
    });

    if (deliveryMode !== "live") {
      otpTimerRef.current = setTimeout(() => {
        setOtpCode(result?.mockCode || "");
        otpTimerRef.current = null;
      }, 1200);
    }
  }

  async function finalizeOtp(auto = false) {
    if (!otpMeta) return;

    setErr("");
    setLoading(true);

    if (otpCode.trim().length !== 6) {
      setErr(pick(lang, "Please enter the correct 6-digit OTP.", "ದಯವಿಟ್ಟು ಸರಿಯಾದ 6 ಅಂಕೆಯ OTP ನಮೂದಿಸಿ."));
      setLoading(false);
      return;
    }

    try {
      const verification = await verifyOtp(otpMeta.phone, otpCode.trim(), otpMeta.mode);
      if (!verification?.ok) {
        throw new Error(verification?.error || pick(lang, "Please enter the correct 6-digit OTP.", "ದಯವಿಟ್ಟು ಸರಿಯಾದ 6 ಅಂಕೆಯ OTP ನಮೂದಿಸಿ."));
      }

      if (otpMeta.mode === "login") {
        toast({
          msg: auto
            ? pick(lang, "✅ OTP detected. Logging you in...", "✅ OTP ಪತ್ತೆಯಾಗಿದೆ. ನಿಮ್ಮನ್ನು ಲಾಗಿನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...")
            : pick(lang, "✅ OTP verified. Welcome back!", "✅ OTP ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಮತ್ತೆ ಸ್ವಾಗತ!"),
          icon: "✅",
        });
        onLogin(otpMeta.user);
      } else {
        await dbPut("users", otpMeta.user);
        toast({
          msg: auto
            ? pick(lang, `🎉 OTP detected. Welcome, ${otpMeta.user.name}!`, `🎉 OTP ಪತ್ತೆಯಾಗಿದೆ. ಸ್ವಾಗತ, ${otpMeta.user.name}!`)
            : pick(lang, `🎉 Welcome, ${otpMeta.user.name}! Account created.`, `🎉 ಸ್ವಾಗತ, ${otpMeta.user.name}! ಖಾತೆ ರಚಿಸಲಾಗಿದೆ.`),
          icon: "🎉",
        });
        onLogin(otpMeta.user);
      }
      resetOtp();
    } catch (error) {
      setErr(error?.message || pick(lang, "Could not complete OTP flow. Please try again.", "OTP ಪ್ರಕ್ರಿಯೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."));
    }

    setLoading(false);
  }

  async function handleLogin() {
    const phone = normalizePhone(form.phone);
    if (phone.length !== 10) {
      setErr(pick(lang, "Please enter a valid 10-digit phone number.", "ದಯವಿಟ್ಟು ಮಾನ್ಯ 10 ಅಂಕೆಯ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ."));
      setLoading(false);
      return;
    }

    try {
      const allUsers = await dbGetAll("users");
      const found = allUsers.find((user) => normalizePhone(user.phone || "") === phone);

      if (!found) {
        setErr(pick(lang, "No account found with that phone number. Please register first.", "ಈ ಫೋನ್ ಸಂಖ್ಯೆಗೆ ಖಾತೆ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮೊದಲು ನೋಂದಣಿ ಮಾಡಿ."));
      } else {
        await startOtp({ mode: "login", phone, user: found });
      }
    } catch (error) {
      setErr(error?.message || pick(lang, "Something went wrong. Please try again.", "ಏನೋ ತಪ್ಪಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."));
    }

    setLoading(false);
  }

  async function handleRegister() {
    const phone = normalizePhone(form.phone);
    if (!form.name.trim()) {
      setErr(pick(lang, "Please enter your full name.", "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ."));
      setLoading(false);
      return;
    }

    if (phone.length !== 10) {
      setErr(pick(lang, "Please enter a valid 10-digit phone number.", "ದಯವಿಟ್ಟು ಮಾನ್ಯ 10 ಅಂಕೆಯ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ."));
      setLoading(false);
      return;
    }

    try {
      const allUsers = await dbGetAll("users");
      const exists = allUsers.find((user) => normalizePhone(user.phone || "") === phone);

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
        district: "",
        village: "",
        phone,
        pin: "",
      };

      await startOtp({ mode: "register", phone, user: newUser });
    } catch (error) {
      setErr(error?.message || pick(lang, "Could not start OTP registration. Please try again.", "OTP ನೋಂದಣಿ ಪ್ರಾರಂಭಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."));
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
      await handleLogin();
    } else {
      await handleRegister();
    }
  }

  useEffect(() => {
    resetOtp();
    setErr("");
  }, [tab, form.role]);

  useEffect(() => {
    if (!otpMeta || otpCode.length !== 6) return;
    const timer = setTimeout(() => {
      finalizeOtp(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [otpCode, otpMeta]);

  useEffect(() => {
    (async () => {
      try {
        if (!localStorage.getItem(RESET_MARKER)) {
          await Promise.all([dbClear("crops"), dbClear("jobs")]);
          localStorage.setItem(RESET_MARKER, "done");
        }
        await Promise.all(DEMO_USERS.map((user) => dbPut("users", user)));
      } catch (_) {}
    })();
  }, []);

  useEffect(() => () => clearOtpTimer(), []);

  const inp = {
    width: "100%",
    padding: "12px 14px",
    border: "1.5px solid var(--border)",
    borderRadius: 12,
    fontSize: 14,
    fontFamily: "inherit",
    color: "var(--text)",
    background: "#fff",
    outline: "none",
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 100px)",
        padding: "30px 18px 50px",
        backgroundImage: `linear-gradient(135deg, rgba(36,34,24,0.82), rgba(83,60,28,0.62)), url(${authImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 26, alignItems: "stretch" }}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 26,
            minHeight: 640,
            background: "linear-gradient(180deg, rgba(24,46,18,0.86), rgba(84,59,25,0.74))",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 18px 60px rgba(0,0,0,.18)",
          }}
        >
          <img
            src={produceImage}
            alt="Fresh crops"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.24 }}
          />
          <div style={{ position: "relative", zIndex: 1, padding: 30, display: "flex", flexDirection: "column", height: "100%", color: "#fff" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "7px 14px", fontSize: 12, fontWeight: 800, letterSpacing: .5, marginBottom: 20 }}>
              <span>🌾</span>
              {pick(lang, "Farm-Direct Presentation Flow", "ಕೃಷಿ ನೇರ ಪ್ರಸ್ತುತಿ ಹರಿವು")}
            </div>
            <h1 style={{ fontSize: "clamp(2rem,4vw,3.1rem)", lineHeight: 1.05, fontWeight: 900, marginBottom: 14 }}>
              {pick(lang, "Login for a Clean, Real Farmer Story", "ಶುದ್ಧ ಮತ್ತು ನೈಜ ರೈತರ ಕಥೆಗೆ ಲಾಗಿನ್ ಮಾಡಿ")}
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,.85)", maxWidth: 520, marginBottom: 28 }}>
              {pick(
                lang,
                "This auth flow is trimmed for presentation: simple phone login, real SMS OTP when MSG91 is enabled, demo auto-fill fallback, and a fresh clean start with old crop and order data cleared.",
                "ಈ ಆಥ್ ಹರಿವು ಪ್ರಸ್ತುತಿಗಾಗಿ ಸರಳಗೊಳಿಸಲಾಗಿದೆ: ಸರಳ ಫೋನ್ ಲಾಗಿನ್, ನೈಜ SMS OTP ಅಥವಾ ಡೆಮೊ ಸ್ವಯಂ ತುಂಬಿಕೆ, ತಕ್ಷಣದ ಡೆಮೊ ಪ್ರವೇಶ, ಮತ್ತು ಹಳೆಯ ಬೆಳೆ/ಆದೇಶ ಡೇಟಾ ತೆರವುಗೊಂಡ ಶುದ್ಧ ಆರಂಭ."
              )}
            </p>

            <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
              {[
                pick(lang, "Farmer logs in with just phone number + OTP", "ರೈತರು ಕೇವಲ ಫೋನ್ ಸಂಖ್ಯೆ + OTP ಮೂಲಕ ಲಾಗಿನ್ ಮಾಡುತ್ತಾರೆ"),
                pick(lang, "New users register with only name and number", "ಹೊಸ ಬಳಕೆದಾರರು ಕೇವಲ ಹೆಸರು ಮತ್ತು ಸಂಖ್ಯೆಯಿಂದ ನೋಂದಣಿ ಮಾಡುತ್ತಾರೆ"),
                pick(lang, "MSG91-ready OTP works live, with demo auto-fill as fallback", "MSG91 ಸಿದ್ಧ OTP ನೈಜವಾಗಿ ಕೆಲಸಮಾಡುತ್ತದೆ, ಡೆಮೋ ಸ್ವಯಂ ತುಂಬಿಕೆ ಬ್ಯಾಕಪ್ ಆಗಿದೆ"),
                pick(lang, "Old crop and order data is reset so you start fresh", "ನೀವು ಶುದ್ಧವಾಗಿ ಪ್ರಾರಂಭಿಸಲು ಹಳೆಯ ಬೆಳೆ ಮತ್ತು ಆದೇಶ ಡೇಟಾ ಮರುಹೊಂದಿಸಲಾಗಿದೆ"),
              ].map((line) => (
                <div key={line} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "rgba(255,255,255,.9)" }}>
                  <span style={{ fontSize: 16 }}>✅</span>
                  <span style={{ lineHeight: 1.6 }}>{line}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "auto", background: "rgba(255,255,255,.09)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 18, backdropFilter: "blur(8px)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: .5, marginBottom: 10, color: "#f7f0dc" }}>
                {pick(lang, "Fast Demo Sequence", "ವೇಗದ ಡೆಮೊ ಕ್ರಮ")}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  `1. ${pick(lang, "Farmer logs in and posts a crop", "ರೈತ ಲಾಗಿನ್ ಮಾಡಿ ಬೆಳೆ ಪೋಸ್ಟ್ ಮಾಡುತ್ತಾರೆ")}`,
                  `2. ${pick(lang, "Retailer accepts the crop directly", "ಖರೀದಿದಾರರು ಬೆಳೆಯನ್ನು ನೇರವಾಗಿ ಸ್ವೀಕರಿಸುತ್ತಾರೆ")}`,
                  `3. ${pick(lang, "Delivery claims route and verifies pickup OTP", "ವಿತರಣಾ ಸಹಭಾಗಿ ಮಾರ್ಗ ಸ್ವೀಕರಿಸಿ ಪಿಕಪ್ OTP ದೃಢೀಕರಿಸುತ್ತಾರೆ")}`,
                ].map((step) => (
                  <div key={step} style={{ fontSize: 13, color: "rgba(255,255,255,.86)" }}>{step}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ animation: "fadeUp .4s ease" }}>
          <div style={{ background: "rgba(255,255,255,.96)", border: "1px solid rgba(255,255,255,.42)", borderRadius: 26, padding: 28, boxShadow: "0 18px 60px rgba(0,0,0,.16)", backdropFilter: "blur(14px)" }}>
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <div style={{ width: 66, height: 66, borderRadius: 20, background: "linear-gradient(135deg, #9a5523 0%, #c88422 48%, #667a2f 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 14px", boxShadow: "0 10px 28px rgba(154,85,35,.22)" }}>🌾</div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", marginBottom: 6 }}>Raitha Reach</h1>
              <p style={{ fontSize: 14, color: "var(--text3)" }}>{pick(lang, "Phone-first login for farmers, buyers and delivery", "ರೈತರು, ಖರೀದಿದಾರರು ಮತ್ತು ವಿತರಣೆಗೆ ಫೋನ್-ಮೊದಲ ಲಾಗಿನ್")}</p>
            </div>

            <div style={{ display: "flex", background: "var(--bg)", borderRadius: 14, padding: 4, marginBottom: 18, border: "1px solid var(--border)" }}>
              {["login", "register"].map((currentTab) => (
                <button
                  key={currentTab}
                  onClick={() => {
                    setTab(currentTab);
                    setErr("");
                  }}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 10,
                    border: "none",
                    background: tab === currentTab ? "#fff" : "transparent",
                    color: tab === currentTab ? "var(--green)" : "var(--text3)",
                    fontFamily: "inherit",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: tab === currentTab ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                  }}
                >
                  {currentTab === "login" ? pick(lang, "🔓 Login", "🔓 ಲಾಗಿನ್") : pick(lang, "✅ Register", "✅ ನೋಂದಣಿ")}
                </button>
              ))}
            </div>

            <div style={{ background: "var(--green-xp)", border: "1px solid var(--green-mid)", borderRadius: 14, padding: "12px 14px", marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--green)", marginBottom: 6 }}>
                {otpMeta
                  ? otpMeta.deliveryMode === "live"
                    ? pick(lang, "📲 OTP sent. Enter the code from your SMS inbox.", "📲 OTP ಕಳುಹಿಸಲಾಗಿದೆ. ನಿಮ್ಮ SMS ಇನ್‌ಬಾಕ್ಸ್‌ನಿಂದ ಕೋಡ್ ನಮೂದಿಸಿ.")
                    : pick(lang, "📲 OTP sent. It auto-fills here for demo.", "📲 OTP ಕಳುಹಿಸಲಾಗಿದೆ. ಡೆಮೋಗಾಗಿ ಅದು ಇಲ್ಲಿ ಸ್ವಯಂ ತುಂಬುತ್ತದೆ.")
                  : tab === "login"
                    ? pick(lang, "👋 Enter your phone number to receive OTP", "👋 OTP ಪಡೆಯಲು ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ")
                    : pick(lang, "👋 Register with just your name and number", "👋 ಕೇವಲ ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ಸಂಖ್ಯೆಯಿಂದ ನೋಂದಣಿ ಮಾಡಿ")}
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
                {pick(
                  lang,
                  "Demo accounts stay available for judges, and the project data has been reset so you can start fresh.",
                  "ನ್ಯಾಯಾಧೀಶರಿಗಾಗಿ ಡೆಮೊ ಖಾತೆಗಳು ಲಭ್ಯವಿವೆ, ಮತ್ತು ನೀವು ಶುದ್ಧವಾಗಿ ಪ್ರಾರಂಭಿಸಲು ಪ್ರಾಜೆಕ್ಟ್ ಡೇಟಾವನ್ನು ಮರುಹೊಂದಿಸಲಾಗಿದೆ."
                )}
              </div>
            </div>

            {tab === "login" && (
              <div style={{ background: "#fff8e7", border: "1px solid #f5d090", borderRadius: 14, padding: "12px 14px", marginBottom: 18 }}>
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
                          {roleMeta.label} · {demoUser.phone}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {tab === "register" && (
                <>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>
                      {pick(lang, "Full Name *", "ಪೂರ್ಣ ಹೆಸರು *")}
                    </label>
                    <input
                      style={inp}
                      name="name"
                      value={form.name}
                      onChange={h}
                      placeholder={pick(lang, "e.g. Ramu Gowda", "ಉದಾ. ರಾಮು ಗೌಡ")}
                      onFocus={(event) => { event.target.style.borderColor = "var(--green)"; }}
                      onBlur={(event) => { event.target.style.borderColor = "var(--border)"; }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 8 }}>
                      {pick(lang, "Select Role *", "ಪಾತ್ರ ಆಯ್ಕೆ ಮಾಡಿ *")}
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {Object.entries(roles).map(([key, role]) => (
                        <div
                          key={key}
                          onClick={() => setForm((current) => ({ ...current, role: key }))}
                          style={{ padding: "12px 8px", borderRadius: 14, border: `2px solid ${form.role === key ? role.color : "var(--border)"}`, background: form.role === key ? role.bg : "#fff", cursor: "pointer", textAlign: "center", transition: "all .15s" }}
                        >
                          <div style={{ fontSize: 22, marginBottom: 4 }}>{role.icon}</div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: form.role === key ? role.color : "var(--text3)" }}>{role.short}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {!otpMeta && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>
                    {pick(lang, "Phone Number *", "ಫೋನ್ ಸಂಖ್ಯೆ *")}
                  </label>
                  <input
                    style={inp}
                    name="phone"
                    value={form.phone}
                    onChange={h}
                    placeholder={pick(lang, "+91 XXXXX XXXXX", "+91 XXXXX XXXXX")}
                    onFocus={(event) => { event.target.style.borderColor = "var(--green)"; }}
                    onBlur={(event) => { event.target.style.borderColor = "var(--border)"; }}
                  />
                </div>
              )}

              {otpMeta && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: .5, display: "block", marginBottom: 6 }}>
                    {pick(lang, "OTP Verification", "OTP ಪರಿಶೀಲನೆ")}
                  </label>
                  <input
                    style={{ ...inp, letterSpacing: 6, textAlign: "center", fontWeight: 900 }}
                    value={otpCode}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="------"
                    onFocus={(event) => { event.target.style.borderColor = "var(--green)"; }}
                    onBlur={(event) => { event.target.style.borderColor = "var(--border)"; }}
                  />
                  <div style={{ fontSize: 11, color: "var(--text4)", marginTop: 6 }}>
                    {otpMeta.deliveryMode === "live"
                      ? pick(lang, `Sent to ${otpMeta.phone}. Enter the same 6-digit OTP from SMS.`, `${otpMeta.phone} ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. SMS ನಲ್ಲಿರುವ ಅದೇ 6 ಅಂಕೆಯ OTP ನಮೂದಿಸಿ.`)
                      : pick(lang, `Sent to ${otpMeta.phone}. For demo, OTP auto-fills and continues.`, `${otpMeta.phone} ಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ಡೆಮೋಗಾಗಿ OTP ಸ್ವಯಂ ತುಂಬಿ ಮುಂದುವರಿಯುತ್ತದೆ.`)}
                  </div>
                </div>
              )}

              {err && (
                <div style={{ background: "#fdecea", border: "1px solid #f5b8b4", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "var(--red)", display: "flex", alignItems: "center", gap: 8 }}>
                  ⚠️ {err}
                </div>
              )}

              <button
                onClick={submit}
                disabled={loading}
                style={{ width: "100%", padding: "13px", borderRadius: 14, border: "none", background: loading ? "var(--border)" : "linear-gradient(135deg, var(--gold), var(--green))", color: "#fff", fontSize: 15, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all .15s", boxShadow: loading ? "none" : "0 14px 32px rgba(154,85,35,.14)" }}
              >
                {loading
                  ? pick(lang, "⏳ Please wait...", "⏳ ದಯವಿಟ್ಟು ಕಾಯಿರಿ...")
                  : otpMeta
                    ? pick(lang, "✅ Verify OTP", "✅ OTP ಪರಿಶೀಲಿಸಿ")
                    : tab === "login"
                      ? pick(lang, "📲 Send OTP", "📲 OTP ಕಳುಹಿಸಿ")
                      : pick(lang, "📲 Register with OTP", "📲 OTP ಮೂಲಕ ನೋಂದಣಿ ಮಾಡಿ")}
              </button>

              <div style={{ textAlign: "center", fontSize: 13, color: "var(--text3)" }}>
                {tab === "login"
                  ? <>{pick(lang, "Don't have an account?", "ಖಾತೆ ಇಲ್ಲವೇ?")} <span onClick={() => { setTab("register"); setErr(""); }} style={{ color: "var(--green)", fontWeight: 800, cursor: "pointer" }}>{pick(lang, "Register here", "ಇಲ್ಲಿ ನೋಂದಣಿ ಮಾಡಿ")}</span></>
                  : <>{pick(lang, "Already have an account?", "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?")} <span onClick={() => { setTab("login"); setErr(""); }} style={{ color: "var(--green)", fontWeight: 800, cursor: "pointer" }}>{pick(lang, "Login here", "ಇಲ್ಲಿ ಲಾಗಿನ್ ಮಾಡಿ")}</span></>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
