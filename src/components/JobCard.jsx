import { Badge, Stepper } from "./UI.jsx";
import { KA_LOCS } from "../data/constants.js";
import { fmtP, timeAgo } from "../utils/helpers.js";
import { pick, tCrop, tLocation } from "../i18n.js";

function getLocationPoint(village, district) {
  return KA_LOCS.find((loc) => loc.n === village)
    || KA_LOCS.find((loc) => loc.n === district)
    || KA_LOCS.find((loc) => loc.d === district)
    || null;
}

function getMapLinks(point, fallbackLabel) {
  const query = point ? `${point.lat},${point.lng}` : fallbackLabel;
  const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  if (!point) {
    return { searchUrl, embedUrl: "" };
  }

  const deltaLat = 0.045;
  const deltaLng = 0.065;
  const bbox = [
    point.lng - deltaLng,
    point.lat - deltaLat,
    point.lng + deltaLng,
    point.lat + deltaLat,
  ].join("%2C");

  return {
    searchUrl,
    embedUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${point.lat}%2C${point.lng}`,
  };
}

function actionLinkStyle(tone = "var(--green)") {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderRadius: 10,
    border: `1px solid ${tone === "var(--green)" ? "var(--green-mid)" : "var(--blue-pale)"}`,
    background: "#fff",
    color: tone,
    fontSize: 12,
    fontWeight: 800,
    textDecoration: "none",
  };
}

export default function JobCard({job,children,lang,role}){
  const farmerPoint = getLocationPoint(job.village, job.district);
  const farmerLabel = job.pickupAddress || tLocation(job.village, job.district, lang);
  const { searchUrl: farmerMapUrl, embedUrl: farmerMapEmbed } = getMapLinks(farmerPoint, farmerLabel);
  const smsFarmerBody = encodeURIComponent(`Hello ${job.farmerName}, this is ${job.deliveryName || "your delivery partner"}. I am coming to collect ${job.cropName} from your farm.`);
  const smsDeliveryBody = encodeURIComponent(`Hello ${job.deliveryName || "delivery partner"}, please contact me about the ${job.cropName} pickup.`);
  const pickupProofPending = Boolean(job.pickupOtp && !job.pickupOtpVerifiedAt);
  const isDelivery = role === "delivery";

  return(
    <div style={{background:isDelivery ? "linear-gradient(180deg,#fffdf9 0%,#ffffff 100%)" : "#fff",border:isDelivery ? "1px solid #d9d8e7" : "1px solid var(--border)",borderRadius:20,padding:18,marginBottom:14,boxShadow:"var(--shadow-sm)",transition:"all .2s"}}
      onMouseOver={e=>e.currentTarget.style.boxShadow="var(--shadow)"}
      onMouseOut={e=>e.currentTarget.style.boxShadow="var(--shadow-sm)"}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div>
          {isDelivery && (
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#f1ede2",border:"1px solid #e3d9bf",borderRadius:999,padding:"4px 10px",fontSize:10,fontWeight:800,color:"#7b5c23",textTransform:"uppercase",letterSpacing:.6,marginBottom:8}}>
              {pick(lang,"Dispatch Ticket","ಡಿಸ್ಪ್ಯಾಚ್ ಟಿಕೆಟ್")}
            </div>
          )}
          <div style={{fontWeight:800,fontSize:15,color:"var(--text)"}}>{job.emoji||"🌾"} {tCrop(job.cropName,lang)} · {job.quantity}{pick(lang,"kg","ಕೆಜಿ")}</div>
          <div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>{pick(lang,"Job","ಕಾರ್ಯ")} #{job.id.slice(-6).toUpperCase()} · {timeAgo(job.createdAt,lang)}</div>
        </div>
        <Badge status={job.status} lang={lang}/>
      </div>

      <Stepper status={job.status} lang={lang}/>

      <div style={{display:isDelivery ? "grid" : "block",gridTemplateColumns:isDelivery ? "repeat(auto-fit,minmax(320px,1fr))" : undefined,gap:isDelivery ? 18 : 0,alignItems:"start"}}>
        <div>
          {isDelivery && (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,margin:"12px 0"}}>
              {[
                [pick(lang,"Pickup","ಪಿಕಪ್"), tLocation(job.village, job.district, lang), pick(lang,"Farm gate","ಫಾರ್ಮ್ ಗೇಟ್"), "#7b5c23", "#fff8eb"],
                [pick(lang,"Wholesale Drop","ಸಗಟು ಡ್ರಾಪ್"), job.retailerVillage ? tLocation(job.retailerVillage, job.retailerDistrict, lang) : pick(lang,"Saved destination","ಉಳಿಸಿದ ಗಮ್ಯಸ್ಥಾನ"), pick(lang,"Buyer endpoint","ಖರೀದಿದಾರರ ಸ್ಥಳ"), "#41546f", "#f5f7fb"],
                [pick(lang,"Driver Payout","ಚಾಲಕರ ಪಾವತಿ"), fmtP(job.deliveryPayout || 0), `${pick(lang,"Fuel","ಇಂಧನ")}: ${fmtP(job.fuelAllowance || 0)}`, "var(--green)", "#f2f8ea"],
              ].map(([label, value, sub, tone, bg]) => (
                <div key={label} style={{background:bg,border:"1px solid rgba(122,122,122,.14)",borderRadius:14,padding:"10px 12px"}}>
                  <div style={{fontSize:10,fontWeight:800,color:"var(--text4)",textTransform:"uppercase",letterSpacing:.55,marginBottom:4}}>{label}</div>
                  <div style={{fontSize:13,fontWeight:800,color:"var(--text)",lineHeight:1.35}}>{value}</div>
                  <div style={{fontSize:11,color:tone,marginTop:3}}>{sub}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,margin:"12px 0"}}>
            {[
              [pick(lang,"Farmer","ರೈತ"),   `🧑‍🌾 ${job.farmerName}`,  `📞 ${job.farmerPhone}`,    "var(--green)"],
              [pick(lang,"Wholesaler","ಸಗಟು ಖರೀದಿದಾರ"), `🏪 ${job.retailerName}`, `📞 ${job.retailerPhone}`,   "var(--blue)"],
              [pick(lang,"Deal Price","ಒಪ್ಪಂದ ಬೆಲೆ"),`${fmtP(job.winningBid)}${pick(lang,"/kg","/ಕೆಜಿ")}`,`${pick(lang,"Total","ಒಟ್ಟು")}: ${fmtP(job.winningBid*job.quantity)}`,"var(--gold)"],
              [pick(lang,"Pickup","ಪಿಕಪ್"),   `📍 ${tLocation(job.village, job.district, lang)}`, job.deliveryName ? `🚛 ${job.deliveryName} · 📞 ${job.deliveryPhone}` : pick(lang,"Awaiting driver","ಡ್ರೈವರ್ ನಿರೀಕ್ಷೆಯಲ್ಲಿ"),"var(--text3)"],
              [pick(lang,"Route","ಮಾರ್ಗ"), `🛣️ ~${job.routeKm || 0}${pick(lang," km"," ಕಿಮೀ")}`, job.retailerVillage ? `🏪 ${tLocation(job.retailerVillage, job.retailerDistrict, lang)}` : pick(lang,"Wholesale destination saved","ಸಗಟು ಗಮ್ಯಸ್ಥಾನ ಉಳಿಸಲಾಗಿದೆ"), "var(--text3)"],
              [pick(lang,"Driver Payout","ಚಾಲಕರ ಪಾವತಿ"), `${fmtP(job.deliveryPayout || 0)}`, `${pick(lang,"Fuel","ಇಂಧನ")}: ${fmtP(job.fuelAllowance || 0)}`, "var(--green)"],
            ].map(([l,v,s,sc])=>(
              <div key={l} style={{background:isDelivery ? "#fcfbf7" : "var(--bg)",borderRadius:12,padding:"10px 12px",border:isDelivery ? "1px solid rgba(123,92,35,.08)" : "none"}}>
                <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.4,marginBottom:3}}>{l}</div>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{v}</div>
                <div style={{fontSize:11,color:sc,marginTop:1}}>{s}</div>
              </div>
            ))}
          </div>

          <div style={{background:isDelivery ? "#fbf7ef" : "var(--bg)",borderRadius:12,padding:"10px 12px",fontSize:12,color:"var(--text3)",marginBottom:children?12:0,border:isDelivery ? "1px solid #eadfc7" : "none"}}>
            <div>📍 {job.pickupAddress}</div>
            {job.payoutRule && <div style={{marginTop:4,color:"var(--green)"}}>💼 {job.payoutRule}</div>}
          </div>

          {role === "farmer" && pickupProofPending && (
            <div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:12,padding:12,marginBottom:children?12:0}}>
              <div style={{fontSize:12,fontWeight:800,color:"#c2410c",marginBottom:4}}>
                🔐 {pick(lang,"Pickup Proof OTP","ಪಿಕಪ್ ದೃಢೀಕರಣ OTP")}
              </div>
              <div style={{fontSize:12,color:"var(--text2)",marginBottom:8}}>
                {pick(lang,"Share this only when the delivery partner reaches your farm.", "ವಿತರಣಾ ಸಹಭಾಗಿಯು ನಿಮ್ಮ ಫಾರ್ಮ್‌ಗೆ ಬಂದ ನಂತರ ಮಾತ್ರ ಇದನ್ನು ಹಂಚಿಕೊಳ್ಳಿ.")}
              </div>
              <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#fff",border:"1px dashed #f59e0b",borderRadius:10,padding:"8px 14px",fontSize:22,fontWeight:900,color:"#9a3412",letterSpacing:4}}>
                {job.pickupOtp}
              </div>
            </div>
          )}

          {role === "delivery" && pickupProofPending && (
            <div style={{background:"#eef5ff",border:"1px solid #c9dafe",borderRadius:12,padding:12,marginBottom:children?12:0}}>
              <div style={{fontSize:12,fontWeight:800,color:"#26457a",marginBottom:4}}>
                🔐 {pick(lang,"Pickup Proof Needed","ಪಿಕಪ್ ದೃಢೀಕರಣ ಅಗತ್ಯ")}
              </div>
              <div style={{fontSize:12,color:"var(--text2)"}}>
                {pick(lang,"Ask the farmer for the 4-digit OTP before marking this order as picked up.", "ಈ ಆದೇಶವನ್ನು ತೆಗೆದುಕೊಂಡಿದೆ ಎಂದು ಗುರುತಿಸುವ ಮೊದಲು ರೈತರಿಂದ 4 ಅಂಕೆಯ OTP ಕೇಳಿ.")}
              </div>
            </div>
          )}

          {job.pickupOtpVerifiedAt && (
            <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:12,marginBottom:children?12:0}}>
              <div style={{fontSize:12,fontWeight:800,color:"#15803d",marginBottom:4}}>
                ✅ {pick(lang,"Pickup Proof Verified","ಪಿಕಪ್ ದೃಢೀಕರಣ ಪರಿಶೀಲಿಸಲಾಗಿದೆ")}
              </div>
              <div style={{fontSize:12,color:"var(--text2)"}}>
                {pick(lang, `Farmer OTP verified ${timeAgo(job.pickupOtpVerifiedAt, lang)}.`, `ರೈತರ OTP ${timeAgo(job.pickupOtpVerifiedAt, lang)} ಹಿಂದೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ.`)}
              </div>
            </div>
          )}

          {role !== "delivery" && job.deliveryPhone && (
            <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:12,padding:12,marginBottom:children?12:0}}>
              <div style={{fontSize:12,fontWeight:800,color:"#1d4ed8",marginBottom:4}}>
                🚛 {pick(lang,"Delivery Partner Coming","ವಿತರಣಾ ಸಹಭಾಗಿ ಬರುತ್ತಿದ್ದಾರೆ")}
              </div>
              <div style={{fontSize:12,color:"var(--text2)",marginBottom:10}}>
                {job.deliveryName} · {job.deliveryPhone}
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <a href={`tel:${job.deliveryPhone}`} style={actionLinkStyle("#1d4ed8")}>
                  📞 {pick(lang,"Call Delivery","ವಿತರಣೆಗೆ ಕರೆ ಮಾಡಿ")}
                </a>
                <a href={`sms:${job.deliveryPhone}?body=${smsDeliveryBody}`} style={actionLinkStyle("#1d4ed8")}>
                  💬 {pick(lang,"SMS Delivery","ವಿತರಣೆಗೆ SMS ಮಾಡಿ")}
                </a>
              </div>
            </div>
          )}

          {children&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{children}</div>}
        </div>

        {isDelivery && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"linear-gradient(145deg,#fff8ec,#f3f7ff)",border:"1px solid #ddd7c7",borderRadius:16,padding:14}}>
              <div style={{fontSize:11,fontWeight:800,color:"#7b5c23",textTransform:"uppercase",letterSpacing:.6,marginBottom:8}}>
                {pick(lang,"Route Brief","ಮಾರ್ಗ ಸಂಕ್ಷಿಪ್ತ ಮಾಹಿತಿ")}
              </div>
              <div style={{display:"grid",gap:10}}>
                <div style={{background:"#fff",border:"1px solid #ece3d0",borderRadius:12,padding:"10px 12px"}}>
                  <div style={{fontSize:10,fontWeight:800,color:"var(--text4)",textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>{pick(lang,"Pickup Farm","ಪಿಕಪ್ ಫಾರ್ಮ್")}</div>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>🧑‍🌾 {job.farmerName}</div>
                  <div style={{fontSize:11,color:"var(--text3)",marginTop:3}}>{farmerLabel}</div>
                </div>
                <div style={{background:"#fff",border:"1px solid #dbe4f3",borderRadius:12,padding:"10px 12px"}}>
                  <div style={{fontSize:10,fontWeight:800,color:"var(--text4)",textTransform:"uppercase",letterSpacing:.5,marginBottom:3}}>{pick(lang,"Drop Point","ಡ್ರಾಪ್ ಪಾಯಿಂಟ್")}</div>
                  <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>🏪 {job.retailerName}</div>
                  <div style={{fontSize:11,color:"var(--text3)",marginTop:3}}>
                    {job.retailerVillage ? tLocation(job.retailerVillage, job.retailerDistrict, lang) : pick(lang,"Wholesale destination saved", "ಸಗಟು ಗಮ್ಯಸ್ಥಾನ ಉಳಿಸಲಾಗಿದೆ")}
                  </div>
                </div>
              </div>
            </div>

            <div style={{background:"#f6f8fc",border:"1px solid #d8deea",borderRadius:16,padding:14}}>
              <div style={{fontSize:12,fontWeight:800,color:"#41546f",marginBottom:8}}>
                🗺️ {pick(lang,"Farmer Pickup Map","ರೈತ ಪಿಕಪ್ ನಕ್ಷೆ")}
              </div>
              {farmerMapEmbed ? (
                <iframe
                  title={`map-${job.id}`}
                  src={farmerMapEmbed}
                  style={{width:"100%",height:220,border:"1px solid #cfd8e7",borderRadius:12,marginBottom:10,background:"#fff"}}
                  loading="lazy"
                />
              ) : (
                <div style={{background:"#fff",border:"1px dashed #cbd5e1",borderRadius:12,padding:"18px 14px",fontSize:12,color:"var(--text3)",lineHeight:1.6,marginBottom:10}}>
                  {pick(lang, "Map preview is not available for this village yet. Use the map link to navigate directly.", "ಈ ಗ್ರಾಮದಿಗಾಗಿ ನಕ್ಷೆ ಪೂರ್ವವೀಕ್ಷಣೆ ಈಗ ಲಭ್ಯವಿಲ್ಲ. ನೇರವಾಗಿ ಹೋಗಲು ಮ್ಯಾಪ್ ಲಿಂಕ್ ಬಳಸಿ.")}
                </div>
              )}
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <a href={farmerMapUrl} target="_blank" rel="noreferrer" style={actionLinkStyle("#1d4ed8")}>
                  🧭 {pick(lang,"Open Farm Map","ಫಾರ್ಮ್ ನಕ್ಷೆ ತೆರೆಯಿರಿ")}
                </a>
                <a href={`tel:${job.farmerPhone}`} style={actionLinkStyle("var(--green)")}>
                  📞 {pick(lang,"Call Farmer","ರೈತನಿಗೆ ಕರೆ ಮಾಡಿ")}
                </a>
                <a href={`sms:${job.farmerPhone}?body=${smsFarmerBody}`} style={actionLinkStyle("var(--green)")}>
                  💬 {pick(lang,"SMS Farmer","ರೈತನಿಗೆ SMS ಮಾಡಿ")}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
