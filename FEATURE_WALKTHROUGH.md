# APMS — Complete Feature Walkthrough

> **Prerequisites**: 1 Coordinator account, 2 Guide accounts, 5 Student accounts already registered.  
> **Frontend**: `http://localhost:5173` | **Backend**: `http://localhost:5000` | **AI Engine**: `http://localhost:8000`  
> **AI Swagger Docs**: `http://localhost:8000/docs`

---

## Phase 1 — Coordinator Sets Up the Academic Structure

### Step 1: Login as Coordinator
- Go to `http://localhost:5173/login`
- Enter the **Coordinator** credentials and sign in
- You will be redirected to `/coordinator/dashboard`
- **Verify**: Dashboard shows overview cards (Total Batches, Active Projects, Available Guides, Pending Allocations)

### Step 2: Add Faculty (Guides)
- Navigate to **Faculty Management** (`/coordinator/faculty`)
- Click **"Add Faculty"** and enter the details for both guides (if not already registered)
- **Verify**: Both guides appear in the faculty list with their details

### Step 3: Create a Batch
- Navigate to **Batch Management** (`/coordinator/batches`)
- Click **"Create Batch"** — enter batch name (e.g., "MCA 2025 Batch A"), select the year
- **Verify**: The new batch appears in the batch list

### Step 4: Add Students to the Batch
- Navigate to **Student Management** (`/coordinator/students`)
- Add all 5 students to the batch either:
  - **Individually**: Click "Add Student" and fill in each student's details
  - **Bulk import**: Use the import feature to add multiple students at once
- **Verify**: All 5 students appear under the correct batch

### Step 5: Set Deadlines for the Batch
- Navigate to **Global Deadlines** (`/coordinator/deadlines`)
- Select the batch from the dropdown
- Create deadlines for each project phase:
  - **Phase 1**: "Synopsis Submission" — due date 1 week from now
  - **Phase 2**: "SRS Document" — due date 3 weeks from now
  - **Phase 3**: "Design Document" — due date 5 weeks from now
  - **Phase 4**: "Final Report" — due date 8 weeks from now
- **Verify**: All deadlines appear in the deadline calendar/list

### Step 6: Assign Guides to Student Groups
- Navigate to **Guide Assignment** (`/coordinator/assignment`)
- Select the batch
- You'll see the student groups that have been formed
- Assign **Guide 1** to 3 groups and **Guide 2** to 2 groups
- **Verify**: Each group shows its assigned guide name

---

## Phase 2 — Students Set Up Their Projects

### Step 7: Login as Student 1
- **Logout** from the coordinator account
- Login with **Student 1** credentials
- You'll be redirected to `/student/dashboard`

### Step 8: Create a Group & Submit Project Topic
- Navigate to **Project Setup** (`/student/setup`)
- Create a new group — give it a name (e.g., "Team Alpha")
- Add other students to the group by searching their names/IDs
- Submit a project topic:
  - **Title**: "Smart Attendance System"
  - **Domain**: "Machine Learning"
  - **Description**: Provide a brief project description
- **Verify**: Project status shows as "Pending" on the dashboard

### Step 9: View Topic Status
- Navigate to **Topic Status** (`/student/topic-status`)
- **Verify**: Shows "Pending Review" with the submitted topic details

### Step 10: Check Deadlines
- Navigate to **Deadlines** (`/student/deadlines`)
- **Verify**: All 4 deadlines set by the coordinator are visible with their due dates

### Step 11: Link a GitHub Repository
- Navigate to **Repository Manager** (`/student/repository`)
- Enter a GitHub repository URL (e.g., `https://github.com/username/project-repo`)
- **Verify**: Repository is linked and shows on the page

### Step 12: Repeat for Student 2 (Different Group)
- **Logout** and login as **Student 2**
- Create a different group (e.g., "Team Beta") with other students
- Submit a different project topic (e.g., "E-Commerce Platform", Domain: "Web Development")
- Link a different GitHub repo
- **Verify**: Both groups are now visible in the system

---

## Phase 3 — Guide Reviews Topics & Monitors Groups

### Step 13: Login as Guide 1
- **Logout** from the student account
- Login with **Guide 1** credentials → redirected to `/guide/dashboard`
- **Verify**: Dashboard shows stats (Assigned Groups, Pending Reviews, etc.)

### Step 14: Review & Approve Topics
- Navigate to **Topic Approvals** (`/guide/topics`)
- You'll see the pending project topics from your assigned groups
- **Approve** one topic (e.g., "Smart Attendance System") — click the approve button
- **Request Revision** on another topic — provide feedback like "Please narrow the scope"
- **Verify**: Topic statuses update accordingly

