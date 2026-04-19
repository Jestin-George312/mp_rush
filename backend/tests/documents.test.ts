import { requestApp, createStudent, createGuide } from './helpers';
import fs from 'fs';
import path from 'path';

describe('Documents API', () => {
    let studentToken: string;
    let guideToken: string;
    let projectId: number;
    let docId: number;
    let testFilePath: string;

    beforeAll(async () => {
        studentToken = await createStudent('doc_student@test.com');
        guideToken = await createGuide('doc_guide@test.com');
        const res = await requestApp.post('/api/projects')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ title: 'Doc Proj', domain: 'Test', description: 'Testing docs' });
        projectId = res.body.data.id;

        testFilePath = path.join(__dirname, 'test.pdf');
        fs.writeFileSync(testFilePath, '%PDF-1.4 test mock pdf file content');
    });

    afterAll(() => {
        if (fs.existsSync(testFilePath)) fs.unlinkSync(testFilePath);
    });

    it('should upload a document', async () => {
        const res = await requestApp.post('/api/documents/upload')
            .set('Authorization', `Bearer ${studentToken}`)
            .field('project_id', projectId)
            .field('type', 'SRS')
            .attach('file', testFilePath);
            
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.type).toBe('SRS');
        docId = res.body.data.id;
    });

    it('should fetch documents', async () => {
        const res = await requestApp.get(`/api/documents?projectId=${projectId}`)
            .set('Authorization', `Bearer ${studentToken}`);
            
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should allow guide to update document status', async () => {
        const res = await requestApp.patch(`/api/documents/${docId}/status`)
            .set('Authorization', `Bearer ${guideToken}`)
            .send({ status: 'Approved' });
            
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('Approved');
    });
});
