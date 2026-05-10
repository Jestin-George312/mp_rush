/**
 * APMS AI Engine Feature Test (Phase 8 from FEATURE_WALKTHROUGH.md)
 * Tests all AI endpoints: risk, alerts, allocation, monitoring, approval, analytics, config
 * Uses IDs from the main test: DEPT=6 BATCH=4 COORD=42 GUIDE1=43 STUDENT1=48
 */
const http = require('http');
const AI = 'http://localhost:8000';
const R = { pass: 0, fail: 0, errors: [] };

// IDs from the core test run
const DEPT_ID = 6, BATCH_ID = 4, COORD_UID = 42, GUIDE1_ID = 43, STUDENT1_ID = 48;

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, AI);
    const opts = { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers: { 'Content-Type': 'application/json' } };
    const r = http.request(opts, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve({s:res.statusCode,d:JSON.parse(d||'{}')})}catch{resolve({s:res.statusCode,d})} }); });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function ok(name, cond, detail) {
  if (cond) { R.pass++; console.log(`  ✅ ${name}`); }
  else { R.fail++; R.errors.push(name); console.log(`  ❌ ${name} — ${detail||'FAILED'}`); }
}

async function run() {
  console.log('\n═══════════════════════════════════════');
  console.log('   APMS AI ENGINE FEATURE TEST');
  console.log('═══════════════════════════════════════\n');

  let r;

  // Health check
  r = await api('GET', '/health');
  ok('AI Health check', r.s===200 && r.d.status==='UP', `s=${r.s} ${JSON.stringify(r.d).slice(0,80)}`);

  // ── F3: Risk Scoring ──
  console.log('\n── F3: Risk Scoring ──');
  r = await api('POST', '/api/ai/risk/compute');
  ok('Step 37: Compute risk scores', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', '/api/ai/risk/projects');
  ok('Step 37: At-risk projects', r.s===200 && Array.isArray(r.d), `s=${r.s}`);

  r = await api('GET', `/api/ai/risk/my-groups/${GUIDE1_ID}`);
  ok('Step 38: Guide group risks', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', `/api/ai/risk/student/${STUDENT1_ID}`);
  ok('Step 39: Student risk profile', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', '/api/ai/risk/trends?days=30');
  ok('Step 40: Risk trends', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  // ── F4: Alerts ──
  console.log('\n── F4: Alerts ──');
  r = await api('POST', '/api/ai/scheduler/trigger/alerts');
  ok('Step 41: Generate alerts', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', `/api/ai/alerts/${GUIDE1_ID}`);
  ok('Step 41: Guide alerts', r.s===200 && Array.isArray(r.d), `s=${r.s}`);

  r = await api('GET', `/api/ai/alerts/${GUIDE1_ID}/count`);
  ok('Step 42: Unread count', r.s===200, `s=${r.s} ${JSON.stringify(r.d)}`);

  const alerts = Array.isArray(r.d) ? r.d : [];
  // Try to get an alert ID from the guide's alerts
  const alertList = await api('GET', `/api/ai/alerts/${GUIDE1_ID}`);
  const firstAlert = Array.isArray(alertList.d) && alertList.d.length > 0 ? alertList.d[0] : null;
  if (firstAlert) {
    r = await api('PATCH', `/api/ai/alerts/${firstAlert.id}/read`);
    ok('Step 42: Mark alert read', r.s===200, `s=${r.s}`);
  }

  r = await api('PATCH', `/api/ai/alerts/${GUIDE1_ID}/read-all`);
  ok('Step 42: Mark all read', r.s===200, `s=${r.s}`);

  // ── F1: Guide Allocation ──
  console.log('\n── F1: Guide Allocation ──');
  r = await api('GET', `/api/ai/allocation/suggest/${BATCH_ID}`);
  ok('Step 43: Allocation suggestions', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('POST', `/api/ai/allocation/auto/${BATCH_ID}`);
  ok('Step 44: Auto-allocate', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', '/api/ai/allocation/workload');
  ok('Step 45: Workload distribution', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  // ── F2: Monitoring ──
  console.log('\n── F2: Monitoring ──');
  r = await api('GET', `/api/ai/monitoring/department/${DEPT_ID}`);
  ok('Step 46: Department overview', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', `/api/ai/monitoring/batch-comparison/${DEPT_ID}`);
  ok('Step 47: Batch comparison', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', `/api/ai/monitoring/compliance/${BATCH_ID}`);
  ok('Step 48: Compliance report', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', `/api/ai/monitoring/phase-progress/${BATCH_ID}`);
  ok('Step 49: Phase-wise progress', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  // ── F5: Auto-Approval ──
  console.log('\n── F5: Auto-Approval ──');
  r = await api('GET', `/api/ai/approval/eligible/${BATCH_ID}`);
  ok('Step 50: Approval eligibility', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  // ── F6: Analytics ──
  console.log('\n── F6: Analytics ──');
  r = await api('GET', '/api/ai/analytics/guide-effectiveness');
  ok('Step 51: Guide effectiveness', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', '/api/ai/analytics/domain-distribution');
  ok('Step 52: Domain distribution', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', `/api/ai/analytics/forecast/${BATCH_ID}`);
  ok('Step 53: Completion forecast', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', '/api/ai/analytics/workload-fairness');
  ok('Step 54: Workload fairness', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', `/api/ai/analytics/submission-funnel/${BATCH_ID}`);
  ok('Step 55: Submission funnel', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', `/api/ai/analytics/batch-health/${DEPT_ID}`);
  ok('Batch health matrix', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  // ── F7: Config & Audit ──
  console.log('\n── F7: Config & Audit ──');
  r = await api('GET', '/api/ai/config');
  ok('Step 56: View config', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('GET', '/api/ai/audit-log');
  ok('Step 57: Audit log', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,80)}`);

  // ── Scheduler triggers ──
  console.log('\n── Scheduler Manual Triggers ──');
  r = await api('POST', '/api/ai/scheduler/trigger/risk_scoring');
  ok('Trigger risk scoring', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  r = await api('POST', '/api/ai/scheduler/trigger/predictions');
  ok('Trigger predictions', r.s===200, `s=${r.s} ${JSON.stringify(r.d).slice(0,100)}`);

  // ═══ SUMMARY ═══
  console.log('\n═══════════════════════════════════════');
  console.log(`  AI RESULTS: ✅ ${R.pass} passed | ❌ ${R.fail} failed`);
  console.log('═══════════════════════════════════════');
  if (R.errors.length) { console.log('\nFailed:'); R.errors.forEach(e=>console.log(`  - ${e}`)); }
}

run().catch(e=>{console.error('FATAL:',e);process.exit(1)});
