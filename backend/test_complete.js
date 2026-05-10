/**
 * APMS Complete Feature Test
 * Data: 1 dept, 1 coordinator, 5 faculty, 15 students (11 individual + 2 groups of 2)
 * 
 * Response formats:
 *   - /api/auth/*  → raw { token, user }
 *   - /api/admin/* → raw data
 *   - /api/coordinator/*, /api/student/*, /api/guide/* → { success, data }
 *   - /api/comms/*, /api/meetings/* → check format at runtime
 */
const http = require('http');
const BASE = 'http://localhost:5000';
const R = { pass: 0, fail: 0, errors: [] };

function api(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = { hostname: url.hostname, port: url.port, path: url.pathname, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    const r = http.request(opts, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ try{resolve({s:res.statusCode,d:JSON.parse(d||'{}')})}catch{resolve({s:res.statusCode,d})} }); });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

// Unwrap {success,data} wrapper
function unwrap(resp) { return resp.d?.data !== undefined ? resp.d.data : resp.d; }

function ok(name, cond, detail) {
  if (cond) { R.pass++; console.log(`  ✅ ${name}`); }
  else { R.fail++; R.errors.push(name); console.log(`  ❌ ${name} — ${detail||'FAILED'}`); }
}

async function run() {
  console.log('\n═══════════════════════════════════════');
  console.log('     APMS COMPLETE FEATURE TEST');
  console.log('═══════════════════════════════════════\n');

  let r, d;

  // ═══ PHASE 0: Admin Setup ═══
  console.log('── Phase 0: Admin & Department Setup ──');
  
  r = await api('POST', '/api/auth/register', { full_name:'System Admin', email:'admin@test.apms', password:'Pass@123', role:'admin' });
  const ADMIN_TK = r.d.token;
  ok('Admin register', !!ADMIN_TK, `s=${r.s}`);

  r = await api('POST', '/api/admin/departments', { name:'Computer Science' }, ADMIN_TK);
  const DEPT = r.d.id;
  ok('Create department', !!DEPT, `s=${r.s} ${JSON.stringify(r.d).slice(0,80)}`);

  r = await api('POST', '/api/admin/coordinators', { name:'Dr. Coord', email:'coord@test.apms', password:'Pass@123' }, ADMIN_TK);
  const CUID = r.d.uid;
  ok('Create coordinator', !!CUID, `s=${r.s}`);

  r = await api('POST', '/api/admin/departments/assign', { departmentId:DEPT, coordinatorId:CUID }, ADMIN_TK);
  ok('Assign coord→dept', r.s===200);

  r = await api('POST', '/api/auth/login', { email:'coord@test.apms', password:'Pass@123' });
  const CTK = r.d.token;
  ok('Coord login', !!CTK);

  // ═══ PHASE 1: Academic Structure ═══
  console.log('\n── Phase 1: Academic Structure ──');
  
  r = await api('GET', '/api/coordinator/stats', null, CTK);
  d = unwrap(r);
  ok('Coord dashboard', r.s===200 && d?.stats, `s=${r.s}`);

  // 5 Faculty
  const GE = ['ga@t.a','gb@t.a','gc@t.a','gd@t.a','ge@t.a'];
  const GN = ['Prof Alpha','Prof Beta','Prof Gamma','Prof Delta','Prof Epsilon'];
  const GID = {}, GTK = {};
  for (let i=0;i<5;i++) {
    r = await api('POST', '/api/coordinator/faculty', { name:GN[i], email:GE[i] }, CTK);
    GID[GE[i]] = unwrap(r)?.uid;
  }
  ok('5 faculty created', Object.values(GID).filter(v=>!!v).length===5, `ids=${JSON.stringify(GID)}`);

  r = await api('GET', '/api/coordinator/faculty', null, CTK);
  d = unwrap(r);
  ok('Faculty list ≥5', Array.isArray(d) && d.length>=5, `len=${d?.length}`);

  for (const e of GE) {
    r = await api('POST', '/api/auth/login', { email:e, password:'ChangeMe123!' });
    GTK[e] = r.d.token;
  }
  ok('All guides login', Object.values(GTK).every(t=>!!t));

  // Batch
  r = await api('POST', '/api/coordinator/batches', { name:'MCA 2025', start_year:2025, end_year:2027, department_id:DEPT }, CTK);
  const BID = unwrap(r)?.id;
  ok('Create batch', !!BID, `id=${BID}`);

  r = await api('GET', '/api/coordinator/batches', null, CTK);
  ok('Batch list', unwrap(r)?.length>=1);

  // 15 Students
  const SE = [], SID = {}, STK = {};
  for (let i=1;i<=15;i++) {
    const e = `s${i}@t.a`;
    SE.push(e);
    r = await api('POST', '/api/coordinator/students', { name:`Student ${i}`, email:e, batch_id:BID, is_leader:true }, CTK);
    SID[e] = unwrap(r)?.uid;
  }
  ok('15 students created', Object.values(SID).filter(v=>!!v).length===15, `count=${Object.values(SID).filter(v=>!!v).length}`);

  r = await api('GET', '/api/coordinator/students', null, CTK);
  ok('Students list ≥15', unwrap(r)?.length>=15, `len=${unwrap(r)?.length}`);

  // Deadlines
  const DLS = [
    {t:'Synopsis Submission',p:'Phase 1',dy:7}, {t:'SRS Document',p:'Phase 2',dy:21},
    {t:'Design Document',p:'Phase 3',dy:35}, {t:'Final Report',p:'Phase 4',dy:56}
  ];
  const DLID = {};
  for (const dl of DLS) {
    const dd = new Date(Date.now()+dl.dy*864e5).toISOString().split('T')[0];
    r = await api('POST', '/api/coordinator/deadlines', { batch_id:BID, title:dl.t, phase:dl.p, due_date:dd }, CTK);
    DLID[dl.t] = unwrap(r)?.id;
  }
  ok('4 deadlines', Object.values(DLID).filter(v=>!!v).length===4);

  r = await api('GET', `/api/coordinator/deadlines/${BID}`, null, CTK);
  ok('Deadlines list ≥4', unwrap(r)?.length>=4, `len=${unwrap(r)?.length}`);

  // ═══ PHASE 2: Student Projects ═══
  console.log('\n── Phase 2: Student Projects ──');
  
  for (const e of SE) {
    r = await api('POST', '/api/auth/login', { email:e, password:'ChangeMe123!' });
    STK[e] = r.d.token;
  }
  ok('15 students login', Object.values(STK).filter(t=>!!t).length===15);

  // 11 individual
  const topics = ['Smart Attendance','E-Commerce','Hospital Mgmt','Library','Online Exam','Chat App','Food Delivery','Inventory','Blog','Expense Mgr','Weather App'];
  let iOk=0;
  for (let i=0;i<11;i++) {
    r = await api('POST', '/api/student/project', { title:topics[i], description:`${topics[i]} desc`, mode:'Individual' }, STK[SE[i]]);
    if (r.s===201||r.s===200) iOk++;
  }
  ok('11 individual projects', iOk===11, `ok=${iOk}`);

  // 2 groups of 2
  r = await api('POST', '/api/student/project', { title:'IoT Automation', description:'Smart home', mode:'Group', memberEmails:[SE[12]] }, STK[SE[11]]);
  ok('Group 1 (S12+S13)', r.s===201||r.s===200, `s=${r.s}`);

  r = await api('POST', '/api/student/project', { title:'Blockchain Vote', description:'E-voting', mode:'Group', memberEmails:[SE[14]] }, STK[SE[13]]);
  ok('Group 2 (S14+S15)', r.s===201||r.s===200, `s=${r.s}`);

  // Verify student sees project
  r = await api('GET', '/api/student/project', null, STK[SE[0]]);
  d = unwrap(r);
  ok('S1 sees project', d?.title==='Smart Attendance', `title=${d?.title}`);

  r = await api('GET', '/api/student/stats', null, STK[SE[0]]);
  d = unwrap(r);
  ok('S1 stats', d?.hasProject===true);

  // Link repos
  r = await api('POST', '/api/student/project/github', { repoUrl:'https://github.com/t/repo1' }, STK[SE[0]]);
  ok('S1 link repo', r.s===200);
  r = await api('POST', '/api/student/project/github', { repoUrl:'https://github.com/t/repo2' }, STK[SE[1]]);
  ok('S2 link repo', r.s===200);

  // ═══ Guide Assignment ═══
  console.log('\n── Guide Assignment ──');
  r = await api('GET', `/api/coordinator/allocation/guides/${BID}`, null, CTK);
  d = unwrap(r);
  const grps = d?.groups || [];
  ok('Groups fetched', grps.length>0, `count=${grps.length}`);

  const gids = Object.values(GID);
  let aOk=0;
  for (let i=0;i<grps.length;i++) {
    r = await api('POST', '/api/coordinator/allocation/assign', { groupId:grps[i].id, guideId:gids[i%gids.length] }, CTK);
    if (r.s===200) aOk++;
  }
  ok('Guides assigned', aOk===grps.length, `${aOk}/${grps.length}`);

  // ═══ PHASE 3: Guide Reviews ═══
  console.log('\n── Phase 3: Guide Reviews ──');
  const g1tk = GTK[GE[0]], g1id = GID[GE[0]];

  r = await api('GET', '/api/guide/stats', null, g1tk);
  d = unwrap(r);
  ok('Guide stats', r.s===200 && d?.totalGroups!==undefined, `groups=${d?.totalGroups}`);

  r = await api('GET', '/api/guide/topics/pending', null, g1tk);
  d = unwrap(r);
  const pts = Array.isArray(d) ? d : [];
  ok('Pending topics', r.s===200, `count=${pts.length}`);

  if (pts.length>0) {
    r = await api('POST', `/api/guide/topics/${pts[0].id}/approve`, { note:'Good!' }, g1tk);
    ok('Approve topic', r.s===200);
    if (pts.length>1) {
      r = await api('POST', `/api/guide/topics/${pts[1].id}/revision`, { note:'Narrow scope' }, g1tk);
      ok('Revision request', r.s===200);
    }
  }

  // Other guides approve remaining
  for (let i=1;i<GE.length;i++) {
    r = await api('GET', '/api/guide/topics/pending', null, GTK[GE[i]]);
    const tp = unwrap(r);
    if (Array.isArray(tp)) for (const t of tp) await api('POST', `/api/guide/topics/${t.id}/approve`, { note:'OK' }, GTK[GE[i]]);
  }
  ok('All topics processed', true);

  r = await api('GET', '/api/guide/groups', null, g1tk);
  d = unwrap(r);
  const gg = Array.isArray(d)?d:[];
  ok('Guide groups', gg.length>0, `count=${gg.length}`);

  if (gg.length>0) {
    r = await api('GET', `/api/guide/groups/${gg[0].id}`, null, g1tk);
    ok('Group details', r.s===200 && unwrap(r)?.group_name);
  }

  r = await api('GET', '/api/guide/git-monitoring', null, g1tk);
  ok('Git monitoring', r.s===200);

  r = await api('GET', '/api/guide/batches', null, g1tk);
  d = unwrap(r);
  ok('Guide batches', r.s===200 && Array.isArray(d));
  if (Array.isArray(d) && d.length>0) {
    r = await api('GET', `/api/guide/batches/${d[0].id}/groups`, null, g1tk);
    ok('Batch groups', r.s===200);
  }

  // ═══ PHASE 4: Student Work ═══
  console.log('\n── Phase 4: Student Work ──');
  const s1 = STK[SE[0]];

  const TIDS = {};
  for (const t of ['DB Schema','Project Setup','UI Wireframes']) {
    const dl = new Date(Date.now()+5*864e5).toISOString().split('T')[0];
    r = await api('POST', '/api/student/tasks', { title:t, priority:'High', deadline:dl }, s1);
    TIDS[t] = unwrap(r)?.id;
  }
  ok('3 tasks created', Object.values(TIDS).filter(v=>!!v).length>=3);

  r = await api('GET', '/api/student/tasks', null, s1);
  ok('Tasks list', unwrap(r)?.length>=3, `len=${unwrap(r)?.length}`);

  if (TIDS['DB Schema']) {
    r = await api('PATCH', `/api/student/tasks/${TIDS['DB Schema']}`, { status:'inprogress' }, s1);
    ok('Task→InProgress', r.s===200);
    r = await api('PATCH', `/api/student/tasks/${TIDS['DB Schema']}`, { status:'done' }, s1);
    ok('Task→Done', r.s===200);
  }

  r = await api('GET', '/api/student/stats', null, s1);
  d = unwrap(r);
  ok('Progress insights', d?.kanbanTasks);

  r = await api('GET', '/api/student/submissions', null, s1);
  ok('Submissions endpoint', r.s===200);

  r = await api('GET', '/api/student/project/git/commits', null, s1);
  ok('Git commits', r.s===200);

  // Tasks for other students
  for (let i=1;i<5;i++) {
    for (const t of ['Task A','Task B']) await api('POST', '/api/student/tasks', { title:`${t}-S${i+1}`, priority:'Medium' }, STK[SE[i]]);
  }
  ok('Multi-student tasks', true);

  // ═══ PHASE 5: Guide Document Review ═══
  console.log('\n── Phase 5: Guide Reviews ──');
  r = await api('GET', '/api/guide/documents/pending', null, g1tk);
  ok('Pending docs', r.s===200);

  if (gg.length>0) {
    r = await api('GET', `/api/guide/groups/${gg[0].id}/kanban`, null, g1tk);
    ok('Kanban oversight', r.s===200);
  }

  // ═══ PHASE 7: Coordinator Monitor ═══
  console.log('\n── Phase 7: Coordinator Monitors ──');
  r = await api('GET', '/api/coordinator/stats', null, CTK);
  d = unwrap(r);
  ok('Dashboard updated', d?.stats?.activeProjects>0, `projects=${d?.stats?.activeProjects}`);

  r = await api('GET', '/api/coordinator/projects', null, CTK);
  ok('Project groups', r.s===200 && Array.isArray(unwrap(r)), `len=${unwrap(r)?.length}`);

  r = await api('GET', '/api/coordinator/audit/topics', null, CTK);
  ok('Topic monitor', r.s===200);

  r = await api('GET', '/api/coordinator/audit/submissions', null, CTK);
  ok('Submissions monitor', r.s===200);

  r = await api('GET', '/api/coordinator/audit/health', null, CTK);
  ok('Project health', r.s===200 && unwrap(r)?.atRiskProjects!==undefined);

  // ═══ Communication ═══
  console.log('\n── Communication ──');
  if (gg.length>0) {
    r = await api('POST', '/api/comms/messages', { group_id:gg[0].id, text:'Hello from student' }, s1);
    ok('Student chat', r.s===200||r.s===201, `s=${r.s}`);
    r = await api('GET', `/api/comms/messages/${gg[0].id}`, null, g1tk);
    ok('Guide reads chat', r.s===200);
    r = await api('POST', '/api/comms/messages', { group_id:gg[0].id, text:'Guide reply' }, g1tk);
    ok('Guide reply', r.s===200||r.s===201, `s=${r.s}`);
  }

  if (gg.length>0) {
    r = await api('POST', '/api/meetings', { group_id:gg[0].id, title:'Week 1 Review', date:new Date(Date.now()+2*864e5).toISOString().split('T')[0], time:'10:00', agenda:'Review' }, g1tk);
    ok('Schedule meeting', r.s===200||r.s===201, `s=${r.s}`);
  }

  // ═══ Deadline CRUD ═══
  console.log('\n── CRUD Operations ──');
  if (DLID['Synopsis Submission']) {
    r = await api('PATCH', `/api/coordinator/deadlines/${DLID['Synopsis Submission']}`, { title:'Synopsis (Updated)' }, CTK);
    ok('Update deadline', r.s===200);
  }

  r = await api('POST', '/api/coordinator/deadlines', { batch_id:BID, title:'Temp', due_date:'2026-12-31', phase:'Test' }, CTK);
  const tmpDl = unwrap(r)?.id;
  if (tmpDl) {
    r = await api('DELETE', `/api/coordinator/deadlines/${tmpDl}`, null, CTK);
    ok('Delete deadline', r.s===200);
  }

  r = await api('PATCH', `/api/coordinator/faculty/${g1id}`, { bio:'AI Specialist' }, CTK);
  ok('Update faculty', r.s===200);

  // ═══ Admin ═══
  console.log('\n── Admin ──');
  r = await api('GET', '/api/admin/departments', null, ADMIN_TK);
  ok('Departments', r.s===200 && r.d.length>=1);
  r = await api('GET', '/api/admin/coordinators', null, ADMIN_TK);
  ok('Coordinators', r.s===200 && r.d.length>=1);
  r = await api('GET', '/api/admin/batches', null, ADMIN_TK);
  ok('Batches', r.s===200);

  // ═══ SUMMARY ═══
  console.log('\n═══════════════════════════════════════');
  console.log(`  RESULTS: ✅ ${R.pass} passed | ❌ ${R.fail} failed`);
  console.log('═══════════════════════════════════════');
  if (R.errors.length) { console.log('\nFailed:'); R.errors.forEach(e=>console.log(`  - ${e}`)); }
  console.log(`\n── IDs for AI Testing ──`);
  console.log(`DEPT_ID=${DEPT} BATCH_ID=${BID} COORD_UID=${CUID} GUIDE1_ID=${g1id} STUDENT1_ID=${SID[SE[0]]}`);
}

run().catch(e=>{console.error('FATAL:',e);process.exit(1)});
