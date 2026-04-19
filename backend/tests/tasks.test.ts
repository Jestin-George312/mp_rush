import { requestApp, createStudent } from './helpers';

describe('Tasks API', () => {
    let studentToken: string;
    let projectId: number;
    let taskId: number;

    beforeAll(async () => {
        studentToken = await createStudent('task_student@test.com');
        const res = await requestApp.post('/api/projects')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ title: 'Task Proj', domain: 'Test', description: 'Testing tasks' });
        projectId = res.body.data.id;
    });

    it('should create a task', async () => {
        const res = await requestApp.post('/api/tasks')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                project_id: projectId,
                title: 'Write Docs',
                priority: 'High'
            });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        taskId = res.body.data.id;
    });

    it('should fetch tasks for project', async () => {
        const res = await requestApp.get(`/api/tasks?projectId=${projectId}`)
            .set('Authorization', `Bearer ${studentToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should update task status', async () => {
        const res = await requestApp.patch(`/api/tasks/${taskId}/status`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ status: 'done' });
        
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('done');
    });

    it('should update task details', async () => {
        const res = await requestApp.patch(`/api/tasks/${taskId}`)
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ title: 'Write Better Docs', priority: 'Low' });
        
        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe('Write Better Docs');
        expect(res.body.data.priority).toBe('Low');
    });
});
