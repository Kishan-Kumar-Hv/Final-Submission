import { S_ORDER, S_ICON } from "../data/constants.js";
import { pick, tStatus } from "../i18n.js";

/* ── Button ── */
export function Btn({children,onClick,variant="primary",size="md",block,disabled,style:sx}){
  const base={display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,border:"none",cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",fontWeight:600,transition:"all .15s",opacity:disabled?.5:1,...sx};
  const sizes={sm:{padding:"6px 14px",fontSize:13,borderRadius:8},md:{padding:"10px 20px",fontSize:14,borderRadius:10},lg:{padding:"13px 28px",fontSize:15,borderRadius:12}};
  const variants={
    primary:{background:"var(--green)",color:"#fff"},
    secondary:{background:"var(--green-pale)",color:"var(--green)"},
    outline:{background:"#fff",color:"var(--green)",border:"1.5px solid var(--green)"},
    ghost:{background:"transparent",color:"var(--text2)",border:"1.5px solid var(--border)"},
    danger:{background:"var(--red-pale)",color:"var(--red)",border:"1px solid #f5b8b4"},
    gold:{background:"var(--gold)",color:"#fff"},
  };
  return(
    <button onClick={disabled?undefined:onClick} disabled={disabled}
      style={{...base,...sizes[size],...variants[variant],width:block?"100%":undefined}}
      onMouseOver={e=>{if(!disabled)e.currentTarget.style.filter="brightness(1.06)"}}
      onMouseOut={e=>e.currentTarget.style.filter=""}>
      {children}
    </button>
  );
}

/* ── Badge ── */
export function Badge({status,lang="en"}){
  const map={
    open:     {bg:"#e6f4ea",color:"#2d7a3a",border:"#b7dfbd"},
    bidding:  {bg:"#fff4e0",color:"#c47000",border:"#f5d090"},
    booked:   {bg:"#e8f0fe",color:"#1967d2",border:"#adc4f7"},
    "awaiting-retailer":{bg:"#fff7ed",color:"#c2410c",border:"#fed7aa"},
    confirmed:{bg:"#e0f7f4",color:"#00796b",border:"#80cbc4"},
    scheduled:{bg:"#e0f7f4",color:"#00796b",border:"#80cbc4"},
    "on-the-way":{bg:"#e8f0fe",color:"#1967d2",border:"#adc4f7"},
    "picked-up":{bg:"#fce4ec",color:"#c2185b",border:"#f48fb1"},
    delivered:{bg:"#e6f4ea",color:"#2d7a3a",border:"#b7dfbd"},
  };
  const s=map[status]||map.open;
  return(
    <span style={{display:"inline-flex",alignItems:"center",padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,background:s.bg,color:s.color,border:`1px solid ${s.border}`,animation:status==="bidding"?"pulse 1.6s infinite":"none"}}>
      {tStatus(status,lang)}
    </span>
  );
}

/* ── Stepper ── */
export function Stepper({status,lang="en"}){
  const idx=S_ORDER.indexOf(status);
  return(
    <div style={{display:"flex",alignItems:"center",padding:"8px 0"}}>
      {S_ORDER.map((s,i)=>(
        <div key={s} style={{display:"flex",alignItems:"center",flex:1}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
            <div style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,border:`2px solid ${i<=idx?"var(--green)":"var(--border)"}`,background:i<idx?"var(--green)":i===idx?"var(--green-pale)":"#fff",color:i<idx?"#fff":i===idx?"var(--green)":"var(--text4)",transition:"all .3s"}}>
              {i<idx?"✓":S_ICON[s]}
            </div>
            <span style={{fontSize:11,color:i<=idx?"var(--green)":"var(--text4)",fontWeight:i===idx?700:400,whiteSpace:"nowrap",textAlign:"center",maxWidth:64}}>{tStatus(s,lang)}</span>
          </div>
          {i<S_ORDER.length-1&&<div style={{flex:1,height:2,background:i<idx?"var(--green)":"var(--border)",margin:"0 4px",marginBottom:18,transition:"background .3s"}}/>}
        </div>
      ))}
    </div>
  );
}

/* ── Toast Container ── */
export function Toasts({list}){
  return(
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:320}}>
      {list.map(t=>(
        <div key={t.id} style={{background:"#fff",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px",boxShadow:"var(--shadow-lg)",animation:"slideR .25s ease",display:"flex",alignItems:"flex-start",gap:10,borderLeft:`4px solid ${t.type==="error"?"var(--red)":t.type==="gold"?"var(--gold)":"var(--green)"}`}}>
          <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
          <span style={{flex:1,fontSize:13,color:"var(--text)",lineHeight:1.45}}>{t.msg}</span>
          <span onClick={t.onClose} style={{cursor:"pointer",color:"var(--text4)",fontSize:16,lineHeight:1,flexShrink:0}}>×</span>
        </div>
      ))}
    </div>
  );
}

