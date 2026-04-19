import { requestApp, createStudent, createGuide, createCoordinator } from './helpers';

describe('Projects API', () => {
    let studentToken: string;
    let student2Token: string;
    let guideToken: string;
    let coordToken: string;

    beforeAll(async () => {
        studentToken = await createStudent('proj_student@test.com');
        student2Token = await createStudent('proj_student2@test.com');
        guideToken = await createGuide('proj_guide@test.com');
        coordToken = await createCoordinator('proj_coord@test.com');
    });

    let projectId: number;
    let groupId: number;

    it('should allow student to submit a project generating a group implicitly', async () => {
        const res = await requestApp.post('/api/projects')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                title: 'Test Web App',
                domain: 'Web',
                description: 'A test project',
                teamMembers: 'proj_student2@test.com' // Testing comma mapping
            });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Test Web App');
        projectId = res.body.data.id;
        groupId = res.body.data.group_id;
    });

    it('should allow getting student projects', async () => {
        const res = await requestApp.get('/api/projects')
            .set('Authorization', `Bearer ${studentToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should allow coordinator to read all groups', async () => {
        const res = await requestApp.get('/api/projects/groups/all')
            .set('Authorization', `Bearer ${coordToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    // We need guide's uid. Let's fetch it via profile
    it('should allow coordinator to assign guide to group', async () => {
        const profileRes = await requestApp.get('/api/users/profile').set('Authorization', `Bearer ${guideToken}`);
        const guideUid = profileRes.body.data.uid;

        const res = await requestApp.patch(`/api/projects/groups/${groupId}/guide`)
            .set('Authorization', `Bearer ${coordToken}`)
            .send({ guideId: guideUid });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should allow guide to update approval status of a project under their group', async () => {
        const res = await requestApp.patch(`/api/projects/${projectId}/status`)
            .set('Authorization', `Bearer ${guideToken}`)
            .send({ status: 'approved' });
        
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('approved');
    });

});
