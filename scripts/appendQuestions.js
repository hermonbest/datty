const fs = require('fs');
const path = require('path');

const NEW_QUESTIONS_BY_DECK = [
  {
    deckKey: 'Daily Delight',
    questions: [
      "What small thing did I do recently that made you feel quietly cherished, even if you never said it out loud?",
      "When was the last time you felt truly safe being soft with me, and what made that moment possible?",
      "What’s one ordinary detail about our life together that still surprises you with gratitude?",
      "If you could bottle one feeling I give you and keep it forever, which feeling would it be and why?",
      "What’s something you’ve been holding back from saying because it feels too tender or exposing?",
      "When do you feel most seen by me, and what am I doing in those moments?",
      "What’s a quiet strength of mine that you’ve never fully told me how much you appreciate?",
      "What’s one way I’ve made your life lighter that you worry I don’t realize?",
      "If vulnerability had a texture or temperature between us, what would today’s version feel like?",
      "What’s the most honest “thank you” you’ve wanted to give me but haven’t found the words for yet?"
    ]
  },
  {
    deckKey: 'Stickers',
    questions: [
      "If your current emotional state were a piece of abstract art, what colors, shapes, and textures would it have?",
      "Draw (or describe) the version of me that lives in your mind when you’re feeling most loved.",
      "What symbol or simple image best represents the part of you that still feels wild and untamed?",
      "If our relationship had a visual motif that only the two of us understood, what would it look like?",
      "Sketch the emotional weather inside you right now—storm, clear sky, fog, or something stranger.",
      "What color is the feeling you get when I look at you a certain way, and where does that color live in your body?",
      "If you could design a sticker that captures your softest, most private self, what would be on it?",
      "What’s the visual metaphor you’d use for the way we fit together when everything else falls away?",
      "Draw the version of “home” that exists only when we’re alone together.",
      "If your inner child handed me a drawing of how they see our connection, what would be on the page?"
    ]
  },
  {
    deckKey: 'Oddballs 2',
    questions: [
      "What’s a completely irrational fear you still carry that you’ve never admitted because it sounds ridiculous?",
      "If you could permanently swap one minor personality trait with me, which would you take and which would you give?",
      "What’s the most unhinged compliment you’ve ever wanted to give someone but held back?",
      "If animals could gossip about humans, what do you think they’d say about the two of us?",
      "What’s a weird personal rule or superstition you follow that no one else knows about?",
      "If your thoughts had a smell, what would the scent of your most private daydreams be?",
      "What’s the strangest thing that still makes you feel oddly powerful or alive?",
      "If we were minor characters in someone else’s story, what would our one defining weird trait be?",
      "What’s a completely useless skill you’d secretly love to master just because?",
      "If your subconscious left me a cryptic note on the bathroom mirror, what would it say?"
    ]
  },
  {
    deckKey: 'Pushing Buttons',
    questions: [
      "What’s one boundary you’ve never tested with me because you’re afraid of what it might reveal?",
      "How far are you willing to let me push you emotionally before it stops feeling exciting and starts feeling unsafe?",
      "What’s something you’ve always wanted me to challenge you on, even if it makes you defensive?",
      "Where is the line between playfulness and real discomfort for you, and how will I know I’ve crossed it?",
      "What’s a belief about yourself that you’re ready for me to question out loud?",
      "How much honesty can you handle from me in one sitting before you need to shut down or push back?",
      "What’s one way I could deliberately make you feel slightly off-balance in a good way?",
      "Where do you still hold back with me because you’re protecting an old version of yourself?",
      "What’s the most intense emotional risk you’re willing to take with me this month?",
      "How do you want me to respond when I notice I’m starting to push a real button?"
    ]
  },
  {
    deckKey: 'The Unhinged Pile',
    questions: [
      "What’s a socially unacceptable thought you’ve had about love, sex, or commitment that you’ve never said out loud?",
      "If morality didn’t exist for one night, what would you most want to explore with me?",
      "What’s something conventional people would judge us for that actually makes our connection stronger?",
      "How much of “normal” relationship advice do you secretly think is bullshit, and why?",
      "What’s the most selfish thing you’ve ever wanted in a relationship and still kind of want?",
      "If we could erase one societal expectation about how couples should behave, which would you delete first?",
      "What’s a dark or taboo fantasy that still turns you on even though part of you feels it “shouldn’t”?",
      "How honest are you willing to be about jealousy, possession, or control without softening it?",
      "What’s one controversial opinion you hold about monogamy, desire, or emotional labor?",
      "If we stopped caring what anyone else thought, how would our dynamic actually change?"
    ]
  },
  {
    deckKey: 'Oddballs',
    questions: [
      "What’s the weirdest thing about you that you hope I never fully get used to?",
      "If your inner weirdo had a manifesto, what would the first three lines be?",
      "What’s a completely non-sexual quirk of mine that still somehow turns you on or makes you soft?",
      "When do you feel most like a delightful freak, and do you want me there for it?",
      "What’s the most “this is so us and no one else would get it” moment we’ve ever shared?",
      "If we had a secret language made only of looks, noises, and inside references, what’s one new word we’d need?",
      "What’s something you’re weirdly proud of that most people would find strange or unimpressive?",
      "How has being with me made your oddness feel safer or more celebrated?",
      "What’s the most unhinged compliment you could give me right now and mean it?",
      "If our relationship were a cryptid or urban legend, what would the local myths say about us?"
    ]
  },
  {
    deckKey: 'Would You Rather? (Choose Wisely or Don\'t)',
    questions: [
      "Would you rather always know exactly what I’m thinking, or always be able to make me feel exactly what you want?",
      "Would you rather have one perfect, unforgettable year with me or twenty good-but-ordinary ones?",
      "Would you rather I challenge you every day or protect your peace at all costs?",
      "Would you rather be completely understood or completely desired—if you could only fully have one?",
      "Would you rather relive our best day on loop or keep creating new ones with no guarantee they’ll top it?",
      "Would you rather I never leave your side or always give you the exact amount of space you need?",
      "Would you rather know the exact day we’ll stop being “us,” or live in permanent uncertainty?",
      "Would you rather I love the realest version of you or the version of you that makes life easiest?",
      "Would you rather fight passionately and make up intensely, or never fight and never quite feel the high?",
      "Would you rather be my safe place or my most exciting risk?"
    ]
  },
  {
    deckKey: 'Would You Rather? (Hypotheticals and Chaos)',
    questions: [
      "Would you rather we get caught in a completely compromising situation or never risk being seen that way at all?",
      "Would you rather I tell you a hard truth that temporarily breaks us or keep a softer lie that lets us stay comfortable?",
      "Would you rather live in a world where everyone knows our private dynamic or a world where no one ever sees how we really are?",
      "Would you rather have the ability to pause time during our best moments or rewind and redo our worst ones?",
      "Would you rather I become suddenly famous and our private life gets complicated, or we stay completely anonymous forever?",
      "Would you rather lose all physical desire for each other but keep the emotional depth, or keep the heat but lose the deep knowing?",
      "Would you rather I push every one of your buttons on purpose for a week, or treat you with perfect carefulness the whole time?",
      "Would you rather we get one impossible wish granted as a couple, or keep the messy, real version of what we have?",
      "Would you rather know every future version of us or stay surprised by who we become?",
      "Would you rather I love you in the exact way you need, or in the exact way I naturally do?"
    ]
  },
  {
    deckKey: 'Tough Love',
    questions: [
      "What’s one pattern of yours that I keep tolerating but that actually costs us something real?",
      "Where are you still choosing comfort over growth in this relationship, and how is it showing up?",
      "What’s the feedback you’ve been half-hoping I wouldn’t give you because you already suspect it’s true?",
      "How are you contributing to the exact dynamic you say you don’t want?",
      "What’s one way you’ve been emotionally lazy with me lately, even if it’s subtle?",
      "Where do you need me to stop rescuing or softening things so you can actually level up?",
      "What’s the story you’re still telling yourself about us that no longer matches reality?",
      "How is your fear of conflict or rejection currently limiting how honest we can be?",
      "What’s one hard truth about your attachment or communication style that you’re ready to own?",
      "If I loved you enough to stop protecting your ego, what would I need to say right now?"
    ]
  },
  {
    deckKey: 'Rewind',
    questions: [
      "What’s a moment from early on that still feels charged when you remember it?",
      "When did you first realize this wasn’t just another connection, and what gave it away?",
      "What’s a small, ordinary memory that somehow still feels golden?",
      "Looking back, what risk did you take with me that ended up being completely worth it?",
      "What’s something I did in the beginning that made you feel chosen in a way you hadn’t before?",
      "Which shared laugh or ridiculous moment do you return to when you need to remember why we work?",
      "What’s a version of us from the past that you miss, even if you’ve grown past it?",
      "When did you feel the shift from “this is fun” to “this matters”?",
      "What’s one thing about how we started that still feels almost unreal in the best way?",
      "If you could drop back into one specific day with me and just linger, which day and why?"
    ]
  },
  {
    deckKey: 'Heart to Heart',
    questions: [
      "What’s the softest, most unprotected part of you that you still hesitate to fully show me?",
      "When do you feel the distance between who you are and who you think I need you to be?",
      "What’s something you’ve never said because you’re afraid it might change how I see you?",
      "How has loving me changed the way you understand yourself?",
      "What’s the emotion you have the hardest time letting me witness, and what does that protect?",
      "Where do you still feel alone even when we’re close?",
      "What’s one way I’ve made it safer for you to be more of yourself?",
      "If your heart could speak without any filter right now, what would it say first?",
      "What’s the difference between the love you thought you wanted and the love you’ve actually found here?",
      "What do you need from me in order to keep choosing deeper instead of safer?"
    ]
  },
  {
    deckKey: 'Hometowns',
    questions: [
      "What part of the place that raised you still lives in your body and reactions?",
      "Which childhood dynamic do you most hope we never recreate between us?",
      "What did “home” feel like growing up, and how is that different from what we’re building?",
      "What’s one belief about love or family that you absorbed early and are still unlearning?",
      "How did the emotional climate of your hometown shape the way you reach for (or pull away from) closeness?",
      "What’s something from your roots that you want to deliberately carry forward into our life?",
      "When do you feel the old version of “how things are supposed to be” still trying to run the show?",
      "What would the kid version of you think about the life and love you’ve found now?",
      "Which unspoken family rule are you most relieved we’ve broken?",
      "How has being with me rewritten some of the stories you inherited about what relationships can be?"
    ]
  },
  {
    deckKey: 'Family Ties',
    questions: [
      "What’s the weirdest or most telling family tradition or habit you grew up with?",
      "Which family member’s way of loving still confuses or affects you the most?",
      "What’s one piece of family chaos you’re determined not to pass on?",
      "How does your family’s version of “normal” still show up in our arguments or expectations?",
      "What’s something your family normalized that you now realize was actually wild?",
      "Which relative do you most see yourself becoming if you’re not careful, and how do we prevent that?",
      "What’s the most accurate (and slightly unflattering) thing your family would say about how you love?",
      "How has our relationship forced you to renegotiate old family roles or loyalties?",
      "What’s one family story that still shapes how you show up when things get hard?",
      "If we created our own family culture from scratch, which inherited quirks would we keep and which would we burn?"
    ]
  },
  {
    deckKey: 'Conflict Resolution',
    questions: [
      "What do you need from me in the first sixty seconds of tension so it doesn’t spiral?",
      "When you’re triggered, what’s the story your nervous system starts telling about me or us?",
      "How can I disagree with you without it feeling like rejection or abandonment?",
      "What’s your honest pattern when you feel unheard—shut down, escalate, people-please, or something else?",
      "What would “fighting fair” actually look and sound like for the two of us specifically?",
      "Where do you still prioritize being right over staying connected, and what does that cost?",
      "How do you want me to bring up something hard without it immediately putting you on defense?",
      "What’s one repair attempt that actually works for you, even if it’s small or awkward?",
      "When conflict ends, what do you need in order to feel fully safe and close again?",
      "How can we make our disagreements feel like they’re happening for us instead of against us?"
    ]
  },
  {
    deckKey: 'Work-Life Harmony',
    questions: [
      "What does “enough” time together actually look and feel like for you right now?",
      "Where are you still sacrificing presence with me for productivity or achievement, and is it worth it?",
      "What’s one boundary with work or outside demands that would protect us if we actually enforced it?",
      "When do you feel most resentful about how our time and energy get spent?",
      "How do you want us to protect the quality of our connection when life gets loud?",
      "What’s something non-negotiable for your well-being that you’ve been treating as optional?",
      "Where are we still performing “busy” instead of choosing what actually matters?",
      "What would a week designed around our real priorities (not just obligations) look like?",
      "How do you know when you’re running on empty, and how do you want me to respond?",
      "What small daily or weekly ritual would help us feel like teammates instead of two people just managing logistics?"
    ]
  },
  {
    deckKey: 'Trust Builders',
    questions: [
      "What’s one promise I’ve kept that quietly strengthened your trust in me?",
      "Where do you still hold a little reserve with me, and what would help that soften?",
      "What’s the difference between the trust you give easily and the trust that has to be earned slowly?",
      "How do you want me to handle it when I inevitably disappoint or miss you?",
      "What’s something you’ve trusted me with that still feels significant when you think about it?",
      "Where has consistency from me mattered more than grand gestures?",
      "What does reliability look like to you in the small, unsexy daily ways?",
      "How can I make it safer for you to tell me when your trust feels shaky?",
      "What’s one way I’ve shown up that made you think, “Okay… this person is solid”?",
      "Brick by brick—what’s the next small thing that would keep building something unshakable between us?"
    ]
  },
  {
    deckKey: 'Social Circles',
    questions: [
      "Which friend or group most influences how you show up in our relationship, for better or worse?",
      "How do you want us to protect our private world when outside opinions get loud?",
      "What’s one dynamic in your social circle that you never want to import into us?",
      "When do you feel the tension between belonging to your people and belonging to me?",
      "Which of my people do you feel most yourself around, and why?",
      "How has our relationship changed the way you choose or maintain friendships?",
      "What’s something you need from your broader community that you don’t need (or want) from me?",
      "Where do you still perform a version of yourself with others that you don’t with me?",
      "How do you want us to handle it when friends or family don’t fully get or support our dynamic?",
      "What does a healthy balance of “us time” and “outside world” actually feel like for you?"
    ]
  },
  {
    deckKey: 'Growth Mindset',
    questions: [
      "What’s one area of your inner life you’re actively trying to upgrade, and how can I support without fixing?",
      "Where have you noticed yourself getting more emotionally skilled because of us?",
      "What’s a version of you from a year ago that you’re proud to have outgrown?",
      "How do you want us to celebrate growth instead of only noticing problems?",
      "What’s one uncomfortable truth about yourself that you’re finally ready to work with instead of against?",
      "Where are you still waiting to “feel ready” instead of practicing the next version of yourself?",
      "How has loving me required you to stretch in ways you didn’t expect?",
      "What’s the difference between growth that feels expansive and growth that feels like self-abandonment for you?",
      "What skill—emotional, relational, or practical—do you most want us to level up together this season?",
      "If we treated our relationship like a living practice instead of a finished product, what would we be practicing more intentionally?"
    ]
  },
  {
    deckKey: 'Attachment Avenue',
    questions: [
      "When you feel me pull away even slightly, what’s the first story your attachment system tells?",
      "How do you typically protest or pursue when you feel disconnection, and how does that land on me?",
      "What does secure attachment with me actually feel like in your body, not just your mind?",
      "Where do your old attachment wounds still get activated in our everyday interactions?",
      "How can I best respond when your anxious or avoidant side shows up without making it worse?",
      "What’s one way I’ve helped your nervous system feel a little safer over time?",
      "When do you notice yourself managing my emotions instead of staying with your own?",
      "What does “earned secure” look like for us specifically—what behaviors build it day by day?",
      "How do you know the difference between a real relational threat and an old attachment alarm?",
      "What’s one attachment pattern you’re committed to interrupting the next time it starts running the show?"
    ]
  },
  {
    deckKey: 'Pattern Breakers',
    questions: [
      "What’s the familiar painful cycle we still fall into, and what’s the very first move that starts it?",
      "How does your childhood or past relationship patterning try to recruit me into an old role?",
      "What would interrupting our most common negative cycle actually require from each of us in the moment?",
      "Where do you still prefer the comfort of a known pattern over the discomfort of a new response?",
      "What’s one reactive habit of yours that you’ve noticed but haven’t fully owned yet?",
      "How can we create a shared language or signal for when the old cycle is starting so we can exit faster?",
      "What’s the cost of staying in the pattern versus the short-term discomfort of breaking it?",
      "Where have you already successfully broken a cycle with me, and what made that possible?",
      "What does the healthier version of our most common conflict actually look and sound like?",
      "If we stopped trying to change each other and focused only on changing the dance between us, what would shift first?"
    ]
  },
  {
    deckKey: 'Parenting Perspectives (Future Chaos Coordinators)',
    questions: [
      "What kind of emotional climate do you most want any future kids to grow up inside?",
      "Which of your own childhood wounds are you most determined not to pass down?",
      "How do you imagine we’ll handle it when we inevitably disagree about parenting in the moment?",
      "What does “good enough” parenting look like to you, free from perfectionism?",
      "How do you want us to protect our relationship so it doesn’t get completely absorbed by kid logistics?",
      "What values do you hope any children of ours absorb just by watching how we treat each other?",
      "Where do you suspect you’ll need the most support or accountability as a parent?",
      "How do you want to talk about the hard, messy, non-Instagram parts of raising humans?",
      "What legacy of emotional safety or courage do you hope we create for the next generation?",
      "If we parent the way we currently love each other, what would that give our kids—and what might it still lack?"
    ]
  },
  {
    deckKey: 'Parenting Perspectives (Legacy Begins at Home)',
    questions: [
      "What do you most want any future family of ours to feel in their bones about love and safety?",
      "Which parts of your upbringing do you want to deliberately redeem or rewrite through how we show up?",
      "How do you want the story of “us” to be told by the people who grow up watching it?",
      "What everyday behaviors between us would you hope children absorb without us ever having to lecture?",
      "Where do you still carry unfinished business with your own parents that could leak into how you parent?",
      "What does a strong, healthy family culture look like to you beyond the usual clichés?",
      "How do you want us to handle our own conflicts so that kids learn repair instead of rupture or silence?",
      "What kind of emotional vocabulary and permission do you want the next generation to have that you didn’t?",
      "If legacy is built in the small, repeated moments, which small moments matter most to you?",
      "What do you hope people say about the home and partnership we built long after we’re gone?"
    ]
  },
  {
    deckKey: 'Wellness (Babe, Drink More Water)',
    questions: [
      "How is your body actually doing right now, beyond the automatic “fine”?",
      "What does real rest look like for you, and how often are you actually getting it?",
      "Where are you still overriding your body’s signals because life (or us) feels more important?",
      "What’s one small physical care habit that would make a noticeable difference if you were consistent?",
      "How do you want me to support your physical well-being without nagging or policing?",
      "When do you feel most at home in your own skin, and how can we create more of that?",
      "What’s the connection you’ve noticed between how you treat your body and how you show up emotionally with me?",
      "Where is stress currently living in your body, and what does it need?",
      "How do you want us to protect sleep, movement, and basic nourishment when everything else gets demanding?",
      "What’s one kind, non-performative thing you could do for your body this week that you’d actually enjoy?"
    ]
  },
  {
    deckKey: 'Wellness (Healthy Minds, Healthy Bodies)',
    questions: [
      "What’s currently weighing on your mental or emotional bandwidth that you haven’t fully shared?",
      "How do you know when your nervous system is dysregulated, and what helps bring you back?",
      "Where are you still using distraction or numbing instead of actual processing or rest?",
      "What does mental and emotional hygiene look like for you in a sustainable way?",
      "How has our relationship supported (or sometimes strained) your psychological well-being?",
      "What’s one boundary with technology, news, or outside input that would protect your inner world?",
      "When do you feel most mentally clear and emotionally resourced, and what conditions create that?",
      "How do you want us to talk about mental health without it becoming heavy or clinical?",
      "What’s the difference between supporting each other and becoming each other’s only emotional regulator?",
      "If we treated our minds with the same care we (ideally) give our bodies, what would change first?"
    ]
  },
  {
    deckKey: 'Photo Prompts (Capture Your Memories)',
    questions: [
      "Take a photo of something that currently represents “us” in an ordinary, non-performative way.",
      "Capture the detail of my face or hands that you find yourself looking at most often.",
      "Photograph the exact spot or object that holds a private memory only we understand.",
      "Take a picture of the version of home that exists when it’s just the two of us.",
      "Capture something that feels like a quiet promise or future you’re looking forward to.",
      "Photograph the evidence of a shared ritual or habit that makes our days feel like ours.",
      "Take a photo that shows the texture of an ordinary good moment we’d otherwise forget.",
      "Capture something that represents how safe or free you feel with me.",
      "Photograph the light, object, or corner that feels most like “our” atmosphere.",
      "Take a picture of whatever currently makes you feel most grateful for this chapter."
    ]
  },
  {
    deckKey: 'Photo Prompts (Flick Them Up)',
    questions: [
      "Send me a photo of something that turned you on today (object, moment, memory, or body).",
      "Capture the look or expression you wish I could see on your face right now.",
      "Photograph something that makes you think of the last time we were really charged together.",
      "Take a picture that represents the fantasy or tension you’re currently carrying.",
      "Capture a detail of your body or space that feels private and meant for me.",
      "Send a photo that says “I want you” without any words needed.",
      "Photograph the aftermath or evidence of desire—rumpled sheets, a mark, a chosen outfit.",
      "Capture something that feels forbidden, teasing, or just out of reach right now.",
      "Take a picture of the version of yourself you only fully show me when things heat up.",
      "Send a photo that is pure invitation—no explanation required."
    ]
  },
  {
    deckKey: 'Hot & Spicy (The Popular Questions)',
    questions: [
      "What’s the single hottest memory of us that you still replay when you want to get yourself going?",
      "Where do you most love being touched, and how do you want me to touch you there when we have all the time in the world?",
      "What’s one thing I’ve done in bed (or almost in bed) that you still think about at random times?",
      "How do you want me to look at you when I’m thinking about taking you apart?",
      "What’s your favorite way I’ve ever taken control, and how can I do more of that?",
      "Where do you still get shy or self-conscious, and how do you want me to handle that tenderness?",
      "What’s the dirtiest compliment you’ve ever wanted to hear from me?",
      "How do you want me to wake you up when I’m already hard/wet and impatient?",
      "What’s one sensation or pace that reliably ruins you in the best way?",
      "If we only had twenty minutes right now, how would you want me to use them on you?"
    ]
  },
  {
    deckKey: 'Hot & Spicy (For Before Things Heat Up)',
    questions: [
      "What are you already imagining me doing to you later, and how detailed is the mental movie?",
      "Which piece of clothing (or lack of it) on me makes it hardest for you to think straight?",
      "How do you want me to start—slow and teasing, or do you need me to just take?",
      "What’s one thing you want me to say in your ear while I’m still fully dressed?",
      "Where should my hands be the second we get a locked door between us and the world?",
      "How worked up are you already, and what would make it worse in the best way?",
      "What’s the first thing you want my mouth on once we’re alone?",
      "Do you want me to make you wait, or are you past the point of patience?",
      "What does your body need from me right now that words haven’t covered yet?",
      "Give me one specific instruction for how you want the next hour to begin."
    ]
  },
  {
    deckKey: 'Hot & Spicy (Philosophize and Fantasize)',
    questions: [
      "If desire were a language only we spoke, what would your favorite phrase in that language be?",
      "What’s a fantasy that feels almost too revealing to say out loud, but you’re still willing to offer it to me?",
      "How does power exchange show up in the way you want to be wanted—or to want me?",
      "What does “being taken” actually mean to your body and nervous system, beyond the surface?",
      "If we could design a night with zero practical limits and total emotional safety, what would the arc of it be?",
      "Where does the line live for you between hot degradation and something that would actually hurt?",
      "What role does being seen—fully, hungrily, without flinching—play in how turned on you get?",
      "How do you want the aftercare and the intensity to talk to each other in our dynamic?",
      "What’s a version of us in bed that we’ve only touched the edge of and you’re hungry to go further into?",
      "If our sex life were a philosophy, what would its core tenet be?"
    ]
  },
  {
    deckKey: 'Hot & Spicy (The Ones You Want to Ask)',
    questions: [
      "What’s something you’ve wanted to ask me in bed but kept swallowing because it felt too direct?",
      "How do you really feel about the sounds I make, the faces I make, the way I lose control?",
      "Is there a part of my body or a way I move that you have a private obsession with?",
      "What’s one thing I do that makes you feel owned in a way that still feels safe and hot?",
      "How honest do you want me to be about how much I want you when we’re in public or around other people?",
      "What’s a boundary you’ve tested in your head with me that you’re curious to test in real life?",
      "Do you ever get off thinking about specific real moments we’ve had, or do you prefer pure fantasy?",
      "What’s the most possessive or territorial thought you’ve had about me that still turns you on?",
      "How do you want me to handle it when you’re shy or hesitant but your body is clearly saying yes?",
      "What’s one question about my desire for you that you’ve been carrying and finally want answered?"
    ]
  },
  {
    deckKey: 'Hot & Spicy (Raw. Next Question.)',
    questions: [
      "Tell me exactly how wet/hard you are right now and what started it.",
      "What’s the filthiest thing you want me to do to you with zero romance attached?",
      "Where do you want my hands, mouth, and cock/fingers in the next five minutes—be specific.",
      "How rough do you actually want it, and where’s the edge you’re hoping I’ll find?",
      "What do you need to hear while I’m inside you or on top of you to completely let go?",
      "Are you in the mood to be used, worshipped, challenged, or something meaner?",
      "What’s one thing you’ve never asked for during sex that you’re finally ready to demand?",
      "How do you want me to look at you while I’m making you come?",
      "Tell me what you’re going to do to me the second you get the chance—no softening.",
      "Right now, do you want me to make you wait or make you break?"
    ]
  },
  {
    deckKey: 'Hot & Spicy (Foreplay Started Yesterday)',
    questions: [
      "I’ve been thinking about the way you sound when you’re close—tell me what you want me to do to get you there again.",
      "Which memory of us has been living rent-free in your body since the last time we were together?",
      "I’ve already decided how I want to take you next—want to hear it, or do you want to try to change my mind?",
      "What have you been doing (or not doing) to yourself while thinking about me?",
      "I’m imagining you exactly as you are right now, except my hands are already on you—where are they?",
      "How long has it been since you were properly wrecked, and are you due?",
      "Tell me one thing you’re going to wear (or not wear) the next time we’re alone that is purely for my benefit.",
      "I’ve been replaying the last time you lost control—want me to recreate it or escalate it?",
      "What’s the first thing you’re going to let me do when we finally lock the door again?",
      "Foreplay isn’t starting later. It’s already happening. What do you need from me in this exact moment to keep the current running?"
    ]
  },
  {
    deckKey: 'Future Plans & Dreams (Dream Big Together)',
    questions: [
      "If money, logistics, and fear were removed, what life would we be building five years from now?",
      "What’s a shared adventure or chapter that still feels slightly out of reach but deeply wanted?",
      "How do you imagine our days feeling when we’ve created more of the life we actually want?",
      "What does “enough” success, freedom, or security look like so we can actually enjoy each other?",
      "Which dream of yours do you most want me to believe in and help protect?",
      "What kind of older couple do you hope we become—energy, dynamic, way of moving through the world?",
      "Where do you still hold back from dreaming bigger because part of you doesn’t want to risk disappointment?",
      "What’s one bold, slightly unreasonable future vision that still makes your chest feel open?",
      "How do you want us to keep choosing each other as the dream evolves and life gets more complex?",
      "If we wrote the next decade as a story, what would the emotional tone and major plot points be?"
    ]
  },
  {
    deckKey: 'Future Plans & Dreams (Write the Next Chapter)',
    questions: [
      "What does the next chapter of “us” need more of, and what does it need less of?",
      "Which current habits or patterns will quietly sabotage the future we say we want if we don’t change them?",
      "How do you want to feel in our relationship one year from now that you don’t fully feel yet?",
      "What’s one concrete decision or experiment we could make in the next three months that would move us toward the life we want?",
      "Where do you need more shared vision, and where do you need more individual freedom within the next chapter?",
      "What are you most excited to build or experience with me that we haven’t fully started yet?",
      "How do we protect the quality of our connection while we chase bigger external goals?",
      "What does a thriving next chapter look like on an ordinary Tuesday, not just the highlight reel?",
      "Which fears about the future are you ready to stop letting drive the car?",
      "If we treated this next season as a deliberate co-authored story, what would we want the reader to feel by the end of it?"
    ]
  }
];

