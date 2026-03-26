import { useState } from "react";
import { LiveDot } from "./UI.jsx";
import { CROPS_DATA } from "../data/constants.js";
import { pick, tCategory, tCrop } from "../i18n.js";

export default function MarketRates({rates,lang}){
  const [cat,setCat]=useState("All");
  const cats=["All",...new Set(CROPS_DATA.map(c=>c.cat))];
  const filtered=rates.filter(r=>cat==="All"||r.cat===cat);
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{fontWeight:800,fontSize:20,color:"var(--text)"}}>📊 {pick(lang,"Today's APMC Market Rates","ಇಂದಿನ ಎಪಿಎಂಸಿ ಮಾರುಕಟ್ಟೆ ದರಗಳು")}</div>
        <div style={{display:"flex",alignItems:"center",gap:6,background:"var(--green-pale)",padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:700,color:"var(--green)"}}><LiveDot/>{pick(lang,"Refreshes once daily","ದಿನಕ್ಕೆ ಒಮ್ಮೆ ನವೀಕರಿಸುತ್ತದೆ")}</div>
      </div>
      <div style={{background:"var(--green-xp)",border:"1px solid var(--green-mid)",borderRadius:12,padding:"10px 14px",marginBottom:16,fontSize:12,color:"var(--text2)"}}>
        📍 {pick(lang,"Aggregated from Karnataka State APMC — Mysuru · Hubli · Hassan · Davangere · Belgaum mandis","ಕರ್ನಾಟಕ ರಾಜ್ಯ ಎಪಿಎಂಸಿ ಮೂಲಗಳಿಂದ ಸಂಗ್ರಹಿತ — ಮೈಸೂರು · ಹುಬ್ಬಳ್ಳಿ · ಹಾಸನ · ದಾವಣಗೆರೆ · ಬೆಳಗಾವಿ ಮಂಡಿಗಳು")}
      </div>
      {/* Category filter */}
      <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:16}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCat(c)} style={{padding:"5px 14px",borderRadius:20,border:`1.5px solid ${cat===c?"var(--green)":"var(--border)"}`,background:cat===c?"var(--green-pale)":"#fff",color:cat===c?"var(--green)":"var(--text2)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
            {tCategory(c,lang)}
          </button>
        ))}
      </div>
      {/* Rates grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(148px,1fr))",gap:10}}>
        {filtered.map(r=>{
          const pct=((r.price-r.prev)/r.prev*100).toFixed(1);
          const up=r.price>=r.prev;
          const mx=Math.max(...r.hist);
          return(
            <div key={r.c} style={{background:"#fff",border:"1px solid var(--border)",borderRadius:12,padding:"14px",boxShadow:"var(--shadow-sm)",transition:"all .2s",borderBottom:`3px solid ${up?"var(--green)":"var(--red)"}`}}
              onMouseOver={e=>e.currentTarget.style.boxShadow="var(--shadow)"}
              onMouseOut={e=>e.currentTarget.style.boxShadow="var(--shadow-sm)"}>
              <div style={{fontSize:12,color:"var(--text3)",fontWeight:600,marginBottom:2}}>{r.e} {tCrop(r.c,lang)}</div>
              <div style={{fontSize:22,fontWeight:800,color:"var(--text)",lineHeight:1}}>₹{r.price.toFixed(1)}</div>
              <div style={{fontSize:11,color:"var(--text4)",marginBottom:4}}>{pick(lang,"per kg · Karnataka APMC","ಪ್ರತಿ ಕೆಜಿ · ಕರ್ನಾಟಕ ಎಪಿಎಂಸಿ")}</div>
              <div style={{fontSize:12,fontWeight:700,color:up?"var(--green)":"var(--red)"}}>{up?"▲":"▼"} {Math.abs(pct)}% {pick(lang,"today","ಇಂದು")}</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:1.5,height:20,marginTop:8}}>
                {r.hist.map((h,i)=><div key={i} style={{flex:1,borderRadius:"2px 2px 0 0",background:up?"var(--green-mid)":"#ffcdd2",height:`${Math.round((h/mx)*100)}%`,transition:"height .4s"}}/>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
