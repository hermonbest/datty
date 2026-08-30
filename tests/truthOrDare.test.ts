import { getRandomPrompt, TRUTH_OR_DARE_DATA } from '../src/features/games/truthOrDare/truthOrDareData';

describe('Truth or Dare Game Engine', () => {
  it('contains valid categories with non-empty prompts', () => {
    expect(TRUTH_OR_DARE_DATA.romantic.truths.length).toBeGreaterThan(5);
    expect(TRUTH_OR_DARE_DATA.romantic.dares.length).toBeGreaterThan(5);
    expect(TRUTH_OR_DARE_DATA.spicy.truths.length).toBeGreaterThan(5);
    expect(TRUTH_OR_DARE_DATA.spicy.dares.length).toBeGreaterThan(5);
    expect(TRUTH_OR_DARE_DATA.deep.truths.length).toBeGreaterThan(5);
    expect(TRUTH_OR_DARE_DATA.fun.truths.length).toBeGreaterThan(5);
  });

  it('returns a random truth or dare prompt from specified category', () => {
    const prompt = getRandomPrompt('romantic', 'truth');
    expect(prompt).toBeDefined();
    expect(typeof prompt.text).toBe('string');
    expect(prompt.category).toBe('romantic');
    expect(prompt.type).toBe('truth');
  });

  it('avoids returning duplicate prompt immediately when excludeIds are provided', () => {
    const firstPrompt = getRandomPrompt('deep', 'truth');
    const secondPrompt = getRandomPrompt('deep', 'truth', [firstPrompt.id]);
    expect(secondPrompt.id).not.toBe(firstPrompt.id);
  });
});
