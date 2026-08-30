import { TruthOrDareCategory, PromptType, TruthOrDareItem } from '../../../types/games';

export const TRUTH_OR_DARE_DATA: Record<
  TruthOrDareCategory,
  { name: string; icon: string; description: string; truths: TruthOrDareItem[]; dares: TruthOrDareItem[] }
> = {
  romantic: {
    name: 'Romantic & Sweet',
    icon: 'Heart',
    description: 'Heartwarming truths and tender romantic gestures.',
    truths: [
      { id: 'rt1', category: 'romantic', type: 'truth', text: 'What was the exact moment you knew you had feelings for me?', intensity: 1 },
      { id: 'rt2', category: 'romantic', type: 'truth', text: 'What is your favorite memory of us together so far?', intensity: 1 },
      { id: 'rt3', category: 'romantic', type: 'truth', text: 'What small everyday thing do I do that makes your heart melt?', intensity: 1 },
      { id: 'rt4', category: 'romantic', type: 'truth', text: 'If we could relive any single day in our relationship, which one would it be?', intensity: 2 },
      { id: 'rt5', category: 'romantic', type: 'truth', text: 'What is your favorite physical feature of mine?', intensity: 1 },
      { id: 'rt6', category: 'romantic', type: 'truth', text: 'What is something you secretly love about how we cuddle?', intensity: 1 },
      { id: 'rt7', category: 'romantic', type: 'truth', text: 'What is a love note or message I sent you that you will never forget?', intensity: 1 },
      { id: 'rt8', category: 'romantic', type: 'truth', text: 'What are three qualities in me that make you feel truly loved and cherished?', intensity: 1 },
    ],
    dares: [
      { id: 'rd1', category: 'romantic', type: 'dare', text: 'Look into my eyes for 60 seconds without speaking or laughing.', intensity: 1 },
      { id: 'rd2', category: 'romantic', type: 'dare', text: 'Give me a slow, gentle 2-minute shoulder and neck massage.', intensity: 1 },
      { id: 'rd3', category: 'romantic', type: 'dare', text: 'Whisper three genuine compliments in my ear with your sweetest voice.', intensity: 1 },
      { id: 'rd4', category: 'romantic', type: 'dare', text: 'Play our song (or a romantic slow song) and dance with me right now.', intensity: 2 },
      { id: 'rd5', category: 'romantic', type: 'dare', text: 'Kiss me on 5 different places on my face.', intensity: 1 },
      { id: 'rd6', category: 'romantic', type: 'dare', text: 'Hold my hands and make a cute, sincere promise to me for this week.', intensity: 1 },
      { id: 'rd7', category: 'romantic', type: 'dare', text: 'Trace the shape of a heart on my palm and hold my hand until next turn.', intensity: 1 },
    ],
  },
  spicy: {
    name: 'Spicy & Flirty',
    icon: 'Flame',
    description: 'Sensual questions and seductive dares to turn up the heat.',
    truths: [
      { id: 'st1', category: 'spicy', type: 'truth', text: 'What is your absolute favorite intimate moment we have ever shared?', intensity: 3 },
      { id: 'st2', category: 'spicy', type: 'truth', text: 'What is an unfulfilled romantic fantasy or scenario you think about?', intensity: 3 },
      { id: 'st3', category: 'spicy', type: 'truth', text: 'Where is your favorite place on your body to be kissed or touched?', intensity: 2 },
      { id: 'st4', category: 'spicy', type: 'truth', text: 'What outfit or look of mine drives you the wildest?', intensity: 2 },
      { id: 'st5', category: 'spicy', type: 'truth', text: 'What is something I do unexpectedly that instantly turns you on?', intensity: 3 },
      { id: 'st6', category: 'spicy', type: 'truth', text: 'Rate our kissing chemistry from 1 to 10 and tell me why.', intensity: 2 },
      { id: 'st7', category: 'spicy', type: 'truth', text: 'What was a time you looked at me and wanted to kiss me desperately?', intensity: 2 },
    ],
    dares: [
      { id: 'sd1', category: 'spicy', type: 'dare', text: 'Give me a passionate 15-second kiss that leaves us breathless.', intensity: 3 },
      { id: 'sd2', category: 'spicy', type: 'dare', text: 'Gently trace your lips along my neck without kissing it for 30 seconds.', intensity: 3 },
      { id: 'sd3', category: 'spicy', type: 'dare', text: 'Send me a flirty/spicy text right now as if we were across the room from each other.', intensity: 2 },
      { id: 'sd4', category: 'spicy', type: 'dare', text: 'Feed me a treat or fruit in the most seductive way possible.', intensity: 2 },
      { id: 'sd5', category: 'spicy', type: 'dare', text: 'Give me a slow, soothing lap or back massage for the next 90 seconds.', intensity: 3 },
      { id: 'sd6', category: 'spicy', type: 'dare', text: 'Whisper your most forbidden secret desire into my ear.', intensity: 3 },
      { id: 'sd7', category: 'spicy', type: 'dare', text: 'Remove one accessory or clothing layer in the slowest, most confident way.', intensity: 3 },
    ],
  },
  deep: {
    name: 'Deep & Vulnerable',
    icon: 'Sparkles',
    description: 'Soulful questions and emotional connection builders.',
    truths: [
      { id: 'dt1', category: 'deep', type: 'truth', text: 'What is a personal fear you rarely share with anyone else?', intensity: 2 },
      { id: 'dt2', category: 'deep', type: 'truth', text: 'In what ways do you feel I have helped you grow as a person?', intensity: 2 },
      { id: 'dt3', category: 'deep', type: 'truth', text: 'When do you feel most safe and understood with me?', intensity: 1 },
      { id: 'dt4', category: 'deep', type: 'truth', text: 'What is a dream for our future that excites you the most?', intensity: 2 },
      { id: 'dt5', category: 'deep', type: 'truth', text: 'What is one thing you wish we did more often together?', intensity: 2 },
      { id: 'dt6', category: 'deep', type: 'truth', text: 'What is a lesson from your past that shaped how you love today?', intensity: 2 },
      { id: 'dt7', category: 'deep', type: 'truth', text: 'If you could know one thing about our future 10 years from now, what would you ask?', intensity: 2 },
    ],
    dares: [
      { id: 'dd1', category: 'deep', type: 'dare', text: 'Share one thing you appreciate about me today that you haven’t said out loud yet.', intensity: 1 },
      { id: 'dd2', category: 'deep', type: 'dare', text: 'Hold me close and synchronize our breathing for 1 minute in silence.', intensity: 1 },
      { id: 'dd3', category: 'deep', type: 'dare', text: 'Show me your favorite photo of us on your phone and tell me the story behind it.', intensity: 1 },
      { id: 'dd4', category: 'deep', type: 'dare', text: 'Write a 3-line mini love poem or haiku about our bond on a piece of paper or notes app.', intensity: 2 },
      { id: 'dd5', category: 'deep', type: 'dare', text: 'Tell me something I did recently that made you proud of me.', intensity: 1 },
      { id: 'dd6', category: 'deep', type: 'dare', text: 'Give me the warmest bear hug for 45 seconds straight.', intensity: 1 },
    ],
  },
  fun: {
    name: 'Fun & Playful',
    icon: 'Laugh',
    description: 'Lighthearted laughs, goofy challenges, and couple trivia.',
    truths: [
      { id: 'ft1', category: 'fun', type: 'truth', text: 'What is the funniest or most embarrassing thing you did to impress me?', intensity: 1 },
      { id: 'ft2', category: 'fun', type: 'truth', text: 'If I were an animal or food, what would I be and why?', intensity: 1 },
      { id: 'ft3', category: 'fun', type: 'truth', text: 'What is a weird habit of mine that you find secretly adorable?', intensity: 1 },
      { id: 'ft4', category: 'fun', type: 'truth', text: 'Who is the bigger drama queen when sick — you or me?', intensity: 1 },
      { id: 'ft5', category: 'fun', type: 'truth', text: 'What is the worst date idea you could ever imagine us having?', intensity: 1 },
      { id: 'ft6', category: 'fun', type: 'truth', text: 'If we were in a zombie apocalypse, who survives longer and how?', intensity: 1 },
    ],
    dares: [
      { id: 'fd1', category: 'fun', type: 'dare', text: 'Do your best, most dramatic impression of how I talk or walk.', intensity: 1 },
      { id: 'fd2', category: 'fun', type: 'dare', text: 'Let me style your hair however I want for the next 10 minutes.', intensity: 1 },
      { id: 'fd3', category: 'fun', type: 'dare', text: 'Sing the chorus of a silly love song like an opera singer.', intensity: 1 },
      { id: 'fd4', category: 'fun', type: 'dare', text: 'Make the funniest face you can and let me take a goofy snapshot.', intensity: 1 },
      { id: 'fd5', category: 'fun', type: 'dare', text: 'Speak in a fake accent of my choice for the next 3 rounds.', intensity: 1 },
      { id: 'fd6', category: 'fun', type: 'dare', text: 'Try not to smile while I do everything I can to make you laugh for 30 seconds.', intensity: 1 },
    ],
  },
};

export function getRandomPrompt(
  category: TruthOrDareCategory,
  type: PromptType,
  excludeIds: string[] = []
): TruthOrDareItem {
  const pool = TRUTH_OR_DARE_DATA[category][type === 'truth' ? 'truths' : 'dares'];
  const candidates = pool.filter((p) => !excludeIds.includes(p.id));
  const selectedList = candidates.length > 0 ? candidates : pool;
  const randomIndex = Math.floor(Math.random() * selectedList.length);
  return selectedList[randomIndex];
}
