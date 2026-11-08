// Finds the pieces of text that fit a question best (the "R" of RAG: Retrieval).
//
//   TF-IDF  : a word that appears in only a few chunks is important (high IDF),
//             a word that appears in many chunks (like "game") is less important.
//   Cosine  : the question and every chunk become a list of numbers (a vector).
//             The chunk whose list points in the most similar direction wins.
//   Synonyms: "js" means javascript, "lvl" means level, "bot" means chatbot ...
//
// The same code finds FAQ pairs (faqBot.js) and knowledge chunks (knowledgeSearch.js).

const STOP = new Set(
  'a an the is are was were be do does did i you me my we our your it its this that these those of to in on at for with and or but how what who why where when which can could would should will shall about tell explain please mean means into from as by if so than then there here have has had not no yes any some more most very just also like'.split(' '),
);

// a word on the left also adds the words on the right to the question
const SYNONYMS = {
  js: ['javascript'],
  zxcvbn: ['password', 'checker', 'strength'],
  zxc: ['zxcvbn', 'password', 'checker'],
  lvl: ['level'],
  bot: ['chatbot', 'mithu'],
  chatbot: ['mithu', 'ollama'],
  chat: ['chatbot', 'mithu'],
  tfidf: ['tf', 'idf'],
  llm: ['language', 'model'],
  qwen: ['model', 'ollama'],
  ml: ['machine', 'learning'],
  hacker: ['jadugar', 'hackerbrain'],
  villain: ['jadugar'],
  wizard: ['jadugar'],
  gpu: ['webgl'],
  engine: ['phaser'],
  parrot: ['mithu', 'tota'],
  tota: ['parrot', 'mithu'],
  fort: ['ranikot'],
  kid: ['child'],
  kids: ['child'],
  children: ['child'],
  boss: ['jadugar', 'miri'],
  fight: ['boss'],
  scam: ['phishing', 'problem'],
  scams: ['phishing', 'problem'],
  github: ['git'],
  claude: ['code', 'assistant'],
  gemini: ['art', 'pictures'],
  art: ['gemini', 'pictures'],
  pics: ['pictures'],
  lang: ['language'],
  urdu: ['language', 'i18n'],
  save: ['localstorage'],
  storage: ['localstorage'],
  weak: ['weakness'],
  formula: ['weakness'],
  explore: ['exploit'],
  exploit: ['explore'],
  win: ['ending', 'ko'],
  lose: ['retry'],
};

function stem(w) {
  return w.length > 4 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;
}

// lower case words, small words removed, plural "s" removed, synonyms added
export function tokenize(text) {
  const base = text
    .toLowerCase()
    .replace(/tf-idf/g, 'tfidf')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w && !STOP.has(w));
  const out = [];
  base.forEach((w) => {
    out.push(stem(w));
    (SYNONYMS[w] || []).forEach((extra) => out.push(stem(extra)));
  });
  return out;
}

function countWords(words) {
  const counts = new Map();
  words.forEach((w) => counts.set(w, (counts.get(w) || 0) + 1));
  return counts;
}

function cosine(a, b) {
  let dot = 0;
  a.vec.forEach((v, w) => {
    const other = b.vec.get(w);
    if (other) dot += v * other;
  });
  return dot / (a.norm * b.norm);
}

// entries: [{ item, words: [tokens] }]. Returns an index with search(question, k).
export function buildIndex(entries) {
  const docs = entries.map((e) => ({ item: e.item, tf: countWords(e.words) }));
  const docFrequency = new Map();
  docs.forEach((d) => d.tf.forEach((_, w) => docFrequency.set(w, (docFrequency.get(w) || 0) + 1)));
  const idf = (w) => Math.log((docs.length + 1) / ((docFrequency.get(w) || 0) + 1)) + 1;

  const vectorize = (tf) => {
    const vec = new Map();
    let norm = 0;
    tf.forEach((count, w) => {
      const v = (1 + Math.log(count)) * idf(w);
      vec.set(w, v);
      norm += v * v;
    });
    return { vec, norm: Math.sqrt(norm) || 1 };
  };
  docs.forEach((d) => Object.assign(d, vectorize(d.tf)));

  return {
    // the k best items for a question: [{ item, score }] (best first)
    search(question, k = 3) {
      const query = vectorize(countWords(tokenize(question)));
      if (!query.vec.size) return [];
      return docs
        .map((d) => ({ item: d.item, score: cosine(query, d) }))
        .filter((r) => r.score > 0)
        .sort((x, y) => y.score - x.score)
        .slice(0, k);
    },
  };
}
