const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { parseDecksFile } = require('./parseDecks');

/**
 * Parses markdown question content into an array of { text, category } objects.
 * Format:
 * # Category: <Category Name>
 * - <Question text> or 1. <Question text>
 */
function parseQuestionsMarkdown(content) {
  const lines = content.split(/\r?\n/);
  const questions = [];
  let currentCategory = 'General';

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const categoryMatch = line.match(/^#+\s*Category:\s*(.+)$/i) || line.match(/^#+\s*(.+)$/i);
    if (categoryMatch && !line.startsWith('-') && !/^\d+\./.test(line)) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    const questionMatch = line.match(/^[-*]\s*(.+)$/) || line.match(/^\d+\.\s*(.+)$/);
    if (questionMatch) {
      const text = questionMatch[1].trim();
      if (text.length > 0) {
        questions.push({
          text,
          category: currentCategory,
        });
      }
    }
  }

  return questions;
}

/**
 * Loads all markdown files from a directory and parses questions
 */
function loadAllQuestionsFromDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    return [];
  }

  const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.md'));
  const allQuestions = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = parseQuestionsMarkdown(content);
    allQuestions.push(...parsed);
  }

  return allQuestions;
}

/**
 * Fisher-Yates shuffle implementation
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Loads all questions and deck metadata from candle_cards_complete_questions_deck.md
 */
function loadAllQuestionsFromSource() {
  const markdownSourcePath = path.join(__dirname, '../candle_cards_complete_questions_deck.md');
  if (!fs.existsSync(markdownSourcePath)) {
    console.error(`Markdown deck source not found: ${markdownSourcePath}`);
    return [];
  }

  const decks = parseDecksFile(markdownSourcePath).filter(d => d.questions.length > 0);
  const allQuestions = [];

  for (const deck of decks) {
    for (const qText of deck.questions) {
      allQuestions.push({
        text: qText,
        category: deck.category,
        deck: deck.deckTitle,
        subtitle: deck.subtitle || '',
      });
    }
  }

  return allQuestions;
}

/**
 * Main seeding logic using Firebase Admin SDK
 */
async function seedQuestions(db) {
  const parsedQuestions = loadAllQuestionsFromSource();

  if (parsedQuestions.length === 0) {
    console.log('No questions found to seed.');
    return;
  }

  console.log(`Total parsed questions from deck: ${parsedQuestions.length}`);

  // Fetch existing questions to maintain idempotency
  const questionsRef = db.collection('questions');
  const snapshot = await questionsRef.get();
  const existingQuestions = new Map();
  let maxOrder = -1;

  snapshot.forEach(doc => {
    const data = doc.data();
    existingQuestions.set(data.text, { id: doc.id, order: data.order });
    if (typeof data.order === 'number' && data.order > maxOrder) {
      maxOrder = data.order;
    }
  });

  console.log(`Found ${existingQuestions.size} existing questions in Firestore (max order: ${maxOrder}).`);

  // Filter only new questions
  const newQuestions = parsedQuestions.filter(q => !existingQuestions.has(q.text));

  if (newQuestions.length === 0) {
    console.log('All questions are already seeded. Database is up to date!');
    return;
  }

  console.log(`Seeding ${newQuestions.length} new questions...`);
  const shuffledNew = shuffleArray(newQuestions);

  const batchSize = 400;
  let batch = db.batch();
  let countInBatch = 0;

  for (let i = 0; i < shuffledNew.length; i++) {
    const q = shuffledNew[i];
    const newDocRef = questionsRef.doc();
    const assignedOrder = maxOrder + 1 + i;

    batch.set(newDocRef, {
      text: q.text,
      category: q.category,
      deck: q.deck,
      subtitle: q.subtitle,
      order: assignedOrder,
      createdAt: new Date(),
    });

    countInBatch++;
    if (countInBatch >= batchSize) {
      console.log(`Committing batch of ${countInBatch} questions...`);
      await batch.commit();
      batch = db.batch();
      countInBatch = 0;
    }
  }

  if (countInBatch > 0) {
    console.log(`Committing final batch of ${countInBatch} questions...`);
    await batch.commit();
  }

  console.log(`🎉 Successfully seeded ${newQuestions.length} questions into Firestore! Total questions: ${existingQuestions.size + newQuestions.length}`);
}

// Export for tests & CLI runner
module.exports = {
  parseQuestionsMarkdown,
  loadAllQuestionsFromDir,
  shuffleArray,
  loadAllQuestionsFromSource,
  seedQuestions,
};

if (require.main === module) {
  const admin = require('firebase-admin');
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '../serviceAccountKey.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Firebase Service Account Key not found at ${serviceAccountPath}.`);
    console.error('Please place your serviceAccountKey.json in the project root or set FIREBASE_SERVICE_ACCOUNT_PATH.');
    process.exit(1);
  }

  const serviceAccount = require(path.resolve(serviceAccountPath));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();
  seedQuestions(db)
    .then(() => {
      console.log('Seeding completed!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error seeding questions:', err);
      process.exit(1);
    });
}
