import { Badge, Stepper } from "./UI.jsx";
import { fmtP, timeAgo } from "../utils/helpers.js";
import { pick, tCrop, tLocation } from "../i18n.js";

export default function JobCard({job,children,lang}){
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
          [pick(lang,"Pickup","ಪಿಕಪ್"),   `📍 ${tLocation(job.village, job.district, lang)}`, job.deliveryName?`🚛 ${job.deliveryName}`:pick(lang,"Awaiting driver","ಡ್ರೈವರ್ ನಿರೀಕ್ಷೆಯಲ್ಲಿ"),"var(--text3)"],
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

      {children&&<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{children}</div>}
    </div>
  );
}
