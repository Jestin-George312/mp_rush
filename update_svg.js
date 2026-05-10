const fs = require('fs');
let content = fs.readFileSync('apms_event_flow.svg', 'utf8');

const replacements = [
  ['System setup', 'System Setup'],
  ['Group formation', 'Project Initiation'],
  ['Topic workflow', 'Allocation & Topic'],
  ['Execution', 'Active Execution'],
  ['Evaluation', 'AI Monitoring'],

  ['1. Coordinator creates departments &amp; faculty accounts', '1. Coordinator registers faculty &amp; marks active'],
  ['Sets up the org structure; assigns coordinator to department', 'Registers faculty members and ensures active statuses'],

  ['2. Coordinator creates batches &amp; assigns faculty as guides', '2. Coordinator initializes Batch &amp; sets modes/limits'],
  ['Links batch to department; sets batch active status', 'Enforces constraints like Project Mode and Max Group Size'],

  ['3. Students are enrolled into batches', '3. Coordinator assigns active faculty to Batch'],
  ['Coordinator adds student accounts; students linked to batch', 'Links specific faculty members available for guide allocation'],

  ['4. Coordinator sets deadlines &amp; configures rubrics', '4. Coordinator defines Topic Submission Window'],
  ['Phases (SRS, mid-term, final), due dates, scoring criteria defined', 'Sets strict Start and End dates for student project setup'],

  ['5. Students form groups &amp; elect a group leader', '5. Student initiates project setup in submission window'],
  ['Group linked to batch; leader marked with is_leader flag', 'Form adapts to coordinator enforced project modes'],

  ['6. Coordinator allocates a guide to each group', '6. Student inputs topic title, domain, and abstract'],
  ['AI-assisted workload balancing; guide_id stored in groups table', 'Defines the primary research scope of the project'],

  ['7. Group leader submits project topic', '7. Student adds team members via email search'],
  ['Title, domain, description entered; status set to Pending', 'Dynamically adds members up to the max group size'],

  ['8. Guide reviews topic → Approve / Request revision / Reject', '8. Auto-leadership &amp; pending invitations sent'],
  ['Student notified; rejected topics can be resubmitted', 'Initiator becomes Group Leader; peers receive invites'],

  ['9. Coordinator gives final topic approval', '9. Guides are allocated to project groups'],
  ['Project status turns Approved; project lifecycle begins', 'AI Engine supports balancing the faculty workload'],

  ['10. Guide defines milestones &amp; review phases', '10. Guide reviews proposed project topic'],
  ['Phases mapped to coordinator deadlines; tasks seeded in task table', 'Topic and abstract verified against department standards'],

  ['11. Students manage tasks on Kanban board', '11. Coordinator/Guide finalizes topic approval'],
  ['To Do → In Progress → Done; guide views board in real time', 'Project lifecycle begins officially once topic is approved'],

  ['12. Students upload versioned documents per phase', '12. Students manage tasks on Kanban board'],
  ['SRS, design doc, final report; version tracked in documents table', 'Breaks down work into To Do / In Progress / Done'],

  ['13. Guide reviews documents with inline feedback', '13. Git repositories are linked for analytics'],
  ['Status → Approved / Rejected with comment; student notified', 'System tracks commit histories and code sync activity'],

  ['14. Students request meetings; in-app chat runs throughout', '14. Documents are uploaded to Submission Portal'],

  ['15. Plagiarism check runs on uploaded documents', '15. In-app Chat enables continuous communication'],

  ['16. Guide scores each group using rubric criteria', '16. Guides monitor Kanban &amp; Git activity'],
  ['Scores stored in evaluation_scores table per rubric &amp; group', 'Oversees the real-time execution of the project'],

  ['17. AI engine flags at-risk groups to coordinator &amp; guide', '17. AI Risk Engine monitors progress continuously'],
  ['Based on inactivity, missed deadlines, low task completion', 'Analyzes task completion rates and repository syncs'],

  ['18. Mid-term review conducted &amp; scored', '18. AI flags at-risk students in Compliance Tracker'],
  ['Milestone completion validated; guide updates progress status', 'Automated alerts sent to Guide based on risk scores'],

  ['19. Students submit final report &amp; deliverables', '19. Guide reviews document submissions'],
  ['Final document version uploaded through submission portal', 'Provides feedback and marks documents for revision'],

  ['20. Final rubric evaluation by guide &amp; coordinator', '20. Project revisions are requested or approved'],
  ['Viva-voce scores recorded; overall assessment finalised', 'Ensures deliverables meet all required standards'],

  ['21. Coordinator approves final submission', '21. Coordinator deactivates or archives Batch'],
  ['Project status updated; compliance confirmed department-wide', 'Manually closes the batch at the end of academic cycle'],

  ['22. Project archived; reports &amp; analytics exported', '22. Project cycle concludes (Future: AI Final Approval)'],
  ['PDF/Excel reports; department analytics dashboard updated', 'Data drives department analytics dashboard updates']
];

for (const [oldStr, newStr] of replacements) {
  content = content.replace(oldStr, newStr);
}

fs.writeFileSync('apms_event_flow.svg', content);
console.log("SVG Updated!");
