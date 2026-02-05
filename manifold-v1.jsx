import { useState, useEffect, useCallback, useRef } from "react";

// ══════════════════════════════════════════════════════════════
// MANIFOLD v1.0
// Decoder + Encoder
// ══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// PRIME TABLE — The codon table. The shared function.
// Both encoder and decoder know this. Never transmitted.
// ─────────────────────────────────────────────────────────────

const P = {
  // ── UI PHYSICS ──
  density:     { 2:"void", 3:"gas", 5:"liquid", 7:"solid", 11:"dense" },
  temperature: { 13:"void", 17:"cold", 19:"warm", 23:"hot", 29:"critical", 31:"fusion" },
  mass:        { 37:-0.5, 41:-0.3, 43:-0.2, 47:0, 53:0.1, 59:0.2, 61:0.3, 67:0.4, 71:0.5, 73:0.6, 79:0.7, 83:0.8, 89:0.9, 97:1.0, 101:1.2, 103:1.3, 107:1.5, 109:2.0 },
  charge:      { 113:0.1, 127:0.2, 131:0.4, 137:0.5, 139:0.6, 149:0.8, 151:5, 157:10, 163:15 },
  friction:    { 167:0.2, 173:0.3, 179:0.5, 181:0.8, 191:1.5 },
  pressure:    { 193:0, 197:1.0, 199:2.0 },
  buoyancy:    { 211:0.0, 223:1.0 },

  // ── ACTIONS ── (primes 227+)
  action: {
    227:"navigate",  229:"addToCart",  233:"removeFromCart",
    239:"increment", 241:"decrement",  251:"submit",
    257:"toggle",    263:"open",       269:"close",
    271:"fetch",     277:"emit",       281:"pay",
    283:"share",     293:"copy",       307:"refresh",
  },

  // ── EMIT TARGETS ── (primes 311+)
  emit: {
    311:"api.get",    313:"api.post",   317:"api.put",
    331:"ws.send",    337:"ws.listen",
    347:"pay.gpay",   349:"pay.crypto",
    353:"event.track", 359:"event.log",
    367:"store.local", 373:"store.session",
  },

  // ── COMPONENT TYPES ── (primes 379+)
  component: {
    379:"Container",  383:"Text",       389:"Button",
    397:"Card",       401:"Input",      409:"Badge",
    419:"Image",      421:"Navbar",     431:"Sidebar",
    433:"Modal",      439:"Table",      443:"List",
    449:"Toast",      457:"Progress",   461:"Avatar",
    463:"Link",       467:"Pill",       479:"Spacer",
    487:"Divider",    491:"Icon",       499:"Form",
    503:"Select",     509:"Checkbox",   521:"Radio",
    523:"Tabs",       541:"Accordion",  547:"Carousel",
  },

  // ── NAVIGATION ORDER ── (primes 557+)
  nav: {
    557:"landing",  563:"page2",  569:"page3",
    571:"page4",    577:"page5",  587:"modal1",
    593:"modal2",   599:"drawer", 601:"sheet",
  },
};

// ── Reverse lookups ──
const ENCODE = {};
Object.entries(P).forEach(([axis, map]) => {
  ENCODE[axis] = {};
  Object.entries(map).forEach(([prime, val]) => { ENCODE[axis][val] = parseInt(prime); });
});

// ── All primes sorted for factoring ──
const ALL_PRIMES = Object.values(P).flatMap(m => Object.keys(m).map(Number)).sort((a,b) => a - b);
const PRIME_AXIS = {};
Object.entries(P).forEach(([axis, map]) => {
  Object.keys(map).forEach(p => { PRIME_AXIS[parseInt(p)] = axis; });
});

// ─────────────────────────────────────────────────────────────
// FACTORIZE — Number → prime factors → physics/actions/emits
// ─────────────────────────────────────────────────────────────

function factorize(n) {
  if (n <= 1) return [];
  const factors = [];
  let r = n;
  for (const p of ALL_PRIMES) {
    if (p * p > r && r > 1) { factors.push(r); break; }
    while (r % p === 0) { factors.push(p); r /= p; }
    if (r === 1) break;
  }
  return factors;
}

function decode(primeProduct) {
  const factors = factorize(primeProduct);
  const result = {};
  for (const f of factors) {
    const axis = PRIME_AXIS[f];
    if (axis) result[axis] = P[axis][f];
  }
  return result;
}

function encode(properties) {
  let product = 1;
  Object.entries(properties).forEach(([axis, value]) => {
    const prime = ENCODE[axis]?.[value];
    if (prime) product *= prime;
  });
  return product;
}

// ─────────────────────────────────────────────────────────────
// Φ — Physics → CSS. Deterministic. Pure.
// ─────────────────────────────────────────────────────────────

