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

  return(
    <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:16,padding:18,marginBottom:12,boxShadow:"var(--shadow-sm)",transition:"all .2s"}}
      onMouseOver={e=>e.currentTarget.style.boxShadow="var(--shadow)"}
      onMouseOut={e=>e.currentTarget.style.boxShadow="var(--shadow-sm)"}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontWeight:800,fontSize:15,color:"var(--text)"}}>{job.emoji||"🌾"} {tCrop(job.cropName,lang)} · {job.quantity}{pick(lang,"kg","ಕೆಜಿ")}</div>
          <div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>{pick(lang,"Job","ಕಾರ್ಯ")} #{job.id.slice(-6).toUpperCase()} · {timeAgo(job.createdAt,lang)}</div>
        </div>
        <Badge status={job.status} lang={lang}/>
      </div>

      <Stepper status={job.status} lang={lang}/>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,margin:"12px 0"}}>
        {[
          [pick(lang,"Farmer","ರೈತ"),   `🧑‍🌾 ${job.farmerName}`,  `📞 ${job.farmerPhone}`,    "var(--green)"],
          [pick(lang,"Retailer","ಖರೀದಿದಾರ"), `🏪 ${job.retailerName}`, `📞 ${job.retailerPhone}`,   "var(--blue)"],
          [pick(lang,"Deal Price","ಒಪ್ಪಂದ ಬೆಲೆ"),`${fmtP(job.winningBid)}${pick(lang,"/kg","/ಕೆಜಿ")}`,`${pick(lang,"Total","ಒಟ್ಟು")}: ${fmtP(job.winningBid*job.quantity)}`,"var(--gold)"],
          [pick(lang,"Pickup","ಪಿಕಪ್"),   `📍 ${tLocation(job.village, job.district, lang)}`, job.deliveryName ? `🚛 ${job.deliveryName} · 📞 ${job.deliveryPhone}` : pick(lang,"Awaiting driver","ಡ್ರೈವರ್ ನಿರೀಕ್ಷೆಯಲ್ಲಿ"),"var(--text3)"],
          [pick(lang,"Route","ಮಾರ್ಗ"), `🛣️ ~${job.routeKm || 0}${pick(lang," km"," ಕಿಮೀ")}`, job.retailerVillage ? `🏪 ${tLocation(job.retailerVillage, job.retailerDistrict, lang)}` : pick(lang,"Retail destination saved","ಖರೀದಿದಾರ ಸ್ಥಳ ಉಳಿಸಲಾಗಿದೆ"), "var(--text3)"],
          [pick(lang,"Driver Payout","ಚಾಲಕರ ಪಾವತಿ"), `${fmtP(job.deliveryPayout || 0)}`, `${pick(lang,"Fuel","ಇಂಧನ")}: ${fmtP(job.fuelAllowance || 0)}`, "var(--green)"],
        ].map(([l,v,s,sc])=>(
          <div key={l} style={{background:"var(--bg)",borderRadius:10,padding:"9px 12px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:.4,marginBottom:3}}>{l}</div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{v}</div>
            <div style={{fontSize:11,color:sc,marginTop:1}}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{background:"var(--bg)",borderRadius:10,padding:"8px 12px",fontSize:12,color:"var(--text3)",marginBottom:children?12:0}}>
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
        <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:12,padding:12,marginBottom:children?12:0}}>
          <div style={{fontSize:12,fontWeight:800,color:"#1d4ed8",marginBottom:4}}>
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

      {role === "delivery" && (
        <div style={{background:"#f8fffb",border:"1px solid var(--green-mid)",borderRadius:12,padding:12,marginBottom:children?12:0}}>
          <div style={{fontSize:12,fontWeight:800,color:"var(--green)",marginBottom:8}}>
            🗺️ {pick(lang,"Farmer Pickup Map","ರೈತ ಪಿಕಪ್ ನಕ್ಷೆ")}
          </div>
          {farmerMapEmbed && (
            <iframe
              title={`map-${job.id}`}
              src={farmerMapEmbed}
              style={{width:"100%",height:180,border:"1px solid var(--border)",borderRadius:10,marginBottom:10}}
              loading="lazy"
            />
          )}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <a href={farmerMapUrl} target="_blank" rel="noreferrer" style={actionLinkStyle("var(--green)")}>
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
  );
}
