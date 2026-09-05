const https = require('https');

async function syncTime() {
  return new Promise((resolve) => {
    const req = https.get('https://www.google.com', (res) => {
      if (res.headers.date) {
        const serverTime = new Date(res.headers.date).getTime();
        const delta = serverTime - Date.now();
        if (Math.abs(delta) > 10000) {
          console.log(`[TimeSync] Adjusting system clock skew by ${delta}ms (${(delta / 3600000).toFixed(2)} hours)...`);
          const OrigDate = Date;
          function PatchedDate(...args) {
            if (args.length === 0) return new OrigDate(OrigDate.now() + delta);
            return new OrigDate(...args);
          }
          PatchedDate.prototype = OrigDate.prototype;
          PatchedDate.now = () => OrigDate.now() + delta;
          PatchedDate.parse = OrigDate.parse;
          PatchedDate.UTC = OrigDate.UTC;
          global.Date = PatchedDate;
        }
      }
      resolve();
    });
    req.on('error', (e) => {
      console.warn('[TimeSync] Warning: Could not reach google.com to verify clock skew:', e.message);
      resolve();
    });
    req.setTimeout(3000, () => {
      req.destroy();
      resolve();
    });
  });
}

module.exports = { syncTime };
