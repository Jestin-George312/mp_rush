import axios from 'axios';
import pool from '../../config/db';
import crypto from 'crypto';

const GITHUB_API_BASE = 'https://api.github.com';

export const verifySignature = (payload: string, signature: string, secret: string) => {
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
};

export const fetchCommits = async (repoUrl: string) => {
    try {
        // Clean and extract owner/repo from URL
        // Handles: https://github.com/owner/repo, https://github.com/owner/repo.git, etc.
        let cleaned = repoUrl.replace('https://github.com/', '').replace('http://github.com/', '');
        cleaned = cleaned.replace(/\.git$/, '').replace(/\/$/, '');
        const parts = cleaned.split('/');
        const owner = parts[0];
        const repo = parts[1];

        const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits`, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
            params: { per_page: 30 }
        });

        return response.data.map((c: any) => ({
            sha: c.sha,
            message: c.commit.message,
            author: c.commit.author.name,
            date: c.commit.author.date,
            url: c.html_url
        }));
    } catch (error: any) {
        console.error('GitHub API error:', error.response?.data || error.message);
        throw new Error('Could not fetch commits from GitHub');
    }
};

export const getCommitDetails = async (repoUrl: string, sha: string) => {
    try {
        let cleaned = repoUrl.replace('https://github.com/', '').replace('http://github.com/', '');
        cleaned = cleaned.replace(/\.git$/, '').replace(/\/$/, '');
        const parts = cleaned.split('/');
        const owner = parts[0];
        const repo = parts[1];

        const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${sha}`, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            }
        });

        return response.data.files.map((f: any) => ({
            filename: f.filename,
            patch: f.patch || '(No patch available - possibly a binary file or too large)',
            status: f.status,
            additions: f.additions,
            deletions: f.deletions
        }));
    } catch (error: any) {
        console.error('GitHub Detail API error:', error.response?.data || error.message);
        throw new Error('Could not fetch commit details');
    }
};

export const linkRepository = async (projectId: number, repoUrl: string) => {
    const result = await pool.query(
        `UPDATE projects SET github_repo = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [repoUrl, projectId]
    );
    return result.rows[0];
};

export const handlePushWebhook = async (payload: any) => {
    const repoUrl = payload.repository.html_url;
    const latestCommit = payload.commits[0];

    if (!latestCommit) return;

    // We can store the latest commit info or just trigger a refresh
    // For now, let's just log it or update a 'last_commit_at' field if we had one
    console.log(`Push received for ${repoUrl}: ${latestCommit.message}`);
};

export const getComparison = async (repoUrl: string) => {
    try {
        let cleaned = repoUrl.replace('https://github.com/', '').replace('http://github.com/', '');
        cleaned = cleaned.replace(/\.git$/, '').replace(/\/$/, '');
        const parts = cleaned.split('/');
        const owner = parts[0];
        const repo = parts[1];

        // 1. Get Repo details to find parent
        const repoRes = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            }
        });

        const repoData = repoRes.data;
        if (!repoData.fork) {
            return { isFork: false, reason: 'not_a_fork' };
        }

        if (!repoData.parent) {
            return { isFork: false, reason: 'no_parent_access' };
        }

        const parentFullName = repoData.parent.full_name; // e.g., "original_owner/base_repo"
        const studentBranch = repoData.default_branch || 'main';

        // 2. Compare with parent
        // Format: parent_owner:branch...student_owner:branch
        const compareRes = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/compare/${parentFullName}:${studentBranch}...${studentBranch}`, {
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            }
        });

        const comparison = compareRes.data;

        return {
            isFork: true,
            parentName: parentFullName,
            status: comparison.status, // ahead, behind, identical
            aheadBy: comparison.ahead_by,
            behindBy: comparison.behind_by,
            totalCommits: comparison.total_commits,
            filesChanged: comparison.files.length,
            stats: {
                additions: comparison.files.reduce((acc: number, f: any) => acc + f.additions, 0),
                deletions: comparison.files.reduce((acc: number, f: any) => acc + f.deletions, 0),
            },
            commits: comparison.commits.map((c: any) => ({
                message: c.commit.message,
                author: c.commit.author.name,
                date: c.commit.author.date,
                sha: c.sha
            }))
        };
    } catch (error: any) {
        console.error('GitHub Comparison error:', error.response?.data || error.message);
        throw new Error('Could not perform fork-level analysis');
    }
};

