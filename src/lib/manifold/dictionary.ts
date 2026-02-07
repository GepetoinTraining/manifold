/**
 * MANIFOLD DICTIONARY
 * Client-side word table for binary encoding/decoding.
 * Extracted from mvp/db/seed.js — ships inline with the app.
 *
 * Two maps:
 *   wordToIndex: "escola" → 104
 *   indexToWord: 104 → "escola"
 *
 * Plus class path indexing for binary class IDs.
 */

// ── WORD TABLE (pt-BR, frequency-ordered) ──
// Index 0 reserved for unknown-word escape

const WORDS_PT: string[] = [
  "", // 0 = reserved
  "de", "a", "o", "que", "e", "do", "da", "em", "um", "para",        // 1-10
  "é", "com", "não", "uma", "os", "no", "se", "na", "por", "mais",   // 11-20
  "as", "dos", "como", "mas", "foi", "ao", "ele", "das", "tem", "seu",// 21-30
  "sua", "ou", "ser", "quando", "muito", "há", "nos", "já", "está",   // 31-39
  "eu", "também", "só", "pelo", "pela", "até", "isso", "ela", "entre",// 40-48
  "era", "depois", "sem", "mesmo", "aos", "ter", "seus", "quem",      // 49-56
  "nas", "me", "esse", "eles", "estão", "você", "tinha", "foram",     // 57-64
  "essa", "num", "nem", "suas", "meu", "às", "minha", "têm", "numa", // 65-73
  "pelos", "elas", "havia", "seja", "qual", "será", "nós", "tenho",   // 74-81
  "lhe", "deles", "essas", "esses", "pelas", "este",                  // 82-87
  // Common UI/business words
  "nome", "ver", "sobre", "todos", "bem", "dia", "novo", "nova",      // 88-95
  "aqui", "onde", "casa", "vida", "tempo", "anos", "mundo", "fazer",  // 96-103
  "pode", "parte", "grande", "ainda", "cada", "outro", "outra",       // 104-110
  "então", "forma", "dois", "trabalho", "primeiro", "lugar", "conta", // 111-117
  "entrar", "reservar", "cardápio", "preço", "menu", "horário",       // 118-123
  "endereço", "telefone", "contato", "início", "serviço", "produto",  // 124-129
  "escola", "método", "aluno", "professor", "aula", "curso",          // 130-135
  "matrícula", "turma", "nota", "saiba", "conheça", "agende",         // 136-141
  "visita", "funciona", "nosso", "nossa", "direitos", "reservados",   // 142-147
  // Additional common UI text
  "futuro", "começa", "aqui", "nada", "perde", "história", "tudo",    // 148-154
  "transforma", "individualidade", "adaptação", "comprometimento",     // 155-157
  "inovação", "transformação", "pronto", "importante", "venha",        // 158-162
  "conhecer", "metodologia", "trilhas", "personalizadas", "currículos",// 163-167
  "engessados", "caixas", "querer", "aprender", "consequência",        // 168-172
  "obrigação", "educação", "século", "retrasado", "cria", "destrói",  // 173-178
  "pizza", "artesanal", "italiana", "margherita", "molho",             // 179-183
  "mozzarella", "bufala", "salame", "picante", "pimentões",           // 184-188
  "cogumelos", "selvagens", "trufa", "parmesão", "gorgonzola",        // 189-193
  "fontina", "formaggi", "quattro",                                    // 194-196
  // English common words
  "the", "is", "a", "to", "and", "of", "in", "that", "it", "for",    // 197-206
  "you", "with", "on", "are", "this", "not", "but", "from", "or",     // 207-215
  "your", "an", "will", "my", "all", "would", "there", "their",       // 216-223
  "what", "so", "if", "about", "get", "which", "go", "when",          // 224-231
  "can", "like", "just", "how", "has", "more", "its", "who",          // 232-239
  "build", "scan", "decode", "encode", "topology", "experience",       // 240-245
  "physics", "density", "temperature", "mass", "charge", "spectrum",   // 246-251
  "background", "border", "opacity", "color", "accent", "shadow",      // 252-257
  "depth", "weight", "padding", "gap", "spacing", "layout",           // 258-263
  "docs", "spec", "enter", "how", "works",                            // 264-268
];

// ── BUILD LOOKUP MAPS ──

const _wordToIndex = new Map<string, number>();
const _indexToWord = new Map<number, string>();

