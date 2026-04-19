import { requestApp, createStudent, createGuide } from './helpers';

describe('Meetings API', () => {
    let studentToken: string;
    let guideToken: string;
    let projectId: number;
    let groupId: number;
    let meetingId: number;

    beforeAll(async () => {
        studentToken = await createStudent('meet_student@test.com');
        guideToken = await createGuide('meet_guide@test.com');
        
        const res = await requestApp.post('/api/projects')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ title: 'Meet Proj', domain: 'Test', description: 'Testing meetings' });
        projectId = res.body.data.id;
        groupId = res.body.data.group_id;
    });

    it('should create a meeting', async () => {
        const res = await requestApp.post('/api/meetings')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                group_id: groupId,
                project_id: projectId,
                title: 'Initial Standup',
                date: '2026-10-10',
                time: '10:00',
                duration: '45 mins',
                agenda: 'Discuss project'
            });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Initial Standup');
        meetingId = res.body.data.id;
    });

    it('should list meetings', async () => {
        const res = await requestApp.get('/api/meetings')
            .set('Authorization', `Bearer ${studentToken}`);
            
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should update meeting details', async () => {
        const res = await requestApp.patch(`/api/meetings/${meetingId}`)
            .set('Authorization', `Bearer ${guideToken}`)
            .send({
                status: 'completed',
                meet_link: 'https://meet.google.com/test'
            });
            
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('completed');
        expect(res.body.data.meet_link).toBe('https://meet.google.com/test');
    });
});
