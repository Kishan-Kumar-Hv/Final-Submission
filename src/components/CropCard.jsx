import { Badge } from "./UI.jsx";
import { fmtP } from "../utils/helpers.js";
import { CostBadge } from "./SmartPriceCalculator.jsx";

const HARVEST_TYPE_META = {
  regrows: {
    icon: "🌿",
    label: "Regrows after harvest",
    tone: "var(--green)",
    bg: "var(--green-xp)",
    border: "var(--green-mid)",
  },
  single_harvest: {
    icon: "🌾",
    label: "Single harvest - replant needed",
    tone: "#92400e",
    bg: "var(--gold-pale)",
    border: "#f5d090",
  },
};

export default function CropCard({ crop, rates, children, role }) {
  const mkt=rates.find(r=>r.c.toLowerCase()===crop.cropName.toLowerCase());
  const topBid=crop.bids?.length?Math.max(...crop.bids.map(b=>b.amount)):0;
  const harvestType = HARVEST_TYPE_META[crop.harvestType] || null;
  return(
    <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",transition:"all .2s",animation:"fadeUp .35s ease both",boxShadow:"var(--shadow-sm)"}}
      onMouseOver={e=>{e.currentTarget.style.boxShadow="var(--shadow)";e.currentTarget.style.transform="translateY(-3px)"}}
      onMouseOut={e=>{e.currentTarget.style.boxShadow="var(--shadow-sm)";e.currentTarget.style.transform=""}}>

      {/* Image */}
      <div style={{height:150,position:"relative",overflow:"hidden",flexShrink:0,background:"var(--green-pale)"}}>
        {crop.photos?.length>0
          ?<img src={crop.photos[0]} alt={crop.cropName} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:56}}>{crop.emoji||"🌾"}</div>}
        <div style={{position:"absolute",top:10,left:10,right:10,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <Badge status={crop.status}/>
          {crop.bids?.length>0&&<span style={{background:"var(--gold)",color:"#fff",fontSize:11,fontWeight:700,padding:"3px 9px",borderRadius:20}}>🔥 {crop.bids.length} bids {topBid>0?`· ₹${topBid}`:""}</span>}
        </div>
      </div>

      {/* Body */}
      <div style={{padding:16,flex:1,display:"flex",flexDirection:"column",gap:10}}>
        <div>
          <div style={{fontWeight:800,fontSize:16,color:"var(--text)",marginBottom:3}}>{crop.emoji} {crop.cropName}</div>
          <div style={{fontSize:12,color:"var(--text3)",display:"flex",alignItems:"center",gap:4}}>📍 {crop.village}, {crop.district} · {crop.pin}</div>
        </div>

        {harvestType && (
          <div style={{display:"inline-flex",alignItems:"center",gap:6,alignSelf:"flex-start",background:harvestType.bg,border:`1px solid ${harvestType.border}`,borderRadius:999,padding:"5px 10px",fontSize:11,fontWeight:700,color:harvestType.tone}}>
            <span>{harvestType.icon}</span>
            <span>{harvestType.label}</span>
          </div>
        )}

        {/* Stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["Quantity",`${crop.quantity} kg`],["Min Bid",`${fmtP(crop.minBid)}/kg`,"var(--gold)"],["Ready Date",crop.readyDate,null,12],["Bids",`${crop.bids?.length||0} bids`,crop.bids?.length?"var(--green)":"var(--text4)"]].map(([l,v,col,fs])=>(
            <div key={l} style={{background:"var(--bg)",borderRadius:10,padding:"8px 12px"}}>
              <div style={{fontSize:11,color:"var(--text3)",fontWeight:600,textTransform:"uppercase",letterSpacing:.4,marginBottom:2}}>{l}</div>
              <div style={{fontSize:fs||14,fontWeight:700,color:col||"var(--text)"}}>{v}</div>
            </div>
          ))}
        </div>

        {/* APMC compare */}
        {mkt&&(
          <div style={{background:mkt.price>crop.minBid?"var(--green-xp)":"var(--gold-pale)",border:`1px solid ${mkt.price>crop.minBid?"var(--green-mid)":"#f5d090"}`,borderRadius:10,padding:"8px 12px",fontSize:12,color:"var(--text2)"}}>
            📊 APMC today: <strong style={{color:mkt.price>crop.minBid?"var(--green)":"var(--gold)"}}>{fmtP(mkt.price)}/kg</strong>
            {mkt.price>crop.minBid
              ?<span style={{color:"var(--green)",marginLeft:6}}>✓ Your price is competitive</span>
              :<span style={{color:"var(--gold)",marginLeft:6}}>↑ You're above market</span>}
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

        {/* Show farmer's cost breakdown to retailers if smart pricing was used */}
        {role==="retailer" && crop.costPerKg>0 && <CostBadge crop={crop}/>}

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
