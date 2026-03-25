import { pick, tCrop } from "../i18n.js";

export default function Ticker({rates,lang}){
  const items=rates.slice(0,16);const doubled=[...items,...items];
  return(
    <div style={{background:"var(--green)",overflow:"hidden",height:36,display:"flex",alignItems:"center"}}>
      <div style={{background:"rgba(0,0,0,.15)",color:"#fff",padding:"0 14px",fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:1.2,whiteSpace:"nowrap",height:"100%",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
        {pick(lang,"📊 LIVE APMC","📊 ಲೈವ್ ಎಪಿಎಂಸಿ")}
      </div>
      <div style={{overflow:"hidden",flex:1}}>
        <div style={{display:"flex",animation:"ticker 55s linear infinite",whiteSpace:"nowrap"}}
          onMouseEnter={e=>e.currentTarget.style.animationPlayState="paused"}
          onMouseLeave={e=>e.currentTarget.style.animationPlayState="running"}>
          {doubled.map((r,i)=>(
            <div key={i} style={{padding:"0 20px",fontSize:12,color:"rgba(255,255,255,.9)",display:"flex",alignItems:"center",gap:6,borderRight:"1px solid rgba(255,255,255,.2)"}}>
              <span style={{fontWeight:700}}>{r.e} {tCrop(r.c,lang)}</span>
              <span style={{color:"#fff",fontWeight:800}}>₹{r.price.toFixed(1)}{pick(lang,"/kg","/ಕೆಜಿ")}</span>
              <span style={{fontSize:11,fontWeight:700,color:r.price>=r.prev?"#90ee90":"#ffcdd2"}}>
                {r.price>=r.prev?"▲":"▼"}{Math.abs(((r.price-r.prev)/r.prev)*100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