for (let i = 0; i < WORDS_PT.length; i++) {
  const w = WORDS_PT[i].toLowerCase();
  if (w && !_wordToIndex.has(w)) {
    _wordToIndex.set(w, i);
  }
  _indexToWord.set(i, WORDS_PT[i]);
}

// ── CLASS PATH INDEX ──
// Maps class paths to compact 1-byte IDs for binary encoding

const CLASS_PATHS: string[] = [
  // Base elements (0-12)
  "button", "text", "link", "input", "image", "icon", "divider",
  "spacer", "pill", "checkbox", "select", "progress", "alert",
  // Role composites (13-22)
  "nav", "hero", "card", "grid", "form", "section", "footer",
  "modal", "list", "sidebar",
  // Button variants (23-27)
  "button.primary", "button.secondary", "button.ghost", "button.cta", "button.danger",
  // Text variants (28-38)
  "text.title", "text.subtitle", "text.sub", "text.body", "text.bold",
  "text.muted", "text.icon", "text.small", "text.brand", "text.label", "text.mono",
  // Link variants (39-41)
  "link.nav", "link.footer", "link.inline",
  // Card variants (42-44)
  "card.flat", "card.glass", "card.elevated",
  // Input variants (45-47)
  "input.large", "input.small", "input.search",
  // Alert variants (48-51)
  "alert.success", "alert.error", "alert.warning", "alert.info",
  // Spectrum-qualified base classes (52+)
  "nav.eco", "hero.eco", "card.eco", "grid.eco", "section.eco", "footer.eco",
  "button.primary.eco", "button.ghost.eco", "button.cta.eco",
  "text.brand.eco", "text.subtitle.eco", "text.sub.eco",
  "link.footer.eco",
  "nav.void", "hero.void", "card.void", "grid.void", "section.void", "footer.void",
  "button.primary.void", "button.ghost.void",
  "text.subtitle.void",
  "link.footer.void",
  "nav.brass", "hero.brass", "card.brass", "grid.brass", "section.brass", "footer.brass",
  "button.primary.brass", "button.ghost.brass", "button.cta.brass",
  "text.subtitle.brass", "text.sub.brass",
  "link.footer.brass",
];

const _classToIndex = new Map<string, number>();
const _indexToClass = new Map<number, string>();

for (let i = 0; i < CLASS_PATHS.length; i++) {
  const cp = CLASS_PATHS[i].toLowerCase();
  _classToIndex.set(cp, i);
  _indexToClass.set(i, CLASS_PATHS[i]);
}

// ── PUBLIC API ──

export interface Dictionary {
  schemaId: number;
  wordIndex(word: string): number | null;
  wordAt(index: number): string | null;
  classIndex(classPath: string): number | null;
  classAt(index: number): string | null;
  addClass(classPath: string): number;
  addWord(word: string): number;
}

export function createDictionary(): Dictionary {
  // Clone maps so runtime additions don't pollute the base
  const wordToIdx = new Map(_wordToIndex);
  const idxToWord = new Map(_indexToWord);
  const classToIdx = new Map(_classToIndex);
  const idxToClass = new Map(_indexToClass);
  let nextWordId = WORDS_PT.length;
  let nextClassId = CLASS_PATHS.length;

  return {
    schemaId: 0,

    wordIndex(word: string): number | null {
      const idx = wordToIdx.get(word.toLowerCase());
      return idx !== undefined ? idx : null;
    },

    wordAt(index: number): string | null {
      return idxToWord.get(index) ?? null;
    },

    classIndex(classPath: string): number | null {
      const idx = classToIdx.get(classPath.toLowerCase());
      return idx !== undefined ? idx : null;
    },

    classAt(index: number): string | null {
      return idxToClass.get(index) ?? null;
    },

    // Runtime addition: unknown class paths get assigned the next ID
    addClass(classPath: string): number {
      const cp = classPath.toLowerCase();
      const existing = classToIdx.get(cp);
      if (existing !== undefined) return existing;
      const id = nextClassId++;
      classToIdx.set(cp, id);
      idxToClass.set(id, classPath);
      return id;
    },

    // Runtime addition: unknown words get assigned the next ID
    addWord(word: string): number {
      const w = word.toLowerCase();
      const existing = wordToIdx.get(w);
      if (existing !== undefined) return existing;
      const id = nextWordId++;
      wordToIdx.set(w, id);
      idxToWord.set(id, word);
      return id;
    },
  };
}

export const WORD_COUNT = WORDS_PT.length;
export const CLASS_COUNT = CLASS_PATHS.length;
