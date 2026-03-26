import { Badge } from "./UI.jsx";
import { fmtP } from "../utils/helpers.js";
import { CostBadge, FarmerProfitHint } from "./SmartPriceCalculator.jsx";
import { findMatchingCrop } from "../data/constants.js";
import { pick, tCrop, tLocation } from "../i18n.js";

const HARVEST_TYPE_META = {
  regrows: {
    icon: "🌿",
    label: "Regrows after harvest",
    knLabel: "ಕೊಯ್ಲಿನ ಬಳಿಕ ಮತ್ತೆ ಬರುತ್ತದೆ",
    tone: "var(--green)",
    bg: "var(--green-xp)",
    border: "var(--green-mid)",
  },
  single_harvest: {
    icon: "🌾",
    label: "Single harvest - replant needed",
    knLabel: "ಒಮ್ಮೆ ಕೊಯ್ಲು - ಮರು ನೆಡುವುದು ಬೇಕು",
    tone: "#92400e",
    bg: "var(--gold-pale)",
    border: "#f5d090",
  },
};

export default function CropCard({ crop, rates, children, role, lang = "en" }) {
  const mkt=findMatchingCrop(crop.cropName, rates);
  const topBid=crop.bids?.length?Math.max(...crop.bids.map(b=>b.amount)):0;
  const harvestType = HARVEST_TYPE_META[crop.harvestType] || null;
  return(
    <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",transition:"all .2s",animation:"fadeUp .35s ease both",boxShadow:"var(--shadow-sm)"}}
      onMouseOver={e=>{e.currentTarget.style.boxShadow="var(--shadow)";e.currentTarget.style.transform="translateY(-3px)"}}
      onMouseOut={e=>{e.currentTarget.style.boxShadow="var(--shadow-sm)";e.currentTarget.style.transform=""}}>

      {/* Image */}
      <div style={{height:150,position:"relative",overflow:"hidden",flexShrink:0,background:"var(--green-pale)"}}>
        {crop.photos?.length>0
          ?<img src={crop.photos[0]} alt={tCrop(crop.cropName, lang)} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:56}}>{crop.emoji||"🌾"}</div>}
        <div style={{position:"absolute",top:10,left:10,right:10,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <Badge status={crop.status} lang={lang}/>
          {crop.bids?.length>0&&<span style={{background:"var(--gold)",color:"#fff",fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20}}>🔥 {crop.bids.length} {pick(lang, "bids", "ಬಿಡ್‌ಗಳು")} {topBid>0?`· ₹${topBid}`:""}</span>}
        </div>
      </div>

      {/* Body */}
      <div style={{padding:16,flex:1,display:"flex",flexDirection:"column",gap:10}}>
        <div>
          <div style={{fontWeight:800,fontSize:16,color:"var(--text)",marginBottom:3}}>{crop.emoji} {tCrop(crop.cropName, lang)}</div>
          <div style={{fontSize:12,color:"var(--text3)",display:"flex",alignItems:"center",gap:4}}>📍 {tLocation(crop.village, crop.district, lang)} · {crop.pin}</div>
        </div>

        {harvestType && (
          <div style={{display:"inline-flex",alignItems:"center",gap:6,alignSelf:"flex-start",background:harvestType.bg,border:`1px solid ${harvestType.border}`,borderRadius:999,padding:"5px 10px",fontSize:11,fontWeight:700,color:harvestType.tone}}>
            <span>{harvestType.icon}</span>
            <span>{pick(lang, harvestType.label, harvestType.knLabel)}</span>
          </div>
        )}

        {crop.acceptedByName && (
          <div style={{display:"inline-flex",alignItems:"center",gap:6,alignSelf:"flex-start",background:"var(--gold-pale)",border:"1px solid rgba(200,132,34,.28)",borderRadius:999,padding:"5px 10px",fontSize:11,fontWeight:800,color:"#9a5523"}}>
            <span>✅</span>
            <span>{pick(lang, `Selected by ${crop.acceptedByName}`, `${crop.acceptedByName} ಅವರು ಆಯ್ಕೆ ಮಾಡಿದ್ದಾರೆ`)}</span>
          </div>
        )}

        {role==="farmer" && <FarmerProfitHint crop={crop} marketRate={mkt} lang={lang} />}

        {/* Stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            [pick(lang,"Quantity","ಪ್ರಮಾಣ"),`${crop.quantity} ${pick(lang,"kg","ಕೆಜಿ")}`],
            [pick(lang,"Min Bid","ಕನಿಷ್ಠ ಬಿಡ್"),`${fmtP(crop.minBid)}/${pick(lang,"kg","ಕೆಜಿ")}`,"var(--gold)"],
            [pick(lang,"Ready Date","ಸಿದ್ಧ ದಿನಾಂಕ"),crop.readyDate,null,12],
            [pick(lang,"Bids","ಬಿಡ್‌ಗಳು"),`${crop.bids?.length||0} ${pick(lang,"bids","ಬಿಡ್‌ಗಳು")}`,crop.bids?.length?"var(--green)":"var(--text4)"]
          ].map(([l,v,col,fs])=>(
            <div key={l} style={{background:"var(--bg)",borderRadius:10,padding:"8px 12px"}}>
              <div style={{fontSize:11,color:"var(--text3)",fontWeight:600,textTransform:"uppercase",letterSpacing:.4,marginBottom:2}}>{l}</div>
              <div style={{fontSize:fs||14,fontWeight:700,color:col||"var(--text)"}}>{v}</div>
            </div>
          ))}
        </div>

        {/* APMC compare */}
        {mkt&&(
          <div style={{background:mkt.price>crop.minBid?"var(--green-xp)":"var(--gold-pale)",border:`1px solid ${mkt.price>crop.minBid?"var(--green-mid)":"#f5d090"}`,borderRadius:10,padding:"8px 12px",fontSize:12,color:"var(--text2)"}}>
            📊 {pick(lang,"APMC today","ಇಂದಿನ ಎಪಿಎಂಸಿ")}: <strong style={{color:mkt.price>crop.minBid?"var(--green)":"var(--gold)"}}>{fmtP(mkt.price)}/{pick(lang,"kg","ಕೆಜಿ")}</strong>
            {mkt.price>crop.minBid
              ?<span style={{color:"var(--green)",marginLeft:6}}>✓ {pick(lang,"Your price is competitive","ನಿಮ್ಮ ಬೆಲೆ ಸ್ಪರ್ಧಾತ್ಮಕವಾಗಿದೆ")}</span>
              :<span style={{color:"var(--gold)",marginLeft:6}}>↑ {pick(lang,"You're above market","ನೀವು ಮಾರುಕಟ್ಟೆಗಿಂತ ಮೇಲೆ ಇದ್ದೀರಿ")}</span>}
          </div>
        )}

        {/* Farmer */}
        <div style={{display:"flex",alignItems:"center",gap:9,padding:"10px 0",borderTop:"1px solid var(--bg2)"}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:"var(--green-pale)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🧑‍🌾</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{crop.farmerName}</div>
            <div style={{fontSize:12,color:"var(--green)",fontFamily:"monospace"}}>📞 {crop.farmerPhone}</div>
          </div>
        </div>

        {crop.notes&&<div style={{fontSize:12,color:"var(--text3)",background:"var(--bg)",padding:"8px 12px",borderRadius:10,lineHeight:1.5}}>📝 {crop.notes}</div>}

        {/* Show farmer's cost breakdown to wholesalers if smart pricing was used */}
        {role==="retailer" && crop.costPerKg>0 && <CostBadge crop={crop} lang={lang}/>}

        {crop.photos?.length>1&&(
          <div style={{display:"flex",gap:5}}>
            {crop.photos.slice(1,4).map((p,i)=><img key={i} src={p} style={{width:44,height:44,borderRadius:8,objectFit:"cover",border:"1px solid var(--border)"}} alt=""/>)}
          </div>
        )}

        {children&&<div style={{display:"flex",gap:8,flexWrap:"wrap",paddingTop:10,borderTop:"1px solid var(--bg2)"}}>{children}</div>}
      </div>
    </div>
  );
}