### Step 15: View Assigned Groups
- Navigate to **My Groups** (`/guide/groups`)
- Click on a group to see **Group Details** (`/guide/groups/:groupId`)
- **Verify**: You can see group members, project title, progress, and topic status

### Step 16: Schedule a Meeting
- Navigate to **Meetings** (`/guide/meetings`)
- Click **"Schedule Meeting"**
- Set meeting title (e.g., "Week 1 Review"), date, time, and select a group
- **Verify**: Meeting appears in the list

### Step 17: Monitor Git Activity
- Navigate to **Git Activity** (`/guide/git-activity`)
- **Verify**: Shows commit history and activity for groups with linked repositories

---

## Phase 4 — Students Work on Their Projects

### Step 18: Login as Student 1 — Check Topic Approval
- Login as **Student 1**
- Navigate to **Topic Status** (`/student/topic-status`)
- **Verify**: Topic now shows "Approved" status ✅

### Step 19: Create Tasks on the Task Board
- Navigate to **Task Board** (`/student/tasks`)
- Create several tasks:
  - "Design database schema" — set deadline to 3 days from now
  - "Set up project structure" — set deadline to 5 days from now
  - "Create UI wireframes" — set deadline to 7 days from now
- **Verify**: Tasks appear on the kanban board (To Do, In Progress, Done)

### Step 20: Move Tasks Through Stages
- Drag "Design database schema" to **In Progress**
- After a while, drag it to **Done**
- **Verify**: Task board reflects the updated statuses

### Step 21: Submit a Document (Synopsis)
- Navigate to **Submission Portal** (`/student/submissions`)
- Select the deadline "Synopsis Submission"
- Upload a PDF document
- **Verify**: Document shows status "Pending" — waiting for guide review

### Step 22: View Progress Insights
- Navigate to **Progress Insights** (`/student/progress`)
- **Verify**: Shows your project completion percentage, task breakdown, and timeline

### Step 23: Chat with Guide
- Navigate to **Chat** (`/student/chat`)
- Send a message to your guide (e.g., "Submitted the synopsis, please review")
- **Verify**: Message appears in the chat thread

### Step 24: View Upcoming Meetings
- Navigate to **Meetings** (`/student/meetings`)
- **Verify**: The meeting scheduled by the guide in Step 16 is visible

---

## Phase 5 — Guide Reviews Documents & Provides Feedback

### Step 25: Login as Guide 1 — Review Documents
- Login as **Guide 1**
- Navigate to **Document Review** (`/guide/documents`)
- You'll see the pending synopsis from Student 1
- Click on it → opens **Feedback UI** (`/guide/documents/:docId`)
- **Approve** the document and provide feedback (e.g., "Well structured, approved")
- **Verify**: Document status changes to "Approved"

### Step 26: Reject a Document (to test revision flow)
- If Student 2's group has submitted a document, **Reject** it
- Provide rejection reason: "Missing objectives section, please revise"
- **Verify**: Document status shows "Rejected"

### Step 27: Check Kanban Oversight
- Navigate to **Kanban Oversight** (`/guide/kanban`)
- **Verify**: Shows task boards for all your assigned groups in one view

### Step 28: Check Compliance
- Navigate to **Compliance Tracker** (`/guide/compliance`)
- **Verify**: Shows which groups are meeting deadlines and which are falling behind

### Step 29: Chat with Students
- Navigate to **Chat** (`/guide/chat`)
- Reply to Student 1's message from Step 23
- **Verify**: Chat thread shows the conversation

---

## Phase 6 — Student Handles Revision & Resubmission

### Step 30: Login as Student 2 — Handle Rejected Document
- Login as **Student 2**
- Navigate to **Feedback Review** (`/student/feedback`)
- **Verify**: Shows the rejection feedback from the guide
- Navigate to **Submission Portal** (`/student/submissions`)
- Upload a revised document for the same deadline
- **Verify**: New submission appears with "Pending" status

### Step 31: View Document Archive
- Navigate to **Document Archive** (`/student/archive`)
- **Verify**: Shows history of all submissions (original rejected + new pending)

---

## Phase 7 — Coordinator Monitors Overall Progress

### Step 32: Login as Coordinator — Check Dashboard
- Login as **Coordinator**
- Go to `/coordinator/dashboard`
- **Verify**: Stats are updated — active projects count, at-risk indicators, etc.

### Step 33: Monitor Project Groups
- Navigate to **Project Groups** (`/coordinator/projects`)
- **Verify**: All groups visible with their guide assignments, topic status, and progress

### Step 34: Monitor Topics
- Navigate to **Topic Monitor** (`/coordinator/topics`)
- **Verify**: Shows all submitted topics — approved, pending, and revision-requested

### Step 35: Monitor Submissions
- Navigate to **Submissions Monitor** (`/coordinator/submissions`)
- **Verify**: Shows all document submissions across batches with their review status

