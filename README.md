# Us — Private Couple App 💑

A private, two-person mobile relationship app built with **React Native (Expo)**, **TypeScript**, and **Firebase** (Auth, Firestore, Storage) with zero backend logic required for v1.

---

## 📱 Features

1. **Daily Question**:
   - One question per day deterministically chosen via `(daysSinceEpoch % totalQuestions)`.
   - Both partners answer privately.
   - Answers are locked until *both* submit, enforced natively by Firestore Security Rules.
   - Archive of past days' revealed answers.

2. **Moments Feed**:
   - Shared photo diary with captions and timestamps.
   - Take photos with camera or pick from gallery.
   - Direct Firebase Storage upload & Cloud Firestore document creation.

3. **Private 1:1 Chat**:
   - Realtime instant messaging.
   - Photo attachment and full-screen viewer.
   - Optimistic UI updates with instant message preview.

4. **Shared Calendar & Milestones**:
   - Anniversaries, birthdays, date nights, and countdowns ("In 12 days", "Today! 🎉").
   - Auto-rolling yearly recurring events.

---

## 🛠️ Architecture & Tech Stack

- **Framework**: React Native 0.76 + Expo SDK 52 (TypeScript)
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **Database & Auth**: Firebase Authentication (Email/Password), Cloud Firestore, Firebase Storage
- **Design System**: Romantic warm palette (Terracotta `#E06D53`, Champagne Gold `#E6A15C`, Warm Sand background `#FAF7F4`), Lucide icons, responsive layout, full loading skeletons, empty states, and toast notifications.

---

## 🚀 Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env` and fill in your Firebase Web App configuration credentials:

```bash
cp .env.example .env
```

```ini
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:...
```

### 2. Deploy Firestore & Storage Rules
Deploy security rules to your Firebase project:

```bash
firebase deploy --only firestore:rules,storage
```

### 3. Seed the Question Bank
Drop your `.md` files into `content/questions/` and run the idempotent seeding script:

```bash
npm run seed:questions
```

### 4. Link the Couple Accounts
Once both partners have registered in the app or Firebase Auth console, run the pairing script:

```bash
node scripts/setupCouple.js you@example.com partner@example.com
```

### 5. Run Locally
```bash
npm start
# or npm run android / npm run ios / npm run web
```

### 6. Run Unit Tests
```bash
npm test
```
