# "Us" App — Build Plan
*A private, two-person relationship app. React Native (Expo) + Firebase.*

This document is written to be handed directly to an AI coding agent (Claude Code or similar) as the spec for building this app end-to-end. It contains the architecture, exact data model, security rules, folder structure, and a phased implementation checklist.

---

## 1. What we're building

A private mobile app for exactly **two users** (a couple) with four modules:

1. **Daily Question** — one question a day, both partners answer privately, answers reveal to each other only once *both* have answered.
2. **Moments feed** — a shared, permanent photo feed for "here's my day" style posts (caption + photo).
3. **Chat** — simple private 1:1 messaging between the two of you.
4. **Shared Calendar** — anniversaries, birthdays, and planned dates, with countdowns.

### Explicit non-goals for v1 (keep it simple)
- No generic multi-couple pairing/invite system — there are only ever two users, so they're linked once via an admin script, not an in-app flow.
- No streak mechanics (common complaint in every app we looked at — "streak anxiety"). If you want a streak later, it's a small opt-in addition, not core logic.
- No push notifications in v1 — they require Cloud Functions + Firebase's pay-as-you-go (Blaze) plan. Everything in v1 runs on Firebase's free (Spark) plan. Push notifications are a clean, isolated Phase 2 addition (see §9).
- No public app store listing — this is a private Android install (APK sideload or Play Store *internal testing* track, never public).

### Design principle for the agent
Every feature lives in its own folder under `/src/features/*` with its own screens, hooks, and Firestore access — no shared "god" files. Each feature module should be buildable/testable in isolation. This is what "modular" means here: you should be able to delete the `calendar` folder entirely and nothing else breaks.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| App framework | **React Native + Expo** (managed workflow, TypeScript) | Fast to build, easy Android builds via EAS, iOS available later for free |
| Auth | **Firebase Authentication** (email/password) | Only 2 users, no need for social login complexity |
| Database | **Cloud Firestore** | Realtime listeners for chat/reveal, generous free tier |
| File storage | **Firebase Storage** | Photos for Moments + chat images |
| Backend logic | **None required for v1** | Deliberately avoided — see §6 for how reveal/daily-question logic works with zero servers |
| Navigation | **React Navigation** (bottom tabs + stack) | Standard, well-documented |
| State | **React Context + hooks per feature**, no Redux | Overkill for this app size |
| Build/release | **EAS Build** (`eas build -p android`) | Produces an installable APK/AAB without a Mac or Play Store review |

---

## 3. Firebase project setup (do this first, manually, in the Firebase console)

