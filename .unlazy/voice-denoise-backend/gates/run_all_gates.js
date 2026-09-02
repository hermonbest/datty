const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('======================================================');
console.log('  RUNNING UNLAZY VERIFICATION GATES: VOICE DENOISE   ');
console.log('======================================================\n');

const backendDir = path.resolve(__dirname, '../../../backend');

function runTest(name, command, args, cwd = backendDir) {
  process.stdout.write(`[TEST] ${name} ... `);
  const res = spawnSync(command, args, {
    cwd,
    encoding: 'utf-8',
    shell: true,
  });

  if (res.status === 0) {
    console.log('PASSED [OK]');
    return { passed: true, output: res.stdout };
  } else {
    console.log('FAILED [X]');
    console.error(res.stderr || res.stdout);
    return { passed: false, error: res.stderr || res.stdout };
  }
}

let passedCount = 0;
let totalGates = 7;

// GATE-1: Health & Boot Endpoints
console.log('\n--- GATE-1: Health & Boot ---');
const gate1 = runTest('Server health endpoints test', 'npx', ['jest', 'tests/server.test.ts', '-t', 'Health Endpoints']);
if (gate1.passed) passedCount++;

// GATE-2: Auth Enforcement
console.log('\n--- GATE-2: Auth Enforcement ---');
const gate2 = runTest('Firebase Auth token verification tests', 'npx', ['jest', 'tests/auth.test.ts']);
if (gate2.passed) passedCount++;

// GATE-3: Input & URL Validation
console.log('\n--- GATE-3: Input & URL Validation ---');
const gate3 = runTest('Zod schema & Cloudinary URL validation tests', 'npx', ['jest', 'tests/validation.test.ts']);
if (gate3.passed) passedCount++;

// GATE-4: Audio Denoise Pipeline
console.log('\n--- GATE-4: Audio Denoise Pipeline ---');
const gate4 = runTest('FFmpeg afftdn & loudnorm audio pipeline tests', 'npx', ['jest', 'tests/processAudio.test.ts', '-t', 'process audio']);
if (gate4.passed) passedCount++;

// GATE-5: Safe Cleanup
console.log('\n--- GATE-5: Safe Cleanup ---');
const gate5 = runTest('Temporary file guaranteed cleanup tests', 'npx', ['jest', 'tests/processAudio.test.ts', '-t', 'cleanup']);
if (gate5.passed) passedCount++;

// GATE-6: Cloudinary Signed Upload & End-to-End Processing
console.log('\n--- GATE-6: Cloudinary Signed Upload & Processing ---');
const gate6 = runTest('End-to-end processing & upload mock tests', 'npx', ['jest', 'tests/server.test.ts', '-t', 'process audio successfully']);
if (gate6.passed) passedCount++;

// GATE-7: Container & Config Safety
console.log('\n--- GATE-7: Container & Config Safety ---');
const dockerfileExists = fs.existsSync(path.join(backendDir, 'Dockerfile'));
const dockerignoreExists = fs.existsSync(path.join(backendDir, '.dockerignore'));
const composeExists = fs.existsSync(path.join(backendDir, 'docker-compose.yml'));
const dockerignoreContent = dockerignoreExists ? fs.readFileSync(path.join(backendDir, '.dockerignore'), 'utf-8') : '';
const secretsExcluded = dockerignoreContent.includes('serviceAccountKey.json') && dockerignoreContent.includes('.env');

if (dockerfileExists && dockerignoreExists && composeExists && secretsExcluded) {
  console.log('[TEST] Dockerfile, docker-compose, and secret exclusion rules ... PASSED [OK]');
  passedCount++;
} else {
  console.log('[TEST] Container configuration safety check ... FAILED [X]');
}

console.log('\n======================================================');
console.log(`  GATES CERTIFICATION SUMMARY: ${passedCount} / ${totalGates} PASSED`);
console.log('======================================================\n');

if (passedCount === totalGates) {
  console.log('ALL VERIFICATION GATES PASSED! Implementation certified.');
  process.exit(0);
} else {
  console.error('Some gates failed. Check errors above.');
  process.exit(1);
}
