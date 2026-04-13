import { useState, useEffect, useRef } from "react";

// ─── CREDENCIAIS ────────────────────────────────
const ADMINS = [
  { user: "admin", key: "sofia2025" },
  { user: "dev",   key: "sofiadev2025" },
];
const TENANTS = {
  inspire: {
    user:"inspire", key:"inspire2025", ativo:true,
    nome:"Inspire Ambientes",
    endereco:"Av. Brasil, 4677 — Centro, Cascavel-PR",
    referencia:"Esquina com o Burger King",
    maps:"https://maps.google.com/?q=Av.+Brasil+4677+Cascavel+PR",
    whatsapp:"554532273913",
    instagram:"https://instagram.com/inspireambientescascavel",
    agente:"Sofia",
    horarios:"Seg–Sex: 9h–18h | Sáb: 9h–13h",
    portfolio:`- Sala de Estar: Sofás, poltronas, racks, painéis TV, aparadores — linhas premium
- Quartos: Camas, cabeceiras, guarda-roupas planejados, cômodas — qualidade superior
- Cozinhas Planejadas: Projetos personalizados, marcenaria de alto nível, sob medida
- Escritório/Home Office: Mesas executivas, cadeiras ergonômicas, estantes planejadas`,
    cor:"#C9A96E",
    welcome:`Olá! Seja muito bem-vindo à Inspire Ambientes. Sou Sofia, sua consultora virtual.\n\nÉ um prazer recebê-lo. Como posso ajudá-lo a transformar o seu espaço hoje?`,
  },
};

// ─── AUTH ───────────────────────────────────────
function doLogin(u,k){
  const user=u.trim().toLowerCase(), key=k.trim();
  if(ADMINS.find(a=>a.user===user&&a.key===key)) return {tipo:"admin",user};
  for(const [id,t] of Object.entries(TENANTS))
    if(t.user===user&&t.key===key&&t.ativo) return {tipo:"tenant",user,tenantId:id};
  return null;
}
const SS="sfia_v3";
const saveS=s=>{try{localStorage.setItem(SS,JSON.stringify({...s,ts:Date.now()}));}catch{}};
const loadS=()=>{try{const s=JSON.parse(localStorage.getItem(SS));if(!s||Date.now()-s.ts>8*3600000){localStorage.removeItem(SS);return null;}return s;}catch{return null;}};
const clearS=()=>{try{localStorage.removeItem(SS);}catch{}};

// ─── UTILS ──────────────────────────────────────
const sc=n=>n>=70?"#5A8A5A":n>=40?"#C9A96E":"#7AACBF";
const fmtDt=iso=>{try{return new Date(iso).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"});}catch{return"—";}};
const fmtHr=iso=>{try{return new Date(iso).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});}catch{return"";}};
const calcScore=l=>{let s=0;if(l.nome)s+=10;if(l.telefone)s+=20;if(l.interesse)s+=10;if(l.ambiente)s+=5;if(l.ticket)s+=15;if(l.prazo)s+=10;if(l.canal)s+=5;if(l.qual==="Quente")s+=25;else if(l.qual==="Morno")s+=12;if(l.objecoes)s-=5;return Math.max(0,Math.min(100,s));};
const QUAL={quente:{cor:"#E8855A",bg:"rgba(232,133,90,0.12)",label:"🔥 Quente"},morno:{cor:"#C9A96E",bg:"rgba(201,169,110,0.12)",label:"🌡 Morno"},frio:{cor:"#7AACBF",bg:"rgba(122,172,191,0.12)",label:"❄️ Frio"}};
const STATUS={ativo:{cor:"#C9A96E",bg:"rgba(201,169,110,0.10)",label:"💬 Ativo"},agendado:{cor:"#7AACBF",bg:"rgba(122,172,191,0.10)",label:"📅 Agendado"},convertido:{cor:"#5A8A5A",bg:"rgba(90,138,90,0.10)",label:"✅ Convertido"},perdido:{cor:"#8A5A5A",bg:"rgba(138,90,90,0.10)",label:"✗ Perdido"}};
const CAMPOS={nome:"Nome",telefone:"Contato",canal:"Canal",interesse:"Interesse",ambiente:"Ambiente",ticket:"Ticket",prazo:"Prazo",qual:"Qualificação",objecoes:"Objeções",intencao:"Intenção",resumo:"Resumo",proximo:"Próx. Passo"};
const gQ=q=>q?(QUAL[q.toLowerCase()]||null):null;
const gS=s=>STATUS[s]||STATUS.ativo;
const isHorario=()=>{const n=new Date(),d=n.getDay(),h=n.getHours();return d!==0&&h>=8&&h<18;};

function parseResp(text){
  const m=text.match(/\|\|\|LEAD\|\|\|([\s\S]*?)\|\|\|LEAD\|\|\|/);
  const hasLoc=text.includes("|||LOC|||");
  const hasHuman=text.includes("|||HUMANO|||");
  const clean=text.replace(/\|\|\|LEAD\|\|\|[\s\S]*?\|\|\|LEAD\|\|\|/g,"").replace(/\|\|\|LOC\|\|\|/g,"").replace(/\|\|\|HUMANO\|\|\|/g,"").trim();
  let data=null;
  if(m){try{data=JSON.parse(m[1].trim());}catch{}}
  return{clean,data,hasLoc,hasHuman};
}

function buildPrompt(t){
  return `Você é ${t.agente}, consultora virtual da ${t.nome} em ${t.endereco}.

ENDEREÇO: ${t.endereco}. Ref: ${t.referencia}.
Ao mencionar o endereço, insira exatamente: |||LOC|||

HORÁRIOS: ${t.horarios} | Dom/feriados: fechado

PORTFÓLIO:
${t.portfolio}

TOM: Formal, sofisticado, acolhedor. Use "investimento" (nunca preço). Use "showroom" (nunca loja).
Máximo 3 frases por mensagem. Direto e elegante. Português brasileiro.

FLUXO DE COLETA (natural, nunca parecer formulário):
1. Nome do cliente — pergunte logo no início
2. Canal de origem — como nos encontrou?
3. O que está procurando e qual ambiente
4. Contexto — casa nova, reforma, ou substituição?
5. Ticket estimado — "Você já tem uma referência de investimento em mente?"
6. Prazo desejado
7. Contato — WhatsApp ou telefone
8. Disponibilidade para visitar

PERGUNTAS NATURAIS (varie sempre):
- "Como posso chamá-lo?"
- "Que ambiente você está pensando em renovar?"
- "É para casa nova, reforma ou substituição?"
- "Você já tem uma referência de investimento em mente?"
- "Tem algum prazo em vista?"
- "Qual o melhor contato para nosso consultor retornar?"
- "Que tal agendar uma visita para sentir a qualidade pessoalmente?"

OBJEÇÕES:
- "É caro" → "Nossos móveis duram décadas. O investimento se dilui no tempo e no prazer diário."
- "Pesquisando" → "Ótimo momento! Sentir a qualidade pessoalmente faz toda a diferença."
- "Vou pensar" → "Com certeza! Posso enviar o catálogo. Qual o melhor contato?"

UPSELL: Sofá→tapete+mesa | Cama→criado+guarda-roupa | Cozinha→mesa jantar | Escritório→estante

QUALIFICAÇÃO: Quente=projeto+prazo≤30d+ticket | Morno=interesse+indefinição | Frio=pesquisa

TRANSFERÊNCIA: Se pedir atendente/consultor/humano, insira: |||HUMANO|||
Exemplo: "Com prazer! Vou conectá-lo agora com um consultor. |||HUMANO|||"

REGRAS: Nunca invente preços. Nunca mencione concorrentes. Tom sofisticado sempre.

---
OBRIGATÓRIO ao final de CADA resposta:
|||LEAD|||{"nome":null,"telefone":null,"canal":null,"interesse":null,"ambiente":null,"ticket":null,"prazo":null,"qual":null,"proximo":null,"objecoes":null,"resumo":null,"intencao":null}|||LEAD|||
qual: "Quente"/"Morno"/"Frio" | intencao: "Alta"/"Média"/"Baixa" | resumo: 1-2 frases para o vendedor`;
}

