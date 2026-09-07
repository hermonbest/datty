# Us (Datty) — Private Relationship App for Couples 💑

**Us** is an intimate, feature-rich mobile app designed exclusively for couples — whether living together or long-distance. Built with **React Native (Expo SDK 52)**, **TypeScript**, and **Firebase**, it provides an encrypted-feeling private sanctuary for shared moments, interactive games, meaningful conversations, and daily rituals.

---

## 🌟 Key Features

### 1. 💌 Daily Question
* **Lock-and-Reveal Mechanic**: Every day at midnight, a new thought-provoking question appears.
* **Privacy First**: Your partner's answer remains blurred until *both* of you have answered.
* **Past Archives**: Browse previous days' answers and revisit how your connection has grown.

### 2. 🃏 Conversation Card Decks
* **Curated Decks**: Categories ranging from *Deep & Soulful*, *Romantic & Sweet*, *Spicy & Intimate*, to *Playful & Future Planning*.
* **Interactive Flipping**: Touch cards to reveal questions and discuss them together.
* **Share to Chat**: Send any question directly into your private chat with one tap.

### 3. 🎮 Couple Games Hub
Real-time, synchronized multiplayer games designed for two:
* **Truth or Dare**: Alternating turn-by-turn gameplay with Romantic, Spicy, Deep, and Playful categories. Features interactive prompts, typed answers, and an on-demand **Re-roll** button.
* **Word Guess**: A romantic 5-letter word puzzle you can solve together.
* **Couple Chess**: Turn-based chess board with move history, capture tracking, and live sync.
* **Couple Trivia**: Test how well you really know each other's memories and habits.
* **Quick Minigames**: Tic-Tac-Toe, Tap Battle, Two Truths & a Lie, Hot Takes, Checkers, and Sea Battle.
* **Flexible Modes**: Play in **Couple Online** mode over distance, or **Pass & Play** on a single device.

### 4. 💬 Realtime 1:1 Chat
* **Live Presence & Typing**: See when your partner is online, last seen, or typing.
* **Voice Notes**: Record, send, and listen to voice memos using `expo-audio`.
* **Rich Media**: High-speed photo and video sharing powered by Cloudinary.
* **Game & Card Replies**: Direct threading from game prompts and cards into the conversation.

### 5. 📸 Moments Feed
* **Shared Photo Diary**: Post candid photos with captions and date stamps.
* **Lightbox Viewer**: Pinch-to-zoom and full-screen view for photos.
* **Private Cloud Storage**: Accessible only to you and your partner.

### 6. 📅 Shared Calendar & Milestones
* **Anniversary & Date Tracking**: Countdowns to visits, trips, anniversaries, and birthdays.
* **Recurring Celebrations**: Automatic yearly reminders for special milestones.

### 7. 📝 Notes, Lists & "About You"
* **Shared Gratitude**: Leave sweet appreciation notes for each other anytime.
* **Couple Bucket List**: Shared to-do items and adventure lists with checkable completion.
* **Private Notes ("About Partner")**: A personal notebook for keeping track of your partner’s gift ideas and little details (strictly hidden from your partner).
* **Love Nudges**: Send gentle push nudges ("Thinking of you", "Nudge to write a note").

### 8. 🔒 Security & Privacy
* **App Passcode**: Optional 4-digit PIN lock with automatic background timeout.
* **Strict Firestore Rules**: Multi-tenant security rules guarantee that no couple can access another couple’s data.

---

## 🛠️ Architecture & Tech Stack

* **Mobile Framework**: React Native 0.76 with Expo SDK 52 (TypeScript)
* **Styling & Theme**: Custom romantic theme system with deep wine red accents (`#60162e`), soft blush surfaces, and Garamond/Manrope typography
* **Navigation**: React Navigation (Bottom Tab Bar + Native Stack)
* **Backend & Database**: Firebase Authentication, Cloud Firestore (Real-time listeners), and Firebase Storage
* **Media Optimization**: Cloudinary CDN for instant media uploads and fast rendering
* **Push Notifications**: Expo Notifications API with Firestore token management
* **Build System**: EAS Build (Expo Application Services)

---

## 📋 Prerequisites

Before running or building the app, make sure you have:
1. **Node.js** (v18 or higher recommended)
2. **npm** or **yarn**
3. **Expo CLI** & **EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```
4. A **Firebase Project** with:
   - Authentication (Email/Password enabled)
   - Cloud Firestore
   - Firebase Storage
5. An **Expo Developer Account** (free at [expo.dev](https://expo.dev))

---

## 🚀 Setup & Local Installation

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd datty
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root based on `.env.example`:

```ini
# Firebase Web Client Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary (Media Uploads)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
EXPO_PUBLIC_CLOUDINARY_API_KEY=your_cloudinary_api_key
```

### 3. Add Android Google Services
Download `google-services.json` from your Firebase Console (under Android App settings with package name `com.usapp.couple`) and place it in the project root:
```
c:\docs\datty\google-services.json
```

### 4. Deploy Firebase Security Rules
Deploy Firestore and Storage security rules to enforce couple privacy:
```bash
firebase deploy --only firestore:rules,storage
```

### 5. Seed Daily Questions (Optional)
Populate your database with the built-in relationship question catalog:
```bash
npm run seed:questions
```

### 6. Run the App in Development
Start the Metro bundler:
```bash
npm start
```
* Press **`a`** to open on an Android emulator / connected device.
* Press **`i`** to open on an iOS simulator.
* Scan the QR code using the **Expo Go** app on your physical device.

---

## 💑 How to Use the App (User Guide)

### Step 1: Create Accounts
1. Partner A downloads and opens the app, taps **Sign Up**, and enters their email and password.
2. Partner B downloads the app, taps **Sign Up**, and creates their own account.

### Step 2: Link as a Couple
There are two ways to connect your accounts:
* **In-App Pairing Screen**:
  1. Once logged in, go to the Unlinked screen.
  2. Copy your unique 6-character Partner Code and send it to your partner.
  3. Your partner inputs the code and taps **Link Accounts**. Both phones will immediately reload into the shared home screen!
* **Admin Script (Alternative for Developers)**:
  Run the automated linking script from your terminal:
  ```bash
  node scripts/setupCouple.js partnerA@example.com partnerB@example.com
  ```

### Step 3: Enjoy Daily Rituals & Games
1. **Daily Question**: Check the **Today** tab every morning. Type your answer and wait for your partner to submit theirs to unlock both!
2. **Chat**: Open the **Chat** tab to send instant text, record voice notes, or share photos.
3. **Play a Game**: Go to **Games**, choose **Truth or Dare**, pick a category, and take turns picking cards and completing challenges with the **Re-roll** option.
4. **Save Memories**: Snap photos in **Moments** to build your timeline.
5. **Mark Milestones**: Add upcoming anniversaries and trips in the **Calendar** tab.
6. **Keep Private Notes**: Open **Notes & Lists** to track shared bucket list goals or write secret gift ideas about your partner in the private notebook.

---

## 📦 Building Standalone APKs / Production (EAS)

To produce an installable Android APK (`preview` profile):

```bash
npx eas build -p android --profile preview
```

When the cloud build finishes, EAS will provide a direct download link or QR code to install the `.apk` on your phone.

To build for production (Google Play / Apple App Store):
```bash
npx eas build -p android --profile production
npx eas build -p ios --profile production
```

---

## 🧪 Testing & Verification

Run TypeScript compilation checks:
```bash
npx tsc --noEmit
```

Run test suite:
```bash
npm test
```

---

## 📄 License
Private & Proprietary. Created with ❤️ for couples.
