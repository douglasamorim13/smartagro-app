import { useState, useEffect, useRef, useCallback } from "react";

const API = "http://localhost:4000";

// ── helpers ────────────────────────────────────────────────────
const apiFetch = async (path, opts = {}, token = null) => {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch(`${API}${path}`, { ...opts, headers });
  const d = await r.json();
  if (!r.ok) throw new Error(d.erro || "Erro desconhecido");
  return d;
};

const FIELDS = [
  { name: "motorista",        label: "Motorista"              },
  { name: "cpfMotorista",     label: "CPF do Motorista"       },
  { name: "transportadora",   label: "Transportadora"         },
  { name: "nfeChave",         label: "Chave NF-e (44 dígitos)"},
  { name: "produtoCodigo",    label: "Código do Produto"      },
  { name: "produtoDescricao", label: "Descrição do Produto"   },
];

const initialForm = {
  motorista: "", cpfMotorista: "", transportadora: "",
  nfeChave: "", produtoCodigo: "", produtoDescricao: "",
};

// ── Ícones ──────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const icons = {
  scale:  "M12 3v1m0 16v1M3 12h1m16 0h1M5.6 5.6l.7.7m11.4-.7-.7.7M5.6 18.4l.7-.7m11.4.7-.7-.7M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  camera: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  nfe:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  user:   "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  lock:   "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4",
  check:  "M20 6L9 17l-5-5",
  truck:  "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M18.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  refresh:"M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  barrier:"M3 12h18M3 6h4m10 0h4M3 18h4m10 0h4M7 3v18M17 3v18",
};

// ── Toast ───────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const c = { ok: "#22c55e", erro: "#ef4444", info: "#f59e0b" };
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999,
      background:"#1a1f2e", border:`1px solid ${c[type]}`, color:"#e2e8f0",
      padding:"12px 20px", borderRadius:10, fontSize:14, maxWidth:360,
      boxShadow:"0 8px 32px rgba(0,0,0,.5)", display:"flex", gap:10,
      alignItems:"center", animation:"slideIn .25s ease" }}>
      <span style={{ color:c[type], fontWeight:700, fontSize:18 }}>
        {type==="ok"?"✓":type==="erro"?"✕":"⚠"}
      </span>
      <span>{msg}</span>
      <button onClick={onClose} style={{ marginLeft:"auto", background:"none",
        border:"none", color:"#94a3b8", cursor:"pointer", fontSize:16 }}>×</button>
    </div>
  );
}

