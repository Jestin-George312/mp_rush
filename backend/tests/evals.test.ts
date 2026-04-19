import { requestApp, createCoordinator, createGuide, createStudent } from './helpers';

describe('Evaluations & Rubrics API', () => {
    let coordToken: string;
    let guideToken: string;
    let studentToken: string;
    let rubricId: number;
    let groupId: number;

    beforeAll(async () => {
        coordToken = await createCoordinator('eval_coord@test.com');
        guideToken = await createGuide('eval_guide@test.com');
        studentToken = await createStudent('eval_student@test.com');

        const res = await requestApp.post('/api/projects')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ title: 'Eval Proj', domain: 'Test', description: 'Testing evaluations' });
        groupId = res.body.data.group_id;
    });

    it('should allow coordinator to create a rubric', async () => {
        const criteria = [
            { description: 'Code Quality', maxMarks: 50 },
            { description: 'Presentation', maxMarks: 50 }
        ];

        const res = await requestApp.post('/api/evaluations/rubrics')
            .set('Authorization', `Bearer ${coordToken}`)
            .send({
                name: 'Final Presentation',
                totalScore: 100,
                criteria
            });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Final Presentation');
        rubricId = res.body.data.id;
    });

    it('should list rubrics', async () => {
        const res = await requestApp.get('/api/evaluations/rubrics')
            .set('Authorization', `Bearer ${guideToken}`);
            
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should allow guide to submit scores for a group', async () => {
        const res = await requestApp.post('/api/evaluations/scores')
            .set('Authorization', `Bearer ${guideToken}`)
            .send({
                rubric_id: rubricId,
                group_id: groupId,
                scores: { '0': 45, '1': 48 }, // Using JS Object mapped to jsonb
                total: 93
            });
            
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.total).toBe(93);
    });

    it('should fetch scores for a group', async () => {
        const res = await requestApp.get(`/api/evaluations/scores?groupId=${groupId}`)
            .set('Authorization', `Bearer ${studentToken}`);
            
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data[0].total).toBe(93);
    });
});
