const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Setup couple script to link two user accounts in Firestore
 * Usage: node scripts/setupCouple.js user1@example.com user2@example.com [timezone]
 */
async function setupCouple(admin, email1, email2, timezone = 'UTC') {
  const auth = admin.auth();
  const db = admin.firestore();

  console.log(`Looking up users: ${email1} and ${email2}...`);

  let user1, user2;
  try {
    user1 = await auth.getUserByEmail(email1);
  } catch (e) {
    throw new Error(`Could not find user with email: ${email1}. Ensure the user has registered.`);
  }

  try {
    user2 = await auth.getUserByEmail(email2);
  } catch (e) {
    throw new Error(`Could not find user with email: ${email2}. Ensure the user has registered.`);
  }

  console.log(`Found user 1: ${user1.uid} (${user1.email})`);
  console.log(`Found user 2: ${user2.uid} (${user2.email})`);

  // Check if either already has a couple
  const user1Doc = await db.collection('users').doc(user1.uid).get();
  const user2Doc = await db.collection('users').doc(user2.uid).get();

  const user1CoupleId = user1Doc.exists ? user1Doc.data()?.coupleId : null;
  const user2CoupleId = user2Doc.exists ? user2Doc.data()?.coupleId : null;

  let coupleId;

  if (user1CoupleId && user2CoupleId && user1CoupleId === user2CoupleId) {
    console.log(`Both users are already linked to coupleId: ${user1CoupleId}`);
    coupleId = user1CoupleId;
  } else {
    // Create new couple doc
    const newCoupleRef = db.collection('couples').doc();
    coupleId = newCoupleRef.id;

    console.log(`Creating new couple document: couples/${coupleId}...`);
    await newCoupleRef.set({
      memberUids: [user1.uid, user2.uid],
      createdAt: new Date(),
      timezone: timezone,
    });
  }

  // Update or set user documents with coupleId
  console.log(`Linking users/${user1.uid} and users/${user2.uid} to coupleId: ${coupleId}...`);
  const batch = db.batch();

  batch.set(
    db.collection('users').doc(user1.uid),
    {
      displayName: user1.displayName || email1.split('@')[0],
      email: user1.email,
      photoURL: user1.photoURL || null,
      coupleId: coupleId,
      updatedAt: new Date(),
      createdAt: user1Doc.exists ? user1Doc.data()?.createdAt || new Date() : new Date(),
    },
    { merge: true }
  );

  batch.set(
    db.collection('users').doc(user2.uid),
    {
      displayName: user2.displayName || email2.split('@')[0],
      email: user2.email,
      photoURL: user2.photoURL || null,
      coupleId: coupleId,
      updatedAt: new Date(),
      createdAt: user2Doc.exists ? user2Doc.data()?.createdAt || new Date() : new Date(),
    },
    { merge: true }
  );

  await batch.commit();

  // Set a `coupleId` custom claim on both users so Firestore security rules can
  // verify membership without a server-side document read on every chat/game
  // operation. Existing sessions pick the claim up on their next token refresh
  // (~1h); rules fall back to the couple document lookup until then.
  console.log('Setting coupleId custom claim for both users...');
  await Promise.all([
    auth.setCustomUserClaims(user1.uid, { coupleId }),
    auth.setCustomUserClaims(user2.uid, { coupleId }),
  ]);
  console.log('Custom claims set.');

  // Mirror membership into Realtime Database so RTDB rules can gate reads/writes
  // with a cheap path check. Admin SDK bypasses rules, but clients need this
  // node to exist before they can read/write chat/presence/games.
  try {
    const rtdb = admin.database();
    await Promise.all([
      rtdb.ref(`couples/${coupleId}/members/${user1.uid}`).set(true),
      rtdb.ref(`couples/${coupleId}/members/${user2.uid}`).set(true),
    ]);
    console.log('RTDB members list written.');
  } catch (err) {
    console.warn(
      'Could not write RTDB members list. Is Realtime Database enabled in the Firebase console?',
      err?.message
    );
  }

  console.log(`\n🎉 Success! Successfully paired ${email1} and ${email2} under coupleId: ${coupleId}`);
  return { coupleId, user1Uid: user1.uid, user2Uid: user2.uid };
}

module.exports = { setupCouple };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/setupCouple.js <email1> <email2> [timezone]');
    process.exit(1);
  }

  const [email1, email2, timezone] = args;

  const admin = require('firebase-admin');
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '../serviceAccountKey.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Firebase Service Account Key not found at ${serviceAccountPath}.`);
    console.error('Please place your serviceAccountKey.json in the project root or set FIREBASE_SERVICE_ACCOUNT_PATH.');
    process.exit(1);
  }

  const serviceAccount = require(path.resolve(serviceAccountPath));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Needed for admin.database() — resolves to the project's default RTDB instance
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.${process.env.FIREBASE_DATABASE_REGION || 'europe-west1'}.firebasedatabase.app`,
  });

  setupCouple(admin, email1, email2, timezone || 'UTC')
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
}