// ── Card ────────────────────────────────────────────────────────
function Card({ title, icon, children, accent="#4ade80" }) {
  return (
    <div style={{ background:"linear-gradient(135deg,#1a1f2e,#141824)",
      border:"1px solid rgba(255,255,255,.07)", borderTop:`2px solid ${accent}`,
      borderRadius:12, padding:"20px 24px", boxShadow:"0 4px 24px rgba(0,0,0,.3)" }}>
      {title && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16,
          paddingBottom:12, borderBottom:"1px solid rgba(255,255,255,.06)" }}>
          <span style={{ color:accent }}>{icon}</span>
          <h2 style={{ margin:0, fontSize:12, fontWeight:700,
            letterSpacing:"0.1em", textTransform:"uppercase", color:"#94a3b8" }}>{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}

// ── Botão ───────────────────────────────────────────────────────
function Btn({ onClick, disabled, children, variant="default", loading, full }) {
  const v = {
    default: { bg:"rgba(74,222,128,.12)",  border:"#4ade80", color:"#4ade80" },
    danger:  { bg:"rgba(239,68,68,.12)",   border:"#ef4444", color:"#ef4444" },
    primary: { bg:"rgba(59,130,246,.15)",  border:"#3b82f6", color:"#3b82f6" },
    warning: { bg:"rgba(245,158,11,.12)",  border:"#f59e0b", color:"#f59e0b" },
    ghost:   { bg:"rgba(255,255,255,.04)", border:"rgba(255,255,255,.1)", color:"#94a3b8" },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled||loading}
      style={{ background:v.bg, border:`1px solid ${disabled?"rgba(255,255,255,.1)":v.border}`,
        color:disabled?"#475569":v.color, padding:"10px 18px", borderRadius:8,
        cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit", fontSize:13,
        fontWeight:600, letterSpacing:"0.05em", display:"flex", alignItems:"center",
        gap:6, whiteSpace:"nowrap", transition:"all .15s", opacity:disabled?.5:1,
        width:full?"100%":undefined, justifyContent:full?"center":undefined }}>
      {loading && <span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⟳</span>}
      {children}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════
//  TELA DE LOGIN
// ════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [email, setEmail]   = useState("");
  const [senha, setSenha]   = useState("");
  const [erro, setErro]     = useState("");
  const [loading, setLoad]  = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErro(""); setLoad(true);
    try {
      const d = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      });
      onLogin(d.token, d.usuario);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoad(false);
    }
  }

  const inp = {
    width:"100%", background:"rgba(255,255,255,.05)",
    border:"1px solid rgba(255,255,255,.12)", borderRadius:8,
    color:"#e2e8f0", padding:"12px 16px", fontSize:14,
    fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0d1117", display:"flex",
      alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:380, padding:"0 24px" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ width:64, height:64, borderRadius:16, margin:"0 auto 16px",
            background:"linear-gradient(135deg,#4ade80,#16a34a)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>⚖</div>
          <div style={{ fontSize:24, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace",
            color:"#e2e8f0" }}>SmartAgro</div>
          <div style={{ fontSize:12, color:"#64748b", letterSpacing:"0.1em",
            textTransform:"uppercase", marginTop:4 }}>Balança Rodoviária</div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

            <div>
              <label style={{ fontSize:11, color:"#64748b", display:"block",
                marginBottom:6, textTransform:"uppercase", letterSpacing:"0.08em" }}>
                E-mail
              </label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="operador@smartagro.com"
                style={inp} required autoFocus />
            </div>

            <div>
              <label style={{ fontSize:11, color:"#64748b", display:"block",
                marginBottom:6, textTransform:"uppercase", letterSpacing:"0.08em" }}>
                Senha
              </label>
              <input type="password" value={senha} onChange={e=>setSenha(e.target.value)}
                placeholder="••••••••" style={inp} required />
            </div>

            {erro && (
              <div style={{ background:"rgba(239,68,68,.1)", border:"1px solid rgba(239,68,68,.3)",
                borderRadius:8, padding:"10px 14px", color:"#ef4444", fontSize:13,
                display:"flex", alignItems:"center", gap:8 }}>
                <Icon d={icons.lock} size={14}/> {erro}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ marginTop:8, background:"linear-gradient(135deg,#4ade80,#16a34a)",
                border:"none", borderRadius:8, color:"#0d1117", padding:"13px",
                fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer",
                fontFamily:"inherit", letterSpacing:"0.05em", width:"100%",
                opacity:loading?.7:1 }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  TELA PRINCIPAL
// ════════════════════════════════════════════════════════════════
function MainScreen({ token, usuario, onLogout }) {
  const [peso, setPeso]               = useState(null);
  const [ultimaLeitura, setUltimaL]   = useState(null);
  const [simulado, setSimulado]       = useState(false);
  const [conectado, setConectado]     = useState(false);
  const [portaAberta, setPortaAberta] = useState(false);
  const [imagens, setImagens]         = useState([]);
  const [nfeData, setNfeData]         = useState(null);
  const [formData, setFormData]       = useState(initialForm);
  const [loading, setLoading]         = useState({});
  const [toast, setToast]             = useState(null);
  const [etapa, setEtapa]             = useState("aguardando");
  const [pesagemId, setPesagemId]     = useState(null);
  const [pesoEntrada, setPesoEntrada] = useState(null);
  const intervalRef = useRef(null);

  const notify = useCallback((msg,type="info") => setToast({msg,type}), []);
  const setLoad = (k,v) => setLoading(p=>({...p,[k]:v}));
  const api = useCallback((path,opts) => apiFetch(path,opts,token), [token]);

  // Polling de peso
  const iniciarPolling = useCallback(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const d = await api("/balanca/peso");
        setPeso(d.peso); setUltimaL(d.ultimaLeitura);
        setSimulado(d.simulado||false); setConectado(true);
      } catch { setConectado(false); }
    }, 1500);
  }, [api]);

  const pararPolling = useCallback(() => {
    clearInterval(intervalRef.current); intervalRef.current = null;
  }, []);

  useEffect(() => () => pararPolling(), [pararPolling]);

  async function abrirPorta() {
    setLoad("porta",true);
    try {
      await api("/balanca/abrir-porta");
      setPortaAberta(true); setEtapa("entrada");
      iniciarPolling(); notify("Porta aberta. Aguardando veículo.","ok");
    } catch(err) { notify(err.message,"erro"); }
    finally { setLoad("porta",false); }
  }

  async function fecharPorta() {
    setLoad("fecharPorta",true);
    try {
      await api("/balanca/fechar-porta");
      setPortaAberta(false); pararPolling(); setConectado(false);
      setPeso(null); setImagens([]); setNfeData(null);
      setFormData(initialForm); setEtapa("aguardando");
      setPesagemId(null); setPesoEntrada(null);
      notify("Porta fechada.","info");
    } catch(err) { notify(err.message,"erro"); }
    finally { setLoad("fecharPorta",false); }
  }

  async function registrarEntrada() {
    if (!peso) return notify("Aguardando leitura da balança.","erro");
    setLoad("entrada",true);
    try {
      const d = await api("/pesagem/entrada",{
        method:"POST", body:JSON.stringify(formData) });
      setPesagemId(d.id); setPesoEntrada(d.pesoEntrada);
      setImagens(d.cameras||[]); setEtapa("saida");
      notify(`Entrada registrada! ${d.pesoEntrada} kg — ${d.cameras?.filter(c=>c.placa).map(c=>c.placa).join(", ")||"placa não detectada"}`,"ok");
    } catch(err) { notify(err.message,"erro"); }
    finally { setLoad("entrada",false); }
  }

  async function registrarSaida() {
    if (!peso) return notify("Aguardando leitura da balança.","erro");
    setLoad("saida",true);
    try {
      const d = await api(`/pesagem/saida/${pesagemId}`,{
        method:"POST", body:JSON.stringify({ pesoSaida: peso }) });
      setImagens(d.cameras||[]); setEtapa("finalizado");
      notify(`Pesagem concluída! Peso líquido: ${d.pesoLiquido} kg`,"ok");
    } catch(err) { notify(err.message,"erro"); }
    finally { setLoad("saida",false); }
  }

  async function consultarNfe() {
    const chave = formData.nfeChave.replace(/\D/g,"");
    if (chave.length!==44) return notify("Chave NF-e deve ter 44 dígitos.","erro");
    setLoad("nfe",true);
    try {
      const d = await api(`/nfe/${chave}`);
      setNfeData(d);
      setFormData(p=>({ ...p,
        produtoDescricao: d.produto||p.produtoDescricao,
        motorista: p.motorista||d.destinatario||p.motorista,
      }));
      notify("NF-e consultada!","ok");
    } catch(err) { notify(err.message,"erro"); }
    finally { setLoad("nfe",false); }
  }

  function handleChange(e) {
    const {name,value}=e.target;
    setFormData(p=>({...p,[name]:value}));
  }

  const pesoLiquido = pesoEntrada && peso && etapa==="finalizado"
    ? Math.abs(pesoEntrada-peso) : null;

  const etapaColors = { aguardando:"#64748b", entrada:"#3b82f6", saida:"#f59e0b", finalizado:"#22c55e" };
  const etapaLabels = { aguardando:"Aguardando", entrada:"Entrada", saida:"Saída", finalizado:"Concluído" };

  const inp = {
    width:"100%", background:"rgba(255,255,255,.04)",
    border:"1px solid rgba(255,255,255,.1)", borderRadius:8,
    color:"#e2e8f0", padding:"10px 14px", fontSize:13,
    fontFamily:"inherit", outline:"none", boxSizing:"border-box",
  };

  const posicaoLabel = { dianteira:"🔵 Dianteira", traseira:"🔴 Traseira", topo:"🟡 Topo" };

  return (
    <div style={{ minHeight:"100vh", background:"#0d1117", paddingBottom:40 }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(90deg,#0d1117,#141824,#0d1117)",
        borderBottom:"1px solid rgba(74,222,128,.15)", padding:"14px 28px",
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>

        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:10,
            background:"linear-gradient(135deg,#4ade80,#16a34a)",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>⚖</div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, fontFamily:"'IBM Plex Mono',monospace" }}>
              SmartAgro
            </div>
            <div style={{ fontSize:10, color:"#64748b", letterSpacing:"0.1em", textTransform:"uppercase" }}>
              Balança Rodoviária
            </div>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {/* Etapa */}
          <div style={{ background:`rgba(255,255,255,.05)`,
            border:`1px solid ${etapaColors[etapa]}`, color:etapaColors[etapa],
            padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:700,
            letterSpacing:"0.08em" }}>
            {etapaLabels[etapa]}
          </div>

          {/* Status balança */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", flexShrink:0,
              background:conectado?"#22c55e":"#ef4444",
              boxShadow:conectado?"0 0 8px #22c55e":"0 0 8px #ef4444",
              display:"inline-block" }}/>
            <span style={{ fontSize:12, fontWeight:600,
              color:conectado?"#22c55e":"#ef4444" }}>
              {conectado?"CONECTADO":"OFFLINE"}
            </span>
            {simulado && <span style={{ fontSize:10, color:"#f59e0b",
              background:"rgba(245,158,11,.1)", padding:"2px 8px", borderRadius:20,
              border:"1px solid #f59e0b" }}>SIM</span>}
          </div>

          {/* Operador + logout */}
          <div style={{ display:"flex", alignItems:"center", gap:10,
            padding:"6px 14px", borderRadius:8,
            background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)" }}>
            <Icon d={icons.user} size={14}/>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:"#e2e8f0" }}>{usuario.nome}</div>
              <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase",
                letterSpacing:"0.08em" }}>{usuario.perfil}</div>
            </div>
            <button onClick={onLogout}
              style={{ background:"none", border:"none", cursor:"pointer",
                color:"#475569", marginLeft:4, padding:4, borderRadius:4,
                display:"flex", alignItems:"center" }}
              title="Sair">
              <Icon d={icons.logout} size={15}/>
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1140, margin:"0 auto", padding:"24px 24px 0" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

          {/* ── Coluna esquerda ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Display de peso */}
            <Card title="Leitura da Balança" icon={<Icon d={icons.scale}/>} accent="#4ade80">
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <div style={{ fontSize:11, letterSpacing:"0.15em", color:"#64748b",
                  textTransform:"uppercase", marginBottom:8 }}>Peso atual</div>
                <div style={{ fontSize:60, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700,
                  color:peso!==null?"#4ade80":"#334155",
                  textShadow:peso!==null?"0 0 40px rgba(74,222,128,.4)":"none",
                  letterSpacing:4, lineHeight:1 }}>
                  {peso!==null ? peso.toLocaleString("pt-BR",{minimumFractionDigits:1}) : "- - - -"}
                </div>
                <div style={{ fontSize:20, color:"#64748b", marginTop:4 }}>kg</div>
                {ultimaLeitura && (
                  <div style={{ fontSize:11, color:"#475569", marginTop:8 }}>
                    {new Date(ultimaLeitura).toLocaleTimeString("pt-BR")}
                    {simulado && <span style={{ color:"#f59e0b", marginLeft:6 }}>(simulado)</span>}
                  </div>
                )}
              </div>

              {pesoEntrada && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginTop:4 }}>
                  {[
                    { label:"Entrada", val:pesoEntrada,   color:"#3b82f6" },
                    { label:"Saída",   val:etapa==="finalizado"?peso:null, color:"#f59e0b" },
                    { label:"Líquido", val:pesoLiquido,   color:"#4ade80" },
                  ].map(({label,val,color}) => (
                    <div key={label} style={{ background:"rgba(255,255,255,.03)", borderRadius:8,
                      padding:"10px 12px", border:"1px solid rgba(255,255,255,.06)", textAlign:"center" }}>
                      <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase",
                        letterSpacing:"0.1em", marginBottom:4 }}>{label}</div>
                      <div style={{ fontSize:20, fontFamily:"'IBM Plex Mono',monospace",
                        fontWeight:700, color:val?color:"#334155" }}>
                        {val?val.toLocaleString("pt-BR",{minimumFractionDigits:1}):"—"}
                      </div>
                      <div style={{ fontSize:10, color:"#475569" }}>kg</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Controles */}
            <Card title="Controles" icon={<Icon d={icons.barrier}/>} accent="#3b82f6">
              <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:10 }}>
                <Btn onClick={abrirPorta}  disabled={portaAberta}  loading={loading.porta}      variant="default"><Icon d={icons.barrier} size={14}/> Abrir Porta</Btn>
                <Btn onClick={fecharPorta} disabled={!portaAberta} loading={loading.fecharPorta} variant="danger" ><Icon d={icons.barrier} size={14}/> Fechar Porta</Btn>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <Btn onClick={registrarEntrada} disabled={etapa!=="entrada"||!peso} loading={loading.entrada} variant="primary">
                  <Icon d={icons.truck} size={14}/> Registrar Entrada
                </Btn>
                <Btn onClick={registrarSaida} disabled={etapa!=="saida"||!peso} loading={loading.saida} variant="warning">
                  <Icon d={icons.truck} size={14}/> Registrar Saída
                </Btn>
              </div>

              {etapa==="finalizado" && (
                <div style={{ marginTop:14, padding:14, borderRadius:8,
                  background:"rgba(34,197,94,.08)", border:"1px solid rgba(34,197,94,.3)",
                  display:"flex", alignItems:"center", gap:10 }}>
                  <Icon d={icons.check} size={20}/>
                  <div>
                    <div style={{ color:"#22c55e", fontWeight:700, fontSize:14 }}>Pesagem Concluída!</div>
                    {pesoLiquido && (
                      <div style={{ color:"#64748b", fontSize:12 }}>
                        Peso líquido: {pesoLiquido.toLocaleString("pt-BR",{minimumFractionDigits:1})} kg
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Câmeras */}
            <Card title="Câmeras (Captura Automática)" icon={<Icon d={icons.camera}/>} accent="#8b5cf6">
              {imagens.length>0 ? (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  {imagens.map((cam,i) => (
                    <div key={i} style={{ borderRadius:8, overflow:"hidden",
                      background:"#0d1117", border:"1px solid rgba(255,255,255,.08)" }}>
                      <div style={{ padding:"5px 8px", background:"rgba(255,255,255,.04)",
                        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ fontSize:10, color:"#94a3b8" }}>
                          {posicaoLabel[cam.posicao] || cam.posicao}
                        </span>
                        {cam.placa && (
                          <span style={{ fontSize:10, fontFamily:"'IBM Plex Mono',monospace",
                            color:"#f59e0b", fontWeight:700, background:"rgba(245,158,11,.1)",
                            padding:"1px 6px", borderRadius:4 }}>{cam.placa}</span>
                        )}
                      </div>
                      {cam.imagem ? (
                        <img src={`data:image/jpeg;base64,${cam.imagem}`}
                          alt={cam.posicao} style={{ width:"100%", display:"block",
                            maxHeight:110, objectFit:"cover" }} />
                      ) : (
                        <div style={{ height:80, display:"flex", alignItems:"center",
                          justifyContent:"center", color:"#334155", fontSize:11 }}>
                          {cam.erro||"Sem sinal"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"28px 0",
                  color:"#334155", fontSize:12 }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>📷</div>
                  As imagens são capturadas automaticamente<br/>ao registrar entrada e saída
                </div>
              )}
            </Card>
          </div>

          {/* ── Coluna direita ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* NF-e */}
            <Card title="Nota Fiscal (NF-e)" icon={<Icon d={icons.nfe}/>} accent="#f59e0b">
              <div style={{ display:"flex", gap:8 }}>
                <input name="nfeChave" value={formData.nfeChave} onChange={handleChange}
                  placeholder="Chave de acesso — 44 dígitos" maxLength={44}
                  style={{ ...inp, fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }} />
                <Btn onClick={consultarNfe} loading={loading.nfe} variant="warning">
                  <Icon d={icons.refresh} size={14}/>
                </Btn>
              </div>

              {nfeData && (
                <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:5 }}>
                  {[
                    ["Número",       nfeData.numero],
                    ["Emitente",     nfeData.emitente],
                    ["Destinatário", nfeData.destinatario],
                    ["Produto",      nfeData.produto],
                    ["Peso NF-e",    nfeData.pesoNfe?`${nfeData.pesoNfe} kg`:null],
                    ["Valor",        nfeData.valor?`R$ ${parseFloat(nfeData.valor).toLocaleString("pt-BR",{minimumFractionDigits:2})}`:null],
                  ].filter(([,v])=>v).map(([k,v])=>(
                    <div key={k} style={{ display:"flex", justifyContent:"space-between",
                      padding:"6px 10px", background:"rgba(255,255,255,.03)",
                      borderRadius:6, fontSize:12 }}>
                      <span style={{ color:"#64748b" }}>{k}</span>
                      <span style={{ color:"#e2e8f0", fontWeight:500,
                        textAlign:"right", maxWidth:"60%", wordBreak:"break-all" }}>{v}</span>
                    </div>
                  ))}
                  <span style={{ fontSize:11, fontWeight:700, padding:"4px 12px",
                    borderRadius:20, width:"fit-content", letterSpacing:"0.08em",
                    background:nfeData.status==="autorizado"?"rgba(34,197,94,.1)":"rgba(239,68,68,.1)",
                    border:`1px solid ${nfeData.status==="autorizado"?"#22c55e":"#ef4444"}`,
                    color:nfeData.status==="autorizado"?"#22c55e":"#ef4444" }}>
                    {nfeData.status==="autorizado"?"✓":"✕"} {(nfeData.status||"").toUpperCase()}
                  </span>
                </div>
              )}
            </Card>

            {/* Dados operacionais */}
            <Card title="Dados Operacionais" icon={<Icon d={icons.user}/>} accent="#06b6d4">
              {/* Operador fixo — vem do login */}
              <div style={{ marginBottom:14, padding:"10px 14px", borderRadius:8,
                background:"rgba(6,182,212,.08)", border:"1px solid rgba(6,182,212,.2)",
                display:"flex", alignItems:"center", gap:10 }}>
                <Icon d={icons.user} size={14}/>
                <div>
                  <div style={{ fontSize:11, color:"#64748b", textTransform:"uppercase",
                    letterSpacing:"0.08em" }}>Operador (sessão ativa)</div>
                  <div style={{ fontSize:14, fontWeight:600, color:"#06b6d4" }}>
                    {usuario.nome}
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {FIELDS.filter(f=>f.name!=="nfeChave").map(({name,label})=>(
                  <div key={name}>
                    <label style={{ fontSize:11, color:"#64748b", display:"block",
                      marginBottom:4, textTransform:"uppercase", letterSpacing:"0.08em" }}>
                      {label}
                    </label>
                    <input name={name} value={formData[name]} onChange={handleChange}
                      placeholder={label} style={inp} />
                  </div>
                ))}
              </div>
            </Card>

            {/* Placas detectadas */}
            {imagens.some(c=>c.placa) && (
              <Card title="Placas Detectadas (OCR)" icon={<Icon d={icons.camera}/>} accent="#22c55e">
                <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                  {imagens.filter(c=>c.placa).map((c,i)=>(
                    <div key={i} style={{ padding:"10px 20px", borderRadius:8,
                      background:"rgba(34,197,94,.08)", border:"1px solid rgba(34,197,94,.3)" }}>
                      <div style={{ fontSize:10, color:"#64748b", marginBottom:4,
                        textTransform:"uppercase", letterSpacing:"0.08em" }}>
                        {posicaoLabel[c.posicao]||c.posicao}
                      </div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:28,
                        fontWeight:700, color:"#4ade80", letterSpacing:6 }}>{c.placa}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </div>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ROOT — gerencia login/sessão
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [token,   setToken]   = useState(() => sessionStorage.getItem("sa_token"));
  const [usuario, setUsuario] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("sa_usuario")); } catch { return null; }
  });

  function handleLogin(t, u) {
    sessionStorage.setItem("sa_token",   t);
    sessionStorage.setItem("sa_usuario", JSON.stringify(u));
    setToken(t); setUsuario(u);
  }

  function handleLogout() {
    sessionStorage.removeItem("sa_token");
    sessionStorage.removeItem("sa_usuario");
    setToken(null); setUsuario(null);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:#0d1117; color:#e2e8f0; font-family:'IBM Plex Sans',sans-serif; }
        input:focus { border-color:#4ade80 !important; }
        input::placeholder { color:#475569; }
        @keyframes slideIn { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:#0d1117; }
        ::-webkit-scrollbar-thumb { background:#1e293b; border-radius:3px; }
      `}</style>

      {token && usuario
        ? <MainScreen token={token} usuario={usuario} onLogout={handleLogout} />
        : <LoginScreen onLogin={handleLogin} />
      }
    </>
  );
}
