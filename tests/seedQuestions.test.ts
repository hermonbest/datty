const { parseQuestionsMarkdown, shuffleArray } = require('../scripts/seedQuestions');

describe('seedQuestions script functions', () => {
  it('parses markdown question headers and list items correctly', () => {
    const sampleMd = `
# Category: Deep Talks
- What is something you have been hesitant to tell me?
- What does feeling loved look like for you?

# Category: Fun & Random
- What is a meal that reminds you of us?
- Where would we teleport tonight?
    `;

    const parsed = parseQuestionsMarkdown(sampleMd);
    expect(parsed).toHaveLength(4);
    expect(parsed[0]).toEqual({
      category: 'Deep Talks',
      text: 'What is something you have been hesitant to tell me?',
    });
    expect(parsed[1]).toEqual({
      category: 'Deep Talks',
      text: 'What does feeling loved look like for you?',
    });
    expect(parsed[2]).toEqual({
      category: 'Fun & Random',
      text: 'What is a meal that reminds you of us?',
    });
    expect(parsed[3]).toEqual({
      category: 'Fun & Random',
      text: 'Where would we teleport tonight?',
    });
  });

  it('handles markdown without explicit category prefixes', () => {
    const sampleMd = `
# Intimacy
- What was your first impression of me?
    `;
    const parsed = parseQuestionsMarkdown(sampleMd);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].category).toBe('Intimacy');
    expect(parsed[0].text).toBe('What was your first impression of me?');
  });

  it('shuffles array without modifying original or losing items', () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffleArray(original);

    expect(shuffled).toHaveLength(original.length);
    expect(shuffled.sort((a: number, b: number) => a - b)).toEqual(original);
  });
});
