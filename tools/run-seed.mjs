import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function upsertUser(client, username, password, role, name, email, phone) {
  const hashed = await bcrypt.hash(password, 10);
  // Safe upsert: check existing user by username first
  const existing = await client.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await client.query('UPDATE users SET password=$1, role=$2, name=$3, email=$4, phone=$5, updated_at=NOW() WHERE id=$6', [hashed, role, name, email, phone, id]);
    return id;
  }
  const res = await client.query('INSERT INTO users (username, password, role, name, email, phone) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id', [username, hashed, role, name, email, phone]);
  return res.rows[0].id;
}

async function upsertScholar(client, userId, scholarId, batch, department) {
  // Safe upsert: check existing row first (some DBs may not have conflict index)
  const existing = await client.query('SELECT id FROM scholars WHERE user_id = $1', [userId]);
  if (existing.rows.length > 0) {
    const id = existing.rows[0].id;
    await client.query('UPDATE scholars SET scholar_id=$1, batch=$2, department=$3, updated_at=NOW() WHERE id=$4', [scholarId, batch, department, id]);
    return id;
  }
  const res = await client.query('INSERT INTO scholars (user_id, scholar_id, batch, department) VALUES ($1,$2,$3,$4) RETURNING id', [userId, scholarId, batch, department]);
  return res.rows[0].id;
}

async function assignSupervisor(client, scholarId, supervisorUserId, isPrimary=true) {
  const ex = await client.query('SELECT id FROM scholar_supervisors WHERE scholar_id=$1 AND supervisor_id=$2', [scholarId, supervisorUserId]);
  if (ex.rows.length === 0) {
    await client.query('INSERT INTO scholar_supervisors (scholar_id, supervisor_id, is_primary) VALUES ($1,$2,$3)', [scholarId, supervisorUserId, isPrimary]);
  }
}

async function assignRacMember(client, scholarId, userId, role) {
  const ex = await client.query('SELECT id FROM rac_members WHERE scholar_id=$1 AND user_id=$2 AND member_role=$3', [scholarId, userId, role]);
  if (ex.rows.length === 0) {
    await client.query('INSERT INTO rac_members (scholar_id, user_id, member_role) VALUES ($1,$2,$3)', [scholarId, userId, role]);
  }
}

async function createApplication(client, scholarId, type, details) {
  const res = await client.query(
    `INSERT INTO applications (scholar_id, type, details)
     VALUES ($1,$2,$3) RETURNING id`,
    [scholarId, type, JSON.stringify(details)]
  );
  return res.rows[0].id;
}

async function createResearchProgress(client, scholarId, completed, pending, pubs) {
  const existing = await client.query('SELECT id FROM research_progress WHERE scholar_id=$1', [scholarId]);
  if (existing.rows.length > 0) {
    await client.query('UPDATE research_progress SET completed_reviews=$1, pending_reports=$2, publications=$3, last_review_date=NOW() WHERE scholar_id=$4', [completed, pending, pubs, scholarId]);
  } else {
    await client.query('INSERT INTO research_progress (scholar_id, completed_reviews, pending_reports, publications) VALUES ($1,$2,$3,$4)', [scholarId, completed, pending, pubs]);
  }
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding users...');
    const scholar1Uid = await upsertUser(client, 'scholar1', 'password123', 'scholar', 'Thirupathi Kumar', 'thirupathi@gitam.in', '9876543210');
    const scholar2Uid = await upsertUser(client, 'scholar2', 'password123', 'scholar', 'Priya Reddy', 'priya.reddy@gitam.in', '9876543220');
    const supervisorUid = await upsertUser(client, 'supervisor1', 'password123', 'supervisor', 'Dr. Ramesh Kumar', 'ramesh.kumar@gitam.edu', '9876543230');
    const drcUid = await upsertUser(client, 'drc1', 'password123', 'drc', 'Dr. Lakshmi Narayana', 'lakshmi.drc@gitam.edu', '9876543240');
    const ircUid = await upsertUser(client, 'irc1', 'password123', 'irc', 'Dr. Venkatesh Rao', 'venkatesh.irc@gitam.edu', '9876543250');
    const doaaUid = await upsertUser(client, 'doaa1', 'password123', 'doaa', 'Prof. Srinivas Reddy', 'srinivas.doaa@gitam.edu', '9876543260');

    console.log('Ensuring scholar profiles...');
    const scholar1Id = await upsertScholar(client, scholar1Uid, 'PHD2020001', '2020-2021', 'Computer Science and Engineering');
    const scholar2Id = await upsertScholar(client, scholar2Uid, 'PHD2021002', '2021-2022', 'Electronics and Communication');

    console.log('Assign supervisors and RAC members...');
    await assignSupervisor(client, scholar1Id, supervisorUid, true);
    await assignRacMember(client, scholar1Id, drcUid, 'drc');
    await assignRacMember(client, scholar1Id, ircUid, 'irc');
    await assignRacMember(client, scholar1Id, doaaUid, 'doaa');

    console.log('Creating sample application and research progress...');
    await createApplication(client, scholar1Id, 'Extension', {
      candidateName: 'Thirupathi Kumar', registrationDate: '15-08-2020', durationEligible: '5 years', extensionDuration: '6 months', reason: 'Additional time needed', timeline: 'Complete experiments by June 2026'
    });

    await createResearchProgress(client, scholar1Id, 4, 1, 3);
    await createResearchProgress(client, scholar2Id, 2, 0, 1);

    await client.query('COMMIT');
    console.log('Seeding complete.');

    // verify counts
    const counts = await client.query(`SELECT
      (SELECT COUNT(*) FROM users) as users_count,
      (SELECT COUNT(*) FROM scholars) as scholars_count,
      (SELECT COUNT(*) FROM scholar_supervisors) as sup_count,
      (SELECT COUNT(*) FROM rac_members) as rac_count,
      (SELECT COUNT(*) FROM applications) as apps_count,
      (SELECT COUNT(*) FROM research_progress) as prog_count`);
    console.log('Counts:', counts.rows[0]);
  } catch (err) {
    console.error('Seeding failed, rolling back:', err.message || err);
    try { await client.query('ROLLBACK'); } catch (e) { console.error('Rollback error', e.message); }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
