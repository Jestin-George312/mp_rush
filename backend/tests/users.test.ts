import { requestApp, createStudent } from './helpers';
import pool from '../src/config/db';

describe('Users / Profiles API', () => {
    let studentToken: string;

    beforeAll(async () => {
        studentToken = await createStudent('profile_test@test.com');
    });

    it('should load student profile', async () => {
        const res = await requestApp.get('/api/users/profile')
            .set('Authorization', `Bearer ${studentToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.email).toBe('profile_test@test.com');
    });

    it('should update student profile', async () => {
        const res = await requestApp.patch('/api/users/profile')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                bio: 'I love automated testing',
                phone: '1234567890',
                location: 'Earth'
            });
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.bio).toBe('I love automated testing');
    });
});