// ─── ATOMS ──────────────────────────────────────
const G={
  bg:"#0C0B09",sur:"#121109",el:"#1A1814",
  bo:"#252218",boh:"#3A3628",
  go:"#C9A96E",gl:"#E8C98A",gd:"#7A6438",
  tx:"#EDE8DE",tm:"#6A6050",td:"#3A3828",
};

function ScoreRing({score,size=42}){
  const c=sc(score),r=size/2-4,circ=2*Math.PI*r,dash=(score/100)*circ;
  return(
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={G.bo} strokeWidth="3"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth="3" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray .5s"}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size>36?11:9,fontWeight:600,color:c}}>{score}</div>
    </div>
  );
}

function LocCard({t}){
  return(
    <a href={t.maps} target="_blank" rel="noopener noreferrer" style={{display:"block",background:G.el,border:`1px solid ${G.gd}`,borderRadius:10,overflow:"hidden",textDecoration:"none",marginTop:6}}>
      <div style={{padding:"11px 13px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,background:"rgba(201,169,110,0.1)",border:`1px solid ${G.gd}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>📍</div>
        <div>
          <div style={{fontSize:12,fontWeight:500,color:G.gl,marginBottom:2}}>{t.nome} — Showroom</div>
          <div style={{fontSize:10.5,color:G.tm}}>{t.endereco}</div>
          <div style={{fontSize:9.5,color:G.td,marginTop:1}}>{t.referencia}</div>
        </div>
      </div>
      <div style={{padding:"6px 13px",background:"rgba(201,169,110,0.04)",borderTop:`1px solid ${G.bo}`,fontSize:9.5,color:G.gd}}>↗ Abrir no Google Maps</div>
    </a>
  );
}

function HumanCard({t,nome}){
  const msg=encodeURIComponent(`Olá! Sou ${nome||"um cliente"} e estava conversando com ${t.agente}. Gostaria de falar com um consultor da ${t.nome}.`);
  return(
    <a href={`https://wa.me/${t.whatsapp}?text=${msg}`} target="_blank" rel="noopener noreferrer" style={{display:"block",background:"rgba(90,138,90,0.06)",border:"1px solid rgba(90,138,90,0.3)",borderRadius:10,overflow:"hidden",textDecoration:"none",marginTop:6}}>
      <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,background:"rgba(90,138,90,0.12)",border:"1px solid rgba(90,138,90,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>💬</div>
        <div>
          <div style={{fontSize:12,fontWeight:500,color:"#7ACA7A",marginBottom:2}}>Transferindo para consultor</div>
          <div style={{fontSize:10.5,color:"#5A7A5A"}}>{t.nome} · WhatsApp</div>
        </div>
      </div>
      <div style={{padding:"6px 14px",background:"rgba(90,138,90,0.04)",borderTop:"1px solid rgba(90,138,90,0.15)",fontSize:10,color:"rgba(90,138,90,0.7)"}}>↗ Abrir WhatsApp</div>
    </a>
  );
}

function Dots(){
  return(
    <div style={{display:"flex",gap:4,padding:"4px 0",alignItems:"center"}}>
      {[0,1,2].map(i=><div key={i} style={{width:5,height:5,background:G.gd,borderRadius:"50%",animation:`pu 1.4s ${i*.2}s infinite`}}/>)}
    </div>
  );
}

// ─── LOGIN ──────────────────────────────────────
function Login({onLogin}){
  const [u,setU]=useState("");const [k,setK]=useState("");const [err,setErr]=useState("");const [loading,setLoading]=useState(false);const [show,setShow]=useState(false);
  function go(){
    if(!u.trim()||!k.trim()){setErr("Preencha todos os campos.");return;}
    setLoading(true);setErr("");
    setTimeout(()=>{
      const s=doLogin(u,k);
      if(s){saveS(s);onLogin(s);}else setErr("Usuário ou chave inválidos.");
      setLoading(false);
    },700);
  }
  return(
    <div style={{minHeight:"100vh",background:G.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}input,button,textarea{font-family:'DM Sans',sans-serif}@keyframes pu{0%,60%,100%{opacity:.3;transform:scale(1)}30%{opacity:1;transform:scale(1.3)}}@keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}@keyframes ti{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{width:58,height:58,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%,#E8C98A,#7A6438)",boxShadow:"0 0 28px rgba(201,169,110,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:"#0C0B09",fontWeight:600,margin:"0 auto 14px"}}>S</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:400,color:G.gl,letterSpacing:".06em",marginBottom:4}}>Sofia IA Platform</div>
        <div style={{fontSize:11,color:G.tm,letterSpacing:".14em",textTransform:"uppercase"}}>Sistema de Atendimento Inteligente</div>
      </div>
      <div style={{width:"100%",maxWidth:380,background:G.sur,border:`1px solid ${G.bo}`,borderRadius:16,padding:"32px 28px",boxShadow:"0 24px 60px rgba(0,0,0,.5)"}}>
        <div style={{fontSize:13,fontWeight:500,color:G.tx,textAlign:"center",marginBottom:24}}>Acesso Restrito</div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:".12em",color:G.tm,marginBottom:5}}>Usuário</div>
          <input value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="ex: admin" style={{width:"100%",background:G.el,border:`1px solid ${G.bo}`,borderRadius:8,padding:"11px 14px",color:G.tx,fontSize:13,outline:"none"}} onFocus={e=>e.target.style.borderColor=G.gd} onBlur={e=>e.target.style.borderColor=G.bo}/>
        </div>
        <div style={{marginBottom:22}}>
          <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:".12em",color:G.tm,marginBottom:5}}>Chave de Acesso</div>
          <div style={{position:"relative"}}>
            <input value={k} onChange={e=>setK(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} type={show?"text":"password"} placeholder="sua chave" style={{width:"100%",background:G.el,border:`1px solid ${G.bo}`,borderRadius:8,padding:"11px 40px 11px 14px",color:G.tx,fontSize:13,outline:"none"}} onFocus={e=>e.target.style.borderColor=G.gd} onBlur={e=>e.target.style.borderColor=G.bo}/>
            <button onClick={()=>setShow(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:14,color:G.tm}}>{show?"🙈":"👁"}</button>
          </div>
        </div>
        {err&&<div style={{fontSize:11,color:"#E08A7A",background:"rgba(176,80,64,.1)",border:"1px solid rgba(176,80,64,.3)",borderRadius:7,padding:"8px 12px",marginBottom:14,textAlign:"center"}}>{err}</div>}
        <button onClick={go} disabled={loading} style={{width:"100%",padding:12,background:G.go,border:"none",borderRadius:9,cursor:"pointer",fontSize:13,fontWeight:600,color:"#0C0B09",opacity:loading?.7:1,transition:"opacity .2s"}}>{loading?"Verificando...":"Acessar Plataforma"}</button>
        <div style={{textAlign:"center",marginTop:14,fontSize:10,color:G.td}}>Sofia IA Platform © 2025 · Acesso monitorado</div>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ────────────────────────────────
function AdminPanel({session,onLogout,onVoltar}){
  const list=Object.entries(TENANTS);
  return(
    <div style={{height:"100vh",background:G.bg,overflowY:"auto",fontFamily:"'DM Sans',sans-serif",color:G.tx}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}`}</style>
      <header style={{background:G.sur,borderBottom:`1px solid ${G.bo}`,padding:"0 18px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%,#E8C98A,#7A6438)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:"#0C0B09",fontWeight:600}}>S</div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:500,color:G.gl}}>Painel Master</div>
            <div style={{fontSize:9,color:G.tm,textTransform:"uppercase",letterSpacing:".1em"}}>Admin · {session.user}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={onVoltar} style={{fontSize:11,padding:"5px 12px",background:"rgba(201,169,110,.08)",border:`1px solid ${G.gd}`,borderRadius:6,cursor:"pointer",color:G.go}}>← Sofia</button>
          <button onClick={onLogout} style={{fontSize:11,padding:"5px 12px",background:"transparent",border:`1px solid ${G.bo}`,borderRadius:6,cursor:"pointer",color:G.tm}}>Sair</button>
        </div>
      </header>
      <div style={{padding:18,maxWidth:700,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:22}}>
          {[{label:"Clientes Ativos",val:list.filter(([,t])=>t.ativo).length,cor:G.go},{label:"Cadastrados",val:list.length,cor:G.tx},{label:"Plataforma",val:"Online 🟢",cor:"#5A8A5A"}].map(m=>(
            <div key={m.label} style={{background:G.sur,border:`1px solid ${G.bo}`,borderRadius:10,padding:"13px 15px"}}>
              <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:".1em",color:G.tm,marginBottom:5}}>{m.label}</div>
              <div style={{fontSize:22,fontFamily:"'Cormorant Garamond',serif",color:m.cor}}>{m.val}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".12em",color:G.tm,marginBottom:12}}>Clientes Cadastrados</div>
        {list.map(([id,t])=>(
          <div key={id} style={{background:G.sur,border:`1px solid ${G.bo}`,borderRadius:10,padding:"16px 18px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
              <span style={{fontSize:14,fontWeight:500}}>{t.nome}</span>
              <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:t.ativo?"rgba(90,138,90,.1)":"rgba(138,90,90,.1)",color:t.ativo?"#7ACA7A":"#E08A7A",border:`1px solid ${t.ativo?"rgba(90,138,90,.2)":"rgba(138,90,90,.2)"}`}}>{t.ativo?"● Ativo":"● Inativo"}</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <span style={{fontSize:11,color:G.tm}}>👤 Usuário: <b style={{color:G.tx}}>{t.user}</b></span>
              <span style={{fontSize:11,color:G.tm}}>🔑 Chave: <b style={{color:G.tx}}>{t.key}</b></span>
              <span style={{fontSize:11,color:G.tm}}>🤖 Agente: {t.agente} · 📍 {t.endereco}</span>
            </div>
          </div>
        ))}
        <div style={{marginTop:16,padding:"13px 16px",background:"rgba(201,169,110,.03)",border:"1px solid rgba(201,169,110,.08)",borderRadius:10,fontSize:11,color:G.td,lineHeight:1.7}}>
          <b style={{color:G.tm}}>Adicionar cliente:</b> Copie o bloco template da seção TENANTS no arquivo, preencha os dados e o cliente acessa imediatamente.
        </div>
      </div>
    </div>
  );
}

// ─── SOFIA PRINCIPAL ────────────────────────────
function Sofia({tenant,tenantId,session,onLogout,onAdminPanel}){
  const t=tenant;
  const PROMPT=buildPrompt(t);
  const C=t.cor||G.go;
  const PREFIX=`${tenantId}_v3_`;

  // ESTADO PRINCIPAL — aba: "chat" | "conversas" | "painel" | "leads"
  const [aba,setAba]=useState("chat");

  // Chat — novo atendimento
  const [msgs,setMsgs]=useState([{role:"assistant",content:t.welcome,ts:new Date().toISOString()}]);
  const [extras,setExtras]=useState({});
  const [lead,setLead]=useState({});
  const [inp,setInp]=useState("");
  const [loading,setLoading]=useState(false);

  // Threads
  const [threads,setThreads]=useState([]);
  const [activeId,setActiveId]=useState(null); // null = novo atendimento
  const [threadInp,setThreadInp]=useState("");
  const [tLoading,setTLoading]=useState(false);

  // Ações
  const [fuRunning,setFuRunning]=useState(false);
  const [scheduling,setScheduling]=useState(false);
  const [mailing,setMailing]=useState(false);

  const [toast,setToast]=useState(null);
  const msgsRef=useRef(null);
  const taRef=useRef(null);
  const fuRef=useRef(null);

  useEffect(()=>{loadThreads();},[]);
  useEffect(()=>{if(msgsRef.current)msgsRef.current.scrollTop=msgsRef.current.scrollHeight;},[msgs,loading,threads,activeId,tLoading]);
  useEffect(()=>{fuRef.current=setInterval(()=>autoFU(),30*60*1000);return()=>clearInterval(fuRef.current);},[threads]);

  function showToast(msg,type="ok"){setToast({msg,type});setTimeout(()=>setToast(null),3200);}

  // Storage
  async function loadThreads(){
    try{
      const list=await window.storage.list(`${PREFIX}th:`);
      if(!list?.keys?.length)return;
      const arr=[];
      for(const k of list.keys){try{const r=await window.storage.get(k);if(r?.value)arr.push(JSON.parse(r.value));}catch{}}
      setThreads(arr.sort((a,b)=>new Date(b.at)-new Date(a.at)));
    }catch{}
  }
  async function saveTh(th){try{await window.storage.set(`${PREFIX}th:${th.id}`,JSON.stringify(th));}catch{}}
  function updTh(id,fn){
    setThreads(prev=>{
      const next=prev.map(th=>th.id===id?fn(th):th);
      const found=next.find(th=>th.id===id);
      if(found)saveTh(found);
      return next.sort((a,b)=>new Date(b.at)-new Date(a.at));
    });
  }

  // Computed para aba atual
  const isChatNovo=activeId===null;
  const activeTh=threads.find(x=>x.id===activeId);
  const curLead=isChatNovo?lead:(activeTh?.lead||{});
  const curMsgs=isChatNovo?msgs:(activeTh?.msgs||[]);
  const curExtras=isChatNovo?extras:(activeTh?.extras||{});
  const score=curLead.score||calcScore(curLead);
  const qual=gQ(curLead.qual);
  const camposKeys=Object.keys(CAMPOS);
  const filled=camposKeys.filter(k=>curLead[k]).length;
  const pct=Math.round((filled/camposKeys.length)*100);
  const totalUnread=threads.reduce((a,th)=>a+(th.unread||0),0);

  // API
  async function callAPI(history){
    const res=await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:PROMPT,messages:history.map(m=>({role:m.role,content:m.content}))}),
    });
    if(!res.ok)throw new Error(String(res.status));
    const d=await res.json();
    return d.content?.[0]?.text||"Desculpe, ocorreu um erro.";
  }

  // Enviar mensagem
  async function sendMsg(){
    const text=(isChatNovo?inp:threadInp).trim();
    if(!text||(isChatNovo?loading:tLoading))return;

    if(isChatNovo){
      const um={role:"user",content:text,ts:new Date().toISOString()};
      const hist=[...msgs,um];
      setMsgs(hist);setInp("");resizeTa();setLoading(true);
      try{
        const raw=await callAPI(hist);
        const{clean,data,hasLoc,hasHuman}=parseResp(raw);
        let nl={...lead};
        if(data){Object.entries(data).forEach(([k,v])=>{if(v!==null)nl[k]=v;});nl.score=calcScore(nl);setLead(nl);}
        const am={role:"assistant",content:clean,ts:new Date().toISOString()};
        const fm=[...hist,am];
        const idx=fm.length-1;
        const ne={...extras};
        if(hasLoc||hasHuman)ne[idx]={loc:hasLoc,human:hasHuman};
        setMsgs(fm);setExtras(ne);
        if(hasHuman){const m=encodeURIComponent(`Olá! Sou ${nl.nome||"um cliente"} conversando com ${t.agente}.`);setTimeout(()=>window.open(`https://wa.me/${t.whatsapp}?text=${m}`,"_blank"),1200);}
      }catch(e){
        const msg=["429","529"].includes(e.message)?"⚠️ Limite de mensagens atingido. Aguarde ou atualize seu plano.":"Erro de conexão. Tente novamente.";
        setMsgs(prev=>[...prev,{role:"assistant",content:msg,ts:new Date().toISOString()}]);
      }finally{setLoading(false);}
    }else{
      const th=activeTh;if(!th)return;
      const um={role:"user",content:text,ts:new Date().toISOString()};
      const hist=[...th.msgs,um];
      updTh(activeId,p=>({...p,msgs:hist,at:new Date().toISOString()}));
      setThreadInp("");resizeTa();setTLoading(true);
      try{
        const raw=await callAPI(hist);
        const{clean,data,hasLoc,hasHuman}=parseResp(raw);
        updTh(activeId,p=>{
          let nl={...p.lead};
          if(data){Object.entries(data).forEach(([k,v])=>{if(v!==null)nl[k]=v;});nl.score=calcScore(nl);}
          const am={role:"assistant",content:clean,ts:new Date().toISOString()};
          const fm=[...hist,am];
          const ne={...p.extras};
          if(hasLoc||hasHuman)ne[fm.length-1]={loc:hasLoc,human:hasHuman};
          return{...p,msgs:fm,extras:ne,lead:nl,at:new Date().toISOString()};
        });
        if(hasHuman){const m=encodeURIComponent(`Olá! Sou ${th.lead?.nome||"um cliente"}.`);setTimeout(()=>window.open(`https://wa.me/${t.whatsapp}?text=${m}`,"_blank"),1200);}
      }catch{
        updTh(activeId,p=>({...p,msgs:[...p.msgs,{role:"assistant",content:"Erro de conexão.",ts:new Date().toISOString()}]}));
      }finally{setTLoading(false);}
    }
  }

  function salvar(){
    if(!lead.nome&&!lead.telefone&&!lead.interesse){showToast("Colete ao menos um dado antes de salvar.","err");return;}
    const id=`th_${Date.now()}`;
    const th={id,lead:{...lead},msgs:[...msgs],extras:{...extras},status:"ativo",at:new Date().toISOString(),fuCount:0,unread:0};
    setThreads(prev=>[th,...prev].sort((a,b)=>new Date(b.at)-new Date(a.at)));
    saveTh(th);
    setMsgs([{role:"assistant",content:t.welcome,ts:new Date().toISOString()}]);setExtras({});setLead({});
    showToast(`✓ "${th.lead.nome||"conversa"}" salva!`);
    setActiveId(id);setAba("chat");
  }

  function novoAtt(){setActiveId(null);setAba("chat");}

  function resizeTa(){if(taRef.current){taRef.current.style.height="48px";taRef.current.style.height=Math.min(taRef.current.scrollHeight,120)+"px";}}

  // Follow-up
  async function autoFU(){
    if(!isHorario())return;
    for(const th of threads){
      if(th.status==="convertido"||th.status==="perdido")continue;
      if((th.fuCount||0)>=3)continue;
      if(Date.now()-new Date(th.at).getTime()<4*3600000)continue;
      if(!th.msgs.find(m=>m.role==="user"))continue;
      const ctx=[th.lead?.nome&&`Nome: ${th.lead.nome}`,th.lead?.interesse&&`Interesse: ${th.lead.interesse}`].filter(Boolean).join("\n");
      const ul=th.msgs.slice(-4).map(m=>`[${m.role==="assistant"?t.agente:"Cliente"}]: ${m.content}`).join("\n");
      try{
        const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:180,messages:[{role:"user",content:`Você é ${t.agente} da ${t.nome}. Gere UMA mensagem de follow-up curta (máx 2 frases) para reengajar cliente sem resposta há 4h. Tom sofisticado, referência ao que mencionou. Finalize com pergunta. Apenas o texto.\nCONTEXTO:\n${ctx}\nÚLTIMAS:\n${ul}`}]})});
        const d=await res.json();
        const fuMsg=d.content?.[0]?.text?.trim();
        if(!fuMsg)continue;
        updTh(th.id,p=>({...p,msgs:[...p.msgs,{role:"assistant",content:fuMsg,ts:new Date().toISOString(),isFollowup:true}],at:new Date().toISOString(),fuCount:(p.fuCount||0)+1,unread:(p.unread||0)+1}));
        showToast(`🔔 Follow-up: ${th.lead?.nome||"cliente"}`);
      }catch{}
    }
  }

  async function manualFU(id){
    if(!isHorario()){showToast("Fora do horário comercial (8h–18h).","err");return;}
    setFuRunning(true);
    const th=threads.find(x=>x.id===id);if(!th){setFuRunning(false);return;}
    const ctx=[th.lead?.nome&&`Nome: ${th.lead.nome}`,th.lead?.interesse&&`Interesse: ${th.lead.interesse}`].filter(Boolean).join("\n");
    const ul=th.msgs.slice(-4).map(m=>`[${m.role==="assistant"?t.agente:"Cliente"}]: ${m.content}`).join("\n");
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:180,messages:[{role:"user",content:`Você é ${t.agente} da ${t.nome}. Gere UMA mensagem de follow-up curta (máx 2 frases). Tom sofisticado, referência ao que mencionou. Finalize com pergunta. Apenas o texto.\nCONTEXTO:\n${ctx}\nÚLTIMAS:\n${ul}`}]})});
      const d=await res.json();const fuMsg=d.content?.[0]?.text?.trim();
      if(!fuMsg){showToast("Erro ao gerar.","err");return;}
      updTh(id,p=>({...p,msgs:[...p.msgs,{role:"assistant",content:fuMsg,ts:new Date().toISOString(),isFollowup:true}],at:new Date().toISOString(),fuCount:(p.fuCount||0)+1}));
      showToast("✓ Follow-up enviado!");
    }catch{showToast("Erro.","err");}
    finally{setFuRunning(false);}
  }

  async function agendar(){
    setScheduling(true);
    try{
      await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:`Crie evento Google Calendar: visita ${t.nome} com ${curLead?.nome||"Cliente"}.\nInteresse: ${curLead?.interesse||"—"} | Ticket: ${curLead?.ticket||"—"}\nAmanhã 10h, 1h. Título: "Visita — ${curLead?.nome||"Cliente"}"\nLocal: ${t.endereco}`}],mcp_servers:[{type:"url",url:"https://gcal.mcp.claude.com/mcp",name:"gcal"}]})});
      showToast("📅 Visita agendada!");
    }catch{showToast("Erro ao agendar.","err");}
    finally{setScheduling(false);}
  }

  async function enviarEmail(){
    setMailing(true);
    try{
      const sumario=Object.entries(curLead||{}).filter(([,v])=>v).map(([k,v])=>`${CAMPOS[k]||k}: ${v}`).join("\n");
      const transcript=curMsgs.filter(m=>m.role!=="system").map(m=>`[${m.role==="assistant"?t.agente:curLead?.nome||"Cliente"}]: ${m.content}`).join("\n\n");
      await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:`Email para equipe ${t.nome}.\nAssunto: "Lead ${t.agente} IA — ${curLead?.nome||"Cliente"} | Score ${score}/100"\nDADOS:\n${sumario}\nHISTÓRICO:\n${transcript}`}],mcp_servers:[{type:"url",url:"https://gmail.mcp.claude.com/mcp",name:"gmail"}]})});
      showToast("✉ Relatório enviado!");
    }catch{showToast("Erro ao enviar.","err");}
    finally{setMailing(false);}
  }

  function exportCSV(){
    const cols=["nome","telefone","canal","interesse","ambiente","ticket","prazo","qual","intencao","objecoes","resumo","proximo","status","fuCount","at"];
    const header=cols.join(";");
    const rows=threads.map(th=>cols.map(c=>`"${((th.lead||{})[c]||th[c]||"").toString().replace(/"/g,'""')}"`).join(";"));
    const csv=[header,...rows].join("\n");
    const url=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download=`sofia_${tenantId}_${new Date().toISOString().slice(0,10)}.csv`;a.click();
    URL.revokeObjectURL(url);
  }

  // ─── UI ─────────────────────────────────────
  const tabBtn=(key,label,badge)=>(
    <button key={key} onClick={()=>setAba(key)} style={{flex:1,padding:"10px 0",border:"none",cursor:"pointer",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"color .2s",color:aba===key?C:G.tm,borderTop:aba===key?`2px solid ${C}`:"2px solid transparent"}}>
      <span style={{fontSize:18}}>{label}</span>
      {badge!=null&&badge>0&&<span style={{width:16,height:16,borderRadius:"50%",background:"#E8855A",color:"#fff",fontSize:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,position:"absolute",marginTop:-6,marginLeft:12}}>{badge}</span>}
    </button>
  );

  return(
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:G.bg,fontFamily:"'DM Sans',sans-serif",color:G.tx,position:"relative"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}input,button,textarea{font-family:'DM Sans',sans-serif}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#252218;border-radius:2px}@keyframes pu{0%,60%,100%{opacity:.3;transform:scale(1)}30%{opacity:1;transform:scale(1.3)}}@keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}@keyframes ti{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>

      {/* HEADER */}
      <header style={{background:G.sur,borderBottom:`1px solid ${G.bo}`,padding:"0 14px",height:50,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%,#E8C98A,#7A6438)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:"#0C0B09",fontWeight:600}}>{t.agente[0]}</div>
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:500,color:G.gl}}>{t.agente} IA</div>
            <div style={{fontSize:9,color:G.tm,textTransform:"uppercase",letterSpacing:".1em"}}>{t.nome}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          {qual&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:qual.bg,color:qual.cor,fontWeight:500}}>{qual.label}</span>}
          <ScoreRing score={score} size={36}/>
          {session?.tipo==="admin"&&onAdminPanel&&<button onClick={onAdminPanel} style={{fontSize:12,padding:"4px 8px",background:"rgba(232,133,90,.08)",border:"1px solid rgba(232,133,90,.2)",borderRadius:6,cursor:"pointer",color:"#E8855A"}}>👑</button>}
          <button onClick={onLogout} style={{fontSize:11,padding:"4px 8px",background:"transparent",border:`1px solid ${G.bo}`,borderRadius:6,cursor:"pointer",color:G.tm}}>Sair</button>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>

        {/* ═══ ABA: CHAT ═══ */}
        {aba==="chat"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {/* Sub-header do chat */}
            <div style={{padding:"8px 14px",background:G.sur,borderBottom:`1px solid ${G.bo}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              {isChatNovo?(
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>Novo Atendimento</div>
                  <div style={{fontSize:10,color:G.tm}}>A Sofia conduz automaticamente</div>
                </div>
              ):(
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <button onClick={novoAtt} style={{background:"none",border:"none",cursor:"pointer",color:G.tm,fontSize:18,lineHeight:1}}>←</button>
                  <div>
                    <div style={{fontSize:13,fontWeight:500}}>{activeTh?.lead?.nome||"Cliente"}</div>
                    <div style={{fontSize:10,color:G.tm}}>{activeTh?.lead?.interesse||"—"}{(activeTh?.fuCount||0)>0&&` · 🔔 ${activeTh.fuCount}x`}</div>
                  </div>
                </div>
              )}
              <div style={{fontSize:10,color:G.tm}}>{filled}/{camposKeys.length} campos · {pct}%</div>
            </div>

            {/* Mensagens */}
            <div ref={msgsRef} style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
              {curMsgs.map((m,i)=>{
                const isA=m.role==="assistant";
                return(
                  <div key={i} style={{display:"flex",flexDirection:"column",gap:3,animation:"fi .25s ease",alignSelf:isA?"flex-start":"flex-end",maxWidth:"86%"}}>
                    {m.isFollowup&&<div style={{fontSize:9,color:G.gd,textTransform:"uppercase",letterSpacing:".08em"}}>🔔 Follow-up · {fmtHr(m.ts)}</div>}
                    <div style={{display:"flex",gap:8,...(isA?{}:{flexDirection:"row-reverse"})}}>
                      <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,...(isA?{background:"radial-gradient(circle at 35% 35%,#E8C98A,#7A6438)",color:"#0C0B09",fontFamily:"'Cormorant Garamond',serif",fontWeight:600}:{background:G.el,color:G.tm,border:`1px solid ${G.bo}`})}}>{isA?t.agente[0]:"C"}</div>
                      <div style={{padding:"10px 14px",lineHeight:1.65,fontSize:13.5,whiteSpace:"pre-wrap",wordBreak:"break-word",...(isA?{background:m.isFollowup?"rgba(201,169,110,.04)":G.el,border:`1px solid ${m.isFollowup?"rgba(201,169,110,.2)":G.bo}`,borderRadius:"3px 12px 12px 12px",color:G.tx}:{background:"#1E1C17",border:"1px solid #2A2820",borderRadius:"12px 3px 12px 12px",color:G.tx})}}>{m.content}</div>
                    </div>
                    {m.ts&&<div style={{fontSize:9,color:G.td,paddingLeft:isA?34:0,paddingRight:isA?0:34,textAlign:isA?"left":"right"}}>{fmtHr(m.ts)}</div>}
                    {curExtras[i]&&(
                      <div style={{paddingLeft:34,display:"flex",flexDirection:"column",gap:5}}>
                        {curExtras[i].loc&&<LocCard t={t}/>}
                        {curExtras[i].human&&<HumanCard t={t} nome={curLead?.nome}/>}
                      </div>
                    )}
                  </div>
                );
              })}
              {(isChatNovo?loading:tLoading)&&(
                <div style={{display:"flex",gap:8,alignSelf:"flex-start"}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%,#E8C98A,#7A6438)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#0C0B09",fontFamily:"'Cormorant Garamond',serif",fontWeight:600}}>{t.agente[0]}</div>
                  <div style={{padding:"10px 14px",background:G.el,border:`1px solid ${G.bo}`,borderRadius:"3px 12px 12px 12px"}}><Dots/></div>
                </div>
              )}
            </div>

            {/* Botões sociais */}
            <div style={{display:"flex",gap:7,padding:"7px 14px",background:G.sur,borderTop:`1px solid ${G.bo}`,flexShrink:0}}>
              <button onClick={()=>window.open(`https://wa.me/${t.whatsapp}`,"_blank")} style={{flex:1,padding:"9px 0",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:5,background:"rgba(90,138,90,.10)",color:"#7ACA7A",border:"1px solid rgba(90,138,90,.25)"}}>💬 WhatsApp</button>
              <button onClick={()=>window.open(t.instagram,"_blank")} style={{flex:1,padding:"9px 0",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:5,background:"rgba(193,100,150,.08)",color:"#D4769A",border:"1px solid rgba(193,100,150,.22)"}}>📸 Instagram</button>
            </div>

            {/* Input */}
            <div style={{padding:"10px 14px",borderTop:`1px solid ${G.bo}`,background:G.sur,display:"flex",gap:8,alignItems:"flex-end",flexShrink:0}}>
              <textarea ref={taRef} value={isChatNovo?inp:threadInp} onChange={e=>{isChatNovo?setInp(e.target.value):setThreadInp(e.target.value);resizeTa();}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}} placeholder={isChatNovo?"Escreva a mensagem do cliente...":`Continue como ${t.agente}...`} style={{flex:1,background:G.el,border:`1px solid ${G.bo}`,borderRadius:10,padding:"11px 14px",color:G.tx,fontSize:13,resize:"none",outline:"none",lineHeight:1.5,height:48,minHeight:48,maxHeight:120,transition:"border-color .2s"}} onFocus={e=>e.target.style.borderColor=G.gd} onBlur={e=>e.target.style.borderColor=G.bo}/>
              <button onClick={sendMsg} disabled={isChatNovo?(loading||!inp.trim()):(tLoading||!threadInp.trim())} style={{width:46,height:46,borderRadius:10,border:"none",cursor:"pointer",background:C,color:"#0C0B09",fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontWeight:700,opacity:(isChatNovo?(loading||!inp.trim()):(tLoading||!threadInp.trim()))?.35:1,transition:"opacity .2s"}}>↑</button>
            </div>

            {/* Barra salvar */}
            {isChatNovo&&msgs.length>2&&(
              <div style={{padding:"7px 14px",background:G.sur,borderTop:`1px solid ${G.bo}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                <span style={{fontSize:10.5,color:G.tm}}>Salvar para follow-up automático</span>
                <button onClick={salvar} style={{padding:"6px 14px",background:C,border:"none",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,color:"#0C0B09"}}>💾 Salvar</button>
              </div>
            )}
          </div>
        )}

        {/* ═══ ABA: CONVERSAS ═══ */}
        {aba==="conversas"&&(
          <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:400}}>Conversas</div>
              <button onClick={novoAtt} style={{padding:"6px 13px",background:C,border:"none",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,color:"#0C0B09"}} >+ Novo</button>
            </div>
            {threads.length===0&&(
              <div style={{textAlign:"center",padding:"50px 20px",color:G.tm}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:44,color:G.td,marginBottom:10}}>◇</div>
                <p>Nenhuma conversa salva</p>
                <button onClick={novoAtt} style={{marginTop:14,padding:"8px 18px",background:C,border:"none",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,color:"#0C0B09"}}>Iniciar Atendimento</button>
              </div>
            )}
            {threads.map(th=>{
              const q=gQ(th.lead?.qual);
              const st=gS(th.status);
              const last=th.msgs?.filter(m=>m.role!=="system").slice(-1)[0];
              return(
                <div key={th.id} onClick={()=>{setActiveId(th.id);updTh(th.id,p=>({...p,unread:0}));setAba("chat");}} style={{background:G.sur,border:`1px solid ${G.bo}`,borderRadius:10,padding:"13px 15px",cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:7}}>
                      <span style={{fontSize:14,fontWeight:500}}>{th.lead?.nome||"Cliente anônimo"}</span>
                      {(th.unread||0)>0&&<span style={{width:18,height:18,borderRadius:"50%",background:"#E8855A",color:"#fff",fontSize:9,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{th.unread}</span>}
                    </div>
                    <ScoreRing score={th.lead?.score||0} size={36}/>
                  </div>
                  <div style={{fontSize:11,color:G.tm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:6}}>{last?.isFollowup?"🔔 "+last.content:last?.content||"—"}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                    {q&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:q.bg,color:q.cor}}>{q.label}</span>}
                    <span style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:st.bg,color:st.cor}}>{st.label}</span>
                    {(th.fuCount||0)>0&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:"rgba(201,169,110,.08)",border:"1px solid rgba(201,169,110,.15)",color:C}}>🔔 {th.fuCount}x</span>}
                    <span style={{fontSize:9,color:G.td,marginLeft:"auto"}}>{fmtDt(th.at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ ABA: PAINEL ═══ */}
        {aba==="painel"&&(
          <div style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:12}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:400,marginBottom:4}}>Painel do Lead</div>

            {/* Score + Qual */}
            <div style={{background:G.sur,border:`1px solid ${G.bo}`,borderRadius:10,padding:"14px 16px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div>
                  <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:".12em",color:G.tm,marginBottom:5}}>Score do Lead</div>
                  {qual?<span style={{fontSize:12,fontWeight:500,padding:"4px 12px",borderRadius:20,background:qual.bg,color:qual.cor,display:"inline-block"}}>{qual.label}</span>:<span style={{fontSize:11,color:G.td,padding:"4px 10px",borderRadius:20,background:G.el,border:`1px solid ${G.bo}`,display:"inline-block"}}>⏳ Em análise</span>}
                  {curLead.intencao&&<span style={{fontSize:10,color:G.tm,marginLeft:6}}>· Intenção {curLead.intencao}</span>}
                </div>
                <ScoreRing score={score} size={52}/>
              </div>
              {/* Progresso */}
              <div>
                <div style={{height:3,background:G.bo,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${G.gd},${C})`,transition:"width .5s",borderRadius:2}}/></div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  <span style={{fontSize:9,color:G.tm}}>{filled}/{camposKeys.length} campos captados</span>
                  <span style={{fontSize:9,color:G.tm,fontWeight:600}}>{pct}%</span>
                </div>
              </div>
              {curLead.resumo&&<div style={{marginTop:10,padding:"8px 10px",background:"rgba(201,169,110,.04)",border:"1px solid rgba(201,169,110,.1)",borderRadius:7,fontSize:11,color:G.tx,lineHeight:1.6,fontStyle:"italic"}}>"{curLead.resumo}"</div>}
            </div>

            {/* Follow-up box */}
            <div style={{background:"rgba(201,169,110,.04)",border:"1px solid rgba(201,169,110,.12)",borderRadius:10,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontSize:10,textTransform:"uppercase",letterSpacing:".1em",color:G.tm}}>Follow-up Automático</span>
                <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:isHorario()?"rgba(90,138,90,.08)":"rgba(122,172,191,.08)",color:isHorario()?"#7ACA7A":"#7AACBF",border:`1px solid ${isHorario()?"rgba(90,138,90,.2)":"rgba(122,172,191,.2)"}`}}>{isHorario()?"🟢 Ativo 8–18h":"🔵 Pausado"}</span>
              </div>
              <div style={{fontSize:11,color:G.td,marginBottom:8}}>{!isChatNovo?`${activeTh?.fuCount||0}/3 disparos · a cada 4h sem resposta`:"Salve a conversa para ativar o follow-up"}</div>
              {!isChatNovo&&(activeTh?.fuCount||0)<3&&<button onClick={()=>manualFU(activeId)} disabled={fuRunning} style={{width:"100%",padding:"8px",background:"rgba(201,169,110,.07)",border:"1px solid rgba(201,169,110,.2)",borderRadius:7,cursor:"pointer",fontSize:11,color:C,fontWeight:500}}>{fuRunning?"Gerando mensagem...":"🔔 Disparar Follow-up Agora"}</button>}
            </div>

            {/* Campos do lead */}
            <div style={{background:G.sur,border:`1px solid ${G.bo}`,borderRadius:10,padding:"14px 16px"}}>
              <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:".12em",color:G.tm,marginBottom:12}}>Dados Capturados</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {camposKeys.filter(k=>!["resumo","intencao"].includes(k)).map((k,i,arr)=>(
                  <div key={k}>
                    <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:".09em",color:G.tm,marginBottom:2}}>{CAMPOS[k]}</div>
                    {curLead[k]?<div style={{fontSize:13,color:G.tx,lineHeight:1.4}}>{curLead[k]}</div>:<div style={{fontSize:13,color:G.td,fontStyle:"italic"}}>—</div>}
                    {i<arr.length-1&&<div style={{height:1,background:G.bo,marginTop:10}}/>}
                  </div>
                ))}
              </div>
            </div>

            {/* Status da conversa */}
            {!isChatNovo&&activeTh&&(
              <div style={{background:G.sur,border:`1px solid ${G.bo}`,borderRadius:10,padding:"14px 16px"}}>
                <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:".12em",color:G.tm,marginBottom:10}}>Status da Conversa</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {Object.entries(STATUS).map(([key,s])=>(
                    <button key={key} onClick={()=>updTh(activeId,p=>({...p,status:key}))} style={{padding:"6px 10px",borderRadius:7,border:`1px solid ${G.bo}`,background:activeTh.status===key?s.bg:"transparent",cursor:"pointer",fontSize:11,color:activeTh.status===key?s.cor:G.tm,fontWeight:activeTh.status===key?600:400}}>{s.label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Ações */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {isChatNovo&&msgs.length>2&&<button onClick={salvar} style={{padding:"11px",borderRadius:9,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:C,color:"#0C0B09"}}>💾 Salvar Conversa</button>}
              <button onClick={agendar} disabled={scheduling} style={{padding:"11px",borderRadius:9,border:`1px solid ${G.bo}`,cursor:"pointer",fontSize:13,fontWeight:500,background:"transparent",color:G.tm}}>{scheduling?"Agendando...":"📅 Agendar Visita no Google Calendar"}</button>
              <button onClick={enviarEmail} disabled={mailing} style={{padding:"11px",borderRadius:9,border:`1px solid ${G.bo}`,cursor:"pointer",fontSize:13,fontWeight:500,background:"transparent",color:G.tm}}>{mailing?"Enviando...":"✉ Enviar Relatório por E-mail"}</button>
            </div>
          </div>
        )}

        {/* ═══ ABA: LEADS ═══ */}
        {aba==="leads"&&(
          <div style={{flex:1,overflowY:"auto",padding:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:400}}>Leads</div>
                <div style={{fontSize:11,color:G.tm}}>{threads.length} conversa{threads.length!==1?"s":""} · Motor {isHorario()?"ativo 🟢":"pausado 🔵"}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>autoFU()} style={{fontSize:10,padding:"6px 10px",background:"transparent",border:`1px solid ${G.bo}`,borderRadius:6,cursor:"pointer",color:G.tm}}>↺ FU</button>
                <button onClick={exportCSV} style={{fontSize:10,padding:"6px 10px",background:"transparent",border:`1px solid ${G.bo}`,borderRadius:6,cursor:"pointer",color:G.tm}}>↓ CSV</button>
              </div>
            </div>

            {/* Métricas */}
            {threads.length>0&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:14}}>
                {[
                  {label:"Total",val:threads.length,cor:C},
                  {label:"Quentes 🔥",val:threads.filter(th=>th.lead?.qual?.toLowerCase()==="quente").length,cor:"#E8855A"},
                  {label:"Convertidos",val:threads.filter(th=>th.status==="convertido").length,cor:"#5A8A5A"},
                  {label:"Score Médio",val:threads.length?Math.round(threads.reduce((a,th)=>a+(th.lead?.score||0),0)/threads.length):0,cor:C},
                ].map(m=>(
                  <div key={m.label} style={{background:G.sur,border:`1px solid ${G.bo}`,borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:".1em",color:G.tm,marginBottom:4}}>{m.label}</div>
                    <div style={{fontSize:24,fontFamily:"'Cormorant Garamond',serif",color:m.cor}}>{m.val}</div>
                  </div>
                ))}
              </div>
            )}

            {threads.length===0?(
              <div style={{textAlign:"center",padding:"50px 20px",color:G.tm}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:44,color:G.td,marginBottom:10}}>◇</div>
                <p>Nenhum lead ainda</p>
                <button onClick={novoAtt} style={{marginTop:14,padding:"8px 18px",background:C,border:"none",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,color:"#0C0B09"}}>+ Iniciar Atendimento</button>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {threads.map(th=>{
                  const q=gQ(th.lead?.qual);const st=gS(th.status);
                  return(
                    <div key={th.id} style={{background:G.sur,border:`1px solid ${G.bo}`,borderRadius:10,padding:"13px 15px"}}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,marginBottom:8}}>
                        <div>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                            <span style={{fontSize:14,fontWeight:500}}>{th.lead?.nome||"Anônimo"}</span>
                            {(th.unread||0)>0&&<span style={{width:16,height:16,borderRadius:"50%",background:"#E8855A",color:"#fff",fontSize:8,display:"inline-flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{th.unread}</span>}
                          </div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            {q&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:q.bg,color:q.cor}}>{q.label}</span>}
                            <span style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:st.bg,color:st.cor}}>{st.label}</span>
                          </div>
                        </div>
                        <ScoreRing score={th.lead?.score||0} size={44}/>
                      </div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                        {th.lead?.telefone&&<span style={{fontSize:11,color:G.tm}}>📱 {th.lead.telefone}</span>}
                        {th.lead?.interesse&&<span style={{fontSize:11,color:G.tm}}>· {th.lead.interesse}</span>}
                        {th.lead?.ticket&&<span style={{fontSize:11,color:G.tm}}>· 💰 {th.lead.ticket}</span>}
                      </div>
                      {th.lead?.resumo&&<div style={{fontSize:10.5,color:G.td,fontStyle:"italic",marginBottom:8}}>"{th.lead.resumo}"</div>}
                      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center",paddingTop:8,borderTop:`1px solid ${G.bo}`}}>
                        {Object.entries(STATUS).map(([key,s])=>(
                          <button key={key} onClick={()=>updTh(th.id,p=>({...p,status:key}))} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${G.bo}`,background:th.status===key?s.bg:"transparent",cursor:"pointer",fontSize:9.5,color:th.status===key?s.cor:G.tm}}>{s.label}</button>
                        ))}
                        <button onClick={()=>manualFU(th.id)} disabled={fuRunning||(th.fuCount||0)>=3} style={{padding:"3px 8px",borderRadius:5,border:"1px solid rgba(201,169,110,.2)",background:"rgba(201,169,110,.06)",cursor:"pointer",fontSize:9.5,color:C,marginLeft:"auto",opacity:(th.fuCount||0)>=3?.4:1}}>🔔 Follow-up</button>
                        <button onClick={()=>{setActiveId(th.id);updTh(th.id,p=>({...p,unread:0}));setAba("chat");}} style={{padding:"3px 8px",borderRadius:5,border:`1px solid ${C}`,background:"rgba(201,169,110,.06)",cursor:"pointer",fontSize:9.5,color:C}}>Ver chat →</button>
                      </div>
                      <div style={{fontSize:9,color:G.td,marginTop:6}}>⏱ {fmtDt(th.at)}{(th.fuCount||0)>0&&` · 🔔 ${th.fuCount} follow-up${th.fuCount!==1?"s":""}`}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM TAB BAR */}
      <nav style={{background:G.sur,borderTop:`1px solid ${G.bo}`,display:"flex",flexShrink:0}}>
        {[
          {key:"chat",icon:"💬",label:"Chat"},
          {key:"conversas",icon:"📁",label:`Conversas${totalUnread>0?` (${totalUnread})`:""}`,badge:totalUnread},
          {key:"painel",icon:"📊",label:"Painel"},
          {key:"leads",icon:"👥",label:`Leads${threads.length>0?` (${threads.length})`:""}`},
        ].map(({key,icon,label,badge})=>(
          <button key={key} onClick={()=>setAba(key)} style={{flex:1,padding:"10px 0 8px",border:"none",cursor:"pointer",background:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative",borderTop:aba===key?`2px solid ${C}`:"2px solid transparent"}}>
            <span style={{fontSize:19}}>{icon}</span>
            <span style={{fontSize:9,color:aba===key?C:G.tm,fontWeight:aba===key?600:400,letterSpacing:".04em"}}>{label}</span>
            {badge>0&&<span style={{width:14,height:14,borderRadius:"50%",background:"#E8855A",position:"absolute",top:6,right:"50%",marginRight:-18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700}}>{badge}</span>}
          </button>
        ))}
      </nav>

      {/* TOAST */}
      {toast&&<div style={{position:"fixed",bottom:76,left:"50%",transform:"translateX(-50%)",padding:"9px 18px",borderRadius:8,fontSize:12.5,fontWeight:500,zIndex:9999,animation:"ti .3s ease",whiteSpace:"nowrap",...(toast.type==="err"?{background:"rgba(176,80,64,.12)",border:"1px solid #B05040",color:"#E08A7A"}:{background:"rgba(90,138,90,.12)",border:"1px solid #5A8A5A",color:"#8ACA8A"})}}>{toast.msg}</div>}
    </div>
  );
}

// ─── ROOT ────────────────────────────────────────
export default function App(){
  const [session,setSession]=useState(null);
  const [adminView,setAdminView]=useState(false);
  const [ready,setReady]=useState(false);
  useEffect(()=>{const s=loadS();if(s)setSession(s);setReady(true);},[]);
  if(!ready)return <div style={{minHeight:"100vh",background:"#0C0B09",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",color:"#6A6050",fontSize:12}}>Carregando...</div>;
  if(!session)return <Login onLogin={s=>{setSession(s);}}/>;
  if(session.tipo==="admin"&&adminView)return <AdminPanel session={session} onLogout={()=>{clearS();setSession(null);setAdminView(false);}} onVoltar={()=>setAdminView(false)}/>;
  const tenantId=session.tipo==="admin"?"inspire":session.tenantId;
  const tenant=TENANTS[tenantId];
  if(!tenant||!tenant.ativo)return <div style={{minHeight:"100vh",background:"#0C0B09",display:"flex",alignItems:"center",justifyContent:"center",color:"#E08A7A",fontFamily:"'DM Sans',sans-serif",fontSize:13}}>Conta inativa.</div>;
  return <Sofia tenant={tenant} tenantId={tenantId} session={session} onLogout={()=>{clearS();setSession(null);}} onAdminPanel={session.tipo==="admin"?()=>setAdminView(true):null}/>;
}