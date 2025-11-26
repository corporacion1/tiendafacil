/* eslint-disable no-console */
// scripts/delete-mock-data.js
// Safe delete script for demo/mock data. Default: dry-run. Use --force to actually delete.

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGOURL || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('MONGO_URI not set in environment. Aborting.');
  process.exit(1);
}

const DRY_RUN = !process.argv.includes('--force');
const REPORT_PATH = path.join(__dirname, 'delete-mock-report.json');
const DATA_TS = path.join(__dirname, '..', 'src', 'lib', 'data.ts');

function extractIdsAndStore(fileText) {
  const ids = new Set();
  // Common ID pattern: ABC-1234567890123 or PRO-..., ADS-..., etc.
  const idRegex = /["']([A-Z]{2,5}-\d{10,16})["']/g;
  let m;
  while ((m = idRegex.exec(fileText))) ids.add(m[1]);

  // Also capture defaultStoreId constant if string literal
  const storeRegex = /export const defaultStoreId = .*?["']([^"']+)["']/;
  const storeMatch = fileText.match(storeRegex);
  const defaultStoreId = storeMatch ? storeMatch[1] : process.env.NEXT_PUBLIC_DEFAULT_STORE_ID || 'ST-1234567890123';

  // Also capture demo user uids that include '_demo_' or 'admin_demo'
  const uidRegex = /["']([a-zA-Z0-9_]*demo[a-zA-Z0-9_\-]*)["']/g;
  while ((m = uidRegex.exec(fileText))) ids.add(m[1]);

  return { ids: Array.from(ids), defaultStoreId };
}

async function main() {
  console.log(`Connecting to MongoDB (dryRun=${DRY_RUN})...`);
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const db = client.db();

  const fileText = fs.readFileSync(DATA_TS, 'utf8');
  const { ids, defaultStoreId } = extractIdsAndStore(fileText);

  console.log(`Found ${ids.length} candidate mock IDs and defaultStoreId='${defaultStoreId}'.`);

  // Candidate collections to scan
  const candidateCollections = [
    'stores','users','products','ads','customers','suppliers','units','families','warehouses','purchases','sales','orders','cashsessions','currencyrates','movements','inventorymovements','paymentmethods','payments'
  ];

  const report = { timestamp: new Date().toISOString(), dryRun: DRY_RUN, defaultStoreId, idCount: ids.length, results: [] };

  for (const collName of candidateCollections) {
    try {
      const coll = db.collection(collName);
      // Build queries to try for id fields
      const queries = [];
      // generic id field
      queries.push({ id: { $in: ids } });
      // uid
      queries.push({ uid: { $in: ids } });
      // storeId match
      queries.push({ storeId: defaultStoreId });

      const collResult = { collection: collName, checks: [] };

      for (const q of queries) {
        const count = await coll.countDocuments(q);
        collResult.checks.push({ query: q, count });
      }

      // Decide deletion only if --force and counts > 0
      if (!DRY_RUN) {
        // delete by id and uid first
        const del1 = await coll.deleteMany({ $or: [{ id: { $in: ids } }, { uid: { $in: ids } }] });
        const del2 = await coll.deleteMany({ storeId: defaultStoreId });
        collResult.deleted = del1.deletedCount + del2.deletedCount;
      }

      report.results.push(collResult);
    } catch (err) {
      report.results.push({ collection: collName, error: String(err) });
    }
  }

  // Save report
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Report written to ${REPORT_PATH}`);

  if (DRY_RUN) {
    console.log('Dry-run complete. No documents were deleted. To delete, re-run with --force');
  } else {
    console.log('Deletion complete. See report for details.');
  }

  await client.close();
}

main().catch(err => {
  console.error('Fatal error', err);
  process.exit(1);
});