function updateMarkdownAndDecksData() {
  const mdPath = path.join(__dirname, '../candle_cards_complete_questions_deck.md');
  let mdContent = fs.readFileSync(mdPath, 'utf8');

  // Map of normalized deck titles to new questions
  const newQuestionsMap = new Map();
  for (const item of NEW_QUESTIONS_BY_DECK) {
    const normKey = item.deckKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    newQuestionsMap.set(normKey, item.questions);
  }

  // Update markdown sections
  const sections = mdContent.split(/\n##\s+/);
  const header = sections[0];
  const newSections = [header];

  for (let i = 1; i < sections.length; i++) {
    const sec = sections[i];
    const lines = sec.split(/\r?\n/);
    const deckTitle = lines[0].trim();
    const normKey = deckTitle.toLowerCase().replace(/[^a-z0-9]/g, '');

    const newQs = newQuestionsMap.get(normKey);
    if (!newQs) {
      console.warn(`No new questions found for deck: "${deckTitle}" (key: ${normKey})`);
      newSections.push(sec);
      continue;
    }

    // Find highest question index
    let lastQIndex = 0;
    const cleanLines = [];
    for (const line of lines) {
      const qMatch = line.match(/^(\d+)\.\s*/);
      if (qMatch) {
        lastQIndex = Math.max(lastQIndex, parseInt(qMatch[1], 10));
      }
      cleanLines.push(line);
    }

    // Append new questions
    newQs.forEach((q, idx) => {
      cleanLines.push(`${lastQIndex + 1 + idx}. ${q}`);
    });

    newSections.push(cleanLines.join('\n'));
  }

  let updatedMd = newSections.join('\n## ');
  // Update header summary
  updatedMd = updatedMd.replace(/\*\*Total Questions\/Prompts:\*\*\s*\d+/, '**Total Questions/Prompts:** 1190');
  updatedMd = updatedMd.replace(/A comprehensive collection of \d+ bespoke/, 'A comprehensive collection of 35 bespoke');

  fs.writeFileSync(mdPath, updatedMd, 'utf8');
  console.log('Updated candle_cards_complete_questions_deck.md successfully!');

  // Now re-parse and generate updated decksData.ts
  const { parseDecksFile } = require('./parseDecks');
  const parsedDecks = parseDecksFile(mdPath);
  console.log(`Parsed ${parsedDecks.length} decks from updated markdown.`);

  const CATEGORY_COLORS = {
    'Popular Community Questions': { color: '#E11D48', bgLight: '#FFE4E6', iconName: 'Sparkles' },
    'Deep Questions': { color: '#7C3AED', bgLight: '#EDE9FE', iconName: 'Heart' },
    'Hot & Spicy': { color: '#DC2626', bgLight: '#FEE2E2', iconName: 'Flame' },
    'Unhinged': { color: '#D946EF', bgLight: '#FAE8FF', iconName: 'Zap' },
    'Would You Rather?': { color: '#EA580C', bgLight: '#FFEDD5', iconName: 'HelpCircle' },
    'Future Plans & Dreams': { color: '#0D9488', bgLight: '#CCFBF1', iconName: 'Compass' },
    'Wellness': { color: '#059669', bgLight: '#D1FAE5', iconName: 'Activity' },
    'Parenting Perspectives': { color: '#D97706', bgLight: '#FEF3C7', iconName: 'Smile' },
    'Creative / Visual': { color: '#DB2777', bgLight: '#FCE7F3', iconName: 'Palette' },
    'Photo Prompts': { color: '#0284C7', bgLight: '#E0F2FE', iconName: 'Camera' },
  };

  const getTheme = (cat) => CATEGORY_COLORS[cat] || { color: '#E11D48', bgLight: '#FFE4E6', iconName: 'Sparkles' };

  // Let's generate decksData.ts
  let tsOutput = `import { getCategoryTheme } from './categoryTheme';

// Auto-generated decks data from candle_cards_complete_questions_deck.md

export interface CardDeck {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  color: string;
  bgLight: string;
  iconName: string;
  questions: string[];
}

export const CATEGORIES = [
  'All',
  'Popular Community Questions',
  'Deep Questions',
  'Hot & Spicy',
  'Unhinged',
  'Would You Rather?',
  'Future Plans & Dreams',
  'Wellness',
  'Parenting Perspectives',
  'Creative / Visual',
  'Photo Prompts',
] as const;

const RAW_DECKS_DATA: CardDeck[] = ${JSON.stringify(parsedDecks.map((d, index) => {
  const theme = getTheme(d.category);
  const slug = d.deckTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    id: `deck-${index + 1}-${slug}`,
    title: d.deckTitle,
    category: d.category,
    subtitle: d.subtitle,
    color: theme.color,
    bgLight: theme.bgLight,
    iconName: theme.iconName,
    questions: d.questions,
  };
}), null, 2)};

export const DECKS_DATA: CardDeck[] = RAW_DECKS_DATA.map((deck) => {
  const theme = getCategoryTheme(deck.category);
  return {
    ...deck,
    color: theme.color,
    bgLight: theme.bgLight,
    iconName: theme.iconName,
  };
});
`;

  const tsPath = path.join(__dirname, '../src/features/cards/decksData.ts');
  fs.writeFileSync(tsPath, tsOutput, 'utf8');
  console.log('Updated src/features/cards/decksData.ts successfully!');
}

if (require.main === module) {
  updateMarkdownAndDecksData();
}

module.exports = { updateMarkdownAndDecksData };

