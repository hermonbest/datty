const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const https = require('https');

const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('serviceAccountKey.json not found');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
const projectId = serviceAccount.project_id;
// Default Realtime Database instance name. Override with env var if yours differs.
const databaseName = process.env.FIREBASE_DATABASE_NAME || `${projectId}-default-rtdb`;
// Region of the RTDB instance (from the Firebase console / the deploy error's correctUrl).
const databaseRegion = process.env.FIREBASE_DATABASE_REGION || 'europe-west1';

const { syncTime } = require('./timeSync');

async function getAccessToken() {
  await syncTime();
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  const tokenObj = await admin.credential.cert(serviceAccount).getAccessToken();
  return tokenObj.access_token;
}

function requestPromise(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject({ status: res.statusCode, body: parsed });
          }
        } catch (e) {
          reject({ status: res.statusCode, text: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function deployRules() {
  console.log(`Deploying database.rules.json → ${databaseName} ...`);
  const token = await getAccessToken();
  const rulesContent = fs.readFileSync(path.join(__dirname, '../database.rules.json'), 'utf8');

  // Official RTDB REST endpoint for setting rules on an instance:
  //   PUT https://<dbname>.<region>.firebasedatabase.app/.settings/rules.json
  const options = {
    hostname: `${databaseName}.${databaseRegion}.firebasedatabase.app`,
    path: `/.settings/rules.json?access_token=${token}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(rulesContent),
    },
  };

  const res = await requestPromise(options, rulesContent);
  console.log('Success:', JSON.stringify(res));
  console.log('Realtime Database rules deployed successfully!');
}

deployRules()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error deploying database rules:', JSON.stringify(err, null, 2));
    process.exit(1);
  });