/* ── Card ── */
export function Card({children,style:sx,hover}){
  return(
    <div style={{background:"#fff",border:"1px solid var(--border)",borderRadius:16,padding:20,boxShadow:"var(--shadow-sm)",transition:"all .2s",...sx}}
      onMouseOver={e=>{if(hover){e.currentTarget.style.boxShadow="var(--shadow)";e.currentTarget.style.transform="translateY(-2px)"}}}
      onMouseOut={e=>{if(hover){e.currentTarget.style.boxShadow="var(--shadow-sm)";e.currentTarget.style.transform=""}}}>
      {children}
    </div>
  );
}

/* ── Stat Card ── */
export function StatCard({icon,label,value,sub,color="#2d7a3a"}){
  return(
    <Card style={{textAlign:"center",padding:"18px 16px"}}>
      <div style={{fontSize:24,marginBottom:6}}>{icon}</div>
      <div style={{fontSize:26,fontWeight:800,color,lineHeight:1}}>{value}</div>
      <div style={{fontSize:12,color:"var(--text3)",fontWeight:500,marginTop:3,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
      {sub&&<div style={{fontSize:12,color:"var(--text4)",marginTop:2}}>{sub}</div>}
    </Card>
  );
}

/* ── Section Title ── */
export function SectionTitle({children}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,margin:"24px 0 14px"}}>
      <span style={{fontSize:14,fontWeight:700,color:"var(--text2)",whiteSpace:"nowrap"}}>{children}</span>
      <div style={{flex:1,height:1,background:"var(--border)"}}/>
    </div>
  );
}

/* ── Live Dot ── */
export function LiveDot(){
  return <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",animation:"pulse 1.4s infinite",flexShrink:0}}/>;
}

/* ── Empty State ── */
export function Empty({icon,title,sub}){
  return(
    <div style={{textAlign:"center",padding:"48px 24px",color:"var(--text3)"}}>
      <div style={{fontSize:40,marginBottom:12,opacity:.5}}>{icon}</div>
      <div style={{fontSize:15,fontWeight:600,color:"var(--text2)"}}>{title}</div>
      {sub&&<div style={{fontSize:13,marginTop:4}}>{sub}</div>}
    </div>
  );
}

/* ── Input ── */
export function Input({label,hint,...props}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<label style={{fontSize:12,fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:.5}}>{label}</label>}
      <input {...props} style={{padding:"10px 14px",border:"1.5px solid var(--border)",borderRadius:10,fontSize:14,fontFamily:"inherit",color:"var(--text)",background:"#fff",outline:"none",transition:"border-color .15s",width:"100%",...props.style}}
        onFocus={e=>{e.target.style.borderColor="var(--green)";e.target.style.boxShadow="0 0 0 3px rgba(45,122,58,.1)"}}
        onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="none"}}/>
      {hint&&<span style={{fontSize:11,color:"var(--text4)"}}>{hint}</span>}
    </div>
  );
}

/* ── Textarea ── */
export function Textarea({label,...props}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      {label&&<label style={{fontSize:12,fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:.5}}>{label}</label>}
      <textarea {...props} style={{padding:"10px 14px",border:"1.5px solid var(--border)",borderRadius:10,fontSize:14,fontFamily:"inherit",color:"var(--text)",background:"#fff",outline:"none",resize:"vertical",minHeight:80,lineHeight:1.5,transition:"border-color .15s",width:"100%",...props.style}}
        onFocus={e=>{e.target.style.borderColor="var(--green)";e.target.style.boxShadow="0 0 0 3px rgba(45,122,58,.1)"}}
        onBlur={e=>{e.target.style.borderColor="var(--border)";e.target.style.boxShadow="none"}}/>
    </div>
  );
}

/* ── Activity Panel ── */
export function ActivityPanel({activity,open,setOpen,lang="en"}){
  return(
    <div style={{position:"fixed",bottom:24,left:20,width:260,zIndex:900,fontFamily:"inherit"}}>
      <div onClick={()=>setOpen(o=>!o)} style={{background:"#fff",border:"1px solid var(--border)",borderRadius:open?"12px 12px 0 0":12,padding:"8px 14px",display:"flex",alignItems:"center",gap:7,cursor:"pointer",boxShadow:"var(--shadow-sm)"}}>
        <LiveDot/>
        <span style={{fontSize:12,fontWeight:700,color:"var(--text2)",flex:1}}>{pick(lang,"Live Activity","ಲೈವ್ ಚಟುವಟಿಕೆ")}</span>
        <span style={{fontSize:11,color:"var(--text4)"}}>{open?"▼":"▲"}</span>
      </div>
      {open&&(
        <div style={{background:"#fff",border:"1px solid var(--border)",borderTop:"none",borderRadius:"0 0 12px 12px",maxHeight:160,overflowY:"auto",boxShadow:"var(--shadow)"}}>
          {activity.slice(0,7).map((a,i)=>(
            <div key={a.id||i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"8px 14px",borderBottom:"1px solid var(--bg2)",animation:"fadeUp .3s ease"}}>
              <span style={{fontSize:14,flexShrink:0}}>{a.icon}</span>
              <div>
                <div style={{fontSize:12,color:"var(--text)",lineHeight:1.4}}>{a.text}</div>
                <div style={{fontSize:11,color:"var(--text4)",marginTop:1}}>{a.timeLabel}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
