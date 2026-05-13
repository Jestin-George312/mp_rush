import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guideApi } from '../../services/guideApi';
import Card from '../../components/common/UI/Card';
import {
  ChevronLeft, GitCommit, Github, Activity,
  Loader2, AlertCircle, Sparkles, ExternalLink,
  User, Calendar, Hash, RefreshCw
} from 'lucide-react';

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

const CommitActivity: React.FC = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [repoData, setRepoData] = useState<{
    repoUrl: string;
    projectTitle: string;
    projectDescription: string;
    groupName: string;
    commits: Commit[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        if (!projectId) return;
        const res = await guideApi.getProjectCommits(projectId);
        const data = (res.data as any).data || res.data;
        setRepoData(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load commit activity');
      } finally {
        setLoading(false);
      }
    };
    fetchCommits();
  }, [projectId]);

  const handleSelectCommit = async (commit: Commit) => {
    setSelectedCommit(commit);
    setSummary('');
    setSummarizing(true);
    try {
      const res = await guideApi.summarizeCommit(projectId!, {
        commitSha: commit.sha,
        commitMessage: commit.message,
        commitAuthor: commit.author,
        commitDate: commit.date,
      });
      const data = (res.data as any).data || res.data;
      setSummary(data.summary || 'No summary generated.');
    } catch (err: any) {
      setSummary('AI summarization is currently unavailable. Please try again.');
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Fetching Commits...</p>
        </div>
      </div>
    );
  }

  if (error || !repoData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-full">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        <h2 className="text-xl font-black text-gray-800 dark:text-white">Cannot Load Commits</h2>
        <p className="text-sm text-gray-500 max-w-sm">{error || 'Repository may not be linked to this project.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all"
        >
          GO BACK
        </button>
      </div>
    );
  }

  const repoShort = repoData.repoUrl.replace('https://github.com/', '');

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg">
                Commit Activity
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                {repoData.groupName}
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-800 dark:text-white">
              {repoData.projectTitle}
            </h1>
          </div>
        </div>
        <a
          href={repoData.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-gray-700 transition-all shadow-lg"
        >
          <Github size={16} /> {repoShort}
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Body — side by side */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 overflow-hidden">

        {/* ── LEFT: Commit List ── */}
        <div className="flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Activity size={14} className="text-blue-500" />
              {repoData.commits.length} Commits — Select to analyse
            </h3>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                guideApi.getProjectCommits(projectId!)
                  .then(res => setRepoData((res.data as any).data || res.data))
                  .catch(e => setError(e.message))
                  .finally(() => setLoading(false));
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Refresh commits"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <Card className="flex-1 overflow-hidden p-0">
            <div className="h-full overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
              {repoData.commits.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-6">
                  <GitCommit size={32} className="text-gray-300 mb-3" />
                  <p className="text-sm font-black text-gray-400">No commits found</p>
                  <p className="text-[10px] text-gray-400 mt-1">Make sure the repository is public or the token has access.</p>
                </div>
              ) : (
                repoData.commits.map((commit) => {
                  const isSelected = selectedCommit?.sha === commit.sha;
                  return (
                    <button
                      key={commit.sha}
                      onClick={() => handleSelectCommit(commit)}
                      className={`w-full text-left px-5 py-4 transition-all group ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/40 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 transition-colors ${
                          isSelected ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                        }`}>
                          <GitCommit size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold leading-snug line-clamp-2 ${
                            isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'
                          }`}>
                            {commit.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase">
                              <User size={9} /> {commit.author}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                            <span className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase">
                              <Calendar size={9} /> {new Date(commit.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                            <code className={`text-[9px] font-mono font-bold uppercase ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                              <Hash size={9} className="inline mr-0.5" />{commit.sha.substring(0, 7)}
                            </code>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_2px_rgba(59,130,246,0.4)] flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* ── RIGHT: AI Summarizer ── */}
        <div className="flex flex-col min-h-0">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-3 flex-shrink-0">
            <Sparkles size={14} className="text-purple-500" />
            AI Commit Analyser
          </h3>

          {!selectedCommit ? (
            <Card className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-purple-500" />
              </div>
              <h4 className="text-sm font-black text-gray-700 dark:text-white mb-2">Select a Commit</h4>
              <p className="text-xs text-gray-400 font-medium max-w-xs leading-relaxed">
                Click any commit from the list to get an AI-generated analysis of its significance within the project context.
              </p>
              <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30">
                <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Powered by Groq AI</span>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 flex flex-col overflow-hidden">
              {/* Selected Commit Header */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-900/30 rounded-t-2xl flex-shrink-0">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-600 rounded-xl flex-shrink-0">
                    <GitCommit size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-blue-800 dark:text-blue-200 leading-snug line-clamp-2">
                      {selectedCommit.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-[9px] font-black text-blue-600/70 uppercase">{selectedCommit.author}</span>
                      <span className="w-1 h-1 rounded-full bg-blue-300" />
                      <span className="text-[9px] font-black text-blue-600/70 uppercase">
                        {new Date(selectedCommit.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <code className="text-[9px] font-mono text-blue-500 font-bold uppercase">
                        #{selectedCommit.sha.substring(0, 7)}
                      </code>
                    </div>
                  </div>
                  <a
                    href={selectedCommit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all flex-shrink-0"
                    title="View on GitHub"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="flex-1 p-5 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="text-purple-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-purple-600">AI Analysis</span>
                  <span className="ml-auto text-[9px] font-black text-gray-400 uppercase tracking-widest">Llama 3.3 (Groq)</span>
                </div>

                {summarizing ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-purple-200 border-t-purple-600 animate-spin" />
                      <Sparkles size={16} className="text-purple-500 absolute inset-0 m-auto" />
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">
                      Analysing with Groq...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-6 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
                          {summary}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectCommit(selectedCommit)}
                      className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={12} /> Re-analyse Commit
                    </button>
                  </div>
                )}
              </div>

              {/* Project Context Badge */}
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  Context: {repoData.projectTitle} · {repoData.groupName}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommitActivity;