1. Create a new Firebase project (e.g. `us-app-prod`).
2. Enable **Authentication → Email/Password** sign-in provider.
3. Create a **Firestore Database** (start in production mode — we supply real rules in §6).
4. Enable **Storage**.
5. Register an Android app in the project (package name e.g. `com.yourname.usapp`), download `google-services.json`.
6. Stay on the **Spark (free) plan** for v1. Only upgrade to Blaze when/if you build Phase 2 (push notifications).
7. Manually create two user accounts for yourself and your girlfriend in the Auth console (or let the app's sign-up screen do it — either works, see §7).

---

## 4. Folder structure

```
/us-app
  /src
    /features
      /auth
        SignInScreen.tsx
        useAuth.ts
      /dailyQuestion
        DailyQuestionScreen.tsx
        useDailyQuestion.ts
        pickTodaysQuestion.ts     # pure function, no backend call
      /moments
        MomentsFeedScreen.tsx
        NewMomentScreen.tsx
        useMoments.ts
      /chat
        ChatScreen.tsx
        useChat.ts
      /calendar
        CalendarScreen.tsx
        NewEventScreen.tsx
        useEvents.ts
    /navigation
      RootNavigator.tsx           # bottom tabs: Today | Moments | Chat | Calendar
    /components                   # shared, dumb UI only (Button, Avatar, ImageBubble...)
    /services
      firebase.ts                 # single init point for app, auth, firestore, storage
      coupleContext.tsx           # provides { coupleId, partnerUid, myUid } app-wide
    /theme
      colors.ts
      typography.ts
    /constants
  /scripts
    seedQuestions.js              # parses your .md files into Firestore
    setupCouple.js                # one-time: links the two accounts
  /content
    /questions
      *.md                        # your question bank files go here
  firestore.rules
  firestore.indexes.json
  app.config.ts                   # reads Firebase keys from env, not hardcoded
  .env                            # gitignored — Firebase web config keys
```

---

## 5. Data model (Firestore)

```
users/{uid}
  displayName: string
  photoURL: string | null
  coupleId: string | null        # set once by setupCouple.js
  createdAt: timestamp

couples/{coupleId}
  memberUids: [uid1, uid2]        # exactly 2, set once by setupCouple.js
  createdAt: timestamp
  timezone: string                 # e.g. "Africa/Addis_Ababa"

questions/{questionId}
  text: string
  category: string                 # e.g. "Deep", "Fun", "Future"
  order: number                    # shuffled index assigned once at seed time — see §6.1

couples/{coupleId}/dailyQuestions/{dateId}      # dateId = "2026-08-29"
  questionId: string               # resolved client-side, see §6.1 — this doc itself
                                    # is never written until someone answers (see below)

couples/{coupleId}/dailyQuestions/{dateId}/answers/{uid}
  text: string
  answeredAt: timestamp

couples/{coupleId}/moments/{momentId}
  authorUid: string
  imageURL: string
  caption: string
  createdAt: timestamp

couples/{coupleId}/messages/{messageId}
  senderUid: string
  text: string | null
  imageURL: string | null
  createdAt: timestamp

couples/{coupleId}/events/{eventId}
  title: string
  date: string            # "MM-DD" if recurring, full ISO date if one-off
  recurringYearly: boolean
  notes: string | null
  createdAt: timestamp
```

---

## 6. The two clever bits (so v1 needs zero backend)

### 6.1 Picking "today's question" with no server

Don't have a Cloud Function assign the daily question. Instead:

1. `seedQuestions.js` shuffles the full question bank once and writes each question with a fixed `order: 0..N-1`.
2. The app computes, purely client-side:
   ```ts
   const daysSinceEpoch = Math.floor(Date.now() / 86400000);
   const todayIndex = daysSinceEpoch % totalQuestionCount;
   // query: questions where order == todayIndex
   ```
3. Because this is a pure function of the date, **both partners' phones compute the exact same question independently** — no write, no race condition, no server needed. The cycle repeats (in the same shuffled order) once you've been through the whole bank.

### 6.2 The "reveal" mechanic, enforced by Firestore rules (not just UI)

This is the trick that makes the reveal actually private (not just hidden in the UI, which a technical user could bypass by reading the raw response):

- Each partner's answer is its own document: `.../dailyQuestions/{dateId}/answers/{uid}`.
- The security rule (§6.3) says: *you can always read your own answer doc. You can read your partner's answer doc **only if your own answer doc already exists.***
- So the database itself refuses to serve you your partner's answer until you've submitted yours. No client-side trust required.

### 6.3 `firestore.rules` (full file)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isMe(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    function coupleOf(coupleId) {
      return get(/databases/$(database)/documents/couples/$(coupleId)).data;
    }

    function isCoupleMember(coupleId) {
      return isSignedIn() && request.auth.uid in coupleOf(coupleId).memberUids;
    }

    match /users/{uid} {
      allow read: if isMe(uid);
      allow update: if isMe(uid)
                    && !("coupleId" in request.resource.data.diff(resource.data).affectedKeys());
      allow create: if isMe(uid);
      // coupleId field is only ever set by the admin script (bypasses rules via Admin SDK)
    }

    match /couples/{coupleId} {
      allow read: if isCoupleMember(coupleId);
      allow write: if false; // only setupCouple.js (Admin SDK) may write this
    }

    match /questions/{questionId} {
      allow read: if isSignedIn();
      allow write: if false; // only seedQuestions.js may write this
    }

    match /couples/{coupleId}/dailyQuestions/{dateId} {
      allow read: if isCoupleMember(coupleId);
      allow write: if false; // this doc is never written directly; it's implicit
    }

    match /couples/{coupleId}/dailyQuestions/{dateId}/answers/{uid} {
      allow create, update: if isCoupleMember(coupleId) && isMe(uid);
      allow read: if isCoupleMember(coupleId) && (
        isMe(uid) ||
        exists(/databases/$(database)/documents/couples/$(coupleId)/dailyQuestions/$(dateId)/answers/$(request.auth.uid))
      );
    }

    match /couples/{coupleId}/moments/{momentId} {
      allow read: if isCoupleMember(coupleId);
      allow create: if isCoupleMember(coupleId) && request.resource.data.authorUid == request.auth.uid;
      allow delete: if isCoupleMember(coupleId) && resource.data.authorUid == request.auth.uid;
    }

    match /couples/{coupleId}/messages/{messageId} {
      allow read: if isCoupleMember(coupleId);
      allow create: if isCoupleMember(coupleId) && request.resource.data.senderUid == request.auth.uid;
    }

    match /couples/{coupleId}/events/{eventId} {
      allow read, create, update, delete: if isCoupleMember(coupleId);
    }
  }
}
```

**Agent note:** deploy with `firebase deploy --only firestore:rules`, and write a small test suite with the Firestore Emulator before touching production data — reveal logic is exactly the kind of thing that's easy to get subtly wrong.

### 6.4 Storage rules (`storage.rules`)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /couples/{coupleId}/{allPaths=**} {
      allow read, write: if request.auth != null &&
        request.auth.uid in firestore.get(/databases/(default)/documents/couples/$(coupleId)).data.memberUids;
    }
  }
}
```

