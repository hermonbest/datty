const fs = require('fs');
const path = require('path');

function parseDecksFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sections = content.split(/\n##\s+/);
  const decks = [];

  // Skip table of contents and top intro
  for (let i = 1; i < sections.length; i++) {
    const sec = sections[i];
    const lines = sec.split(/\r?\n/);
    const deckTitle = lines[0].trim();

    let category = '';
    let subtitle = '';
    const questions = [];

    for (let j = 1; j < lines.length; j++) {
      const line = lines[j].trim();
      if (!line) continue;

      const catMatch = line.match(/\*\*App Category:\*\*\s*\*?(.*?)\*?\s*$/i);
      if (catMatch && !category) {
        category = catMatch[1].replace(/^\*+|\*+$/g, '').trim();
        continue;
      }

      const subMatch = line.match(/\*\*Card Subtitle:\*\*\s*\*?\"?(.*?)\"?\*?\s*$/i);
      if (subMatch && !subtitle) {
        subtitle = subMatch[1].replace(/^[\*"]+|[\*"]+$/g, '').trim();
        continue;
      }

      const qMatch = line.match(/^\d+\.\s*(.+)$/);
      if (qMatch) {
        questions.push(qMatch[1].trim());
      }
    }

    if (questions.length > 0 && deckTitle.toLowerCase() !== 'table of contents') {
      decks.push({
        deckTitle,
        category: category || 'General',
        subtitle: subtitle || '',
        questionCount: questions.length,
        questions,
      });
    }
  }

  return decks;
}

if (require.main === module) {
  const filePath = path.join(__dirname, '../candle_cards_complete_questions_deck.md');
  const decks = parseDecksFile(filePath);
  console.log(`Successfully parsed ${decks.length} decks.`);
  let totalQuestions = 0;
  const categories = new Map();

  decks.forEach(d => {
    totalQuestions += d.questionCount;
    if (!categories.has(d.category)) {
      categories.set(d.category, []);
    }
    categories.get(d.category).push(d.deckTitle);
  });

  console.log(`Total questions: ${totalQuestions}`);
  console.log(`\nCategories Breakdown (${categories.size} categories):`);
  for (const [cat, deckList] of categories.entries()) {
    console.log(`- ${cat} (${deckList.length} decks): ${deckList.join(', ')}`);
  }
}

module.exports = { parseDecksFile };
