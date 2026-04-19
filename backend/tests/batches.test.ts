import { requestApp, createCoordinator, createStudent } from './helpers';

describe('Batches API', () => {
    let coordinatorToken: string;
    let studentToken: string;

    beforeAll(async () => {
        coordinatorToken = await createCoordinator('coord_batch@test.com');
        studentToken = await createStudent('student_batch@test.com');
    });

    let batchId: number;

    it('should allow coordinator to create a batch', async () => {
        const res = await requestApp.post('/api/batches')
            .set('Authorization', `Bearer ${coordinatorToken}`)
            .send({
                name: 'MCA 2026-Test',
                start_year: 2024,
                end_year: 2026
            });
        
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('MCA 2026-Test');
        batchId = res.body.data.id;
    });

    it('should not allow student to create a batch', async () => {
        const res = await requestApp.post('/api/batches')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                name: 'Hacker Batch',
                start_year: 2024,
                end_year: 2026
            });
        
        expect(res.status).toBe(403);
    });

    it('should allow coordinator to list batches', async () => {
        const res = await requestApp.get('/api/batches')
            .set('Authorization', `Bearer ${coordinatorToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should allow coordinator to update a batch', async () => {
        const res = await requestApp.patch(`/api/batches/${batchId}`)
            .set('Authorization', `Bearer ${coordinatorToken}`)
            .send({
                is_active: false
            });
        
        expect(res.status).toBe(200);
        expect(res.body.data.is_active).toBe(false);
    });
});
