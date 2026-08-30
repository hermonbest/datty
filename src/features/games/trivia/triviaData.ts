export interface TriviaQuestion {
  id: string;
  question: string;
  category: string;
  options: [string, string, string, string];
  forfeit: string;
}

export interface TriviaPack {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: TriviaQuestion[];
}

export const TRIVIA_PACKS: TriviaPack[] = [
  {
    id: 'love_story',
    title: 'Our Love Story',
    description: 'How well do you remember the cute details of how we started?',
    icon: 'HeartHandshake',
    questions: [
      {
        id: 'ls1',
        question: 'What was the exact venue or setting of our very first date?',
        category: 'Firsts',
        options: ['Cozy Cafe / Coffee Shop', 'Nice Dinner Restaurant', 'Walk in the Park / Outdoors', 'Cinema or Event'],
        forfeit: 'Give your partner a 1-minute hand massage!'
      },
      {
        id: 'ls2',
        question: 'Who initiated the very first message or contact?',
        category: 'Firsts',
        options: ['You did', 'I did', 'A mutual friend introduced us', 'It was spontaneous'],
        forfeit: 'Say three things you secretly thought when you first saw them!'
      },
      {
        id: 'ls3',
        question: 'What was the first movie or show we binged together?',
        category: 'Memories',
        options: ['A Romantic Comedy', 'A Thriller / Sci-Fi', 'An Animated Movie', 'A Reality / Sitcom Show'],
        forfeit: 'Sing the opening theme of any show together!'
      },
      {
        id: 'ls4',
        question: 'Where was our first ever road trip or weekend getaway?',
        category: 'Travel',
        options: ['Beach / Coast', 'Mountains / Cabin', 'Vibrant City Trip', 'Cozy Staycation'],
        forfeit: 'Plan our next dream weekend getaway spot!'
      },
      {
        id: 'ls5',
        question: 'What meal or dish did we first cook together?',
        category: 'Food',
        options: ['Homemade Pasta / Pizza', 'Breakfast Pancakes / Eggs', 'BBQ / Grilled Dinner', 'Dessert / Baking'],
        forfeit: 'Promise to cook your partner breakfast this weekend!'
      },
      {
        id: 'ls6',
        question: 'What is our song or the song that always reminds you of us?',
        category: 'Music',
        options: ['A Soft Acoustic Ballad', 'A Pop Love Anthem', 'An R&B Smooth Track', 'An Indie Classic'],
        forfeit: 'Play the song and slow dance together right now!'
      }
    ]
  },
  {
    id: 'favorites_quirks',
    title: 'Favorites & Quirks',
    description: 'Test your knowledge about each other’s habits and preferences!',
    icon: 'Sparkles',
    questions: [
      {
        id: 'fq1',
        question: 'What is your partner’s ultimate comfort food after a tiring day?',
        category: 'Habits',
        options: ['Warm Pizza / Pasta', 'Ice Cream & Sweets', 'Spicy Noodles / Ramen', 'Fresh Burger & Fries'],
        forfeit: 'Get your partner a glass of water or favorite snack!'
      },
      {
        id: 'fq2',
        question: 'What is your partner’s primary Love Language?',
        category: 'Love',
        options: ['Words of Affirmation', 'Quality Time', 'Physical Touch', 'Acts of Service / Gifts'],
        forfeit: 'Express their love language immediately!'
      },
      {
        id: 'fq3',
        question: 'How does your partner prefer their morning coffee or tea?',
        category: 'Mornings',
        options: ['Sweet & Creamy', 'Strong & Black', 'Herbal / Green Tea', 'Iced Latte'],
        forfeit: 'Make them their favorite beverage next morning!'
      },
      {
        id: 'fq4',
        question: 'What is their biggest pet peeve?',
        category: 'Quirks',
        options: ['Being late / Waiting', 'Loud chewing / Noise', 'Cluttered spaces', 'Indecision on what to eat'],
        forfeit: 'Do an impression of them when they are mildly annoyed!'
      },
      {
        id: 'fq5',
        question: 'If they won a free vacation tomorrow, where would they fly?',
        category: 'Dreams',
        options: ['Tropical Island Overwater Villa', 'Historic European City', 'Cozy Alpine Mountain Lodge', 'Vibrant Asian Metropolis'],
        forfeit: 'Show them 3 photos of their dream destination on your phone!'
      },
      {
        id: 'fq6',
        question: 'What is their favorite way to spend a lazy Sunday?',
        category: 'Relaxation',
        options: ['Cuddled in bed watching movies', 'Exploring outdoors & brunch', 'Cooking and relaxing with music', 'Shopping & café hopping'],
        forfeit: 'Give a 2-minute foot or head massage!'
      }
    ]
  },
  {
    id: 'deep_connection',
    title: 'Deep Connection & Dreams',
    description: 'Explore the deeper aspirations, dreams, and values of your relationship.',
    icon: 'Compass',
    questions: [
      {
        id: 'dc1',
        question: 'What is your partner’s biggest dream project or life aspiration?',
        category: 'Aspirations',
        options: ['Starting their own venture / Creative project', 'Traveling around the globe', 'Building a cozy custom dream home', 'Mastering an art or high skill'],
        forfeit: 'Give a passionate cheer and affirmation for their dreams!'
      },
      {
        id: 'dc2',
        question: 'What makes your partner feel most peaceful and relaxed?',
        category: 'Serenity',
        options: ['Nature / Silence / Rain', 'A cozy blanket and good music', 'Laughing and being silly with you', 'Warm bath or massage'],
        forfeit: 'Create a calming mood for your partner right now!'
      },
      {
        id: 'dc3',
        question: 'What personality trait in you does your partner value the most?',
        category: 'Appreciation',
        options: ['Your kindness & empathy', 'Your humor & energy', 'Your reliability & strength', 'Your passion & ambition'],
        forfeit: 'Tell them why you appreciate their personality too!'
      }
    ]
  }
];
