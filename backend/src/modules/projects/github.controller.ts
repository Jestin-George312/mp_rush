import { Request, Response } from 'express';
import * as githubService from './github.service';
import { sendSuccess, sendError } from '../../utils/response';
import pool from '../../config/db';

export const linkRepo = async (req: Request, res: Response) => {
    try {
        const { repoUrl } = req.body;
        const studentId = req.user!.id;

        // Find the student's project
        const projectRes = await pool.query(
            `SELECT p.id FROM projects p 
             JOIN group_members gm ON gm.group_id = p.group_id 
             WHERE gm.student_id = $1 LIMIT 1`,
            [studentId]
        );

        if (projectRes.rows.length === 0) {
            return sendError(res, 'No active project found for this user', 404);
        }

        const projectId = projectRes.rows[0].id;
        const updatedProject = await githubService.linkRepository(projectId, repoUrl);
        
        sendSuccess(res, updatedProject, 'GitHub repository linked successfully');
    } catch (error: any) {
        sendError(res, error.message);
    }
};

export const getCommits = async (req: Request, res: Response) => {
    try {
        const studentId = req.user!.id;
        const projectRes = await pool.query(
            `SELECT p.github_repo FROM projects p 
             JOIN group_members gm ON gm.group_id = p.group_id 
             WHERE gm.student_id = $1 LIMIT 1`,
            [studentId]
        );

        const repoUrl = projectRes.rows[0]?.github_repo;
        if (!repoUrl) return sendSuccess(res, { repoUrl: null, commits: [] }, 'No repository linked');

        const commits = await githubService.fetchCommits(repoUrl);
        sendSuccess(res, { repoUrl, commits });
    } catch (error: any) {
        sendError(res, error.message);
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const signature = req.headers['x-hub-signature-256'] as string;
        const secret = process.env.GITHUB_WEBHOOK_SECRET;

        if (secret && signature) {
            const isValid = githubService.verifySignature(JSON.stringify(req.body), signature, secret);
            if (!isValid) return res.status(401).send('Invalid signature');
        }

        await githubService.handlePushWebhook(req.body);
        res.status(200).send('Webhook processed');
    } catch (error: any) {
        res.status(500).send('Webhook error');
    }
};

export const analyzeFork = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const projectRes = await pool.query(`SELECT github_repo FROM projects WHERE id = $1`, [projectId]);
        
        const repoUrl = projectRes.rows[0]?.github_repo;
        if (!repoUrl) return sendError(res, 'No repository linked to this project', 400);

        const analysis = await githubService.getComparison(repoUrl);
        sendSuccess(res, analysis);
    } catch (error: any) {
        sendError(res, error.message);
    }
};
