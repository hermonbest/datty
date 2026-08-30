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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function getAccessToken() {
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
          resolve({ status: res.statusCode, text: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function deployRules() {
  console.log(`Deploying storage.rules to project: ${projectId}...`);
  const token = await getAccessToken();
  const rulesContent = fs.readFileSync(path.join(__dirname, '../storage.rules'), 'utf8');

  // 1. Create ruleset
  const createRulesetOptions = {
    hostname: 'firebaserules.googleapis.com',
    path: `/v1/projects/${projectId}/rulesets`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const rulesetBody = {
    source: {
      files: [
        {
          name: 'storage.rules',
          content: rulesContent,
        },
      ],
    },
  };

  const rulesetRes = await requestPromise(createRulesetOptions, rulesetBody);
  console.log('Created ruleset:', rulesetRes.name);

  // 2. Update release to point to new ruleset
  const releaseName = `projects/${projectId}/releases/cloud.storage`;
  const updateReleaseOptions = {
    hostname: 'firebaserules.googleapis.com',
    path: `/v1/${releaseName}`,
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const releaseBody = {
    release: {
      name: releaseName,
      rulesetName: rulesetRes.name,
    },
  };

  const releaseRes = await requestPromise(updateReleaseOptions, releaseBody);
  console.log('Successfully updated release cloud.storage to new ruleset!');
  console.log('Storage rules deployed successfully!');
}

deployRules()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error deploying storage rules:', JSON.stringify(err, null, 2));
    process.exit(1);
  });