function phi(physics) {
  const css = {};
  if (physics.mass !== undefined) {
    if (physics.mass >= 0) {
      css.boxShadow = `0 ${Math.floor(physics.mass*20)}px ${Math.floor(physics.mass*40)}px rgba(0,0,0,0.25)`;
      css.zIndex = Math.floor(physics.mass * 10);
    } else {
      css.boxShadow = `0 0 ${Math.abs(physics.mass)*30}px rgba(200,160,60,0.4)`;
      css.transform = `translateY(${physics.mass*10}px)`;
    }
  }
  const d = { void:{background:"transparent",border:"1px dashed rgba(200,190,170,0.12)"}, gas:{background:"rgba(200,190,170,0.04)",border:"1px solid rgba(200,190,170,0.08)"}, liquid:{background:"rgba(200,190,170,0.07)",border:"1px solid rgba(200,190,170,0.14)"}, solid:{background:"rgba(200,190,170,0.1)",border:"1px solid rgba(200,190,170,0.2)"}, dense:{background:"rgba(200,190,170,0.15)",border:"1px solid rgba(200,190,170,0.28)"} };
  Object.assign(css, d[physics.density] || d.liquid);
  const tc = { void:"#64748b", cold:"#6b8fa3", warm:"#c9a227", hot:"#d4842a", critical:"#c44a2f", fusion:"#9b6dd7" };
  css.borderColor = tc[physics.temperature] || tc.warm;
  if (physics.charge !== undefined) { const s=8+physics.charge*24; css.padding=`${s}px`; css.gap=`${s}px`; }
  if (physics.friction !== undefined) css.transition = `all ${0.1+physics.friction*0.3}s ease`;
  if (physics.pressure !== undefined) css.flexGrow = physics.pressure;
  if (physics.buoyancy !== undefined) css.flexDirection = physics.buoyancy > 0 ? "column" : "column-reverse";
  if (physics.density === "void") { css.flexGrow=1; css.flexShrink=1; css.minHeight=0; css.width="100%"; }
  return css;
}

// ─────────────────────────────────────────────────────────────
// CACHE — Dedekind lattice. Learn through use.
// ─────────────────────────────────────────────────────────────

const CACHE = new Map();
const STATS = { hits: 0, misses: 0 };

function resolve(prime) {
  if (CACHE.has(prime)) { STATS.hits++; return CACHE.get(prime); }
  STATS.misses++;
  const decoded = decode(prime);
  const uiPhysics = {};
  const actions = [];
  const emits = [];
  let componentType = null;
  let navOrder = null;

  Object.entries(decoded).forEach(([axis, val]) => {
    if (axis === "action") actions.push(val);
    else if (axis === "emit") emits.push(val);
    else if (axis === "component") componentType = val;
    else if (axis === "nav") navOrder = val;
    else uiPhysics[axis] = val;
  });

  const result = {
    css: phi(uiPhysics),
    physics: uiPhysics,
    actions,
    emits,
    componentType,
    navOrder,
    prime,
  };
  CACHE.set(prime, result);
  return result;
}

// ─────────────────────────────────────────────────────────────
// QR TOPOLOGY FORMAT
// ─────────────────────────────────────────────────────────────
//
// {
//   v: 1,                          // protocol version
//   api: "https://...",            // external data endpoint (optional)
//   nav: [557, 563, ...],          // page order (nav primes)
//   pages: {
//     557: {                        // landing page
//       ui: [                       // component tree
//         [prime, "text content", [  // [physics+component prime, text, children]
//           [prime, "child text", []],
//         ]],
//       ],
//       actions: {                  // action mappings
//         "button_0": prime,        // button index → action+emit prime product
//       },
//     }
//   }
// }

// ─────────────────────────────────────────────────────────────
// TOPOLOGY RENDERER — Recursive tree → React elements
// ─────────────────────────────────────────────────────────────

const TEMP_COLORS = { void:"#64748b", cold:"#6b8fa3", warm:"#c9a227", hot:"#d4842a", critical:"#c44a2f", fusion:"#9b6dd7" };

