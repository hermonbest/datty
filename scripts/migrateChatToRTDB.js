const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Migrate existing Firestore chat history into Realtime Database.
 * Usage: node scripts/migrateChatToRTDB.js <coupleId>
 */
async function migrateChat(admin, coupleId) {
  const db = admin.firestore();
  const rtdb = admin.database();

  const messagesCol = db.collection('couples').doc(coupleId).collection('messages');
  const snap = await messagesCol.orderBy('createdAt', 'asc').get();

  if (snap.empty) {
    console.log('No Firestore messages to migrate.');
    return;
  }

  console.log(`Migrating ${snap.size} messages → couples/${coupleId}/chat ...`);

  // Clear any existing RTDB chat for a clean import
  await rtdb.ref(`couples/${coupleId}/chat`).set(null);

  let count = 0;
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const createdAtMs =
      d.createdAt && typeof d.createdAt.toMillis === 'function'
        ? d.createdAt.toMillis()
        : Date.now();

    await rtdb.ref(`couples/${coupleId}/chat`).push({
      senderUid: d.senderUid,
      text: d.text || null,
      imageURL: d.imageURL || null,
      audioURL: d.audioURL || null,
      audioDuration: typeof d.audioDuration === 'number' ? d.audioDuration : null,
      createdAt: createdAtMs,
      replyTo: d.replyTo || null,
      reaction: d.reaction || null,
      mediaState: d.mediaState || 'ready',
    });
    count++;
    if (count % 25 === 0) console.log(`  ${count}/${snap.size}...`);
  }

  console.log(`🎉 Migrated ${count} messages.`);
}

module.exports = { migrateChat };

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/migrateChatToRTDB.js <coupleId>');
    process.exit(1);
  }
  const [coupleId] = args;

  const admin = require('firebase-admin');
  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || path.join(__dirname, '../serviceAccountKey.json');

  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Firebase Service Account Key not found at ${serviceAccountPath}.`);
    process.exit(1);
  }

  const serviceAccount = require(path.resolve(serviceAccountPath));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.${process.env.FIREBASE_DATABASE_REGION || 'europe-west1'}.firebasedatabase.app`,
  });

  migrateChat(admin, coupleId)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}