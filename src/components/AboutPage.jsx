import { pick, tDistrict } from "../i18n.js";

export default function AboutPage({ setPage, lang }) {
  const visuals = {
    hero: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1400&q=80",
    farmer: "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=900&q=80",
    produce: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=80",
    delivery: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=900&q=80",
    mission: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&q=80",
    districts: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=1200&q=80",
  };

  const features = lang === "kn"
    ? [
        {
          icon: "🔥",
          title: "ರಿಯಲ್-ಟೈಮ್ ಬಿಡ್ ಹೋರಾಟ",
          desc: "ಯಾವುದೇ ಜಿಲ್ಲೆಯಿಂದ ಖರೀದಿದಾರರು ಲೈವ್ ಆಗಿ ಸ್ಪರ್ಧಿಸುತ್ತಾರೆ. ರೈತರಿಗೆ ಪ್ರತಿಯೊಂದು ಬಿಡ್ ಕೂಡ ತಕ್ಷಣ ಕಾಣುತ್ತದೆ ಮತ್ತು ಅವರು ಸಂಪೂರ್ಣ ಪಾರದರ್ಶಕತೆಯಲ್ಲಿ ಉತ್ತಮ ಬಿಡ್ ಸ್ವೀಕರಿಸಬಹುದು.",
        },
        {
          icon: "📊",
          title: "ಲೈವ್ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ ದರಗಳು",
          desc: "ಕರ್ನಾಟಕದ ಪ್ರಮುಖ ಮಂಡಿಗಳ ದರಗಳು ರೈತರಿಗೆ ಆಫರ್‌ಗಳನ್ನು ಹೋಲಿಸಿ ಸರಿಯಾದ ಆರಂಭಿಕ ಬೆಲೆ ನಿಗದಿಪಡಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ.",
        },
        {
          icon: "📸",
          title: "ನಿಜವಾದ ಬೆಳೆ ಫೋಟೋಗಳು",
          desc: "ರೈತರು ನಿಜವಾದ ಬೆಳೆ ಚಿತ್ರಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡುತ್ತಾರೆ, ಆದ್ದರಿಂದ ಖರೀದಿದಾರರು ಬಿಡ್ ಮಾಡುವ ಮುನ್ನ ಗುಣಮಟ್ಟ ಪರಿಶೀಲಿಸಬಹುದು. ನಂಬಿಕೆ ಹೆಚ್ಚಿದಂತೆ ಬಿಡ್‌ಗಳೂ ಉತ್ತಮವಾಗುತ್ತವೆ.",
        },
        {
          icon: "📍",
          title: "18+ ಕರ್ನಾಟಕ ಸ್ಥಳಗಳು",
          desc: "ಗ್ರಾಮ, ಜಿಲ್ಲೆ ಮತ್ತು PIN ಬೆಂಬಲವು ಲಿಸ್ಟಿಂಗ್‌ಗಳನ್ನು ಖಚಿತಗೊಳಿಸುತ್ತದೆ ಮತ್ತು ಫಾರ್ಮ್ ಗೇಟ್ ಪಿಕಪ್ ಅನ್ನು ವಿತರಣಾ ಸಹಭಾಗಿಗಳಿಗೆ ಇನ್ನಷ್ಟು ಸುಲಭಗೊಳಿಸುತ್ತದೆ.",
        },
        {
          icon: "🌦️",
          title: "ಹವಾಮಾನ + ಸಮಯ ಸೂಚನೆಗಳು",
          desc: "ಜಿಲ್ಲೆ ಮಟ್ಟದ ಹವಾಮಾನ ಮಾಹಿತಿ ರೈತರಿಗೆ ಬೇಗ ಕೆಡುವ ಬೆಳೆಗಳಿಗೆ ಉತ್ತಮ ಕೊಯ್ಲು ಮತ್ತು ಪೋಸ್ಟ್ ಸಮಯ ಆಯ್ಕೆ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
        },
        {
          icon: "🚛",
          title: "ಫಾರ್ಮ್ ಗೇಟ್ ಪಿಕಪ್",
          desc: "ಒಪ್ಪಂದ ಸ್ವೀಕರಿಸಿದ ತಕ್ಷಣ ವಿತರಣಾ ಸಹಭಾಗಿಗಳು ಮಾರ್ಗವನ್ನು ಕ್ಲೇಮ್ ಮಾಡಿ ಬೆಳೆಯನ್ನು ನೇರವಾಗಿ ಫಾರ್ಮ್‌ನಿಂದ ಎತ್ತಿಕೊಳ್ಳಬಹುದು.",
        },
      ]
    : [
        {
          icon: "🔥",
          title: "Real-time Bidding Wars",
          desc: "Retailers from any district compete live. Farmers see every bid instantly and can accept the best one with complete transparency.",
        },
        {
          icon: "📊",
          title: "Live APMC Market Rates",
          desc: "Market prices from major Karnataka mandis help farmers compare offers and decide the right auction floor before posting.",
        },
        {
          icon: "📸",
          title: "Real Crop Photos",
          desc: "Farmers upload actual crop images so buyers can inspect quality before bidding. Better trust leads to stronger offers.",
        },
        {
          icon: "📍",
          title: "18+ Karnataka Locations",
          desc: "Village, district and PIN support keeps listings precise and makes farm-gate pickups easier for delivery partners.",
        },
        {
          icon: "🌦️",
          title: "Weather + Timing Signals",
          desc: "District-level weather context helps farmers choose better harvest and posting windows for perishable produce.",
        },
        {
          icon: "🚛",
          title: "Farm Gate Pickup",
          desc: "Once a deal is accepted, delivery partners can claim the route and pick up the crop directly from the farm.",
        },
      ];

  const journey = lang === "kn"
    ? [
        {
          icon: "🧑‍🌾",
          title: "ರೈತ ಮೊದಲು",
          subtitle: "ಪೋಸ್ಟ್ ಮಾಡಿ, ಹೋಲಿಸಿ, ವಿಶ್ವಾಸದಿಂದ ಮಾರಾಟ ಮಾಡಿ",
          image: visuals.farmer,
          points: ["ನಿಜವಾದ ಉತ್ಪನ್ನದ ಫೋಟೋಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ", "ಸ್ವೀಕರಿಸಬಹುದಾದ ಕನಿಷ್ಠ ಬಿಡ್ ನಿಗದಿ ಮಾಡಿ", "ನಿಮ್ಮ ಷರತ್ತುಗಳ ಮೇಲೆ ಉತ್ತಮ ಆಫರ್ ಸ್ವೀಕರಿಸಿ"],
        },
        {
          icon: "🏪",
          title: "ಖರೀದಿದಾರರಿಗೆ ಸಿದ್ಧ",
          subtitle: "ಖರೀದಿದಾರರು ನಂಬಿಕೆಯ ಲಿಸ್ಟಿಂಗ್‌ಗಳ ಮೇಲೆ ಬಿಡ್ ಮಾಡುತ್ತಾರೆ",
          image: visuals.produce,
          points: ["ಕರ್ನಾಟಕದಾದ್ಯಂತದ ಬೆಳೆಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ", "ಲೈವ್ ಬಿಡ್‌ಗಳನ್ನು ಎಪಿಎಂಸಿ ದರಗಳೊಂದಿಗೆ ಹೋಲಿಸಿ", "ನೇರವಾಗಿ ಫಾರ್ಮ್‌ಗಳಿಂದ ಹೆಚ್ಚು ತಾಜಾ ಉತ್ಪನ್ನ ಪಡೆಯಿರಿ"],
        },
        {
          icon: "🚛",
          title: "ವಿತರಣೆಯ ಸಂಪರ್ಕ",
          subtitle: "ಪಿಕಪ್ ಮತ್ತು ಡೆಲಿವರಿ ಒಂದೇ ಹರಿವಿನಲ್ಲಿ ಇರುತ್ತದೆ",
          image: visuals.delivery,
          points: ["ಒಂದು ಕ್ಲಿಕ್‌ನಲ್ಲಿ ಕಾರ್ಯ ಸ್ವೀಕರಿಸಿ", "ಖಚಿತ ಪಿಕಪ್ ವಿವರಗಳು ಮತ್ತು PIN ಬಳಸಿ", "ಎಲ್ಲರಿಗೂ ಲೈವ್ ಮಾರ್ಗ ಸ್ಥಿತಿ ನವೀಕರಿಸಿ"],
        },
      ]
    : [
        {
          icon: "🧑‍🌾",
          title: "Farmer First",
          subtitle: "Post, compare, and sell with confidence",
          image: visuals.farmer,
          points: ["Upload photos of real produce", "Set the minimum acceptable bid", "Accept the best offer on your terms"],
        },
        {
          icon: "🏪",
          title: "Buyer Ready",
          subtitle: "Retailers bid on trusted, verified listings",
          image: visuals.produce,
          points: ["Browse crops across Karnataka", "Compare live bids with APMC context", "Secure fresher produce directly from farms"],
        },
        {
          icon: "🚛",
          title: "Delivery Connected",
          subtitle: "Pickup and delivery stay inside one flow",
          image: visuals.delivery,
          points: ["Claim jobs in one click", "Use exact pickup details and PIN codes", "Update route status for everyone live"],
        },
      ];

  const stats = lang === "kn"
    ? [
        { value: "35L+", label: "ಕರ್ನಾಟಕದ ರೈತರು" },
        { value: "₹0", label: "ವೇದಿಕೆ ಕಮಿಷನ್" },
        { value: "18+", label: "ವ್ಯಾಪ್ತಿಯ ಜಿಲ್ಲೆಗಳು" },
        { value: "3 ಪಾತ್ರಗಳು", label: "ಒಂದೇ ವ್ಯವಸ್ಥೆಯಲ್ಲಿ" },
      ]
    : [
        { value: "35L+", label: "farmers in Karnataka" },
        { value: "₹0", label: "platform commission" },
        { value: "18+", label: "districts covered" },
        { value: "3 roles", label: "working in one system" },
      ];

  const standoutPoints = lang === "kn"
    ? [
        "ಮೊದಲ ಕಾಣಿಕೆಯಲ್ಲಿ ಹೆಚ್ಚು ಭಾವನಾತ್ಮಕ ಮತ್ತು ನೆನಪಿನಲ್ಲಿ ಉಳಿಯುವ ಅನುಭವ",
        "ಪ್ರಾರಂಭದಿಂದ ಅಂತ್ಯದವರೆಗಿನ ಕೆಲಸದ ಹರಿವಿನ ಸ್ಪಷ್ಟ ವಿವರಣೆ",
        "ಸರಳ ಪಠ್ಯ ಬ್ಲಾಕ್‌ಗಳ ಬದಲು ಕೃಷಿಗೆ ಸಂಬಂಧಿಸಿದ ಚಿತ್ರಗಳು",
        "ಟೆಕ್ನಿಕಲ್ ಸ್ಟ್ಯಾಕ್ ವಿಭಾಗವಿಲ್ಲದ ಸ್ವಚ್ಛ ಪ್ರಸ್ತುತಿ",
      ]
    : [
        "More emotional and memorable first impression",
        "Clearer explanation of the end-to-end workflow",
        "Agriculture-focused imagery instead of plain text blocks",
        "Cleaner presentation without the technical stack section",
      ];

  const districts = [
    "Hassan",
    "Mysuru",
    "Mandya",
    "Ramanagara",
    "Kolar",
    "Tumakuru",
    "Bengaluru Rural",
    "Shivamogga",
    "Davangere",
    "Dharwad",
    "Raichur",
    "Bidar",
    "Chikkamagaluru",
    "Sira",
    "Tiptur",
    "Hoskote",
    "Channapatna",
  ];

  const cardStyle = {
    background: "#fff",
    border: "1px solid var(--border)",
    borderRadius: 20,
    boxShadow: "var(--shadow-sm)",
  };

  return (
    <div style={{ background: "linear-gradient(180deg,#f4faf5 0%, var(--bg) 28%, var(--bg) 100%)", paddingBottom: 72 }}>
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(18,64,30,0.96) 0%, rgba(33,95,43,0.92) 54%, rgba(45,122,58,0.88) 100%)",
          padding: "68px 24px 110px",
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: 28,
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  marginBottom: 18,
                }}
              >
                <span>🌾</span>
                {pick(lang, "Built for Karnataka's farm economy", "ಕರ್ನಾಟಕದ ಕೃಷಿ ಆರ್ಥಿಕತೆಗೆ ನಿರ್ಮಿಸಲಾಗಿದೆ")}
              </div>
              <h1 style={{ fontSize: "clamp(2.3rem,5vw,3.6rem)", lineHeight: 1.05, fontWeight: 900, marginBottom: 16 }}>
                {pick(lang, "About Raitha Reach", "ರೈತ ರೀಚ್ ಬಗ್ಗೆ")}
              </h1>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: "rgba(255,255,255,0.82)", maxWidth: 560, marginBottom: 28 }}>
                {pick(
                  lang,
                  "Raitha Reach is a farm-direct platform that helps farmers sell smarter, helps retailers buy fresher, and makes delivery part of the same seamless journey.",
                  "ರೈತ ರೀಚ್ ಎನ್ನುವುದು ರೈತರು ಹೆಚ್ಚು ಚಾಣಾಕ್ಷವಾಗಿ ಮಾರಾಟ ಮಾಡಲು, ಖರೀದಿದಾರರು ಹೆಚ್ಚು ತಾಜಾ ಉತ್ಪನ್ನ ಖರೀದಿಸಲು ಮತ್ತು ವಿತರಣೆಯನ್ನು ಅದೇ ಸರಳ ಪ್ರಯಾಣದ ಭಾಗವಾಗಿಸಲು ಸಹಾಯ ಮಾಡುವ ಫಾರ್ಮ್-ಡೈರೆಕ್ಟ್ ವೇದಿಕೆ."
                )}
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
                <button
                  onClick={() => setPage("auth")}
                  style={{
                    background: "#fff",
                    color: "#1e5c28",
                    border: "none",
                    padding: "13px 24px",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {pick(lang, "🚀 Join the Platform", "🚀 ವೇದಿಕೆಗೆ ಸೇರಿ")}
                </button>
                <button
                  onClick={() => window.scrollTo({ top: 760, behavior: "smooth" })}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.3)",
                    padding: "13px 22px",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {pick(lang, "Explore the Story", "ಕಥೆಯನ್ನು ನೋಡಿ")}
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                  gap: 12,
                }}
              >
                {stats.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: "16px 14px",
                      borderRadius: 16,
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, marginBottom: 6 }}>{item.value}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", textTransform: "uppercase", letterSpacing: 0.6 }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.35fr 1fr",
                gap: 14,
                minHeight: 420,
              }}
            >
              <div
                style={{
                  borderRadius: 28,
                  overflow: "hidden",
                  position: "relative",
                  minHeight: 420,
                  boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
                }}
              >
                <img
                  src={visuals.hero}
                  alt={pick(lang, "Green farmland in Karnataka", "ಕರ್ನಾಟಕದ ಹಸಿರು ಕೃಷಿಭೂಮಿ")}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(10,25,10,0.05) 0%, rgba(10,25,10,0.62) 100%)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 18,
                    right: 18,
                    bottom: 18,
                    padding: "14px 16px",
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.16)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#b5f5c6", marginBottom: 6 }}>
                    {pick(lang, "FARM TO MARKET, WITHOUT THE MIDDLEMAN", "ಫಾರ್ಮ್‌ನಿಂದ ಮಾರುಕಟ್ಟೆಗೆ, ಮಧ್ಯವರಿಯಿಲ್ಲದೆ")}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.88)" }}>
                    {pick(
                      lang,
                      "A stronger pitch comes from showing the full ecosystem, not just the product.",
                      "ಬಲವಾದ ಪ್ರಸ್ತುತಿ ಕೇವಲ ಉತ್ಪನ್ನವಲ್ಲ, ಸಂಪೂರ್ಣ ಪರಿಸರವನ್ನು ತೋರಿಸಿದಾಗ ಮೂಡುತ್ತದೆ."
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                {[visuals.farmer, visuals.produce].map((image, index) => (
                  <div
                    key={image}
                    style={{
                      borderRadius: 22,
                      overflow: "hidden",
                      minHeight: 203,
                      position: "relative",
                      boxShadow: "0 14px 38px rgba(0,0,0,0.14)",
                    }}
                  >
                    <img
                      src={image}
                      alt={index === 0 ? pick(lang, "Farmer in the field", "ಹೊಳೆಯಲ್ಲಿ ರೈತ") : pick(lang, "Fresh produce ready for buyers", "ಖರೀದಿದಾರರಿಗೆ ತಯಾರಾದ ತಾಜಾ ಉತ್ಪನ್ನ")}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        left: 14,
                        bottom: 14,
                        padding: "8px 12px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.86)",
                        color: "#1a2e1c",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {index === 0 ? pick(lang, "Farmer story", "ರೈತನ ಕಥೆ") : pick(lang, "Fresh produce trust", "ತಾಜಾ ಉತ್ಪನ್ನದ ನಂಬಿಕೆ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "-56px auto 0", padding: "0 24px" }}>
        <div
          style={{
            ...cardStyle,
            padding: 30,
            marginBottom: 28,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
            gap: 28,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--green)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              {pick(lang, "Our Mission", "ನಮ್ಮ ಧ್ಯೇಯ")}
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", lineHeight: 1.15, marginBottom: 14 }}>
              {pick(lang, "Better prices for farmers. Better sourcing for buyers.", "ರೈತರಿಗೆ ಉತ್ತಮ ಬೆಲೆ. ಖರೀದಿದಾರರಿಗೆ ಉತ್ತಮ ಮೂಲಸಾಗಣೆ.")}
            </h2>
            <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.8, marginBottom: 12 }}>
              {pick(
                lang,
                "Karnataka has millions of farmers, but too many still lose value to commission agents and broken supply chains. Raitha Reach creates a cleaner path from farm to buyer.",
                "ಕರ್ನಾಟಕದಲ್ಲಿ ಲಕ್ಷಾಂತರ ರೈತರು ಇದ್ದರೂ, ಇನ್ನೂ ಅನೇಕರು ಕಮಿಷನ್ ಏಜೆಂಟ್‌ಗಳು ಮತ್ತು ಮುರಿದ ಸರಬರಾಜು ಸರಪಳಿಗಳಿಂದ ಮೌಲ್ಯ ಕಳೆದುಕೊಳ್ಳುತ್ತಿದ್ದಾರೆ. ರೈತ ರೀಚ್ ಫಾರ್ಮ್‌ನಿಂದ ಖರೀದಿದಾರನಿಗೆ ಸ್ವಚ್ಛವಾದ ಮಾರ್ಗವನ್ನು ನಿರ್ಮಿಸುತ್ತದೆ."
              )}
            </p>
            <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.8 }}>
              {pick(
                lang,
                "Farmers post crops, retailers bid live, and delivery partners close the loop with farm-gate pickup. The result is transparent pricing, faster movement, and more dignity for the people who grow the food.",
                "ರೈತರು ಬೆಳೆಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡುತ್ತಾರೆ, ಖರೀದಿದಾರರು ಲೈವ್ ಬಿಡ್ ಮಾಡುತ್ತಾರೆ, ಮತ್ತು ವಿತರಣಾ ಸಹಭಾಗಿಗಳು ಫಾರ್ಮ್-ಗೇಟ್ ಪಿಕಪ್ ಮೂಲಕ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸುತ್ತಾರೆ. ಪರಿಣಾಮವಾಗಿ ಪಾರದರ್ಶಕ ಬೆಲೆ, ವೇಗವಾದ ಸಾಗಾಟ ಮತ್ತು ಆಹಾರ ಬೆಳೆಸುವವರಿಗೆ ಹೆಚ್ಚುವರಿ ಗೌರವ ಸಿಗುತ್ತದೆ."
              )}
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ borderRadius: 24, overflow: "hidden", minHeight: 320 }}>
              <img
                src={visuals.mission}
                alt={pick(lang, "Farm produce and cultivation", "ಕೃಷಿ ಉತ್ಪನ್ನ ಮತ್ತು ಬೆಳೆಗಾರಿಕೆ")}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                right: 18,
                bottom: 18,
                maxWidth: 240,
                padding: "16px 18px",
                borderRadius: 18,
                background: "rgba(255,255,255,0.92)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
              <div style={{ fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>
                {pick(lang, "One platform, three stakeholders", "ಒಂದು ವೇದಿಕೆ, ಮೂರು ಹಿತಾಸಕ್ತಿಪಕ್ಷಗಳು")}
              </div>
              <div style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.7 }}>
                {pick(
                  lang,
                  "A strong hackathon story is visible here: economic impact, operational clarity, and a complete user journey.",
                  "ಇಲ್ಲಿ ಬಲವಾದ ಹ್ಯಾಕಥಾನ್ ಕಥೆ ಕಾಣುತ್ತದೆ: ಆರ್ಥಿಕ ಪರಿಣಾಮ, ಕಾರ್ಯಾಚರಣೆಯ ಸ್ಪಷ್ಟತೆ ಮತ್ತು ಸಂಪೂರ್ಣ ಬಳಕೆದಾರರ ಪ್ರಯಾಣ."
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 34 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--green)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              {pick(lang, "Platform Features", "ವೇದಿಕೆಯ ವೈಶಿಷ್ಟ್ಯಗಳು")}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", marginBottom: 6 }}>
              {pick(lang, "Everything important, shown clearly", "ಮುಖ್ಯವಾದ ಎಲ್ಲವೂ ಸ್ಪಷ್ಟವಾಗಿ ತೋರಿಸಲಾಗಿದೆ")}
            </h2>
            <p style={{ fontSize: 14, color: "var(--text3)" }}>
              {pick(
                lang,
                "The page now feels more like a product story than a plain documentation block.",
                "ಈ ಪುಟವು ಈಗ ಸರಳ ಡಾಕ್ಯುಮೆಂಟೇಶನ್ ಬ್ಲಾಕ್‌ಗಿಂತ ಉತ್ಪನ್ನದ ಕಥೆಯಂತೆ ಕಾಣುತ್ತದೆ."
              )}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
            {features.map((feature) => (
              <div
                key={feature.title}
                style={{
                  ...cardStyle,
                  padding: "22px 20px",
                  transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "var(--shadow)";
                  e.currentTarget.style.borderColor = "var(--green-mid)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{feature.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>{feature.title}</div>
                <div style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.72 }}>{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--green)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              {pick(lang, "The Journey", "ಪ್ರಯಾಣ")}
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", marginBottom: 6 }}>
              {pick(lang, "A visual flow judges can understand in seconds", "ಕೆಲವು ಸೆಕೆಂಡುಗಳಲ್ಲಿ ನ್ಯಾಯಾಧೀಶರು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವ ದೃಶ್ಯ ಹರಿವು")}
            </h2>
            <p style={{ fontSize: 14, color: "var(--text3)" }}>
              {pick(
                lang,
                "Each image card tells a role-based story, which makes the About page feel more pitch-ready and memorable.",
                "ಪ್ರತಿ ಚಿತ್ರ ಕಾರ್ಡ್ ಒಂದು ಪಾತ್ರ ಆಧಾರಿತ ಕಥೆಯನ್ನು ಹೇಳುತ್ತದೆ, ಇದರಿಂದ About ಪುಟ ಹೆಚ್ಚು ಪ್ರಸ್ತುತಿ-ಸಿದ್ಧ ಮತ್ತು ನೆನಪಿನಲ್ಲಿ ಉಳಿಯುವಂತಾಗುತ್ತದೆ."
              )}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 16 }}>
            {journey.map((item) => (
              <div key={item.title} style={{ ...cardStyle, overflow: "hidden" }}>
                <div style={{ height: 210, position: "relative" }}>
                  <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, rgba(10,20,10,0.08) 0%, rgba(10,20,10,0.66) 100%)",
                    }}
                  />
                  <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
                    <div style={{ fontSize: 30, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>{item.subtitle}</div>
                  </div>
                </div>
                <div style={{ padding: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {item.points.map((point) => (
                      <div key={point} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--text2)", lineHeight: 1.65 }}>
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "var(--green-pale)",
                            color: "var(--green)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                            flexShrink: 0,
                          }}
                        >
                          ✓
                        </span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18, marginBottom: 32 }}>
          <div style={{ ...cardStyle, overflow: "hidden" }}>
            <div style={{ height: 220 }}>
              <img
                src={visuals.districts}
                alt={pick(lang, "Landscape representing Karnataka districts", "ಕರ್ನಾಟಕದ ಜಿಲ್ಲೆಗಳ ಪ್ರತಿನಿಧಿ ದೃಶ್ಯ")}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
            <div style={{ padding: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", marginBottom: 6 }}>
                {pick(lang, "📍 Districts Covered", "📍 ವ್ಯಾಪ್ತಿಯ ಜಿಲ್ಲೆಗಳು")}
              </h2>
              <p style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.7, marginBottom: 16 }}>
                {pick(
                  lang,
                  "Auto-complete with PIN codes and district awareness makes the product feel practical, local, and ready for real field use.",
                  "PIN ಕೋಡ್‌ಗಳು ಮತ್ತು ಜಿಲ್ಲಾ ಅರಿವಿನೊಂದಿಗೆ ಇರುವ ಸ್ವಯಂ-ಪೂರ್ಣಗೊಳಿಸುವಿಕೆ ಈ ಉತ್ಪನ್ನವನ್ನು ಪ್ರಾಯೋಗಿಕ, ಸ್ಥಳೀಯ ಮತ್ತು ನೈಜ ಕ್ಷೇತ್ರ ಬಳಕೆಗೆ ಸಿದ್ಧವಾದಂತೆ ಕಾಣಿಸುತ್ತದೆ."
                )}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {districts.map((district) => (
                  <span
                    key={district}
                    style={{
                      background: "var(--green-pale)",
                      color: "var(--green)",
                      border: "1px solid var(--green-mid)",
                      padding: "6px 12px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    📍 {tDistrict(district, lang)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              padding: 24,
              background: "linear-gradient(135deg,#143a1d 0%, #1f5f2c 55%, #2d7a3a 100%)",
              color: "#fff",
              border: "none",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: "#b5f5c6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              {pick(lang, "Why It Stands Out", "ಇದು ಯಾಕೆ ವಿಶೇಷ")}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.15, marginBottom: 12 }}>
              {pick(lang, "This About page now sells the vision, not just the feature list.", "ಈ About ಪುಟವು ಈಗ ಕೇವಲ ವೈಶಿಷ್ಟ್ಯಗಳ ಪಟ್ಟಿಯನ್ನು ಅಲ್ಲ, ದೃಷ್ಟಿಯನ್ನೇ ಪರಿಚಯಿಸುತ್ತದೆ.")}
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "rgba(255,255,255,0.82)", marginBottom: 20 }}>
              {pick(
                lang,
                "Strong visuals, role-based storytelling, local relevance, and a clear impact narrative make the project feel more polished for hackathon demos and judging rounds.",
                "ಬಲವಾದ ದೃಶ್ಯಗಳು, ಪಾತ್ರ ಆಧಾರಿತ ಕಥನ, ಸ್ಥಳೀಯ ಹೊಂದಾಣಿಕೆ ಮತ್ತು ಸ್ಪಷ್ಟ ಪರಿಣಾಮ ಕಥಾವಳಿ ಈ ಯೋಜನೆಯನ್ನು ಹ್ಯಾಕಥಾನ್ ಡೆಮೊಗಳು ಮತ್ತು ನ್ಯಾಯಪಾಲನಾ ಸುತ್ತುಗಳಿಗೆ ಹೆಚ್ಚು ನಯಗೊಳಿಸಿದಂತೆ ತೋರಿಸುತ್ತವೆ."
              )}
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              {standoutPoints.map((point) => (
                <div
                  key={point}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    padding: "10px 12px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.09)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontSize: 13,
                    lineHeight: 1.65,
                  }}
                >
                  <span style={{ color: "#b5f5c6" }}>✦</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "linear-gradient(135deg,var(--green-pale),#fff)",
            border: "1px solid var(--green-mid)",
            borderRadius: 24,
            padding: "38px 26px",
            textAlign: "center",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ fontSize: 42, marginBottom: 14 }}>🌾</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", marginBottom: 8 }}>
            {pick(lang, "Ready to join the movement?", "ಈ ಪ್ರಯಾಣಕ್ಕೆ ಸೇರಲು ಸಿದ್ಧವೇ?")}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text3)", maxWidth: 580, margin: "0 auto 22px", lineHeight: 1.75 }}>
            {pick(
              lang,
              "It is free to join, simple to use, and built to help every stakeholder in the farm-to-market chain work together better.",
              "ಇದಕ್ಕೆ ಸೇರುವುದು ಉಚಿತ, ಬಳಸಲು ಸರಳ, ಮತ್ತು ಫಾರ್ಮ್‌ನಿಂದ ಮಾರುಕಟ್ಟೆಯ ಸರಪಳಿಯಲ್ಲಿರುವ ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ಒಟ್ಟಾಗಿ ಉತ್ತಮವಾಗಿ ಕೆಲಸ ಮಾಡಲು ನಿರ್ಮಿಸಲಾಗಿದೆ."
            )}
          </p>
          <button
            onClick={() => setPage("auth")}
            style={{
              background: "var(--green)",
              color: "#fff",
              border: "none",
              padding: "14px 32px",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "transform .15s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "";
            }}
          >
            {pick(lang, "🚀 Create Free Account", "🚀 ಉಚಿತ ಖಾತೆ ರಚಿಸಿ")}
          </button>
        </div>
      </div>
    </div>
  );
}
