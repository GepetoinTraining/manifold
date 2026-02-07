/**
 * MANIFOLD WORKER
 * Runs in browser. Receives binary topology or deltas.
 * Emits DOM instructions to main thread.
 *
 * Messages IN:
 *   { type: 'load', payload: ArrayBuffer }     — full topology
 *   { type: 'delta', payload: ArrayBuffer }    — delta update
 *   { type: 'resize', width: number }          — viewport change
 *
 * Messages OUT:
 *   { type: 'render', nodes: DOMInstruction[] }  — full render
 *   { type: 'patch', patches: DOMPatch[] }       — incremental update
 *   { type: 'ready', stats: {} }                 — worker initialized
 *   { type: 'error', message: string }           — error
 *
 * DOMInstruction:
 *   { id, tag, style, text, children, classPath }
 *
 * DOMPatch:
 *   { address, op: 'update'|'insert'|'delete', instruction? }
 */

// Import schema and phi inline (worker is self-contained)
// In production these would be bundled. Here we define them inline.

const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

// ── STATE ──
let tree = null;
let spectrum = 'void';
let nodeIndex = 0;

// ── MESSAGE HANDLER ──
self.onmessage = function(e) {
  const { type, payload } = e.data;

  try {
    switch (type) {
      case 'load':
        handleLoad(payload);
        break;
      case 'delta':
        handleDelta(payload);
        break;
      case 'resize':
        // Could trigger responsive recalculation
        break;
      default:
        self.postMessage({ type: 'error', message: `Unknown message type: ${type}` });
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};

function handleLoad(source) {
  const start = performance.now();

  // Parse .mf source (text mode for now, binary mode later)
  if (typeof source === 'string') {
    const parsed = parseMF(source);
    tree = parsed.tree;
    spectrum = parsed.directives.spectrum || 'void';
  }

  // Render full tree
  nodeIndex = 0;
  const instructions = renderTree(tree, spectrum, null);

  const elapsed = performance.now() - start;

  self.postMessage({
    type: 'render',
    nodes: instructions,
    stats: {
      parseTime: elapsed,
      nodeCount: nodeIndex,
      spectrum,
    },
  });
}

function handleDelta(deltaBuffer) {
  // Apply delta to tree, generate patches
  // For now: re-render (optimize later with surgical patches)
  if (tree) {
    nodeIndex = 0;
    const instructions = renderTree(tree, spectrum, null);
    self.postMessage({ type: 'render', nodes: instructions });
  }
}

// ── PARSER (inline for worker isolation) ──

function parseMF(source) {
  const lines = source.split('\n');
  const root = { children: [], directives: {} };
  const stack = [{ node: root, indent: -1 }];

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (line.trim().startsWith('@')) {
      const m = line.trim().match(/^@(\w+)\s+(.+)$/);
      if (m) root.directives[m[1]] = m[2];
      continue;
    }

    const indent = line.search(/\S/);
    const content = line.trim();
    const pipeIdx = content.indexOf('|');
    const classPath = pipeIdx >= 0 ? content.slice(0, pipeIdx).trim() : content.trim();
    const text = pipeIdx >= 0 ? content.slice(pipeIdx + 1) : '';
    const isTexture = text.trim() === '~';
    const fields = !isTexture && text.includes(';') ? text.split(';').map(f => f.trim()) : null;

    const node = { classPath, text: isTexture ? null : (fields ? null : text), texture: isTexture, fields, children: [] };

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    stack[stack.length - 1].node.children.push(node);
    stack.push({ node, indent });
  }

  return { directives: root.directives, tree: root.children };
}

// ── RENDER (generates DOM instructions) ──

function renderTree(nodes, spectrumName, parentContext) {
  return nodes.map((node, i) => renderNode(node, spectrumName, {
    childIndex: i,
    siblingCount: nodes.length,
    parentRole: parentContext?.role || null,
  }));
}

function renderNode(node, spectrumName, context) {
  const id = nodeIndex++;
  const resolved = resolveClass(node.classPath);
  const spec = resolved.spectrum || spectrumName;
  const role = ROLES[resolved.role] || null;
  const baseType = node.classPath.split('.')[0].toLowerCase();

  // Determine HTML tag
  let tag = 'div';
  if (baseType === 'button') tag = 'button';
  if (baseType === 'link') tag = 'a';
  if (baseType === 'input') tag = 'input';
  if (baseType === 'image') tag = 'img';
  if (baseType === 'divider') tag = 'hr';

  // Compute style
  const style = computeStyle(resolved, spec, context, baseType);

  // Handle macro fields (icon;title;desc)
  let children = [];
  if (node.fields) {
    children = node.fields.map((field, fi) => ({
      id: nodeIndex++,
      tag: 'span',
      style: computeStyle(
        resolveClass('text'),
        spec,
        { childIndex: fi, siblingCount: node.fields.length, parentRole: role },
        'text'
      ),
      text: field,
      children: [],
      classPath: 'text',
    }));
  } else if (node.children && node.children.length > 0) {
    children = node.children.map((child, ci) => renderNode(child, spec, {
      childIndex: ci,
      siblingCount: node.children.length,
      parentRole: role,
    }));
  }

  return {
    id,
    tag,
    style,
    text: node.texture ? generateTexture(node, context) : (node.text || null),
    children,
    classPath: node.classPath,
  };
}

function generateTexture(node, context) {
  // Texture generation: contextual filler
  // In production this would use the lattice. For now, simple rules.
  if (context?.parentRole === 'hero') return 'Descubra o que nos torna diferentes.';
  if (context?.parentRole === 'card') return 'Uma abordagem centrada no que importa.';
  if (context?.parentRole === 'footer') return '© 2026 · Todos os direitos reservados.';
  if (context?.parentRole === 'section') return 'Saiba mais sobre o que fazemos.';
  return '';
}

// ── SCHEMA (inline for worker isolation) ──

const CLASSES = {
  button:{d:4,t:2,m:12,c:5,role:0,action:0},text:{d:1,t:2,m:9,c:3,role:0,action:0},
  link:{d:1,t:3,m:9,c:3,role:0,action:1},input:{d:3,t:2,m:9,c:5,role:0,action:0},
  image:{d:4,t:2,m:14,c:2,role:0,action:0},icon:{d:1,t:2,m:10,c:2,role:0,action:0},
  divider:{d:1,t:2,m:1,c:1,role:0,action:0},spacer:{d:1,t:1,m:1,c:1,role:0,action:0},
  pill:{d:3,t:2,m:7,c:4,role:0,action:0},alert:{d:4,t:4,m:12,c:6,role:0,action:0},
  nav:{d:4,t:2,m:14,c:5,role:2,action:0},hero:{d:1,t:3,m:14,c:8,role:1,action:0},
  card:{d:4,t:2,m:12,c:6,role:3,action:0},grid:{d:1,t:2,m:9,c:5,role:4,action:0},
  form:{d:3,t:2,m:12,c:6,role:5,action:0},section:{d:1,t:2,m:14,c:7,role:6,action:0},
  footer:{d:2,t:2,m:9,c:5,role:7,action:0},modal:{d:5,t:3,m:14,c:8,role:8,action:0},
  list:{d:1,t:2,m:9,c:4,role:9,action:0},sidebar:{d:4,t:2,m:14,c:5,role:10,action:0},
  'button.primary':{t:3,m:14,c:7},'button.secondary':{t:2,m:10,d:3},
  'button.ghost':{d:1,t:2,m:7,c:3},'button.cta':{t:4,m:14,c:8},
  'text.title':{m:17,c:5},'text.subtitle':{m:15,c:4},'text.sub':{m:11,t:2},
  'text.body':{m:10},'text.bold':{m:12},'text.muted':{m:9,t:1},
  'text.icon':{m:15},'text.brand':{m:15,t:3},'text.label':{m:8,t:2},
  'link.nav':{m:9,c:4},'link.footer':{m:7,t:1},
  'card.flat':{d:3,m:10},'card.glass':{d:3,t:2,c:5},'card.elevated':{d:5,m:14},
  'alert.success':{t:3},'alert.error':{t:5},'alert.warning':{t:4},
  '*.eco':{spectrum:'eco'},'*.void':{spectrum:'void'},'*.brass':{spectrum:'brass'},
};

const SPECTRUMS = {
  eco:{bg:'#F7F5F0',surface:'#ffffff',surfaceAlt:'#f0ece4',border:'rgba(94,62,44,0.12)',text:'#2D2D2D',textMuted:'#6b6560',textBright:'#5E3E2C',primary:'#009933',primaryText:'#ffffff',secondary:'#E6007E',accent:'#9BC53D',shadow:'rgba(94,62,44,0.08)',shadowDeep:'rgba(94,62,44,0.16)',glow:'rgba(0,153,51,0.15)'},
  void:{bg:'#0f0e0c',surface:'rgba(200,190,170,0.06)',surfaceAlt:'rgba(200,190,170,0.03)',border:'rgba(200,190,170,0.12)',text:'#a09888',textMuted:'#706860',textBright:'#d4c8b8',primary:'#c9a227',primaryText:'#0f0e0c',secondary:'#d4842a',accent:'#c9a227',shadow:'rgba(0,0,0,0.2)',shadowDeep:'rgba(0,0,0,0.4)',glow:'rgba(200,160,60,0.2)'},
  brass:{bg:'#1a1714',surface:'rgba(200,180,140,0.08)',surfaceAlt:'rgba(200,180,140,0.04)',border:'rgba(200,180,140,0.15)',text:'#b8a888',textMuted:'#887860',textBright:'#e8d8b8',primary:'#d4a828',primaryText:'#1a1714',secondary:'#c87830',accent:'#d4a828',shadow:'rgba(0,0,0,0.25)',shadowDeep:'rgba(0,0,0,0.45)',glow:'rgba(212,168,40,0.2)'},
};

const DENSITIES = {1:'void',2:'gas',3:'liquid',4:'solid',5:'dense'};
const TEMPS = {1:'void',2:'cold',3:'warm',4:'hot',5:'critical',6:'fusion'};
const MASSES = {1:-0.5,2:-0.3,3:-0.2,4:0,5:0.1,6:0.2,7:0.3,8:0.4,9:0.5,10:0.6,11:0.7,12:0.8,13:0.9,14:1.0,15:1.2,16:1.3,17:1.5,18:2.0};
const CHARGES = {1:0.1,2:0.2,3:0.3,4:0.4,5:0.5,6:0.6,7:0.7,8:0.8,9:0.9,10:1.0};
const ROLES = {0:null,1:'hero',2:'nav',3:'card',4:'grid',5:'form',6:'section',7:'footer',8:'modal',9:'list',10:'sidebar'};

function resolveClass(classPath) {
  const parts = classPath.toLowerCase().split('.');
  const resolved = {...(CLASSES[parts[0]] || CLASSES.text)};
  for (let i = 1; i < parts.length; i++) {
    const partial = parts.slice(0, i + 1).join('.');
    const wildcard = `*.${parts[i]}`;
    if (CLASSES[wildcard]) Object.assign(resolved, CLASSES[wildcard]);
    if (CLASSES[partial]) Object.assign(resolved, CLASSES[partial]);
  }
  return resolved;
}

// ── Φ (inline for worker isolation) ──

function computeStyle(resolved, spectrumName, context, baseType) {
  const d = DENSITIES[resolved.d] || 'liquid';
  const mass = MASSES[resolved.m] || 0.5;
  const charge = CHARGES[resolved.c] || 0.5;
  const role = ROLES[resolved.role] || null;
  const S = SPECTRUMS[spectrumName || resolved.spectrum || 'void'] || SPECTRUMS.void;
  const r = (base, inv) => Math.round(base * (inv ? PHI_INV : PHI));

  const css = { display:'flex', flexDirection:'column', boxSizing:'border-box', position:'relative', color:S.text };

  // Layer 1: Quantum
  const radMap = {void:0,gas:4,liquid:8,solid:10,dense:14};
  if (d==='void') css.background='transparent';
  else if (d==='gas') css.background=S.surfaceAlt;
  else if (d==='liquid') { css.background=S.surface; css.backdropFilter='blur(12px)'; }
  else if (d==='solid') { css.background=S.surface; css.border=`1px solid ${S.border}`; }
  else { css.background=S.bg; css.border=`1px solid ${S.border}`; }
  css.borderRadius=`${radMap[d]}px`;

  if (mass>0.5&&(d==='solid'||d==='dense')) { const sd=Math.floor(mass*12); css.boxShadow=`0 ${sd}px ${sd*3}px ${S.shadow}`; }
  const sp=Math.round(6+charge*22*PHI_INV); css.padding=`${sp}px`; css.gap=`${Math.round(sp*PHI_INV)}px`;

  // Layer 2: Electromagnetic
  if (role==='hero') Object.assign(css,{alignItems:'center',justifyContent:'center',textAlign:'center',width:'100%',minHeight:'50vh',padding:`${r(64)}px ${r(32)}px`,gap:`${r(16)}px`,background:S.surfaceAlt});
  if (role==='nav') Object.assign(css,{flexDirection:'row',alignItems:'center',justifyContent:'space-between',width:'100%',position:'sticky',top:0,zIndex:100,padding:`${r(14,1)}px ${r(28,1)}px`,borderBottom:`1px solid ${S.border}`,background:S.bg});
  if (role==='card') Object.assign(css,{borderRadius:`${r(10,1)}px`,overflow:'hidden',border:`1px solid ${S.border}`,background:S.surface,padding:`${r(20)}px`,gap:`${r(8)}px`});
  if (role==='grid') Object.assign(css,{display:'grid',gridTemplateColumns:`repeat(auto-fit,minmax(${r(220,1)}px,1fr))`,gap:`${r(16)}px`,width:'100%',padding:`0 ${r(28,1)}px`});
  if (role==='section') Object.assign(css,{width:'100%',alignItems:'center',padding:`${r(40)}px ${r(28,1)}px`,gap:`${r(14)}px`});
  if (role==='footer') Object.assign(css,{flexDirection:'row',alignItems:'center',justifyContent:'space-between',width:'100%',marginTop:'auto',padding:`${r(18)}px ${r(28,1)}px`,borderTop:`1px solid ${S.border}`});

  // Layer 3: Crystalline
  if (context) {
    const {childIndex:ci,siblingCount:sc,parentRole:pr} = context;
    if (pr==='hero'&&ci===0) Object.assign(css,{fontSize:`${(2.2*PHI_INV+1.2).toFixed(2)}rem`,fontWeight:700,color:S.textBright,letterSpacing:'-0.02em',lineHeight:1.15,maxWidth:'680px'});
    if (pr==='hero'&&ci===1&&sc>2) Object.assign(css,{fontSize:'1.1rem',color:S.textMuted,maxWidth:'520px',lineHeight:1.6});
    if (pr==='nav') { css.flexDirection='row'; if(ci===0) Object.assign(css,{fontWeight:700,fontSize:'1.05rem',color:S.textBright,letterSpacing:'0.06em',textTransform:'uppercase'}); if(ci>0) Object.assign(css,{fontSize:'0.9rem',cursor:'pointer',color:S.textMuted}); }
    if (pr==='card') { if(ci===0&&sc>=3) Object.assign(css,{fontSize:'1.8rem',lineHeight:1,color:S.primary}); if(ci===1&&sc>=3) Object.assign(css,{fontWeight:600,fontSize:'1.05rem',color:S.textBright}); if(ci===sc-1&&sc>=3) Object.assign(css,{fontSize:'0.9rem',color:S.textMuted,lineHeight:1.55}); }
    if (pr==='footer') { css.fontSize='0.85rem'; css.color=S.textMuted; if(ci===sc-1){css.cursor='pointer';css.color=S.primary;} }
  }

  // Button overrides
  if (baseType==='button') {
    Object.assign(css,{display:'inline-flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontWeight:600,fontSize:'0.95rem',border:'none',borderRadius:`${r(6)}px`,padding:`${r(12,1)}px ${r(28,1)}px`,transition:'all 0.25s ease'});
    const t=TEMPS[resolved.t]||'cold';
    if (t==='warm'||t==='hot') Object.assign(css,{background:S.primary,color:S.primaryText,boxShadow:`0 4px 16px ${S.glow}`});
    else if (d==='void') Object.assign(css,{background:'transparent',color:S.textMuted,border:`1px solid ${S.border}`});
    else Object.assign(css,{background:S.surfaceAlt,color:S.textBright,border:`1px solid ${S.border}`});
  }

  if (baseType==='link') Object.assign(css,{textDecoration:'none',cursor:'pointer',color:S.textMuted,transition:'color 0.2s ease'});

  return css;
}

// Signal ready
self.postMessage({ type: 'ready', stats: { version: '1.0.0', classes: Object.keys(CLASSES).length } });