function RenderNode({ node, depth = 0, actionHandler, index = 0 }) {
  if (!node || !Array.isArray(node)) return null;
  const [prime, text, children = [], actionKey] = node;
  const resolved = resolve(prime);
  const { css, componentType, actions } = resolved;

  const isInteractive = actions.length > 0 || actionKey;
  const Tag = isInteractive ? "button" : "div";

  // Component-type-specific style overrides
  const typeStyle = {};
  if (componentType === "Text") {
    typeStyle.background = "transparent";
    typeStyle.border = "none";
    typeStyle.boxShadow = "none";
    typeStyle.padding = "0";
    if (resolved.physics.mass >= 0.8) { typeStyle.fontSize = "18px"; typeStyle.fontWeight = 600; }
    else if (resolved.physics.mass >= 0.3) { typeStyle.fontSize = "14px"; typeStyle.lineHeight = "1.6"; }
    else { typeStyle.fontSize = "12px"; typeStyle.color = "#8a8070"; }
  }
  if (componentType === "Button") {
    typeStyle.cursor = "pointer";
    typeStyle.borderRadius = "8px";
    typeStyle.padding = typeStyle.padding || "12px 24px";
    typeStyle.fontSize = "14px";
    typeStyle.fontWeight = 500;
    if (resolved.physics.temperature === "warm") {
      typeStyle.background = "#c9a227";
      typeStyle.color = "#0f0e0c";
      typeStyle.border = "none";
    }
  }
  if (componentType === "Card") {
    typeStyle.borderRadius = "12px";
    typeStyle.padding = typeStyle.padding || "16px";
  }
  if (componentType === "Navbar") {
    typeStyle.position = "sticky";
    typeStyle.top = 0;
    typeStyle.backdropFilter = "blur(20px)";
    typeStyle.padding = "14px 20px";
    typeStyle.display = "flex";
    typeStyle.alignItems = "center";
    typeStyle.justifyContent = "space-between";
    typeStyle.zIndex = 100;
  }
  if (componentType === "Badge") {
    typeStyle.fontSize = "10px";
    typeStyle.padding = "3px 8px";
    typeStyle.borderRadius = "4px";
    typeStyle.fontFamily = "'DM Mono', monospace";
    typeStyle.display = "inline-block";
    const tc = TEMP_COLORS[resolved.physics.temperature] || TEMP_COLORS.warm;
    typeStyle.color = tc;
    typeStyle.background = tc + "18";
    typeStyle.borderColor = tc + "40";
  }
  if (componentType === "Container") {
    typeStyle.display = "flex";
    typeStyle.flexDirection = "column";
    typeStyle.gap = typeStyle.gap || "12px";
  }
  if (componentType === "Spacer") {
    typeStyle.flexGrow = 1;
  }
  if (componentType === "Divider") {
    typeStyle.height = "1px";
    typeStyle.background = "rgba(200,190,170,0.1)";
    typeStyle.border = "none";
    typeStyle.boxShadow = "none";
  }
  if (componentType === "Input") {
    typeStyle.borderRadius = "8px";
    typeStyle.padding = "10px 14px";
    typeStyle.fontSize = "14px";
    typeStyle.outline = "none";
    typeStyle.color = "#e8e0d0";
  }
  if (componentType === "Image") {
    typeStyle.borderRadius = "8px";
    typeStyle.overflow = "hidden";
    typeStyle.minHeight = "120px";
    typeStyle.display = "flex";
    typeStyle.alignItems = "center";
    typeStyle.justifyContent = "center";
    typeStyle.color = "#8a8070";
    typeStyle.fontSize = "12px";
  }
  if (componentType === "Toast") {
    typeStyle.position = "fixed";
    typeStyle.top = "80px";
    typeStyle.left = "50%";
    typeStyle.transform = "translateX(-50%)";
    typeStyle.zIndex = 200;
    typeStyle.borderRadius = "8px";
    typeStyle.padding = "10px 20px";
    typeStyle.fontSize = "13px";
  }

  const mergedStyle = {
    ...css,
    ...typeStyle,
    animation: `fadeUp ${0.2 + depth * 0.05 + index * 0.04}s ease both`,
  };

  if (isInteractive) {
    mergedStyle.WebkitTapHighlightColor = "transparent";
    mergedStyle.fontFamily = "inherit";
  }

  const handleClick = isInteractive ? () => {
    if (actionHandler && actionKey) actionHandler(actionKey, actions);
  } : undefined;

  // Input special case
  if (componentType === "Input") {
    return (
      <input
        placeholder={text || ""}
        style={mergedStyle}
      />
    );
  }

  return (
    <Tag onClick={handleClick} style={mergedStyle}>
      {text && <span>{text}</span>}
      {children && children.map((child, i) => (
        <RenderNode
          key={i}
          node={child}
          depth={depth + 1}
          index={i}
          actionHandler={actionHandler}
        />
      ))}
    </Tag>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE RENDERER — Handles navigation + state + API
// ─────────────────────────────────────────────────────────────

function PageRenderer({ topology }) {
  const [currentPage, setCurrentPage] = useState(topology.nav[0]);
  const [appState, setAppState] = useState({ cart: [], data: null, loading: false });
  const [toast, setToast] = useState(null);

  // Fetch from external API if specified
  useEffect(() => {
    if (topology.api) {
      setAppState(s => ({ ...s, loading: true }));
      fetch(topology.api)
        .then(r => r.json())
        .then(data => setAppState(s => ({ ...s, data, loading: false })))
        .catch(() => setAppState(s => ({ ...s, loading: false })));
    }
  }, [topology.api]);

  const actionHandler = useCallback((key, actions) => {
    actions.forEach(action => {
      switch(action) {
        case "navigate":
          const targetPage = topology.actions?.[key]?.target;
          if (targetPage) setCurrentPage(targetPage);
          break;
        case "addToCart":
          const item = topology.actions?.[key]?.item;
          if (item !== undefined) {
            setAppState(s => {
              const existing = s.cart.find(c => c.id === item);
              if (existing) return { ...s, cart: s.cart.map(c => c.id === item ? { ...c, qty: c.qty+1 } : c) };
              const itemData = s.data?.items?.[item] || { id: item, name: `Item ${item}`, price: 0 };
              return { ...s, cart: [...s.cart, { ...itemData, qty: 1 }] };
            });
            setToast("Item adicionado");
            setTimeout(() => setToast(null), 1500);
            break;
          }
          break;
        case "removeFromCart":
          const removeId = topology.actions?.[key]?.item;
          setAppState(s => ({ ...s, cart: s.cart.map(c => c.id === removeId ? {...c, qty:c.qty-1} : c).filter(c => c.qty > 0) }));
          break;
        case "pay":
          // Google Pay integration point
          setToast("Redirecting to payment...");
          setTimeout(() => setToast(null), 2000);
          break;
        case "submit":
          const emitTarget = topology.actions?.[key]?.emit;
          if (emitTarget) {
            fetch(emitTarget.url, {
              method: emitTarget.method || "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cart: appState.cart, state: appState }),
            }).catch(console.error);
          }
          break;
        default:
          console.log(`[Manifold] Action: ${action}`, key);
      }
    });
  }, [topology, appState]);

  const page = topology.pages?.[currentPage];
  if (!page) return <div style={{ color: "#c44a2f", padding: "20px", fontFamily: "monospace" }}>Page {currentPage} not found in topology</div>;

  // Inject live data into text nodes
  const injectData = (tree) => {
    if (!tree || !Array.isArray(tree)) return tree;
    let [prime, text, children, actionKey] = tree;

    // Replace {{data.path}} with actual values
    if (text && typeof text === "string" && appState.data) {
      text = text.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
        const val = path.split(".").reduce((o, k) => o?.[k], appState.data);
        return val !== undefined ? val : `{{${path}}}`;
      });
    }

    return [prime, text, children?.map(c => injectData(c)), actionKey];
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f0e0c",
      fontFamily: "'DM Sans', sans-serif",
      color: "#e8e0d0",
      display: "flex",
      flexDirection: "column",
      maxWidth: "560px",
      margin: "0 auto",
      position: "relative",
    }}>
      {page.ui.map((node, i) => (
        <RenderNode
          key={i}
          node={injectData(node)}
          actionHandler={actionHandler}
          index={i}
        />
      ))}

      {/* Cart footer if items exist */}
      {appState.cart.length > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "14px 20px",
          background: "rgba(15,14,12,0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(201,162,39,0.3)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          maxWidth: "560px", margin: "0 auto", zIndex: 100,
          animation: "slideUp 0.3s ease",
        }}>
          <div>
            <div style={{ fontSize: "11px", color: "#8a8070", fontFamily: "'DM Mono', monospace" }}>
              {appState.cart.reduce((s,c) => s+c.qty, 0)} itens
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#c9a227", fontFamily: "'DM Mono', monospace" }}>
              R$ {appState.cart.reduce((s,c) => s + c.price * c.qty, 0).toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => actionHandler("__pay", ["pay"])}
            style={{
              padding: "12px 28px", borderRadius: "8px",
              background: "#c9a227", color: "#0f0e0c",
              border: "none", fontSize: "14px", fontWeight: 600,
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Pedir →
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
          padding: "8px 18px", borderRadius: "8px",
          background: "rgba(90,154,58,0.12)", border: "1px solid rgba(90,154,58,0.3)",
          color: "#5a9a3a", fontSize: "12px", fontFamily: "'DM Mono', monospace",
          zIndex: 200, animation: "slideDown 0.3s ease",
        }}>
          ✓ {toast}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DEBUG PANEL — Shows the math behind the render
