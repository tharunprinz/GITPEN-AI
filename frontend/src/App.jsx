import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Shield, GitPullRequest, HelpCircle, Github } from 'lucide-react';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ScanDetails from './pages/ScanDetails';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-[#080710] text-gray-100 font-sans selection:bg-cyan-500 selection:text-black">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-70 blur group-hover:opacity-100 transition duration-300"></div>
                <div className="relative bg-black p-1.5 rounded-lg border border-white/20">
                  <Shield className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                GIT<span className="text-cyan-400">PEN</span>
              </span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Scan Repo
              </Link>
              <a
                href="https://github.com/tharunprinz"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                <Github className="w-4 h-4" />
                tharunprinz
              </a>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative flex flex-col">
          {/* Ambient Glowing Background Elements */}
          <div className="ambient-glow-cyan top-1/4 left-10"></div>
          <div className="ambient-glow-indigo bottom-1/4 right-10"></div>

          <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard/:id" element={<Dashboard />} />
              <Route path="/scan/:id" element={<ScanDetails />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-black/60 py-6 text-center text-xs text-gray-500 relative z-10">
          <p>© {new Date().getFullYear()} GITPEN AI. AI-assisted repository security analysis & code audits.</p>
          <p className="mt-2">developed by <a href="https://github.com/tharunprinz" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">tharunprinz</a></p>
        </footer>

        {/* Toast Notifier */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#131320',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
