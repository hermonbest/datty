export interface TriviaQuestion {
  id: string;
  template: string;
  category: string;
  options: [string, string, string, string];
  forfeit: string;
}

export interface TriviaPack {
  id: string;
  title: string;
  description: string;
  icon: string;
  badgeColor: string;
  questions: TriviaQuestion[];
}

export function formatTriviaText(
  text: string,
  targetName: string,
  guesserName: string
): string {
  return text
    .replace(/\{target\}/g, targetName)
    .replace(/\{guesser\}/g, guesserName);
}

export const TRIVIA_PACKS: TriviaPack[] = [
  {
    id: 'favorites_quirks',
    title: 'Favorites & Quirks',
    description: 'Test how well you know each other’s daily habits, tastes, and pet peeves!',
    icon: 'Sparkles',
    badgeColor: '#F59E0B',
    questions: [
      {
        id: 'fq1',
        template: 'What is {target}’s ultimate comfort food after a tiring day?',
        category: 'Habits',
        options: ['Warm Pizza / Pasta', 'Ice Cream & Sweets', 'Spicy Noodles / Ramen', 'Fresh Burger & Fries'],
        forfeit: 'Get {target} a favorite snack or glass of water right now!'
      },
      {
        id: 'fq2',
        template: 'How does {target} prefer their morning beverage?',
        category: 'Mornings',
        options: ['Sweet & Creamy Coffee', 'Strong & Bold Black Coffee', 'Herbal / Green Tea', 'Iced Latte / Smoothie'],
        forfeit: 'Promise to make {target} their favorite drink tomorrow morning!'
      },
      {
        id: 'fq3',
        template: 'What is {target}’s biggest pet peeve?',
        category: 'Quirks',
        options: ['Being late / Waiting around', 'Loud chewing / Background noise', 'Messy / Cluttered spaces', 'Indecision on what to eat'],
        forfeit: 'Do your best silly impression of {target} when mildly annoyed!'
      },
      {
        id: 'fq4',
        template: 'If {target} won an all-expenses-paid trip tomorrow, where would they fly?',
        category: 'Travel',
        options: ['Tropical Island Overwater Villa', 'Historic European Old Town', 'Cozy Alpine Mountain Cabin', 'Vibrant Tokyo/New York Metropolis'],
        forfeit: 'Find and show {target} 3 gorgeous photos of their dream vacation!'
      },
      {
        id: 'fq5',
        template: 'What is {target}’s ideal way to spend a lazy Sunday?',
        category: 'Relaxation',
        options: ['Cuddled in bed watching movies', 'Exploring outdoors & brunch', 'Cooking while listening to music', 'Shopping & café hopping'],
        forfeit: 'Give {target} a 2-minute relaxing head or hand massage!'
      },
      {
        id: 'fq6',
        template: 'What movie or TV genre is {target}’s guilty pleasure?',
        category: 'Entertainment',
        options: ['Romantic Comedies / Cheesy Dramas', 'True Crime / Thrillers', 'Sci-Fi / Marvel Fantasies', 'Reality TV & Comedy Shows'],
        forfeit: 'Let {target} pick what show you both watch next without complaining!'
      },
      {
        id: 'fq7',
        template: 'When {target} is stressed, what helps them unwind the fastest?',
        category: 'Self-Care',
        options: ['A long warm shower / bath', 'Venting and getting a big hug', 'Quiet alone time with their phone', 'Going for a drive / fresh air walk'],
        forfeit: 'Give {target} a warm, unbroken 30-second hug!'
      },
      {
        id: 'fq8',
        template: 'Which dessert will {target} almost NEVER say no to?',
        category: 'Sweets',
        options: ['Rich Chocolate Lava Cake / Brownies', 'Fresh Cheesecake / Berry Tart', 'Gourmet Artisanal Ice Cream', 'Warm Cookies / Pastries'],
        forfeit: 'Treat {target} to dessert on your next date out!'
      }
    ]
  },
  {
    id: 'love_story',
    title: 'Our Love Story',
    description: 'How well do you remember the cute details and milestones of your romance?',
    icon: 'HeartHandshake',
    badgeColor: '#E11D48',
    questions: [
      {
        id: 'ls1',
        template: 'What was {target}’s very first impression of {guesser}?',
        category: 'Firsts',
        options: ['Instantly attracted & excited', 'A bit shy / mysterious', 'Funny, warm and charming', 'Thought {guesser} was hard to read'],
        forfeit: 'Confess three things you secretly noticed during your first meeting!'
      },
      {
        id: 'ls2',
        template: 'What kind of date night does {target} find most romantic with {guesser}?',
        category: 'Romance',
        options: ['Candlelight dinner & dressing up', 'Cozy homemade meal & blanket fort', 'Stargazing / late-night drive', 'Fun activity (arcade, pottery, comedy)'],
        forfeit: 'Plan and schedule your next romantic date together right now!'
      },
      {
        id: 'ls3',
        template: 'What music genre best represents {target}’s romantic vibe for your relationship?',
        category: 'Music',
        options: ['Soft Acoustic & Indie Love Songs', 'Smooth R&B & Soul Vibes', 'Upbeat Pop Love Anthems', 'Classic Nostalgic Ballads'],
        forfeit: 'Play a romantic song and slow dance together for 1 minute!'
      },
      {
        id: 'ls4',
        template: 'What cute habit of {guesser} makes {target} smile the most?',
        category: 'Affection',
        options: ['The silly faces or laughs you make', 'When you get super excited about something', 'Your sleepy morning voice or cuddles', 'When you randomly check in during the day'],
        forfeit: 'Compliment {target} with 3 genuine, heartfelt reasons you adore them!'
      },
      {
        id: 'ls5',
        template: 'What meal does {target} love cooking (or eating) together most?',
        category: 'Food',
        options: ['Homemade Pasta & Wine', 'BBQ / Steaks & Sides', 'Homemade Tacos / Asian Bowls', 'Baking Cookies / Sweet Desserts'],
        forfeit: 'Offer to cook or do the dishes for {target} tonight!'
      },
      {
        id: 'ls6',
        template: 'What is {target}’s favorite memory of a trip or adventure you took together?',
        category: 'Memories',
        options: ['Late-night talks and laughs in the hotel', 'A breathtaking view or sunset you saw', 'Getting lost and making it an adventure', 'Eating incredible local food together'],
        forfeit: 'Show {target} your absolute favorite couple photo saved on your phone!'
      },
      {
        id: 'ls7',
        template: 'How does {target} most love hearing "I Love You"?',
        category: 'Connection',
        options: ['Said softly during a quiet moment', 'Written in a sweet random text/note', 'Shown through thoughtful little actions', 'Said with a passionate kiss and hug'],
        forfeit: 'Whisper a sweet personalized love confession in {target}’s ear!'
      },
      {
        id: 'ls8',
        template: 'If you both renewed your vows or celebrated a big anniversary, {target} would want:',
        category: 'Celebration',
        options: ['An intimate private getaway just the two of you', 'A lavish party with close friends & family', 'A spontaneous adventure in a new country', 'A cozy luxury cabin retreat in nature'],
        forfeit: 'Toast to each other with a romantic high-five and a kiss!'
      }
    ]
  },
  {
    id: 'deep_connection',
    title: 'Deep Dreams & Soul',
    description: 'Explore the deeper aspirations, values, and emotional world of your partner.',
    icon: 'Compass',
    badgeColor: '#8B5CF6',
    questions: [
      {
        id: 'dc1',
        template: 'What is {target}’s biggest dream or life aspiration right now?',
        category: 'Aspirations',
        options: ['Building their own business / Creative project', 'Traveling and exploring the world freely', 'Creating a dream home & beautiful family', 'Mastering a craft and reaching top expertise'],
        forfeit: 'Give a heartfelt motivational speech cheering on {target}’s dreams!'
      },
      {
        id: 'dc2',
        template: 'What is {target}’s primary Love Language?',
        category: 'Love Language',
        options: ['Words of Affirmation & Praise', 'Quality Time & Undivided Attention', 'Physical Touch & Warm Cuddles', 'Acts of Service & Thoughtful Gifts'],
        forfeit: 'Express {target}’s primary love language to them right now!'
      },
      {
        id: 'dc3',
        template: 'What personality quality does {target} value most in a relationship?',
        category: 'Values',
        options: ['Unshakable Loyalty & Trust', 'Great Sense of Humor & Playfulness', 'Emotional Empathy & Deep Listening', 'Ambition & Drive to Grow Together'],
        forfeit: 'Tell {target} what you admire most about their character!'
      },
      {
        id: 'dc4',
        template: 'When {target} needs to feel completely at peace, where do they imagine being?',
        category: 'Serenity',
        options: ['By the calm ocean hearing waves crash', 'In a quiet forest or mountain cabin in the rain', 'Curled up under warm blankets in total quiet', 'Holding you close in a peaceful room'],
        forfeit: 'Create a calming mood and give {target} a peaceful moment of relaxation!'
      },
      {
        id: 'dc5',
        template: 'If {target} could possess one superpower for a day, which would they pick?',
        category: 'Imagination',
        options: ['Teleportation to anywhere instantly', 'Time travel to revisit cherished moments', 'Mind reading / knowing true feelings', 'Healing and endless energy'],
        forfeit: 'Tell {target} which everyday superpower you think they already have!'
      },
      {
        id: 'dc6',
        template: 'What is {target}’s secret fear or worry that they rarely talk about?',
        category: 'Vulnerability',
        options: ['Not reaching their full potential in life', 'Losing connection with people they love', 'Feeling overwhelmed / running out of time', 'Financial or future instability'],
        forfeit: 'Reassure {target} with loving words that you are always in their corner!'
      },
      {
        id: 'dc7',
        template: 'Where does {target} see you both in 5 years?',
        category: 'Future',
        options: ['Thriving in a gorgeous dream home together', 'Traveling the globe on epic adventures', 'Growing careers and celebrating big wins', 'Living a peaceful, cozy, and slow life'],
        forfeit: 'Describe your shared 5-year dream vision together!'
      },
      {
        id: 'dc8',
        template: 'What does {target} feel is the biggest secret to keeping your love strong?',
        category: 'Wisdom',
        options: ['Never going to sleep angry & open communication', 'Always laughing and being best friends first', 'Supporting each other through every storm', 'Keeping the romantic sparks and surprises alive'],
        forfeit: 'Look {target} in the eyes for 15 seconds without laughing!'
      }
    ]
  },
  {
    id: 'spicy_playful',
    title: 'Spicy & Playful',
    description: 'A spicy, flirty mix testing romantic sparks, secret desires, and chemistry!',
    icon: 'Flame',
    badgeColor: '#E11D48',
    questions: [
      {
        id: 'sp1',
        template: 'What outfit or style on {guesser} does {target} find most attractive?',
        category: 'Attraction',
        options: ['Casual cozy sweats & messy hair', 'Dressed up sharp & elegant', 'Athletic / gym workout gear', 'Silk sleepwear / lingerie'],
        forfeit: 'Wear {target}’s favorite style on your next evening together!'
      },
      {
        id: 'sp2',
        template: 'What is {target}’s favorite spot to be kissed by {guesser}?',
        category: 'Chemistry',
        options: ['Softly on the lips', 'Gently along the neck & jawline', 'Tenderly on the forehead / nose', 'Playfully on the cheeks & ears'],
        forfeit: 'Plant 5 sweet kisses on {target} right now!'
      },
      {
        id: 'sp3',
        template: 'Which romantic mood does {target} prefer the most?',
        category: 'Mood',
        options: ['Slow, sweet, and deeply affectionate', 'Spontaneous, passionate, and playful', 'Teasing, cheeky, and flirty all day', 'Late-night cozy whispers under the duvet'],
        forfeit: 'Send {target} a cheeky, flirty text message while sitting together!'
      },
      {
        id: 'sp4',
        template: 'What is {target}’s favorite time for cuddles and intimacy?',
        category: 'Timing',
        options: ['Lazy morning wake-ups in bed', 'Right after a relaxing evening shower', 'Late at night when the world is quiet', 'Random spontaneous daytime hugs'],
        forfeit: 'Cuddle with {target} for at least 60 uninterrupted seconds!'
      },
      {
        id: 'sp5',
        template: 'If {target} planned a surprise romantic getaway, what would be the centerpiece?',
        category: 'Fantasy',
        options: ['Private hot tub under the stars', 'Champagne & strawberries by a fireplace', 'Beach sunset with candlelit dinner', 'Luxury hotel room service & silk robes'],
        forfeit: 'Promise to set up a candlelit romantic evening soon!'
      },
      {
        id: 'sp6',
        template: 'What flirty gesture from {guesser} makes {target}’s heart skip a beat?',
        category: 'Flirting',
        options: ['A lingering, intense stare across the room', 'A gentle hand placed on their lower back/thigh', 'A sudden surprise pull-in for a deep hug', 'A playful wink with a cheeky smile'],
        forfeit: 'Demonstrate {target}’s favorite flirty move right now!'
      }
    ]
  },
  {
    id: 'this_or_that',
    title: 'This or That',
    description: 'Rapid-fire preference showdown! Can you guess their quick instinctive pick?',
    icon: 'Zap',
    badgeColor: '#2563EB',
    questions: [
      {
        id: 'tt1',
        template: 'For a Friday night, would {target} rather:',
        category: 'Weekend',
        options: ['Order takeout & binge movies at home', 'Go out for fancy dinner & drinks', 'Attend a lively party/concert with friends', 'Go on a night drive or midnight walk'],
        forfeit: 'Let {target} pick your exact Friday night plans this week!'
      },
      {
        id: 'tt2',
        template: 'For a dream holiday setting, would {target} choose:',
        category: 'Vacation',
        options: ['Sun-soaked tropical beach & waves', 'Snowy mountain cabin & fireplace', 'Vibrant cultural city & historic sites', 'Lush countryside vineyard / retreat'],
        forfeit: 'Check out flights together for your next travel dream!'
      },
      {
        id: 'tt3',
        template: 'In their daily sleep schedule, {target} is naturally:',
        category: 'Rhythm',
        options: ['An early morning energetic bird', 'A late-night nocturnal owl', 'Needs a solid afternoon power nap', 'Can sleep anywhere, anytime, any hour'],
        forfeit: 'Bring {target} a glass of water before bedtime tonight!'
      },
      {
        id: 'tt4',
        template: 'When getting ready for an event, {target} is usually:',
        category: 'Style',
        options: ['Ready in 15 minutes flat', 'Taking their sweet time with music blasting', 'Changing outfits 3 times before picking', 'Waiting at the door on {guesser}'],
        forfeit: 'Pay {target} 3 distinct compliments on their style!'
      },
      {
        id: 'tt5',
        template: 'For breakfast comfort, does {target} lean towards:',
        category: 'Food',
        options: ['Sweet pancakes, waffles & pastries', 'Savory eggs, avocado, bacon & toast', 'Just coffee/tea and nothing else', 'Fresh fruit smoothies & yogurt bowl'],
        forfeit: 'Serve {target} their dream breakfast in bed this weekend!'
      },
      {
        id: 'tt6',
        template: 'When planning a trip, {target}’s travel style is:',
        category: 'Travel',
        options: ['Super organized with a color-coded itinerary', 'Go with the flow and be spontaneous', 'Research food spots only and wing the rest', 'Relax by the pool with zero plans'],
        forfeit: 'Give {target} total control over the playlist on your next drive!'
      }
    ]
  }
];
