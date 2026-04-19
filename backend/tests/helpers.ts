import request from 'supertest';
import app from '../src/server';

export const requestApp = request(app);

// We need to hit the local auth endpoint to get a token
export const createStudent = async (email: string) => {
    await requestApp.post('/api/auth/register').send({
        full_name: 'Test Student',
        email,
        password: 'password123',
        role: 'student'
    });
    const res = await requestApp.post('/api/auth/login').send({
        email,
        password: 'password123'
    });
    return res.body.token;
};

export const createGuide = async (email: string) => {
    await requestApp.post('/api/auth/register').send({
        full_name: 'Test Guide',
        email,
        password: 'password123',
        role: 'guide'
    });
    const res = await requestApp.post('/api/auth/login').send({
        email,
        password: 'password123'
    });
    return res.body.token;
};

export const createCoordinator = async (email: string) => {
    await requestApp.post('/api/auth/register').send({
        full_name: 'Test Coordinator',
        email,
        password: 'password123',
        role: 'coordinator'
    });
    const res = await requestApp.post('/api/auth/login').send({
        email,
        password: 'password123'
    });
    return res.body.token;
};
