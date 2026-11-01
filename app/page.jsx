"use client";
import { useMemo, useState } from "react";

const clips = [
 {id:1,tag:"TENDENCIA",title:"Ideas que transforman tu día",creator:"@vida_en_60s",views:"24.8 mil",coins:8,color:"violet",src:"https://videos.pexels.com/video-files/3129671/3129671-hd_1080_1920_25fps.mp4",desc:"Pequeños hábitos, grandes cambios. ¿Cuál vas a probar hoy?"},
 {id:2,tag:"ENTRETENIMIENTO",title:"Un momento para sonreír",creator:"@clipsdivertidos",views:"18.2 mil",coins:6,color:"blue",src:"https://videos.pexels.com/video-files/855028/855028-hd_1080_1920_25fps.mp4",desc:"Una pausa divertida para seguir con energía."},
 {id:3,tag:"INSPIRACIÓN",title:"Persigue eso que te mueve",creator:"@motiva_hoy",views:"12.6 mil",coins:10,color:"pink",src:"https://videos.pexels.com/video-files/3195394/3195394-hd_1080_1920_25fps.mp4",desc:"Cada paso cuenta. Sigue avanzando."}
];
export default function Home(){
 const [active,setActive]=useState(0),[coins,setCoins]=useState(120),[claimed,setClaimed]=useState([]),[tab,setTab]=useState("Para ti"),[showWallet,setShowWallet]=useState(false),[liked,setLiked]=useState([]),[referralNotice,setReferralNotice]=useState("");
 const referralCode="CLIPJ2026";
 const referralCommission=10;
 const referralCount=0;
 const referralEarnings=referralCount*referralCommission;
 const shareReferral=async()=>{const link=`${window.location.origin}/?ref=${referralCode}`;try{await navigator.clipboard.writeText(link);setReferralNotice("¡Enlace de invitación copiado!")}catch{setReferralNotice(link)}};
 const clip=clips[active];
 const earned=claimed.reduce((n,id)=>n+(clips.find(c=>c.id===id)?.coins||0),0);
 const claim=()=>{if(!claimed.includes(clip.id)){setClaimed([...claimed,clip.id]);setCoins(coins+clip.coins)}};
 const next=()=>setActive((active+1)%clips.length);
 const prev=()=>setActive((active+clips.length-1)%clips.length);
 return <main className="shell">
  <aside className="sidebar">
   <a className="brand" href="#"><span className="brandMark">C</span><span>CLIP<span className="brandAccent">CLAPS</span><small>WATCH · ENJOY · REWARD</small></span></a>
   <div className="sideLabel">MENÚ PRINCIPAL</div>
   {["⌂|Inicio","▣|Explorar","◉|Recompensas","▤|Mi actividad"].map(x=><button key={x} className={"navItem "+(x.startsWith("⌂")?"selected":"")} onClick={()=>x.includes("Recompensas")?setShowWallet(true):setTab(x.split("|")[1])}><span>{x.split("|")[0]}</span>{x.split("|")[1]}</button>)}
   <div className="sideLabel communityLabel">TU ESPACIO</div>
   <button className="navItem" onClick={()=>setShowWallet(true)}><span>◈</span>Mi billetera</button>
   <button className="navItem" onClick={()=>setTab("Siguiendo")}><span>♡</span>Siguiendo</button>\n   <button className={"navItem "+(tab==="Referidos"?"selected":"")} onClick={()=>setTab("Referidos")}><span>♧</span>Invita y gana</button>
   <div className="sidebarPromo"><div className="spark">✦</div><b>¡Cada clip cuenta!</b><p>Disfruta contenido y descubre nuevas recompensas.</p><button onClick={()=>setShowWallet(true)}>Ver mis puntos <span>→</span></button></div>
   <div className="profileMini"><div className="avatar">J</div><div><b>Invitado</b><small>Cuenta de prueba</small></div><span className="dots">•••</span></div>
  </aside>
  <section className="mainArea">
   <header className="topbar"><div className="mobileBrand"><span className="brandMark">C</span> CLIPCLAPS</div><div className="search"><span>⌕</span><input placeholder="Buscar videos, creadores..." /></div><div className="topActions"><button className="iconBtn" aria-label="Notificaciones">♧</button><button className="walletBtn" onClick={()=>setShowWallet(true)}><span>◈</span><b>{coins.toLocaleString("es-PE")}</b><small>MONEDAS</small></button><div className="avatar topAvatar">J</div></div></header>
   <div className="content">
    <div className="welcome"><div><div className="eyebrow">TU MOMENTO, TU RECOMPENSA <span>✦</span></div><h1>Descubre. Disfruta.<em> Gana.</em></h1><p>Tu próximo video favorito está a un scroll de distancia.</p></div><div className="welcomeBadge"><span>✦</span><div><b>CLIPCLAPS</b><small>Una nueva forma de disfrutar</small></div></div></div>
    <div className="feedHeader"><div className="tabs">{["Para ti","Tendencias","Nuevos"].map(t=><button onClick={()=>setTab(t)} className={tab===t?"tab activeTab":"tab"} key={t}>{t}</button>)}</div><button className="filterBtn">☷ <span>Filtrar</span></button></div>
    {tab==="Referidos"?<section className="referralPage"><div className="referralHero"><div className="eyebrow">CRECE CON CLIPCLAPS</div><h2>Invita amigos. <em>Gana monedas.</em></h2><p>Comparte tu enlace personal. Cuando una persona nueva se registre correctamente con tu invitación, recibirás una comisión fija.</p><div className="referralReward"><b>+{referralCommission}</b><span>MONEDAS POR CADA REGISTRO VÁLIDO</span></div><button className="claimBtn referralShare" onClick={shareReferral}>↗ Compartir mi invitación</button>{referralNotice&&<div className="referralNotice">{referralNotice}</div>}</div><div className="referralMetrics"><div><span>Personas invitadas</span><b>{referralCount}</b></div><div><span>Comisiones acumuladas</span><b>{referralEarnings} <small>monedas</small></b></div><div><span>Comisión por referido</span><b>{referralCommission} <small>monedas</small></b></div></div><div className="referralInfo"><h3>Tu código de invitación</h3><div className="referralCode"><strong>{referralCode}</strong><button onClick={()=>{navigator.clipboard?.writeText(referralCode);setReferralNotice("Código copiado.")}}>Copiar código</button></div><p>La comisión se acredita una sola vez por cada cuenta nueva que complete el registro y supere las validaciones. No se permiten autorreferidos ni cuentas duplicadas.</p><small>MODO DEMO · Las comisiones son monedas de prueba, no dinero real ni canjeable todavía.</small></div></section>:<div className="feedLayout">
     <div className="videoStage">
      <div className="clipMeta"><span className="tag">{clip.tag}</span><span className="clipCount">{String(active+1).padStart(2,"0")} / 03</span></div>
      <div className={"videoFrame "+clip.color}>
       <video key={clip.id} src={clip.src} autoPlay muted loop playsInline />
       <div className="videoShade"></div>
       <div className="videoCopy"><span className="creator">{clip.creator} <i>✓</i></span><h2>{clip.title}</h2><p>{clip.desc}</p></div>
       <div className="videoControls"><button onClick={prev} aria-label="Video anterior">↑</button><button onClick={next} aria-label="Siguiente video">↓</button></div>
       <div className="videoBottom"><span>▶ &nbsp;{clip.views} reproducciones</span><span>•••</span></div>
      </div>
      <div className="clipActions"><button onClick={()=>setLiked(liked.includes(clip.id)?liked.filter(x=>x!==clip.id):[...liked,clip.id])} className={liked.includes(clip.id)?"actionOn":""}><span>♡</span> Me gusta</button><button onClick={()=>navigator.clipboard?.writeText(location.href)}><span>↗</span> Compartir</button><button><span>▢</span> Guardar</button><div className="rewardPill">✦ +{clip.coins} monedas</div></div>
     </div>
     <aside className="rightRail">
      <div className="rewardCard"><div className="rewardIcon">✦</div><span className="cardEyebrow">RECOMPENSA DE ESTE CLIP</span><div className="rewardAmount">+{clip.coins}<small> monedas</small></div><p>Mira, descubre y acumula puntos de prueba.</p><button className="claimBtn" onClick={claim} disabled={claimed.includes(clip.id)}>{claimed.includes(clip.id)?"✓ Recompensa recibida":"Reclamar recompensa"}</button><small className="demoNote">MODO DEMO · SIN VALOR MONETARIO</small></div>
      <div className="balanceCard"><div className="balanceTop"><span>MI SALDO</span><span>◈</span></div><div className="balanceValue">{coins.toLocaleString("es-PE")} <small>CLIPS</small></div><div className="balanceProgress"><span style={{width:Math.min(100,coins/5)+"%"}}></span></div><div className="balanceFoot"><span>Saldo de prueba</span><button onClick={()=>setShowWallet(true)}>Ver billetera →</button></div></div>
      <div className="quickStats"><div><span>Videos vistos</span><b>{active+1}</b></div><div><span>Clips ganados</span><b>{claimed.length}</b></div></div>
      <div className="tip"><span>✧</span><p><b>Consejo del día</b> Explora nuevas categorías para descubrir contenido que te encante.</p></div>
     </aside>
    </div>
    <footer>© 2026 CLIPCLAPS <span>•</span> Plataforma en fase de prueba <span>•</span> <a href="#">Términos</a> <a href="#">Privacidad</a></footer>
   </div>
  </section>
  {showWallet&&<div className="modalBackdrop" onClick={()=>setShowWallet(false)}><section className="walletModal" onClick={e=>e.stopPropagation()}><button className="closeModal" onClick={()=>setShowWallet(false)}>×</button><div className="eyebrow">TU BILLETERA</div><h2>Tu progreso en CLIPCLAPS</h2><div className="modalBalance"><span>Saldo de prueba</span><b>◈ {coins.toLocaleString("es-PE")} <small>monedas</small></b></div><div className="walletRow"><span>Recompensas reclamadas</span><b>+{earned} monedas</b></div><div className="walletRow"><span>Saldo inicial de demostración</span><b>120 monedas</b></div><p className="modalDisclaimer">Las monedas son puntos ficticios para probar la experiencia. No representan dinero, no son canjeables y no se pueden retirar.</p><button className="claimBtn" onClick={()=>setShowWallet(false)}>Continuar viendo videos</button></section></div>}
  <nav className="mobileNav"><button className="selected">⌂<small>Inicio</small></button><button onClick={()=>setTab("Explorar")}>▣<small>Explorar</small></button><button onClick={()=>setShowWallet(true)}>◈<small>Billetera</small></button><button>☺<small>Perfil</small></button></nav>
 </main>
}
