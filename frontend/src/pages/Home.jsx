import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, History, ShieldAlert, Sparkles, Terminal, Cpu } from 'lucide-react';
import { triggerScan, getScanHistory } from '../services/api';
import toast from 'react-hot-toast';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getScanHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      return toast.error('Please enter a GitHub repository URL.');
    }

    if (!repoUrl.includes('github.com')) {
      return toast.error('Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)');
    }

    setLoading(true);
    const scanToast = toast.loading('Connecting to GitHub and selecting critical files...');

    try {
      const result = await triggerScan(repoUrl);
      toast.success(result.cached ? 'Loaded cached scan results.' : 'Scan completed successfully!', { id: scanToast });
      navigate(`/dashboard/${result.data._id}`);
    } catch (error) {
      console.error(error);
      const detailMsg = error.response?.data?.details || error.message;
      toast.error(`Scanning pipeline failed: ${detailMsg}`, { id: scanToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-4xl mx-auto pt-8">
      {/* Hero Header */}
      <div className="text-center space-y-4 mb-12 relative">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered Vulnerability Analysis
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          Pen-Test Repositories with <br />
          <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-indigo-600 bg-clip-text text-transparent">
            GITPEN AI Security
          </span>
        </h1>
        <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto">
          Audit configurations, check dependencies, and identify code vulnerabilities instantly using Gemini & Groq AI models.
        </p>
      </div>

      {/* URL Input Form */}
      <div className="w-full max-w-3xl mb-16">
        <form onSubmit={handleScan} className="relative group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 opacity-60 blur-md group-focus-within:opacity-100 transition duration-300"></div>
          <div className="relative flex flex-col sm:flex-row items-center gap-3 p-2 bg-slate-900 border border-white/10 rounded-2xl">
            <div className="relative flex-1 w-full flex items-center pl-3">
              <Search className="w-5 h-5 text-gray-500 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Paste GitHub Repository Link (e.g. https://github.com/expressjs/express)"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={loading}
                className="w-full py-3 bg-transparent border-0 outline-none text-white placeholder-gray-500 text-base disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold text-sm tracking-wide rounded-xl shadow-lg active:scale-[0.98] transition duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                'Launch Analysis'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Feature cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Vulnerability Scanning</h3>
          <p className="text-sm text-gray-400">
            Locate secrets leaks, SQL injections, XSS, and authorization flaws flagged directly at the line-level of your code.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Deep Code Audits</h3>
          <p className="text-sm text-gray-400">
            Assess algorithmic complexity, readability, and speed characteristics leveraging Groq's high-speed AI analysis.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
            <Terminal className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Interactive Copilot</h3>
          <p className="text-sm text-gray-400">
            Query the context-aware chatbot for custom secure remediation directives directly on your scanned files.
          </p>
        </div>
      </div>

      {/* Scanned History Panel */}
      {history.length > 0 && (
        <div className="w-full border-t border-white/10 pt-10">
          <div className="flex items-center gap-2 mb-6 text-gray-400">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Recent Security Audits</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {history.map((scan) => {
              const totalVulns = scan.vulnerabilities?.length || 0;
              const isExcellent = scan.securityScore >= 80;
              const isWarning = scan.securityScore >= 60 && scan.securityScore < 80;

              return (
                <Link
                  key={scan._id}
                  to={`/dashboard/${scan._id}`}
                  className="glass-panel glass-panel-hover p-4 rounded-xl border border-white/5 flex items-center justify-between transition group"
                >
                  <div className="space-y-1 pr-4 truncate">
                    <p className="font-semibold text-sm text-white group-hover:text-cyan-400 transition truncate">
                      {scan.owner}/{scan.name}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <span>branch: {scan.branch}</span>
                      <span className="text-white/20">•</span>
                      <span>{new Date(scan.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-gray-400 block">score</span>
                      <span
                        className={`font-extrabold text-sm ${
                          isExcellent
                            ? 'text-emerald-400'
                            : isWarning
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {scan.securityScore}/100
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center px-2.5 py-1 bg-white/5 rounded-md border border-white/10">
                      <span className="text-[10px] text-gray-400 block uppercase">vulns</span>
                      <span className="text-xs font-bold text-gray-200">{totalVulns}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
