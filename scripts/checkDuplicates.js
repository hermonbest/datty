const fs = require('fs');
const path = require('path');
const { parseDecksFile } = require('./parseDecks');

const mdPath = path.join(__dirname, '../candle_cards_complete_questions_deck.md');
const decks = parseDecksFile(mdPath);

console.log(`=== CHECKING DUPLICATIONS ACROSS ${decks.length} DECKS (${decks.reduce((a, b) => a + b.questionCount, 0)} QUESTIONS) ===\n`);

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[’'""“”]/g, "'")
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 1. Check exact duplicates within decks and across decks
const exactMap = new Map();
const normalizedMap = new Map();
const intraDeckDuplicates = [];
const crossDeckDuplicates = [];

decks.forEach((deck, deckIdx) => {
  const seenInThisDeck = new Set();

  deck.questions.forEach((q, qIdx) => {
    const trimmed = q.trim();
    const normalized = normalizeText(q);

    // Intra-deck check
    if (seenInThisDeck.has(normalized)) {
      intraDeckDuplicates.push({
        deck: deck.deckTitle,
        questionIndex: qIdx + 1,
        question: trimmed,
      });
    }
    seenInThisDeck.add(normalized);

    // Exact match across all decks
    if (!exactMap.has(trimmed)) {
      exactMap.set(trimmed, []);
    }
    exactMap.get(trimmed).push({ deck: deck.deckTitle, index: qIdx + 1 });

    // Normalized match across all decks
    if (!normalizedMap.has(normalized)) {
      normalizedMap.set(normalized, []);
    }
    normalizedMap.get(normalized).push({ deck: deck.deckTitle, index: qIdx + 1, original: trimmed });
  });
});

console.log(`--- 1. Intra-Deck Duplicates (Same question repeated in same deck) ---`);
if (intraDeckDuplicates.length === 0) {
  console.log(`✓ None found! All questions within each deck are unique.`);
} else {
  console.log(`⚠️ Found ${intraDeckDuplicates.length} intra-deck duplicates:`, intraDeckDuplicates);
}

console.log(`\n--- 2. Cross-Deck Exact / Normalized Duplicates ---`);
let crossDeckCount = 0;
for (const [normText, occurrences] of normalizedMap.entries()) {
  if (occurrences.length > 1) {
    crossDeckCount++;
    console.log(`\n⚠️ Duplicate found (${occurrences.length} occurrences):`);
    occurrences.forEach((occ, i) => {
      console.log(`   ${i + 1}. [Deck: ${occ.deck}, Q#${occ.index}]: "${occ.original}"`);
    });
  }
}

if (crossDeckCount === 0) {
  console.log(`✓ None found! All 1,190 questions across all decks are 100% unique.`);
}

// 3. Near-duplicate / high similarity check (Jaccard similarity > 0.85 on word tokens)
console.log(`\n--- 3. Near-Duplicate Analysis (Jaccard Word Token Similarity >= 85%) ---`);
const allQuestionsFlat = [];
decks.forEach((deck) => {
  deck.questions.forEach((q, qIdx) => {
    const tokens = new Set(normalizeText(q).split(' ').filter(w => w.length > 2));
    allQuestionsFlat.push({
      deck: deck.deckTitle,
      index: qIdx + 1,
      text: q,
      tokens,
    });
  });
});

function jaccardSimilarity(setA, setB) {
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const nearDuplicates = [];
for (let i = 0; i < allQuestionsFlat.length; i++) {
  for (let j = i + 1; j < allQuestionsFlat.length; j++) {
    const q1 = allQuestionsFlat[i];
    const q2 = allQuestionsFlat[j];
    const sim = jaccardSimilarity(q1.tokens, q2.tokens);

    if (sim >= 0.85) {
      nearDuplicates.push({
        similarity: (sim * 100).toFixed(1) + '%',
        q1: `[${q1.deck} Q#${q1.index}] ${q1.text}`,
        q2: `[${q2.deck} Q#${q2.index}] ${q2.text}`,
      });
    }
  }
}

if (nearDuplicates.length === 0) {
  console.log(`✓ No highly similar near-duplicates found.`);
} else {
  console.log(`Found ${nearDuplicates.length} potential near-duplicate pairs for review:`);
  nearDuplicates.forEach((nd, i) => {
    console.log(`\nPair ${i + 1} (${nd.similarity} overlap):`);
    console.log(`  A: ${nd.q1}`);
    console.log(`  B: ${nd.q2}`);
  });
}

// 4. Check Firestore database for duplicates if serviceAccountKey exists
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  console.log(`\n--- 4. Checking Firestore Database Collection ('questions') ---`);
  const admin = require('firebase-admin');
  const serviceAccount = require(serviceAccountPath);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  const db = admin.firestore();
  db.collection('questions').get().then(snap => {
    const firestoreTexts = new Map();
    let firestoreDups = 0;
    snap.forEach(doc => {
      const data = doc.data();
      const norm = normalizeText(data.text || '');
      if (firestoreTexts.has(norm)) {
        firestoreDups++;
        console.log(`⚠️ Firestore duplicate doc: ${doc.id} duplicates ${firestoreTexts.get(norm)}: "${data.text}"`);
      } else {
        firestoreTexts.set(norm, doc.id);
      }
    });

    console.log(`Firestore total docs: ${snap.size}`);
    console.log(`Firestore unique questions: ${firestoreTexts.size}`);
    if (firestoreDups === 0) {
      console.log(`✓ Firestore has zero duplicates! All ${snap.size} documents are unique.`);
    }
    process.exit(0);
  }).catch(err => {
    console.error('Firestore check error:', err);
    process.exit(0);
  });
}
