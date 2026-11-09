import { GLOSSARY, GLOSSARY_LIST } from '../data/knowledge/glossary.js';

// The keyword router: it runs BEFORE TF-IDF. If a question contains a cyber-security term (or a
// synonym such as "ransom" or "locked files"), the chunk of that term is ALWAYS used first:
//   - with Ollama: it is the first chunk sent to the model
//   - offline: Mithu answers directly from it
// Because it is a plain keyword test, it never "forgets" a term the way a similarity search can.
const compiled = GLOSSARY.map((term) => ({ term, regex: new RegExp(term.words.map((w) => `(?:${w})`).join('|'), 'i') }));

// "Which cyber security terms are used in this game?"
const LIST_QUESTION = /(which|what|list|all|every|show|name).{0,45}(terms|words|vocabulary|glossary|jargon)\b/i;

export function isListQuestion(question) {
  return LIST_QUESTION.test(question);
}

// The terms in the question. The one with the LONGEST matching words comes first ("guess passwords"
// is more specific than "passwords"); a tie goes to the order of the glossary.
export function findTerms(question) {
  const found = [];
  compiled.forEach((c, index) => {
    const m = c.regex.exec(question);
    if (m) found.push({ term: c.term, length: m[0].length, index });
  });
  return found.sort((a, b) => b.length - a.length || a.index - b.index).map((f) => f.term);
}

// the text of a term as a knowledge chunk (for the system prompt)
export function termChunk(term) {
  return { item: { id: `term-${term.id}`, title: `Glossary: ${term.name}`, text: term.text }, score: 9 };
}

export function listChunk() {
  return { item: GLOSSARY_LIST, score: 9 };
}

// the offline answer for a term question: the full chunk, and for a second term its one-line meaning
export function answerForTerms(terms) {
  const [first, second] = terms;
  return second ? `${first.text}\n\nAlso: ${second.line}` : first.text;
}
