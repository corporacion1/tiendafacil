/* eslint-disable no-console */
// scripts/delete-mock-ads.js
// Delete only mock ADS defined in src/lib/data.ts
// Usage:
//  - Dry run (default): node scripts/delete-mock-ads.js
//  - Delete for real: node scripts/delete-mock-ads.js --force

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGOURL || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set in environment. Aborting.');
  process.exit(1);
}

const DRY_RUN = !process.argv.includes('--force');
const BACKUP_DIR = path.join(__dirname);
const DATA_TS = path.join(__dirname, '..', 'src', 'lib', 'data.ts');

function extractMockAdIds(fileText) {
  const ids = new Set();
  // Look for id: "ADS-..." or id: 'ADS-...'
  const idRegex = /id\s*:\s*["'](ADS-[0-9A-Za-z\-_]*)["']/g;
  let m;
  while ((m = idRegex.exec(fileText))) ids.add(m[1]);
  return Array.from(ids);
}

async function main() {
  console.log(`Connecting to MongoDB (dryRun=${DRY_RUN})...`);
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db();

  if (!fs.existsSync(DATA_TS)) {
    console.error(`Could not find ${DATA_TS}`);
    process.exit(1);
  }
  const fileText = fs.readFileSync(DATA_TS, 'utf8');
  const adIds = extractMockAdIds(fileText);

  if (!adIds.length) {
    console.log('No mock ADS IDs found in src/lib/data.ts. Nothing to do.');
    await client.close();
    return;
  }

  console.log(`Found ${adIds.length} mock ADS IDs. Preview:\n  ${adIds.slice(0, 50).join(', ')}`);

  const adsColl = db.collection('ads');
  const matching = await adsColl.find({ id: { $in: adIds } }).toArray();
  console.log(`Matched ${matching.length} documents in 'ads' collection.`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `mock-ads-backup-${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify({ timestamp: new Date().toISOString(), ids: adIds, matchedCount: matching.length, docs: matching }, null, 2), 'utf8');
  console.log(`Wrote backup of matched docs to ${backupPath}`);

  const reportPath = path.join(BACKUP_DIR, `delete-mock-ads-report-${timestamp}.json`);
  const report = { timestamp: new Date().toISOString(), dryRun: DRY_RUN, adIds, matchedCount: matching.length };

  if (DRY_RUN) {
    report.note = 'Dry run: no documents were deleted. Re-run with --force to delete.';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Dry-run complete. Report written to ${reportPath}`);
  } else {
    // perform deletion
    const delResult = await adsColl.deleteMany({ id: { $in: adIds } });
    report.deletedCount = delResult.deletedCount;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Deletion complete. deletedCount=${delResult.deletedCount}. Report written to ${reportPath}`);
  }

  await client.close();
}

main().catch(err => {
  console.error('Fatal error', err);
  process.exit(1);
});
