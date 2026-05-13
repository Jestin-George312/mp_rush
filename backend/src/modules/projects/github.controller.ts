import { Request, Response } from 'express';
import * as githubService from './github.service';
import axios from 'axios';
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

// Guide: fetch all commits for a specific project's linked repo
export const getCommitsByProject = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const projectRes = await pool.query(
            `SELECT p.github_repo, p.title, p.description, g.group_name
             FROM projects p
             JOIN groups g ON g.id = p.group_id
             WHERE p.id = $1`,
            [projectId]
        );

        const row = projectRes.rows[0];
        if (!row?.github_repo) return sendError(res, 'No repository linked to this project', 400);

        const commits = await githubService.fetchCommits(row.github_repo);
        sendSuccess(res, {
            repoUrl: row.github_repo,
            projectTitle: row.title,
            projectDescription: row.description,
            groupName: row.group_name,
            commits,
        });
    } catch (error: any) {
        sendError(res, error.message);
    }
};

// AI summarizer: explain a commit in context of the project using Gemini
export const summarizeCommit = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const { commitSha, commitMessage, commitAuthor, commitDate } = req.body;

        if (!commitMessage) return sendError(res, 'Commit message is required', 400);

        const projectRes = await pool.query(
            `SELECT p.title, p.description, p.domain, g.group_name
             FROM projects p
             JOIN groups g ON g.id = p.group_id
             WHERE p.id = $1`,
            [projectId]
        );

        const project = projectRes.rows[0];
        if (!project) return sendError(res, 'Project not found', 404);

        const groqApiKey = process.env.GROQ_API;
        if (!groqApiKey) return sendError(res, 'AI service not configured', 503);

        // Fetch actual code changes
        let fileChanges = 'Detailed code diffs are currently unavailable. Please intelligently infer the technical impact from the commit message, project context, and file metadata below.';
        try {
            if (project.github_repo && commitSha) {
                const details = await githubService.getCommitDetails(project.github_repo, commitSha);
                if (details && details.length > 0) {
                    fileChanges = details.map((f: any) => 
                        `File: ${f.filename} (${f.status})\nChanges: +${f.additions} -${f.deletions}\nPatch:\n${f.patch}\n`
                    ).join('\n---\n');
                    
                    // Limit length to avoid context window issues
                    if (fileChanges.length > 12000) {
                        fileChanges = fileChanges.substring(0, 12000) + '... (truncated due to size)';
                    }
                }
            }
        } catch (e: any) {
            console.error('Failed to fetch commit details for AI:', e.message);
        }

        const prompt = `You are an expert academic project reviewer and senior software engineer evaluating GitHub commits made by students in a software development project.

Your task is to deeply analyse the significance of this commit using:
1. Project context
2. Commit message
3. Actual modified code/files (if available)
4. Architecture and development impact

==================================================
PROJECT CONTEXT
==================================================

Project Title: ${project.title}
Project Domain: ${project.domain || 'Not specified'}
Project Description: ${project.description || 'Not provided'}
Group: ${project.group_name}

==================================================
COMMIT METADATA
==================================================

Commit SHA: ${commitSha}
Author: ${commitAuthor}
Date: ${new Date(commitDate).toLocaleString()}
Commit Message: ${commitMessage}

==================================================
ACTUAL CODE CHANGES / METADATA
==================================================

${fileChanges}

==================================================
YOUR ANALYSIS TASK
==================================================

Carefully inspect the ACTUAL CODE CHANGES and explain:

1. What technical changes were implemented
2. Why these changes matter in the context of the project
3. Evaluate the engineering quality
4. Estimate the development significance
5. Infer probable developer intent

==================================================
CRITICAL RULES
==================================================

- If actual code changes (patches) are available, prioritise analysing the code diffs and modified files.
- If code diffs are NOT available, intelligently infer the likely technical work from the commit message, project context, and development stage.
- Do NOT say "no code changes were provided", "analysis is not possible", or "cannot evaluate".
- Instead, provide the most technically reasonable interpretation while clearly indicating when something is inferred rather than directly visible.
- Do NOT simply restate the commit message.
- Analyse the REAL work, be technically intelligent and context-aware.
- Maximum length: 250 words.

==================================================
OUTPUT FORMAT
==================================================

Summary:
(2-4 sentence technical overview)

Technical Significance:
(Explain architectural/functional importance)

Engineering Evaluation:
(Comment on implementation quality)

Impact Level:
(Minor/Moderate/Major/etc.)

Overall Assessment:
(Final concise supervisor-style judgement)`;

        try {
            const axiosRes = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a senior technical supervisor. Deeply analyze code changes in project context.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 800,
                    temperature: 0.5
                },
                {
                    headers: {
                        'Authorization': `Bearer ${groqApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const summary = axiosRes.data?.choices?.[0]?.message?.content || 'No summary could be generated for this commit.';
            sendSuccess(res, { summary, commitSha, commitMessage });
        } catch (error: any) {
            if (error.response) {
                console.error('Groq API Error Detail:', JSON.stringify(error.response.data, null, 2));
                return sendError(res, `Groq API Error: ${error.response.data?.error?.message || error.message}`, error.response.status);
            }
            throw error;
        }
    } catch (error: any) {
        console.error('Summarize commit error:', error.message);
        sendError(res, error.message);
    }
};

// AI health analysis: Provide overall health report of the project commits
export const getHealthAnalysis = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.params;
        const projectRes = await pool.query(
            `SELECT p.title, p.description, p.domain, p.github_repo, g.group_name
             FROM projects p
             JOIN groups g ON g.id = p.group_id
             WHERE p.id = $1`,
            [projectId]
        );

        const project = projectRes.rows[0];
        if (!project || !project.github_repo) {
            return sendError(res, 'Project or repository not found', 404);
        }

        const groqApiKey = process.env.GROQ_API;
        if (!groqApiKey) return sendError(res, 'AI service not configured', 503);

        // 1. Get Fork/Comparison Data
        let comparisonData = null;
        try {
            comparisonData = await githubService.getComparison(project.github_repo);
        } catch (e) {
            console.warn('Comparison failed (might not be a fork):', e);
        }

        // 2. Get Recent Commits (summary)
        const commits = await githubService.fetchCommits(project.github_repo);
        const commitSummary = commits.slice(0, 15).map((c: any) => `- ${c.message} (${c.author})`).join('\n');

        const prompt = `You are an expert software engineering analyst reviewing a student GitHub repository.

PROJECT CONTEXT:
- Title: ${project.title}
- Domain: ${project.domain || 'Not specified'}
- Group: ${project.group_name}

GIT REPOSITORY STATISTICS:
- Total Recent Commits: ${commits.length}
- Repository Type: ${comparisonData?.isFork ? `Fork of ${comparisonData.parentName} (${comparisonData.aheadBy} commits ahead)` : 'Original Repository'}

RECENT COMMIT HISTORY (Last 15 commits, chronological):
${commitSummary}

==================================================
TASK:
Analyse this GitHub repository and estimate the likelihood of AI-assisted development based on commit patterns, coding consistency, architectural decisions, commenting style, repetition patterns, implementation depth, and development evolution over time.

Do NOT treat AI assistance as plagiarism or misconduct. This is a probabilistic, evidence-based assessment only.

OUTPUT FORMAT (JSON):
{
  "aiAssistanceLevel": "Minimal | Moderate | Significant | Extensive",
  "confidenceScore": (0-100),
  "technicalReasons": "(2-3 sentences explaining the reasoning based on commit patterns, message style, development evolution, etc.)",
  "humanDrivenIndicators": ["Indicator 1", "Indicator 2"],
  "aiAssistedIndicators": ["Indicator 1", "Indicator 2"]
}
Only output the JSON.`;

        const axiosRes = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a senior technical auditor. Output only valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                max_tokens: 600,
                temperature: 0.4
            },
            {
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        let report;
        try {
            const content = axiosRes.data.choices[0].message.content;
            report = JSON.parse(content);
        } catch (e) {
            console.error('Failed to parse Groq health JSON:', axiosRes.data.choices[0].message.content);
            throw new Error('Invalid report format from AI');
        }

        sendSuccess(res, report);
    } catch (error: any) {
        console.error('Health analysis error:', error.message);
        sendError(res, error.message);
    }
};
