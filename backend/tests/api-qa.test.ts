import { requestApp, createCoordinator, createGuide, createStudent } from './helpers';
import fs from 'fs';
import path from 'path';

describe('APMS Automated Integration Tests (QA Requirements)', () => {
    let coordinatorToken: string;
    let guideToken: string;
    let studentToken: string;

    let batchId: number;
    let projectId: number;
    let taskId: number;
    let docId: number;
    let rubricId: number;

    beforeAll(async () => {
        coordinatorToken = await createCoordinator('qa_coord@test.com');
        guideToken = await createGuide('qa_guide@test.com');
        studentToken = await createStudent('qa_student@test.com');
    });

    // 1. Users & Roles
    describe('1. Users & Roles', () => {
        it('GET /api/users/profile : Verifies the student profile', async () => {
            const res = await requestApp.get('/api/users/profile')
                .set('Authorization', `Bearer ${studentToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.email).toBe('qa_student@test.com');
        });
    });

    // 2. Batches & Deadlines (Coordinator)
    describe('2. Batches & Deadlines (Coordinator)', () => {
        it('POST /api/batches : Creates a new batch', async () => {
            const res = await requestApp.post('/api/batches')
                .set('Authorization', `Bearer ${coordinatorToken}`)
                .send({ name: '2024-2026', start_year: 2024, end_year: 2026 });
            expect(res.status).toBe(201);
            batchId = res.body.data?.id || 1;
        });

        it('POST /api/batches/:id/deadlines : Sets global deadline', async () => {
             // Expecting failure here as flagged in Gap Analysis
            const res = await requestApp.post(`/api/batches/${batchId}/deadlines`)
                .set('Authorization', `Bearer ${coordinatorToken}`)
                .send({ title: 'Phase 1 Submission', dueDate: '2026-10-15' });
            expect(res.status).toBe(201); 
        });
    });

    // 3. Project Management (Student & Guide)
    describe('3. Project Management (Student & Guide)', () => {
        it('POST /api/projects : Submit a new project proposal (Student)', async () => {
            const res = await requestApp.post('/api/projects')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ title: 'QA Automated System', domain: 'Testing', description: 'Testing Flow' });
            expect(res.status).toBe(201);
            projectId = res.body.data?.id || 1;
        });

        it('PATCH /api/projects/:id/status : Update project status (Guide)', async () => {
            const res = await requestApp.patch(`/api/projects/${projectId}/status`)
                .set('Authorization', `Bearer ${guideToken}`)
                .send({ status: 'approved' }); // Using 'approved' as mapped in DB schema enum
            expect(res.status).toBe(200);
        });
    });

    // 4. Task Board / Kanban (Student)
    describe('4. Task Board / Kanban (Student)', () => {
        it('POST /api/tasks : Create a new task linked to a milestone', async () => {
            const res = await requestApp.post('/api/tasks')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ project_id: projectId, title: 'Build UI', priority: 'High', milestone_id: 1 }); // milestone mock
            expect(res.status).toBe(201);
            taskId = res.body.data?.id || 1;
        });

        it('PATCH /api/tasks/:id/status : Update task status to In-Progress', async () => {
            const res = await requestApp.patch(`/api/tasks/${taskId}/status`)
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ status: 'inprogress' });
            expect(res.status).toBe(200);
        });
    });

    // 5. Documents & Feedback
    describe('5. Documents & Feedback', () => {
        let testFilePath: string;
        
        beforeAll(() => {
            testFilePath = path.join(__dirname, 'mock.pdf');
            fs.writeFileSync(testFilePath, '%PDF-1.4 mock pdf data');
        });

        afterAll(() => {
            if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
        });

        it('POST /api/documents/upload : Upload a PDF Document', async () => {
            const res = await requestApp.post('/api/documents/upload')
                .set('Authorization', `Bearer ${studentToken}`)
                .field('project_id', projectId)
                .field('type', 'SRS')
                .attach('file', testFilePath);
            expect(res.status).toBe(201);
            docId = res.body.data?.id || 1;
        });

        it('POST /api/documents/:id/feedback : Add inline feedback (Guide)', async () => {
             // Expecting failure here as flagged in Gap Analysis
            const res = await requestApp.post(`/api/documents/${docId}/feedback`)
                .set('Authorization', `Bearer ${guideToken}`)
                .send({ feedback: 'Please revise use case diagram.' });
            expect(res.status).toBe(201);
        });

        it('PATCH /api/documents/:id/status : Mark document as Approved', async () => {
            const res = await requestApp.patch(`/api/documents/${docId}/status`)
                .set('Authorization', `Bearer ${guideToken}`)
                .send({ status: 'Approved' });
            expect(res.status).toBe(200);
        });
    });

    // 6. Evaluations (Guide & Coordinator)
    describe('6. Evaluations (Guide & Coordinator)', () => {
        it('POST /api/evaluations/rubrics : Create rubric template (Coordinator)', async () => {
            const res = await requestApp.post('/api/evaluations/rubrics')
                .set('Authorization', `Bearer ${coordinatorToken}`)
                .send({ name: 'Backend Testing', totalScore: 100, criteria: [{ description: 'API', maxMarks: 100 }] });
            expect(res.status).toBe(201);
            rubricId = res.body.data?.id || 1;
        });

        it('POST /api/evaluations/scores : Submit criteria scores (Guide)', async () => {
            const res = await requestApp.post('/api/evaluations/scores')
                .set('Authorization', `Bearer ${guideToken}`)
                .send({ rubric_id: rubricId, group_id: 1, scores: { '0': 95 }, total: 95 });
            expect(res.status).toBe(201);
        });
    });
});