### Step 36: Check Project Health
- Navigate to **Project Health** (`/coordinator/health`)
- **Verify**: Health analytics cards show Healthy / Need Attention / At Risk counts
- Click on a health card to filter the project list
- Click **"Trigger Manual Audit"** to refresh the data

---

## Phase 8 — AI Engine Features (via FastAPI)

> **Start the AI Engine first**:
> ```bash
> cd ai-py
> pip install -r requirements.txt
> python main.py
> ```
> Then run the migration:
> ```bash
> psql -U postgres -d mp_rush -f ai-py/migration.sql
> ```
> Open the Swagger UI at `http://localhost:8000/docs` to test all endpoints.

### Step 37: AI — Compute Risk Scores (F3)
- **POST** `/api/ai/risk/compute` → Execute
- **Verify**: Response shows how many projects were scored
- Then **GET** `/api/ai/risk/projects`
- **Verify**: Returns at-risk projects with scores, levels, and factor breakdowns

### Step 38: AI — View Guide's Group Risks (F3)
- **GET** `/api/ai/risk/my-groups/{guide_id}` — use Guide 1's user ID
- **Verify**: Returns risk scores for all groups supervised by that guide

### Step 39: AI — Student Risk Profile (F3)
- **GET** `/api/ai/risk/student/{student_id}` — use Student 1's user ID
- **Verify**: Shows the risk profile for that student's project

### Step 40: AI — Risk Trends (F3)
- **GET** `/api/ai/risk/trends?days=30`
- **Verify**: Returns risk distribution and scoring history

### Step 41: AI — Generate Alerts (F4)
- **POST** `/api/ai/scheduler/trigger/alerts`
- **Verify**: Shows count of alerts created for guides and coordinators
- Then **GET** `/api/ai/alerts/{user_id}` with Guide 1's ID
- **Verify**: Alerts like "Overdue task in Team Alpha", "Team Beta is at risk"

### Step 42: AI — Alert Management (F4)
- **GET** `/api/ai/alerts/{user_id}/count` → see unread count
- **PATCH** `/api/ai/alerts/{alert_id}/read` → mark as read
- **PATCH** `/api/ai/alerts/{user_id}/read-all` → mark all read
- **Verify**: Unread count decreases

### Step 43: AI — Guide Allocation Suggestions (F1)
- **GET** `/api/ai/allocation/suggest/{batch_id}`
- **Verify**: Returns ranked guide suggestions with scores and reasons

### Step 44: AI — Auto-Allocate Guides (F1)
- **POST** `/api/ai/allocation/auto/{batch_id}`
- **Verify**: Returns assigned guide-group pairs

### Step 45: AI — Workload Distribution (F1)
- **GET** `/api/ai/allocation/workload`
- **Verify**: All guides with load, avg, std deviation, fairness index

### Step 46: AI — Department Overview (F2)
- **GET** `/api/ai/monitoring/department/{dept_id}`
- **Verify**: Aggregated stats — projects, avg progress, risk counts, compliance

### Step 47: AI — Batch Comparison (F2)
- **GET** `/api/ai/monitoring/batch-comparison/{dept_id}`
- **Verify**: Side-by-side batch metrics

### Step 48: AI — Compliance Report (F2)
- **GET** `/api/ai/monitoring/compliance/{batch_id}`
- **Verify**: Per-group breakdown of tasks, docs, overdue, risk scores

### Step 49: AI — Phase-wise Progress (F2)
- **GET** `/api/ai/monitoring/phase-progress/{batch_id}`
- **Verify**: Deadline phases with submission rates

### Step 50: AI — Auto-Approval Check (F5)
- **GET** `/api/ai/approval/eligible/{batch_id}`
- **Verify**: Most projects "not eligible" at this stage — expected!

### Step 51: AI — Guide Effectiveness (F6)
- **GET** `/api/ai/analytics/guide-effectiveness`
- **Verify**: Guides ranked by effectiveness score

### Step 52: AI — Domain Distribution (F6)
- **GET** `/api/ai/analytics/domain-distribution`
- **Verify**: Project count per domain

### Step 53: AI — Completion Forecast (F6)
- **GET** `/api/ai/analytics/forecast/{batch_id}`
- **Verify**: Daily rate, estimated completion, on-track status per group

### Step 54: AI — Workload Fairness (F6)
- **GET** `/api/ai/analytics/workload-fairness`
- **Verify**: Fairness index (1.0 = perfectly balanced)

### Step 55: AI — Submission Funnel (F6)
- **GET** `/api/ai/analytics/submission-funnel/{batch_id}`
- **Verify**: Total → pending → approved → rejected breakdown

### Step 56: AI — View Config (F7)
- **GET** `/api/ai/config`
- **Verify**: Current thresholds and cron intervals