---

## 7. Auth & one-time couple setup

**In-app:** a plain email/password sign-in screen (Firebase Auth). On first sign-in, if the user doc doesn't exist yet, create it with `coupleId: null`. Sign-up can either happen in-app (a "create account" screen) or you can just create both accounts directly in the Firebase console — either is fine, but the in-app flow is barely more work and nicer to have.

**`scripts/setupCouple.js`** (run once, manually, from your laptop with a Firebase Admin SDK service account key):
```js
// 1. Look up both users by email via admin.auth().getUserByEmail()
// 2. Create couples/{autoId} with memberUids: [uid1, uid2], createdAt, timezone
// 3. Set users/{uid1}.coupleId and users/{uid2}.coupleId to that id
```
Run this once after both accounts exist. From then on, the app just reads `users/{myUid}.coupleId` on launch and everything else follows from that (via `coupleContext.tsx`).

---

## 8. Content import — your question bank

Drop your `.md` files into `/content/questions/`. Format convention:

```markdown
# Category: Deep Talks
- What's something you've been afraid to tell me?
- What does feeling loved look like for you day to day?

# Category: Fun & Random
- What's a meal that instantly reminds you of us?
- If we teleported anywhere for dinner tonight, where would we go?
```

**`scripts/seedQuestions.js`** should:
1. Glob-read every `.md` file in `/content/questions/`.
2. Parse `# Category: X` headings and the `- ` list items beneath each into `{ text, category }` objects.
3. Shuffle the full combined list once (`Fisher–Yates`).
4. Write each as a `questions/{autoId}` doc with its shuffled `order` (0..N-1), using the Firebase Admin SDK (bypasses security rules, so no client write access to `questions/` is ever needed).
5. Be **idempotent** — safe to re-run if you add more `.md` files later (e.g., track already-imported question text and only append new ones with the next available `order` values, rather than re-shuffling existing ones and breaking everyone's daily cycle).

When you're ready to hand over your actual question files, the agent should adjust the parser to your exact heading/format if it differs from the convention above rather than forcing you to reformat everything.

---

## 9. Screens / navigation map

Bottom tab navigator, 4 tabs:

- **Today** → `DailyQuestionScreen`: shows today's question, a text input if you haven't answered, and either "waiting for [partner]..." or both answers side-by-side once revealed. Small calendar-icon button to view past days' revealed Q&As.
- **Moments** → `MomentsFeedScreen`: reverse-chronological feed of photo+caption posts from both of you; floating "+" opens `NewMomentScreen` (camera/gallery picker → upload to Storage → write Firestore doc).
- **Chat** → `ChatScreen`: standard chat bubble UI, realtime Firestore listener (`onSnapshot`, ordered by `createdAt`), text + optional image attach.
- **Calendar** → `CalendarScreen`: list of events sorted by next occurrence, with a countdown ("in 12 days") for each; recurring yearly events (birthdays/anniversary) auto-roll to next year once passed. "+" opens `NewEventScreen`.

---

## 10. Phased implementation checklist (for the agent)

**Phase 0 — Firebase setup**
- [ ] Create Firebase project, enable Auth/Firestore/Storage (§3)
- [ ] Deploy `firestore.rules` and `storage.rules` (§6.3, §6.4)

**Phase 1 — App shell**
- [ ] `npx create-expo-app` with TypeScript template
- [ ] Set up folder structure (§4), install React Navigation, set up bottom tabs (empty screens)
- [ ] `services/firebase.ts` — single Firebase init, reading config from `.env`

**Phase 2 — Auth**
- [ ] Sign-in screen (+ optional sign-up screen)
- [ ] `coupleContext.tsx` — on auth state change, load `users/{uid}`, expose `{ myUid, coupleId, partnerUid }` app-wide; show a simple "waiting to be linked" screen if `coupleId` is null

**Phase 3 — Admin scripts**
- [ ] `scripts/seedQuestions.js` (§8) — run against your real `.md` files
- [ ] `scripts/setupCouple.js` (§7) — run once for your two accounts

**Phase 4 — Daily Question**
- [ ] `pickTodaysQuestion.ts` (§6.1, pure function)
- [ ] Answer submit → write own `answers/{uid}` doc
- [ ] Realtime listener on both `answers/{myUid}` and `answers/{partnerUid}` (second read will simply fail/return nothing until rule condition is met — handle that as "not revealed yet", not an error)
- [ ] Past-days history view

**Phase 5 — Moments feed**
- [ ] Image picker (`expo-image-picker`) → Storage upload → Firestore doc
- [ ] Feed list with pagination (start simple: last 50, "load more" later if needed)

**Phase 6 — Chat**
- [ ] Realtime message list + composer
- [ ] Optional image attach (reuse Storage upload helper from Moments)

**Phase 7 — Calendar**
- [ ] Add/edit/delete events, recurring-yearly toggle
- [ ] Countdown calculation, sort by next occurrence

**Phase 8 — Polish & release**
- [ ] App icon, splash screen, theme pass (see `frontend-design` conventions if using one)
- [ ] `eas build -p android --profile preview` → sideload APK to both phones, or Play Store *internal testing* track

---

## 11. Phase 2+ (optional, later, not part of v1)

Keep these out of scope now, but the modular structure means each is an isolated add-on:

- **Push notifications** — needs Blaze plan + one Cloud Function per trigger (new message, partner answered, event reminder tomorrow) that calls the FCM Admin SDK. Isolated to a `/functions` folder, doesn't touch existing client code.
- **Mini-games/quizzes** — a new `/features/games` folder; same reveal pattern as Daily Question can be reused directly.
- **Streaks** — purely derived/computed from existing `dailyQuestions` history, no schema change needed; make it a subtle indicator, not a guilt mechanic.
- **Widgets / lock-screen photo (Locket-style)** — Android widget requires native module work; bigger lift, worth scoping separately if you want it.

---

## 12. What to hand the agent alongside this file

- This plan.
- Your question-bank `.md` file(s) — the agent will adapt `seedQuestions.js`'s parser to whatever heading format you actually used if it differs from §8's convention.
- Firebase project config (or have the agent walk you through §3 interactively).