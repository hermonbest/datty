const fs = require('fs');
const path = require('path');
const { parseDecksFile } = require('./parseDecks');

const markdownSourcePath = path.join(__dirname, '../candle_cards_complete_questions_deck.md');
const outputDir = path.join(__dirname, '../content/questions');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Remove old mock files if any
const existingFiles = fs.readdirSync(outputDir);
for (const file of existingFiles) {
  fs.unlinkSync(path.join(outputDir, file));
}

const decks = parseDecksFile(markdownSourcePath).filter(d => d.questions.length > 0);

// Group by category
const categoriesMap = new Map();

for (const deck of decks) {
  if (!categoriesMap.has(deck.category)) {
    categoriesMap.set(deck.category, []);
  }
  categoriesMap.get(deck.category).push(deck);
}

for (const [categoryName, categoryDecks] of categoriesMap.entries()) {
  const fileName = categoryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') + '.md';

  const filePath = path.join(outputDir, fileName);

  let fileContent = `# Category: ${categoryName}\n\n`;

  for (const deck of categoryDecks) {
    fileContent += `## Deck: ${deck.deckTitle}\n`;
    if (deck.subtitle) {
      fileContent += `> Subtitle: "${deck.subtitle}"\n\n`;
    } else {
      fileContent += `\n`;
    }

    for (let i = 0; i < deck.questions.length; i++) {
      fileContent += `${i + 1}. ${deck.questions[i]}\n`;
    }
    fileContent += `\n---\n\n`;
  }

  fs.writeFileSync(filePath, fileContent.trim() + '\n', 'utf8');
  console.log(`Generated ${fileName} with ${categoryDecks.length} deck(s) (${categoryDecks.reduce((acc, d) => acc + d.questions.length, 0)} questions)`);
}

console.log(`Successfully generated all category markdown files in ${outputDir}`);
