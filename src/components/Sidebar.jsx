import { pick, tLocation, tRole } from "../i18n.js";

export default function Sidebar({user,view,setView,navItems,lang}){
  const roleColor={farmer:"var(--green)",retailer:"var(--gold)",delivery:"var(--blue)",exporter:"#4338ca"};
  const roleBg={farmer:"var(--green-pale)",retailer:"var(--gold-pale)",delivery:"var(--blue-pale)",exporter:"#eef2ff"};
  const roleIcon={farmer:"🧑‍🌾",retailer:"🏪",delivery:"🚛",exporter:"🌍"};
  const accent = user.role === "exporter" ? "#4338ca" : "var(--green)";
  return(
    <aside className="rr-sidebar" style={{width:220,flexShrink:0,background:"#fff",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column",position:"sticky",top:100,height:"calc(100vh - 100px)",overflowY:"auto"}}>
      {/* User card */}
      <div className="rr-sidebar-user" style={{padding:"20px 16px 16px",borderBottom:"1px solid var(--bg2)"}}>
        <div style={{width:52,height:52,borderRadius:14,background:roleBg[user.role],display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,marginBottom:12,border:`2px solid ${roleColor[user.role]}22`}}>{roleIcon[user.role]}</div>
        <div style={{fontWeight:800,fontSize:14,color:"var(--text)",lineHeight:1.2}}>{user.name}</div>
        <div style={{fontSize:11,fontWeight:700,color:roleColor[user.role],letterSpacing:.4,marginTop:2}}>{tRole(user.role,lang)}</div>
        <div style={{fontSize:11,color:"var(--text3)",marginTop:4,display:"flex",flexDirection:"column",gap:2}}>
          <span>{user.role === "exporter" ? "🪪" : "📞"} {user.role === "exporter" ? user.clientId : user.phone}</span>
          <span>📍 {user.role === "exporter" ? `${user.companyName || user.name} · ${user.country || user.district}` : tLocation(user.village, user.district, lang)}</span>
        </div>
        <div style={{marginTop:8,display:"flex",alignItems:"center",gap:5,background:user.role === "exporter" ? "#f5f3ff" : "var(--green-xp)",padding:"4px 8px",borderRadius:6,fontSize:11,color:accent,fontWeight:600}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",animation:"pulse 1.4s infinite"}}/>
          {pick(lang,user.role === "exporter" ? "Separate export portal" : "Online · Data saved locally",user.role === "exporter" ? "ಪ್ರತ್ಯೇಕ ರಫ್ತು ಪೋರ್ಟಲ್" : "ಆನ್‌ಲೈನ್ · ಡೇಟಾ ಸ್ಥಳೀಯವಾಗಿ ಉಳಿಸಲಾಗಿದೆ")}
        </div>
      </div>

      {/* Nav items */}
      <nav className="rr-sidebar-nav" style={{padding:"8px 0",flex:1}}>
        {navItems.map(n=>(
          <button key={n.k} onClick={()=>setView(n.k)}
            style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",width:"100%",border:"none",background:view===n.k?(user.role === "exporter" ? "#f5f3ff" : "var(--green-pale)"):"transparent",color:view===n.k?accent:"var(--text2)",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,transition:"all .15s",borderRight:view===n.k?`3px solid ${accent}`:"3px solid transparent",textAlign:"left"}}>
            <span style={{fontSize:16}}>{n.i}</span>
            <span style={{flex:1}}>{n.l}</span>
            {n.b>0&&<span style={{background:"var(--red)",color:"#fff",fontSize:10,fontWeight:800,padding:"1px 6px",borderRadius:10}}>{n.b}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