// ─────────────────────────────────────────────────────────────

function DebugPanel({ topology, onClose }) {
  const allPrimes = new Set();
  const collectPrimes = (nodes) => {
    if (!nodes) return;
    nodes.forEach(n => {
      if (Array.isArray(n)) {
        allPrimes.add(n[0]);
        if (n[2]) collectPrimes(n[2]);
      }
    });
  };
  Object.values(topology.pages || {}).forEach(p => collectPrimes(p.ui));

  const primeList = [...allPrimes].sort((a,b) => a - b);

  // Calculate payload size
  const topologyStr = JSON.stringify(topology);
  const totalBytes = new TextEncoder().encode(topologyStr).length;
  const uiPrimeBits = primeList.reduce((s, p) => s + Math.ceil(Math.log2(p+1)), 0);

  return (
    <div style={{
      minHeight: "100vh", background: "#0f0e0c",
      fontFamily: "'DM Mono', monospace", color: "#e8e0d0",
      padding: "20px", fontSize: "12px", lineHeight: 1.8,
      maxWidth: "640px", margin: "0 auto",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px", paddingBottom:"16px", borderBottom:"1px solid rgba(200,190,170,0.1)" }}>
        <div>
          <div style={{ fontSize:"16px", fontWeight:500, color:"#c9a227" }}>⊞ MANIFOLD DEBUG</div>
          <div style={{ color:"#8a8070", marginTop:"4px" }}>Topology factorization</div>
        </div>
        <button onClick={onClose} style={{ background:"rgba(201,162,39,0.1)", border:"1px solid rgba(201,162,39,0.3)", color:"#c9a227", padding:"6px 14px", borderRadius:"6px", cursor:"pointer", fontSize:"11px", fontFamily:"'DM Mono', monospace" }}>
          ← BACK
        </button>
      </div>

      {/* Stats */}
      <div style={{ padding:"16px", borderRadius:"8px", background:"rgba(201,162,39,0.05)", border:"1px solid rgba(201,162,39,0.2)", marginBottom:"16px" }}>
        <div style={{ color:"#c9a227", marginBottom:"12px", fontSize:"11px", letterSpacing:"2px" }}>PAYLOAD</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"12px" }}>
          {[
            { l:"UI Primes", v: primeList.length },
            { l:"Prime Bits", v: uiPrimeBits },
            { l:"Total JSON", v: `${totalBytes}B` },
            { l:"Pages", v: Object.keys(topology.pages || {}).length },
          ].map((s,i) => (
            <div key={i}>
              <div style={{ color:"#8a8070", fontSize:"10px", letterSpacing:"1px", marginBottom:"4px" }}>{s.l}</div>
              <div style={{ color:"#e8e0d0", fontSize:"16px", fontWeight:500 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cache */}
      <div style={{ padding:"16px", borderRadius:"8px", background:"rgba(200,190,170,0.04)", border:"1px solid rgba(200,190,170,0.08)", marginBottom:"16px" }}>
        <div style={{ color:"#8a8070", marginBottom:"12px", fontSize:"11px", letterSpacing:"2px" }}>CACHE (DEDEKIND LATTICE)</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" }}>
          <div><div style={{color:"#8a8070",fontSize:"10px"}}>Cached</div><div style={{color:"#c9a227",fontSize:"16px",fontWeight:500}}>{CACHE.size}</div></div>
          <div><div style={{color:"#8a8070",fontSize:"10px"}}>Hits</div><div style={{color:"#5a9a3a",fontSize:"16px",fontWeight:500}}>{STATS.hits}</div></div>
          <div><div style={{color:"#8a8070",fontSize:"10px"}}>Misses</div><div style={{color:"#c44a2f",fontSize:"16px",fontWeight:500}}>{STATS.misses}</div></div>
        </div>
      </div>

      {/* Prime factorizations */}
      <div style={{ padding:"16px", borderRadius:"8px", background:"rgba(200,190,170,0.04)", border:"1px solid rgba(200,190,170,0.08)", marginBottom:"16px" }}>
        <div style={{ color:"#8a8070", marginBottom:"16px", fontSize:"11px", letterSpacing:"2px" }}>FACTORIZATIONS</div>
        {primeList.map((p, i) => {
          const factors = factorize(p);
          const decoded = decode(p);
          return (
            <div key={p} style={{ padding:"8px 0", borderBottom: i < primeList.length-1 ? "1px solid rgba(200,190,170,0.06)" : "none" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                <span style={{ color:"#c9a227" }}>{decoded.component || "physics"}</span>
                <span style={{ color:"#8a8070" }}>{p} = {factors.join(" × ")}</span>
              </div>
              <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                {Object.entries(decoded).filter(([k]) => k !== "component").map(([k,v]) => (
                  <span key={k} style={{ padding:"1px 6px", borderRadius:"3px", background:"rgba(200,190,170,0.06)", border:"1px solid rgba(200,190,170,0.1)", fontSize:"10px" }}>
                    <span style={{color:"#8a8070"}}>{k}:</span> <span style={{color:"#e8e0d0"}}>{String(v)}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Raw topology */}
      <div style={{ padding:"16px", borderRadius:"8px", background:"rgba(200,190,170,0.04)", border:"1px solid rgba(200,190,170,0.08)" }}>
        <div style={{ color:"#8a8070", marginBottom:"12px", fontSize:"11px", letterSpacing:"2px" }}>RAW TOPOLOGY</div>
        <pre style={{ fontSize:"10px", lineHeight:"1.6", color:"#8a8070", whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
          {JSON.stringify(topology, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ENCODER — Claude-powered topology builder
// ─────────────────────────────────────────────────────────────

function Encoder({ onPreview }) {
  const [apiKey, setApiKey] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [topology, setTopology] = useState(null);
  const chatEnd = useRef(null);

  const SYSTEM_PROMPT = `You are the Manifold Encoder. You help users build application topologies using prime-encoded physics.

THE PRIME TABLE:
- Component types: Container(379), Text(383), Button(389), Card(397), Input(401), Badge(409), Image(419), Navbar(421), Sidebar(431), Modal(433), Table(439), List(443), Toast(449), Progress(457), Avatar(461), Link(463), Pill(467), Spacer(479), Divider(487), Icon(491), Form(499), Select(503), Checkbox(509), Radio(521), Tabs(523), Accordion(541), Carousel(547)
- Density: void(2), gas(3), liquid(5), solid(7), dense(11)
- Temperature: void(13), cold(17), warm(19), hot(23), critical(29), fusion(31)
- Mass: -0.5(37), -0.3(41), -0.2(43), 0(47), 0.1(53), 0.2(59), 0.3(61), 0.4(67), 0.5(71), 0.6(73), 0.7(79), 0.8(83), 0.9(89), 1.0(97), 1.2(101), 1.3(103), 1.5(107), 2.0(109)
- Actions: navigate(227), addToCart(229), removeFromCart(233), increment(239), decrement(241), submit(251), toggle(257), open(263), close(269), fetch(271), emit(277), pay(281)
- Navigation: landing(557), page2(563), page3(569)

HOW TO ENCODE: Multiply primes together. A warm solid Button with mass 1.0 that adds to cart = 389 × 7 × 19 × 97 × 229 = the product. Each product is unique and perfectly factorable.

TOPOLOGY FORMAT:
{
  "v": 1,
  "api": "optional external URL",
  "nav": [557],
  "pages": {
    "557": {
      "ui": [
        [prime_product, "text content or null", [children], "action_key_or_null"]
      ]
    }
  },
  "actions": {
    "action_key": { "target": page_prime, "item": index, "emit": { "url": "...", "method": "POST" } }
  }
}

When the user describes an app, build the topology step by step. Show them the structure in human-readable form first, then generate the JSON topology. Always explain which primes you're multiplying and why.

CRITICAL: Every UI node is [prime_product, text, children, action_key]. The prime_product MUST be the mathematical product of all applicable primes (component × density × temperature × mass × any actions). Calculate these products correctly.`;

  const sendMessage = async () => {
    if (!input.trim() || !apiKey) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: newMessages,
        }),
      });
      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "Error";
      setMessages([...newMessages, { role: "assistant", content: text }]);

      // Try to extract topology JSON from response
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*"v"\s*:\s*1[\s\S]*\})/);
      if (jsonMatch) {
        try {
          const topo = JSON.parse(jsonMatch[1].trim());
          if (topo.v === 1 && topo.pages) setTopology(topo);
        } catch(e) { /* not valid json yet */ }
      }
    } catch(e) {
      setMessages([...newMessages, { role: "assistant", content: `Error: ${e.message}` }]);
    }
    setLoading(false);
  };

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const mono = "'DM Mono', monospace";
  const sans = "'DM Sans', sans-serif";

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#0f0e0c", color:"#e8e0d0", fontFamily:sans }}>
      {/* Header */}
      <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(200,190,170,0.1)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:"16px", fontWeight:600, color:"#c9a227" }}>⊞ MANIFOLD ENCODER</div>
          <div style={{ fontSize:"11px", color:"#8a8070", fontFamily:mono, marginTop:"2px" }}>Describe → Topology → QR</div>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          {topology && (
            <button onClick={() => onPreview(topology)} style={{ background:"rgba(90,154,58,0.12)", border:"1px solid rgba(90,154,58,0.3)", color:"#5a9a3a", padding:"6px 14px", borderRadius:"6px", cursor:"pointer", fontSize:"11px", fontFamily:mono }}>
              ▶ PREVIEW
            </button>
          )}
        </div>
      </div>

      {/* API Key */}
      {!apiKey && (
        <div style={{ padding:"20px", borderBottom:"1px solid rgba(200,190,170,0.06)" }}>
          <div style={{ fontSize:"12px", color:"#8a8070", marginBottom:"8px", fontFamily:mono }}>ANTHROPIC API KEY</div>
          <div style={{ display:"flex", gap:"8px" }}>
            <input
              type="password"
              placeholder="sk-ant-..."
              onKeyDown={(e) => { if (e.key === "Enter") setApiKey(e.target.value); }}
              style={{
                flex:1, padding:"10px 14px", borderRadius:"8px",
                background:"rgba(200,190,170,0.06)", border:"1px solid rgba(200,190,170,0.12)",
                color:"#e8e0d0", fontSize:"13px", fontFamily:mono, outline:"none",
              }}
            />
            <button
              onClick={(e) => { const inp = e.target.previousSibling; setApiKey(inp.value); }}
              style={{
                padding:"10px 20px", borderRadius:"8px",
                background:"#c9a227", color:"#0f0e0c",
                border:"none", fontSize:"13px", fontWeight:600, cursor:"pointer",
              }}
            >
              Connect
            </button>
          </div>
        </div>
      )}

      {/* Chat */}
      <div style={{ flex:1, overflow:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:"12px" }}>
        {messages.length === 0 && apiKey && (
          <div style={{ color:"#8a8070", textAlign:"center", marginTop:"40px", fontSize:"13px", lineHeight:1.8 }}>
            <div style={{ fontSize:"32px", marginBottom:"16px", opacity:0.3 }}>⊞</div>
            Describe the app you want to build.<br/>
            <span style={{ fontFamily:mono, fontSize:"11px" }}>e.g. "A restaurant menu with 4 items, a cart, and checkout"</span>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            padding:"12px 16px", borderRadius:"10px",
            background: msg.role === "user" ? "rgba(201,162,39,0.08)" : "rgba(200,190,170,0.04)",
            border: `1px solid ${msg.role === "user" ? "rgba(201,162,39,0.2)" : "rgba(200,190,170,0.08)"}`,
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
          }}>
            <div style={{ fontSize:"10px", color:"#8a8070", fontFamily:mono, marginBottom:"6px" }}>
              {msg.role === "user" ? "YOU" : "ENCODER"}
            </div>
            <div style={{ fontSize:"13px", lineHeight:1.7, whiteSpace:"pre-wrap" }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ padding:"12px 16px", color:"#c9a227", fontFamily:mono, fontSize:"12px" }}>
            ◌ Building topology...
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Input */}
      {apiKey && (
        <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(200,190,170,0.08)", display:"flex", gap:"8px" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
            placeholder="Describe your app..."
            style={{
              flex:1, padding:"12px 16px", borderRadius:"10px",
              background:"rgba(200,190,170,0.06)", border:"1px solid rgba(200,190,170,0.1)",
              color:"#e8e0d0", fontSize:"14px", fontFamily:sans, outline:"none",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding:"12px 20px", borderRadius:"10px",
              background: loading ? "#8a8070" : "#c9a227",
              color:"#0f0e0c", border:"none",
              fontSize:"14px", fontWeight:600, cursor: loading ? "default" : "pointer",
            }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCANNER — QR camera reader (simulated + paste JSON)
// ─────────────────────────────────────────────────────────────

function Scanner({ onScan }) {
  const [scanAnim, setScanAnim] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteVal, setPasteVal] = useState("");

  const handlePaste = () => {
    try {
      const topo = JSON.parse(pasteVal);
      if (topo.v === 1 && topo.pages) onScan(topo);
      else alert("Invalid topology: missing v:1 or pages");
    } catch(e) { alert("Invalid JSON: " + e.message); }
  };

  return (
    <div style={{
      minHeight:"100vh", background:"#0f0e0c",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Sans', sans-serif", color:"#e8e0d0", padding:"24px",
      position:"relative",
    }}>
      {/* Grain */}
      <div style={{ position:"absolute", inset:0, opacity:0.03, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      <div style={{ position:"relative", zIndex:1, textAlign:"center", maxWidth:"420px", width:"100%" }}>
        {/* Logo */}
        <div style={{ marginBottom:"40px" }}>
          <div style={{ fontSize:"12px", letterSpacing:"6px", textTransform:"uppercase", color:"#8a8070", fontFamily:"'DM Mono', monospace", marginBottom:"10px" }}>∎ MANIFOLD</div>
          <div style={{ fontSize:"26px", fontWeight:300, letterSpacing:"1px" }}>Prime Topology Decoder</div>
          <div style={{ fontSize:"12px", color:"#8a8070", marginTop:"6px" }}>number → physics → interface</div>
        </div>

        {pasteMode ? (
          /* Paste topology JSON */
          <div style={{ textAlign:"left" }}>
            <div style={{ fontSize:"11px", color:"#8a8070", fontFamily:"'DM Mono', monospace", marginBottom:"8px", letterSpacing:"1px" }}>PASTE TOPOLOGY JSON</div>
            <textarea
              value={pasteVal}
              onChange={e => setPasteVal(e.target.value)}
              placeholder='{"v":1,"nav":[557],"pages":{...}}'
              style={{
                width:"100%", height:"200px", padding:"14px",
                borderRadius:"12px", background:"rgba(200,190,170,0.04)",
                border:"1px solid rgba(200,190,170,0.12)", color:"#e8e0d0",
                fontSize:"11px", fontFamily:"'DM Mono', monospace",
                outline:"none", resize:"vertical", lineHeight:1.6,
              }}
            />
            <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
              <button onClick={() => setPasteMode(false)} style={{ flex:1, padding:"12px", borderRadius:"8px", background:"transparent", border:"1px solid rgba(200,190,170,0.15)", color:"#8a8070", cursor:"pointer", fontSize:"13px" }}>
                Cancel
              </button>
              <button onClick={handlePaste} style={{ flex:1, padding:"12px", borderRadius:"8px", background:"#c9a227", border:"none", color:"#0f0e0c", cursor:"pointer", fontSize:"13px", fontWeight:600 }}>
                Decode →
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Scanner box */}
            <div style={{
              width:"260px", height:"260px", margin:"0 auto 32px",
              border:`2px solid ${scanAnim ? "#c9a227" : "rgba(200,190,170,0.12)"}`,
              borderRadius:"20px", display:"flex", alignItems:"center", justifyContent:"center",
              cursor:"pointer", position:"relative", overflow:"hidden",
              transition:"all 0.6s ease", background: scanAnim ? "rgba(201,162,39,0.03)" : "transparent",
            }}>
              {/* Corners */}
              {[{top:"12px",left:"12px",borderTop:"3px solid #c9a227",borderLeft:"3px solid #c9a227"},{top:"12px",right:"12px",borderTop:"3px solid #c9a227",borderRight:"3px solid #c9a227"},{bottom:"12px",left:"12px",borderBottom:"3px solid #c9a227",borderLeft:"3px solid #c9a227"},{bottom:"12px",right:"12px",borderBottom:"3px solid #c9a227",borderRight:"3px solid #c9a227"}].map((s,i) => (
                <div key={i} style={{ position:"absolute", width:"28px", height:"28px", ...s, borderRadius:"2px" }} />
              ))}
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:"44px", marginBottom:"12px", opacity:0.3 }}>⊞</div>
                <div style={{ fontSize:"13px", color:"#8a8070" }}>Camera QR scanning</div>
                <div style={{ fontSize:"11px", color:"#64748b", marginTop:"4px" }}>coming in v1.1</div>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => setPasteMode(true)}
              style={{
                width:"100%", padding:"14px", borderRadius:"10px",
                background:"rgba(201,162,39,0.08)", border:"1px solid rgba(201,162,39,0.2)",
                color:"#c9a227", cursor:"pointer", fontSize:"14px", fontWeight:500,
                fontFamily:"'DM Sans', sans-serif", marginBottom:"12px",
              }}
            >
              Paste Topology JSON
            </button>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginTop:"8px", fontSize:"12px", fontFamily:"'DM Mono', monospace" }}>
              {[{l:"COMPONENTS",v:"43"},{l:"PHYSICS",v:"7 axes"},{l:"CACHE",v:String(CACHE.size)}].map((s,i) => (
                <div key={i} style={{ padding:"10px", borderRadius:"8px", background:"rgba(200,190,170,0.04)", border:"1px solid rgba(200,190,170,0.08)" }}>
                  <div style={{ color:"#c9a227", fontSize:"16px", fontWeight:500, marginBottom:"2px" }}>{s.v}</div>
                  <div style={{ color:"#8a8070", fontSize:"9px", letterSpacing:"1px" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN APP — Scanner ↔ Renderer ↔ Encoder ↔ Debug
// ─────────────────────────────────────────────────────────────

const ManifoldApp = () => {
  const [mode, setMode] = useState("home"); // home | scan | encode | render | debug
  const [topology, setTopology] = useState(null);

  const handleScan = (topo) => {
    setTopology(topo);
    setMode("render");
  };

  return (
    <div>
      {mode === "home" && (
        <div style={{
          minHeight:"100vh", background:"#0f0e0c",
          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          fontFamily:"'DM Sans', sans-serif", color:"#e8e0d0", padding:"24px",
          position:"relative",
        }}>
          <div style={{ position:"absolute", inset:0, opacity:0.03, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

          <div style={{ position:"relative", zIndex:1, textAlign:"center", maxWidth:"400px" }}>
            <div style={{ fontSize:"12px", letterSpacing:"8px", textTransform:"uppercase", color:"#8a8070", fontFamily:"'DM Mono', monospace", marginBottom:"12px" }}>∎</div>
            <div style={{ fontSize:"36px", fontWeight:300, letterSpacing:"2px", marginBottom:"8px" }}>MANIFOLD</div>
            <div style={{ fontSize:"13px", color:"#8a8070", marginBottom:"48px", lineHeight:1.6 }}>
              Prime-encoded topology decoder.<br />
              <span style={{ fontFamily:"'DM Mono', monospace", fontSize:"11px" }}>number → physics → interface</span>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              <button onClick={() => setMode("scan")} style={{
                padding:"16px 24px", borderRadius:"12px",
                background:"rgba(201,162,39,0.08)", border:"1px solid rgba(201,162,39,0.25)",
                color:"#c9a227", cursor:"pointer", fontSize:"15px", fontWeight:500,
                fontFamily:"'DM Sans', sans-serif", transition:"all 0.2s ease",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
              }}>
                <span style={{ fontSize:"20px" }}>⊞</span> Scan / Decode
              </button>

              <button onClick={() => setMode("encode")} style={{
                padding:"16px 24px", borderRadius:"12px",
                background:"rgba(200,190,170,0.04)", border:"1px solid rgba(200,190,170,0.12)",
                color:"#e8e0d0", cursor:"pointer", fontSize:"15px", fontWeight:500,
                fontFamily:"'DM Sans', sans-serif", transition:"all 0.2s ease",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
              }}>
                <span style={{ fontSize:"20px" }}>◇</span> Build / Encode
              </button>
            </div>

            <div style={{ marginTop:"48px", fontSize:"10px", color:"#64748b", fontFamily:"'DM Mono', monospace", lineHeight:1.8 }}>
              43 components · 7 physics axes · 178 variants<br/>
              18 bytes topology · ∞ applications
            </div>
          </div>
        </div>
      )}

      {mode === "scan" && (
        <>
          <Scanner onScan={handleScan} />
          <button onClick={() => setMode("home")} style={{ position:"fixed", top:"16px", left:"16px", background:"rgba(200,190,170,0.06)", border:"1px solid rgba(200,190,170,0.12)", color:"#8a8070", padding:"6px 12px", borderRadius:"6px", cursor:"pointer", fontSize:"11px", fontFamily:"'DM Mono', monospace", zIndex:200 }}>
            ← HOME
          </button>
        </>
      )}

      {mode === "encode" && (
        <>
          <Encoder onPreview={(topo) => { setTopology(topo); setMode("render"); }} />
          <button onClick={() => setMode("home")} style={{ position:"fixed", top:"16px", left:"16px", background:"rgba(200,190,170,0.06)", border:"1px solid rgba(200,190,170,0.12)", color:"#8a8070", padding:"6px 12px", borderRadius:"6px", cursor:"pointer", fontSize:"11px", fontFamily:"'DM Mono', monospace", zIndex:200 }}>
            ← HOME
          </button>
        </>
      )}

      {mode === "render" && topology && (
        <>
          <PageRenderer topology={topology} />
          <div style={{ position:"fixed", top:"12px", right:"12px", display:"flex", gap:"6px", zIndex:200 }}>
            <button onClick={() => setMode("debug")} style={{ background:"rgba(200,190,170,0.06)", border:"1px solid rgba(200,190,170,0.12)", color:"#8a8070", padding:"6px 12px", borderRadius:"6px", cursor:"pointer", fontSize:"11px", fontFamily:"'DM Mono', monospace" }}>⊞ DEBUG</button>
            <button onClick={() => { setMode("scan"); setTopology(null); }} style={{ background:"rgba(200,190,170,0.06)", border:"1px solid rgba(200,190,170,0.12)", color:"#8a8070", padding:"6px 12px", borderRadius:"6px", cursor:"pointer", fontSize:"11px", fontFamily:"'DM Mono', monospace" }}>✕</button>
          </div>
        </>
      )}

      {mode === "debug" && topology && (
        <DebugPanel topology={topology} onClose={() => setMode("render")} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@300;400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
        body { background:#0f0e0c; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(200,190,170,0.2); border-radius:4px; }
      `}</style>
    </div>
  );
};

export default ManifoldApp;
