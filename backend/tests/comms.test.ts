import { requestApp, createStudent, createGuide } from './helpers';

describe('Communication API', () => {
    let studentToken: string;
    let guideToken: string;
    let groupId: number;

    beforeAll(async () => {
        studentToken = await createStudent('chat_student@test.com');
        guideToken = await createGuide('chat_guide@test.com');
        
        const res = await requestApp.post('/api/projects')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ title: 'Chat Proj', domain: 'Test', description: 'Testing chat' });
        groupId = res.body.data.group_id;
    });

    it('should allow student to send a message to the group', async () => {
        const res = await requestApp.post('/api/comms/messages')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                group_id: groupId,
                text: 'Hello guide, review my PR!'
            });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.text).toBe('Hello guide, review my PR!');
    });

    it('should allow guide to fetch messages', async () => {
        const res = await requestApp.get(`/api/comms/messages?groupId=${groupId}`)
            .set('Authorization', `Bearer ${guideToken}`);
            
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].text).toBe('Hello guide, review my PR!');
        expect(res.body.data[0].sender_role).toBe('student');
    });
});