### Step 57: AI — Audit Log (F7)
- **GET** `/api/ai/audit-log`
- **Verify**: History of all AI actions performed

---

## Phase 9 — Final Project Lifecycle

### Step 58: Students Complete All Tasks
- Login as each student → mark all tasks as "Done"
- Update project progress to **100%**
- Submit remaining documents for each deadline

### Step 59: Guide Approves All Documents
- Login as Guide → approve all pending documents
- **Verify**: All documents show "Approved" status

### Step 60: AI — Re-check Approval Eligibility (F5)
- **GET** `/api/ai/approval/eligible/{batch_id}`
- **Verify**: Completed projects now show `"eligible": true`

### Step 61: AI — Execute Auto-Approval (F5)
- **POST** `/api/ai/approval/approve/{project_id}`
- **Verify**: `"success": true, "message": "Project auto-approved"`

### Step 62: AI — Archive Completed Projects (F5)
- **POST** `/api/ai/approval/archive/{batch_id}`
- **Verify**: Approved projects get archived
- **GET** `/api/ai/approval/archive-summary/{batch_id}` → see breakdown

### Step 63: AI — Final Risk Rescore
- **POST** `/api/ai/risk/compute`
- **Verify**: Completed projects now show "healthy" risk levels

---

## Quick Reference — All AI Endpoints

| Feature | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| **F3** | POST | `/api/ai/risk/compute` | Recompute all risk scores |
| **F3** | GET | `/api/ai/risk/projects` | At-risk projects list |
| **F3** | GET | `/api/ai/risk/my-groups/{guide_id}` | Guide's group risks |
| **F3** | GET | `/api/ai/risk/student/{student_id}` | Student risk profile |
| **F3** | GET | `/api/ai/risk/trends` | Risk trends over time |
| **F4** | GET | `/api/ai/alerts/{user_id}` | Get user alerts |
| **F4** | GET | `/api/ai/alerts/{user_id}/count` | Unread count |
| **F4** | PATCH | `/api/ai/alerts/{id}/read` | Mark read |
| **F4** | PATCH | `/api/ai/alerts/{user_id}/read-all` | Mark all read |
| **F4** | PATCH | `/api/ai/alerts/{id}/resolve` | Resolve alert |
| **F1** | GET | `/api/ai/allocation/suggest/{batch_id}` | Allocation suggestions |
| **F1** | POST | `/api/ai/allocation/auto/{batch_id}` | Auto-allocate guides |
| **F1** | GET | `/api/ai/allocation/workload` | Workload distribution |
| **F2** | GET | `/api/ai/monitoring/department/{dept_id}` | Department overview |
| **F2** | GET | `/api/ai/monitoring/batch-comparison/{dept_id}` | Batch comparison |
| **F2** | GET | `/api/ai/monitoring/compliance/{batch_id}` | Compliance report |
| **F2** | GET | `/api/ai/monitoring/phase-progress/{batch_id}` | Phase progress |
| **F5** | GET | `/api/ai/approval/eligible/{batch_id}` | Approval candidates |
| **F5** | POST | `/api/ai/approval/approve/{project_id}` | Execute auto-approval |
| **F5** | POST | `/api/ai/approval/archive/{batch_id}` | Archive projects |
| **F5** | GET | `/api/ai/approval/archive-summary/{batch_id}` | Archive stats |
| **F6** | GET | `/api/ai/analytics/guide-effectiveness` | Guide ranking |
| **F6** | GET | `/api/ai/analytics/domain-distribution` | Domain stats |
| **F6** | GET | `/api/ai/analytics/batch-health/{dept_id}` | Batch health matrix |
| **F6** | GET | `/api/ai/analytics/forecast/{batch_id}` | Completion forecast |
| **F6** | GET | `/api/ai/analytics/workload-fairness` | Fairness index |
| **F6** | GET | `/api/ai/analytics/submission-funnel/{batch_id}` | Doc funnel |
| **F7** | GET | `/api/ai/config` | View AI config |
| **F7** | PATCH | `/api/ai/config/{key}` | Update config |
| **F7** | GET | `/api/ai/audit-log` | Audit history |
| **F7** | POST | `/api/ai/scheduler/trigger/{job}` | Manual trigger |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "ai_config table not found" | Run `psql -U postgres -d mp_rush -f ai-py/migration.sql` |
| AI endpoints return empty arrays | Run `POST /api/ai/risk/compute` first to seed data |
| Students don't see deadlines | Coordinator must create deadlines for the batch (Step 5) |
| Guide doesn't see groups | Coordinator must assign the guide to groups (Step 6) |
| Topic stuck on "Pending" | Guide needs to approve/reject from `/guide/topics` (Step 14) |
| "No groups found" for allocation | Groups need to exist without guides assigned |
