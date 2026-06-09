import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Shield, AlertTriangle, CheckCircle, Package, ArrowRight,
  RefreshCw, FileText, ChevronRight, Activity, Terminal
} from 'lucide-react';
import { getScanDetails } from '../services/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScanDetails();
  }, [id]);

  const fetchScanDetails = async () => {
    try {
      setLoading(true);
      const data = await getScanDetails(id);
      setScan(data);

      // Save to local history
      try {
        const historyItem = {
          _id: data._id,
          owner: data.owner,
          name: data.name,
          branch: data.branch,
          securityScore: data.securityScore,
          vulnerabilities: data.vulnerabilities || [],
          createdAt: data.createdAt,
        };

        const stored = localStorage.getItem('gitpen_scan_history');
        let currentHistory = stored ? JSON.parse(stored) : [];
        currentHistory = currentHistory.filter((item) => item._id !== historyItem._id);
        currentHistory.unshift(historyItem);
        currentHistory = currentHistory.slice(0, 10);
        localStorage.setItem('gitpen_scan_history', JSON.stringify(currentHistory));
      } catch (historyErr) {
        console.error('Failed to update local history:', historyErr);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to retrieve scan results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium animate-pulse">Loading dashboard telemetry...</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-400">Scan details not found</h2>
        <Link to="/" className="text-cyan-400 hover:underline mt-4 inline-block">Go back home</Link>
      </div>
    );
  }

  // Calculate stats
  const vulns = scan.vulnerabilities || [];
  const critical = vulns.filter(v => v.severity === 'critical').length;
  const high = vulns.filter(v => v.severity === 'high').length;
  const medium = vulns.filter(v => v.severity === 'medium').length;
  const low = vulns.filter(v => v.severity === 'low').length;

  const chartData = [
    { name: 'Critical', count: critical, fill: '#ef4444' },
    { name: 'High', count: high, fill: '#f97316' },
    { name: 'Medium', count: medium, fill: '#eab308' },
    { name: 'Low', count: low, fill: '#3b82f6' }
  ];

  // Grade calculation
  let grade = 'F';
  let gradeColor = 'text-red-500';
  const score = scan.securityScore;
  if (score >= 90) { grade = 'A'; gradeColor = 'text-emerald-400'; }
  else if (score >= 80) { grade = 'B'; gradeColor = 'text-green-400'; }
  else if (score >= 70) { grade = 'C'; gradeColor = 'text-yellow-400'; }
  else if (score >= 60) { grade = 'D'; gradeColor = 'text-orange-400'; }

  // Circle Gauge offsets
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-8">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-1">
            <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20 uppercase tracking-wider">
              Scan Finished
            </span>
            <span>commit: {scan.commitHash.substring(0, 7)}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            {scan.owner}/<span className="text-cyan-400">{scan.name}</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Branch: <code className="bg-white/5 px-1.5 py-0.5 rounded text-gray-300">{scan.branch}</code> • Analyzed {scan.analyzedFiles.length} critical codebase files.
          </p>
        </div>

        <Link
          to={`/scan/${scan._id}`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-sm transition self-start"
        >
          Explore Source & Chat AI
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid of Main Dashboard Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Score Circle Gauge */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center relative overflow-hidden h-[240px]">
          <div className="absolute inset-0 bg-gradient-radial from-cyan-500/5 via-transparent to-transparent pointer-events-none"></div>
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* SVG Circle Gauge */}
            <svg className="w-full h-full transform -rotate-90 radial-progress-svg">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-white/5"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-cyan-500"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{score}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Score</span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-sm font-semibold text-gray-300">Security Health Grade: <span className={`font-black ${gradeColor}`}>{grade}</span></h3>
          </div>
        </div>

        {/* Breakdown Indicator Cards */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-[240px]">
          <div>
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Scan Findings Summary
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed line-clamp-4">
              {scan.summary}
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-white/5 pt-4 text-xs text-gray-400">
            <span>Dependency Status:</span>
            <span className={`font-semibold capitalize flex items-center gap-1 ${
              scan.dependencyHealth.status === 'healthy' ? 'text-emerald-400' :
              scan.dependencyHealth.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                scan.dependencyHealth.status === 'healthy' ? 'bg-emerald-400' :
                scan.dependencyHealth.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
              }`}></span>
              {scan.dependencyHealth.status}
            </span>
          </div>
        </div>

        {/* Severity Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 h-[240px]">
          <h3 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-cyan-400" />
            Vulnerability Spectrum
          </h3>
          <div className="w-full h-[150px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, idx) => (
                    <Bar key={`bar-${idx}`} dataKey="count" fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Code Quality & Config Hardening splits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Code Quality (Groq SDK) */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-cyan-400" />
              Code Quality Index (Groq AI)
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/25 text-cyan-400">
              Score: {scan.codeQuality.score}/100
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-0.5">Readability</span>
              <p className="text-gray-300 leading-relaxed">{scan.codeQuality.readability}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-0.5">Complexity</span>
              <p className="text-gray-300 leading-relaxed">{scan.codeQuality.complexity}</p>
            </div>
          </div>
        </div>

        {/* Config Hardening */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-base font-semibold text-white border-b border-white/5 pb-3 flex items-center gap-2">
            <Terminal className="w-4.5 h-4.5 text-cyan-400" />
            Config Hardening & Docker audits
          </h3>

          <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1">
            {scan.configHardening.length > 0 ? (
              scan.configHardening.map((config, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-white">{config.setting}</p>
                    <p className="text-xs text-gray-400">{config.description}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    config.status === 'secure' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    config.status === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {config.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400 italic">No security configurations scanned.</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Vulnerabilities Checklist */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-4">
          <AlertTriangle className="w-5 h-5 text-cyan-400" />
          Vulnerabilities Registry ({vulns.length})
        </h3>

        {vulns.length > 0 ? (
          <div className="divide-y divide-white/5">
            {vulns.map((vuln) => {
              let badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
              if (vuln.severity === 'high') badgeColor = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
              if (vuln.severity === 'medium') badgeColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
              if (vuln.severity === 'low') badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';

              return (
                <div key={vuln.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row justify-between gap-4 items-start">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeColor}`}>
                        {vuln.severity}
                      </span>
                      <h4 className="text-base font-bold text-white leading-tight">
                        {vuln.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {vuln.description}
                    </p>
                    <div className="text-xs text-gray-500 font-mono">
                      File: <Link to={`/scan/${scan._id}?file=${encodeURIComponent(vuln.file)}`} className="text-cyan-400 hover:underline">{vuln.file}</Link>
                      {vuln.lineStart ? ` : L${vuln.lineStart}` : ''}
                    </div>
                  </div>

                  <Link
                    to={`/scan/${scan._id}?file=${encodeURIComponent(vuln.file)}`}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-md text-xs font-semibold border border-white/10 shrink-0 self-start hover:border-cyan-500/25 hover:text-cyan-400 transition"
                  >
                    View Code
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Zero vulnerability flags raised. Excellent code security hygiene!</p>
          </div>
        )}
      </div>

      {/* Analyzed Files Registry */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          Smart File Analysis registry
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {scan.analyzedFiles.map((file, idx) => (
            <Link
              key={idx}
              to={`/scan/${scan._id}?file=${encodeURIComponent(file.path)}`}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-cyan-500/20 hover:bg-white/10 transition group"
            >
              <div className="truncate pr-3">
                <p className="text-xs font-medium text-gray-200 truncate group-hover:text-cyan-400 transition">
                  {file.path.split('/').pop()}
                </p>
                <p className="text-[10px] text-gray-500 truncate">{file.path}</p>
              </div>
              <span className="text-[10px] font-mono text-gray-400 bg-black/40 px-1.5 py-0.5 rounded">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
