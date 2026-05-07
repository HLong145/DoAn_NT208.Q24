/**
 * Seed script: insert 10 000 fake users + tweets + follow relationships
 * Run from Evolix_backend folder: node seed-10k.mjs
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const DB = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'yuwkaa',
  password: process.env.DB_PASSWORD ?? 'yuwkaapassword',
  database: process.env.DB_NAME ?? 'evolix_db',
};

const TOTAL_USERS    = 10_000;
const TWEETS_PER_USER = 3;
const FOLLOWS_PER_USER = 10;
const BATCH = 500;

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

const SAMPLE_CONTENT = [
  'Hello world! #evolix',
  'Just posted something cool 🚀',
  'What a great day to be alive!',
  'Testing the feed with 10k users',
  'Loving this platform #webdev',
  'Another day another tweet',
  'Check out my latest post!',
  '#trending #viral post here',
  'Having a great time on Evolix!',
  'Another great post today!',
];

async function main() {
  console.log('Connecting to DB…');
  const conn = await mysql.createConnection(DB);

  const [[{ cnt }]] = await conn.query('SELECT COUNT(*) as cnt FROM user');
  console.log(`Existing users: ${cnt}`);

  if (Number(cnt) >= TOTAL_USERS) {
    console.log('Already have 10k+ users. Run cleanup first if you want to reseed.');
    await conn.end();
    return;
  }

  const toInsert = TOTAL_USERS - Number(cnt);
  console.log(`Inserting ${toInsert} new users in batches of ${BATCH}…`);

  // Pre-hash password once — avoids bcrypt running 10k times (would take ~16 minutes)
  const hashedPw = await bcrypt.hash('Password123!', 10);
  const insertedIds = [];

  for (let i = 0; i < toInsert; i += BATCH) {
    const batchSize = Math.min(BATCH, toInsert - i);
    const placeholders = [];
    const params = [];

    for (let j = 0; j < batchSize; j++) {
      const idx = Number(cnt) + i + j + 1;
      const handle = `seed_user_${idx}`;
      placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
      params.push(
        handle,
        `seed${idx}@evolix.test`,
        hashedPw,
        `Seed User ${idx}`,
        `https://i.pravatar.cc/150?u=${handle}`,
        `https://picsum.photos/seed/${handle}/1200/400`,
        1,
        new Date(),
      );
    }

    const [result] = await conn.query(
      `INSERT INTO user (username, email, password, displayName, avatarUrl, headerUrl, isActive, createdAt)
       VALUES ${placeholders.join(',')}`,
      params,
    );

    for (let k = 0; k < batchSize; k++) insertedIds.push(result.insertId + k);
    process.stdout.write(`\r  Users: ${Math.min(Number(cnt) + i + batchSize, TOTAL_USERS)} / ${TOTAL_USERS}`);
  }
  console.log('\n✅ Users done.');

  // Tweets
  console.log(`Inserting tweets (~${insertedIds.length * TWEETS_PER_USER} total)…`);
  let tweetsTotal = 0;

  for (let i = 0; i < insertedIds.length; i += BATCH) {
    const slice = insertedIds.slice(i, i + BATCH);
    const placeholders = [];
    const params = [];

    for (const uid of slice) {
      for (let t = 0; t < TWEETS_PER_USER; t++) {
        const content = pick(SAMPLE_CONTENT);
        const daysAgo = rand(0, 90);
        const createdAt = new Date(Date.now() - daysAgo * 86_400_000);
        placeholders.push('(?, ?, ?, ?, ?, ?)');
        params.push(uid, content, 0, 0, false, createdAt);
      }
    }

    await conn.query(
      `INSERT INTO tweet (userId, content, likeCount, commentCount, isRetweet, createdAt)
       VALUES ${placeholders.join(',')}`,
      params,
    );

    tweetsTotal += slice.length * TWEETS_PER_USER;
    process.stdout.write(`\r  Tweets: ${tweetsTotal}`);
  }
  console.log('\n✅ Tweets done.');

  // Follows
  console.log(`Inserting follow relationships (~${insertedIds.length * FOLLOWS_PER_USER} total)…`);
  let followsTotal = 0;

  for (let i = 0; i < insertedIds.length; i += BATCH) {
    const slice = insertedIds.slice(i, i + BATCH);
    const placeholders = [];
    const params = [];

    for (const uid of slice) {
      const targets = new Set();
      while (targets.size < FOLLOWS_PER_USER) {
        const t = insertedIds[rand(0, insertedIds.length - 1)];
        if (t !== uid) targets.add(t);
      }
      for (const tid of targets) {
        placeholders.push('(?, ?)');
        params.push(uid, tid);
      }
    }

    if (placeholders.length > 0) {
      await conn.query(
        `INSERT IGNORE INTO follow (followerId, followingId) VALUES ${placeholders.join(',')}`,
        params,
      );
      followsTotal += placeholders.length;
    }

    process.stdout.write(`\r  Follows: ${followsTotal}`);
  }
  console.log('\n✅ Follows done.');

  await conn.end();
  console.log('\n🎉 Seed complete!');
  console.log(`   Total users:   ${TOTAL_USERS}`);
  console.log(`   Total tweets:  ~${insertedIds.length * TWEETS_PER_USER}`);
  console.log(`   Total follows: ~${followsTotal}`);
}

main().catch((err) => { console.error(err); process.exit(1); });