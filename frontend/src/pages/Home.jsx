import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, History, ShieldAlert, Sparkles, Terminal, Cpu, CheckCircle2, Loader2 } from 'lucide-react';
import { triggerScan, getScanStatus, getScanHistory } from '../services/api';
import toast from 'react-hot-toast';

// Ordered phases shown during the scan with animated progress
const SCAN_PHASES = [
  { key: 'Queued',                      label: 'Queued for analysis' },
  { key: 'Fetching repository info...',  label: 'Fetching repository info' },
  { key: 'Checking latest commit...',    label: 'Checking latest commit' },
  { key: 'Selecting critical files...',  label: 'Selecting critical files' },
  { key: 'Downloading file contents...', label: 'Downloading source files' },
  { key: 'Running AI security analysis...', label: 'Running AI security analysis' },
  { key: 'Saving results...',            label: 'Saving results to database' },
  { key: 'Done',                         label: 'Scan complete!' },
];

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();
  const pollIntervalRef = useRef(null);
  const scanToastRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getScanHistory();
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
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
    setCurrentPhase('Queued');
    scanToastRef.current = toast.loading('Connecting to GitHub...');

    try {
      // POST /api/scan — returns immediately with a jobId
      const { jobId } = await triggerScan(repoUrl);

      // Poll /api/scan/status/:jobId every 3 seconds
      pollIntervalRef.current = setInterval(async () => {
        try {
          const result = await getScanStatus(jobId);
          setCurrentPhase(result.phase);
          toast.loading(result.phase || 'Analyzing...', { id: scanToastRef.current });

          if (result.status === 'completed') {
            stopPolling();
            toast.success('Scan completed successfully!', { id: scanToastRef.current });
            setLoading(false);
            setCurrentPhase(null);
            navigate(`/dashboard/${result.scanId}`);
          } else if (result.status === 'failed') {
            stopPolling();
            toast.error(`Scan failed: ${result.error || 'Unknown error'}`, { id: scanToastRef.current });
            setLoading(false);
            setCurrentPhase(null);
          }
        } catch (pollError) {
          console.error('Polling error:', pollError);
          // Don't stop polling on a single network blip — just log it
        }
      }, 3000);
    } catch (error) {
      console.error(error);
      stopPolling();
      const detailMsg = error.response?.data?.details || error.response?.data?.error || error.message;
      toast.error(`Scanning failed: ${detailMsg}`, { id: scanToastRef.current });
      setLoading(false);
      setCurrentPhase(null);
    }
  };

  // Figure out which phase index we're at for the progress bar
  const phaseIndex = SCAN_PHASES.findIndex((p) => p.key === currentPhase);
  const progressPct = phaseIndex < 0 ? 0 : Math.round((phaseIndex / (SCAN_PHASES.length - 1)) * 100);

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
          Audit configurations, check dependencies, and identify code vulnerabilities instantly using AI models.
        </p>
      </div>

      {/* URL Input Form */}
      <div className="w-full max-w-3xl mb-8">
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
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-black font-bold text-sm tracking-wide rounded-xl shadow-lg active:scale-[0.98] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Launch Analysis'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live scan progress panel */}
      {loading && currentPhase && (
        <div className="w-full max-w-3xl mb-10 glass-panel rounded-2xl border border-cyan-500/20 p-5 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-cyan-400 font-semibold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {SCAN_PHASES.find((p) => p.key === currentPhase)?.label || currentPhase}
            </span>
            <span className="text-gray-500">{progressPct}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Phase step list */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {SCAN_PHASES.slice(0, -1).map((phase, i) => {
              const isDone = phaseIndex > i;
              const isActive = phaseIndex === i;
              return (
                <div
                  key={phase.key}
                  className={`flex items-center gap-2 text-xs px-2 py-1 rounded-lg transition-colors ${
                    isDone ? 'text-emerald-400' : isActive ? 'text-cyan-300' : 'text-gray-600'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : isActive ? (
                    <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-current shrink-0 opacity-30" />
                  )}
                  {phase.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
            Assess algorithmic complexity, readability, and speed characteristics leveraging high-speed AI analysis.
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
                          isExcellent ? 'text-emerald-400' : isWarning ? 'text-yellow-400' : 'text-red-400'
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
