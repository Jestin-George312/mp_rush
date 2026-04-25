# APMS — Complete Database Schema

All tables used in the Academic Project Monitoring System, with their complete column definitions and SQL.

---

## 1. Users

**Description:** Stores all system users including students, guides, coordinators, and admins.

| Sl.No | Field Name    | Data Type    | Size | Constraints                          |
|-------|---------------|--------------|------|--------------------------------------|
| 1     | uid           | SERIAL       |      | Primary Key                          |
| 2     | email         | VARCHAR      | 255  | UNIQUE, NOT NULL                     |
| 3     | password_hash | VARCHAR      | 255  |                                      |
| 4     | auth_provider | VARCHAR      | 50   | NOT NULL, DEFAULT 'local'            |
| 5     | role          | user_role    |      | NOT NULL, DEFAULT 'student'          |
| 6     | is_deleted    | BOOLEAN      |      | NOT NULL, DEFAULT FALSE              |
| 7     | created_at    | TIMESTAMPTZ  |      | NOT NULL, DEFAULT NOW()              |

### ENUM: user_role

```
'student' | 'guide' | 'coordinator' | 'admin'
```

### SQL

```sql
CREATE TYPE user_role AS ENUM ('student', 'guide', 'coordinator', 'admin');

CREATE TABLE IF NOT EXISTS users (
    uid           SERIAL       PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    auth_provider VARCHAR(50)  NOT NULL DEFAULT 'local',
    role          user_role    NOT NULL DEFAULT 'student',
    is_deleted    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

## 2. Profiles

**Description:** Stores extended profile information for each user.

| Sl.No | Field Name  | Data Type   | Size | Constraints                                    |
|-------|-------------|-------------|------|------------------------------------------------|
| 1     | u_id        | INTEGER     |      | Primary Key, Foreign Key → users(uid) ON DELETE CASCADE |
| 2     | full_name   | VARCHAR     | 255  | NOT NULL                                       |
| 3     | profile_img | VARCHAR     | 500  |                                                |
| 4     | department  | VARCHAR     | 100  |                                                |
| 5     | phone       | VARCHAR     | 20   |                                                |
| 6     | bio         | TEXT        |      |                                                |
| 7     | location    | VARCHAR     | 255  |                                                |

### SQL

```sql
CREATE TABLE IF NOT EXISTS profiles (
    u_id        INTEGER      PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
    full_name   VARCHAR(255) NOT NULL,
    profile_img VARCHAR(500),
    department  VARCHAR(100),
    phone       VARCHAR(20),
    bio         TEXT,
    location    VARCHAR(255)
);
```

---

## 3. Departments

**Description:** Stores department information and coordinator assignments.

| Sl.No | Field Name     | Data Type   | Size | Constraints                                      |
|-------|----------------|-------------|------|--------------------------------------------------|
| 1     | id             | SERIAL      |      | Primary Key                                      |
| 2     | name           | VARCHAR     | 100  | NOT NULL, UNIQUE                                 |
| 3     | coordinator_id | INTEGER     |      | Foreign Key → users(uid) ON DELETE SET NULL       |
| 4     | created_at     | TIMESTAMPTZ |      | NOT NULL, DEFAULT NOW()                          |

### SQL

```sql
CREATE TABLE IF NOT EXISTS departments (
    id             SERIAL       PRIMARY KEY,
    name           VARCHAR(100) NOT NULL UNIQUE,
    coordinator_id INTEGER      REFERENCES users(uid) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

## 4. Batches

**Description:** Stores academic batch configurations per department.

| Sl.No | Field Name     | Data Type   | Size | Constraints                                        |
|-------|----------------|-------------|------|----------------------------------------------------|
| 1     | id             | SERIAL      |      | Primary Key                                        |
| 2     | name           | VARCHAR     | 100  | NOT NULL                                           |
| 3     | coordinator_id | INTEGER     |      | Foreign Key → users(uid) ON DELETE SET NULL         |
| 4     | start_year     | INTEGER     |      | NOT NULL                                           |
| 5     | end_year       | INTEGER     |      | NOT NULL                                           |
| 6     | is_active      | BOOLEAN     |      | NOT NULL, DEFAULT TRUE                             |
| 7     | department_id  | INTEGER     |      | Foreign Key → departments(id) ON DELETE SET NULL   |
| 8     | created_at     | TIMESTAMPTZ |      | NOT NULL, DEFAULT NOW()                            |

### SQL

```sql
CREATE TABLE IF NOT EXISTS batches (
    id             SERIAL       PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    coordinator_id INTEGER      REFERENCES users(uid) ON DELETE SET NULL,
    start_year     INTEGER      NOT NULL,
    end_year       INTEGER      NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    department_id  INTEGER      REFERENCES departments(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

## 5. Groups

**Description:** Stores student project groups and their assigned guides.

| Sl.No | Field Name | Data Type   | Size | Constraints                                    |
|-------|------------|-------------|------|------------------------------------------------|
| 1     | id         | SERIAL      |      | Primary Key                                    |
| 2     | group_name | VARCHAR     | 100  | NOT NULL                                       |
| 3     | batch_id   | INTEGER     |      | Foreign Key → batches(id) ON DELETE SET NULL   |
| 4     | guide_id   | INTEGER     |      | Foreign Key → users(uid) ON DELETE SET NULL    |
| 5     | created_at | TIMESTAMPTZ |      | NOT NULL, DEFAULT NOW()                        |

### SQL

```sql
CREATE TABLE IF NOT EXISTS groups (
    id         SERIAL       PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL,
    batch_id   INTEGER      REFERENCES batches(id) ON DELETE SET NULL,
    guide_id   INTEGER      REFERENCES users(uid)  ON DELETE SET NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

## 6. Group Members

**Description:** Maps students to their respective project groups.

| Sl.No | Field Name | Data Type | Size | Constraints                                       |
|-------|------------|-----------|------|---------------------------------------------------|
| 1     | group_id   | INTEGER   |      | NOT NULL, Foreign Key → groups(id) ON DELETE CASCADE, Composite PK |
| 2     | student_id | INTEGER   |      | NOT NULL, Foreign Key → users(uid) ON DELETE CASCADE, Composite PK |
| 3     | is_leader  | BOOLEAN   |      | NOT NULL, DEFAULT FALSE                           |

### SQL

```sql
CREATE TABLE IF NOT EXISTS group_members (
    group_id   INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    is_leader  BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (group_id, student_id)
);
```

---

## 7. Projects

**Description:** Stores all academic project details submitted by groups. Tracks project lifecycle from topic submission through approval.

| Sl.No | Field Name        | Data Type      | Size | Constraints                                         |
|-------|-------------------|----------------|------|-----------------------------------------------------|
| 1     | id                | SERIAL         |      | Primary Key                                         |
| 2     | group_id          | INTEGER        |      | NOT NULL, Foreign Key → groups(id) ON DELETE CASCADE |
| 3     | title             | VARCHAR        | 255  | NOT NULL                                            |
| 4     | domain            | VARCHAR        | 100  |                                                     |
| 5     | description       | TEXT           |      |                                                     |
| 6     | status            | project_status |      | NOT NULL, DEFAULT 'pending'                         |
| 7     | progress          | INTEGER        |      | NOT NULL, DEFAULT 0, CHECK (0–100)                  |
| 8     | submitted_by      | INTEGER        |      | Foreign Key → users(uid) ON DELETE SET NULL          |
| 9     | review_state      | VARCHAR        | 30   | NOT NULL, DEFAULT 'Pending'                         |
| 10    | topic_feedback    | TEXT           |      |                                                     |
| 11    | topic_reviewed_at | TIMESTAMPTZ    |      |                                                     |
| 12    | github_repo       | VARCHAR        | 500  |                                                     |
| 13    | created_at        | TIMESTAMPTZ    |      | NOT NULL, DEFAULT NOW()                             |
| 14    | updated_at        | TIMESTAMPTZ    |      | NOT NULL, DEFAULT NOW()                             |

### ENUM: project_status

```
'pending' | 'approved' | 'rejected'
```

### SQL

```sql
CREATE TYPE project_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE IF NOT EXISTS projects (
    id                SERIAL         PRIMARY KEY,
    group_id          INTEGER        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title             VARCHAR(255)   NOT NULL,
    domain            VARCHAR(100),
    description       TEXT,
    status            project_status NOT NULL DEFAULT 'pending',
    progress          INTEGER        NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    submitted_by      INTEGER        REFERENCES users(uid) ON DELETE SET NULL,
    review_state      VARCHAR(30)    NOT NULL DEFAULT 'Pending',
    topic_feedback    TEXT,
    topic_reviewed_at TIMESTAMPTZ,
    github_repo       VARCHAR(500),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
```

---

## 8. Tasks

**Description:** Stores Agile tasks created within a project for the Kanban board.

| Sl.No | Field Name  | Data Type     | Size | Constraints                                          |
|-------|-------------|---------------|------|------------------------------------------------------|
| 1     | id          | SERIAL        |      | Primary Key                                          |
| 2     | project_id  | INTEGER       |      | NOT NULL, Foreign Key → projects(id) ON DELETE CASCADE |
| 3     | title       | VARCHAR       | 255  | NOT NULL                                             |
| 4     | priority    | task_priority |      | NOT NULL, DEFAULT 'Medium'                           |
| 5     | status      | task_status   |      | NOT NULL, DEFAULT 'todo'                             |
| 6     | deadline    | DATE          |      |                                                      |
| 7     | assigned_to | INTEGER       |      | Foreign Key → users(uid) ON DELETE SET NULL           |
| 8     | created_by  | INTEGER       |      | Foreign Key → users(uid) ON DELETE SET NULL           |
| 9     | created_at  | TIMESTAMPTZ   |      | NOT NULL, DEFAULT NOW()                              |

### ENUM: task_status

```
'todo' | 'inprogress' | 'done'
```

### ENUM: task_priority

```
'High' | 'Medium' | 'Low'
```

### SQL

```sql
CREATE TYPE task_status   AS ENUM ('todo', 'inprogress', 'done');
CREATE TYPE task_priority AS ENUM ('High', 'Medium', 'Low');

CREATE TABLE IF NOT EXISTS tasks (
    id          SERIAL        PRIMARY KEY,
    project_id  INTEGER       NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title       VARCHAR(255)  NOT NULL,
    priority    task_priority NOT NULL DEFAULT 'Medium',
    status      task_status   NOT NULL DEFAULT 'todo',
    deadline    DATE,
    assigned_to INTEGER       REFERENCES users(uid) ON DELETE SET NULL,
    created_by  INTEGER       REFERENCES users(uid) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

---

## 9. Documents

**Description:** Stores uploaded project documents with review status and feedback.

| Sl.No | Field Name  | Data Type   | Size | Constraints                                          |
|-------|-------------|-------------|------|------------------------------------------------------|
| 1     | id          | SERIAL      |      | Primary Key                                          |
| 2     | project_id  | INTEGER     |      | NOT NULL, Foreign Key → projects(id) ON DELETE CASCADE |
| 3     | uploaded_by | INTEGER     |      | Foreign Key → users(uid) ON DELETE SET NULL           |
| 4     | name        | VARCHAR     | 255  | NOT NULL                                             |
| 5     | file_path   | VARCHAR     | 500  | NOT NULL                                             |
| 6     | type        | doc_type    |      | NOT NULL, DEFAULT 'Other'                            |
| 7     | status      | doc_status  |      | NOT NULL, DEFAULT 'Pending'                          |
| 8     | feedback    | TEXT        |      |                                                      |
| 9     | reviewed_by | INTEGER     |      | Foreign Key → users(uid) ON DELETE SET NULL           |
| 10    | reviewed_at | TIMESTAMPTZ |      |                                                      |
| 11    | deadline_id | INTEGER     |      |                                                      |
| 12    | created_at  | TIMESTAMPTZ |      | NOT NULL, DEFAULT NOW()                              |

### ENUM: doc_type

```
'SRS' | 'Reports' | 'Diagrams' | 'Other'
```

### ENUM: doc_status

```
'Pending' | 'Approved' | 'Rejected'
```

### SQL

```sql
CREATE TYPE doc_type   AS ENUM ('SRS', 'Reports', 'Diagrams', 'Other');
CREATE TYPE doc_status AS ENUM ('Pending', 'Approved', 'Rejected');

CREATE TABLE IF NOT EXISTS documents (
    id          SERIAL       PRIMARY KEY,
    project_id  INTEGER      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by INTEGER      REFERENCES users(uid) ON DELETE SET NULL,
    name        VARCHAR(255) NOT NULL,
    file_path   VARCHAR(500) NOT NULL,
    type        doc_type     NOT NULL DEFAULT 'Other',
    status      doc_status   NOT NULL DEFAULT 'Pending',
    feedback    TEXT,
    reviewed_by INTEGER      REFERENCES users(uid) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    deadline_id INTEGER,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

## 10. Meetings

**Description:** Stores meeting schedules between guides and student groups.

| Sl.No | Field Name   | Data Type      | Size | Constraints                                          |
|-------|--------------|----------------|------|------------------------------------------------------|
| 1     | id           | SERIAL         |      | Primary Key                                          |
| 2     | project_id   | INTEGER        |      | Foreign Key → projects(id) ON DELETE CASCADE         |
| 3     | group_id     | INTEGER        |      | Foreign Key → groups(id) ON DELETE CASCADE           |
| 4     | requested_by | INTEGER        |      | Foreign Key → users(uid) ON DELETE SET NULL           |
| 5     | title        | VARCHAR        | 255  | NOT NULL                                             |
| 6     | date         | DATE           |      | NOT NULL                                             |
| 7     | time         | VARCHAR        | 10   | NOT NULL                                             |
| 8     | duration     | VARCHAR        | 50   | DEFAULT '30 mins'                                    |
| 9     | agenda       | TEXT           |      |                                                      |
| 10    | meet_link    | VARCHAR        | 500  |                                                      |
| 11    | status       | meeting_status |      | NOT NULL, DEFAULT 'upcoming'                         |
| 12    | created_at   | TIMESTAMPTZ    |      | NOT NULL, DEFAULT NOW()                              |

### ENUM: meeting_status

```
'upcoming' | 'completed' | 'cancelled'
```

### SQL

```sql
CREATE TYPE meeting_status AS ENUM ('upcoming', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS meetings (
    id           SERIAL         PRIMARY KEY,
    project_id   INTEGER        REFERENCES projects(id) ON DELETE CASCADE,
    group_id     INTEGER        REFERENCES groups(id)   ON DELETE CASCADE,
    requested_by INTEGER        REFERENCES users(uid)   ON DELETE SET NULL,
    title        VARCHAR(255)   NOT NULL,
    date         DATE           NOT NULL,
    time         VARCHAR(10)    NOT NULL,
    duration     VARCHAR(50)    DEFAULT '30 mins',
    agenda       TEXT,
    meet_link    VARCHAR(500),
    status       meeting_status NOT NULL DEFAULT 'upcoming',
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
```

---

## 11. Rubrics

**Description:** Stores rubric definitions created by coordinators for evaluation.

| Sl.No | Field Name  | Data Type   | Size | Constraints                                    |
|-------|-------------|-------------|------|------------------------------------------------|
| 1     | id          | SERIAL      |      | Primary Key                                    |
| 2     | name        | VARCHAR     | 255  | NOT NULL                                       |
| 3     | created_by  | INTEGER     |      | Foreign Key → users(uid) ON DELETE SET NULL     |
| 4     | total_score | INTEGER     |      | NOT NULL, DEFAULT 0                            |
| 5     | criteria    | JSONB       |      | NOT NULL, DEFAULT '[]'                         |
| 6     | created_at  | TIMESTAMPTZ |      | NOT NULL, DEFAULT NOW()                        |

### SQL

```sql
CREATE TABLE IF NOT EXISTS rubrics (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    created_by  INTEGER      REFERENCES users(uid) ON DELETE SET NULL,
    total_score INTEGER      NOT NULL DEFAULT 0,
    criteria    JSONB        NOT NULL DEFAULT '[]',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

## 12. Evaluation Scores

**Description:** Stores rubric-based evaluation scores for each group.

| Sl.No | Field Name   | Data Type   | Size | Constraints                                       |
|-------|--------------|-------------|------|---------------------------------------------------|
| 1     | id           | SERIAL      |      | Primary Key                                       |
| 2     | rubric_id    | INTEGER     |      | NOT NULL, Foreign Key → rubrics(id) ON DELETE CASCADE |
| 3     | group_id     | INTEGER     |      | NOT NULL, Foreign Key → groups(id) ON DELETE CASCADE  |
| 4     | evaluated_by | INTEGER     |      | Foreign Key → users(uid) ON DELETE SET NULL        |
| 5     | scores       | JSONB       |      | NOT NULL, DEFAULT '{}'                            |
| 6     | total        | INTEGER     |      | NOT NULL, DEFAULT 0                               |
| 7     | created_at   | TIMESTAMPTZ |      | NOT NULL, DEFAULT NOW()                           |

### SQL

```sql
CREATE TABLE IF NOT EXISTS evaluation_scores (
    id           SERIAL      PRIMARY KEY,
    rubric_id    INTEGER     NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
    group_id     INTEGER     NOT NULL REFERENCES groups(id)  ON DELETE CASCADE,
    evaluated_by INTEGER     REFERENCES users(uid) ON DELETE SET NULL,
    scores       JSONB       NOT NULL DEFAULT '{}',
    total        INTEGER     NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 13. Messages

**Description:** Stores chat messages within project groups.

| Sl.No | Field Name | Data Type   | Size | Constraints                                       |
|-------|------------|-------------|------|---------------------------------------------------|
| 1     | id         | SERIAL      |      | Primary Key                                       |
| 2     | group_id   | INTEGER     |      | NOT NULL, Foreign Key → groups(id) ON DELETE CASCADE |
| 3     | sender_id  | INTEGER     |      | NOT NULL, Foreign Key → users(uid) ON DELETE CASCADE |
| 4     | text       | TEXT        |      | NOT NULL                                          |
| 5     | created_at | TIMESTAMPTZ |      | NOT NULL, DEFAULT NOW()                           |

### Index

```
idx_messages_group ON messages (group_id, created_at)
```

### SQL

```sql
CREATE TABLE IF NOT EXISTS messages (
    id         SERIAL      PRIMARY KEY,
    group_id   INTEGER     NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    sender_id  INTEGER     NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    text       TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_group ON messages (group_id, created_at);
```

---

## 14. Deadlines

**Description:** Stores deadline configurations set by coordinators for each batch.

| Sl.No | Field Name  | Data Type   | Size | Constraints                                        |
|-------|-------------|-------------|------|----------------------------------------------------|
| 1     | id          | SERIAL      |      | Primary Key                                        |
| 2     | batch_id    | INTEGER     |      | NOT NULL, Foreign Key → batches(id) ON DELETE CASCADE |
| 3     | title       | VARCHAR     | 255  | NOT NULL                                           |
| 4     | description | TEXT        |      |                                                    |
| 5     | due_date    | DATE        |      | NOT NULL                                           |
| 6     | phase       | VARCHAR     | 100  | DEFAULT 'General'                                  |
| 7     | created_by  | INTEGER     |      | Foreign Key → users(uid) ON DELETE SET NULL         |
| 8     | created_at  | TIMESTAMPTZ |      | NOT NULL, DEFAULT NOW()                            |

### Index

```
idx_deadlines_batch_due_date ON deadlines (batch_id, due_date)
```

### SQL

```sql
CREATE TABLE IF NOT EXISTS deadlines (
    id          SERIAL       PRIMARY KEY,
    batch_id    INTEGER      NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    due_date    DATE         NOT NULL,
    phase       VARCHAR(100) DEFAULT 'General',
    created_by  INTEGER      REFERENCES users(uid) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deadlines_batch_due_date ON deadlines (batch_id, due_date);
```
