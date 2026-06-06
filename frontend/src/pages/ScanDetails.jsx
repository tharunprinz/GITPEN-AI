import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  FileText, FolderOpen, Send, ShieldAlert,
  ArrowLeft, MessageSquare, Terminal, ChevronRight
} from 'lucide-react';
import { getScanDetails, getFileContent, sendChatMessage, getChatSession } from '../services/api';
import toast from 'react-hot-toast';

export default function ScanDetails() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);

  // File explorer state
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);

  // Chatbot state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const messagesEndRef = useRef(null);

  // Parse file query parameter
  const fileQuery = searchParams.get('file');

  useEffect(() => {
    fetchScanDetails();
  }, [id]);

  useEffect(() => {
    if (scan) {
      const targetFile = fileQuery || (scan.analyzedFiles[0] && scan.analyzedFiles[0].path) || '';
      if (targetFile) {
        setSelectedFilePath(targetFile);
        fetchFileContent(targetFile);
      }
      fetchChatSession();
    }
  }, [scan, fileQuery]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchScanDetails = async () => {
    try {
      setLoading(true);
      const data = await getScanDetails(id);
      setScan(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load scan details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (path) => {
    try {
      setLoadingFile(true);
      const content = await getFileContent(id, path);
      setFileContent(content);
    } catch (error) {
      console.error(error);
      setFileContent('// Failed to retrieve file contents from repository. Check API connectivity.');
    } finally {
      setLoadingFile(false);
    }
  };

  const fetchChatSession = async () => {
    try {
      const data = await getChatSession(id);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch chat log:', error);
    }
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingChat) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    
    // Add user message locally
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setSendingChat(true);

    try {
      const result = await sendChatMessage(id, userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);
    } catch (error) {
      console.error(error);
      toast.error('AI Chat failed. Check API configuration.');
    } finally {
      setSendingChat(false);
    }
  };

  const selectFile = (path) => {
    setSearchParams({ file: path });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 font-medium">Constructing workspace analyzer...</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-400">Scan metadata unavailable</h2>
        <Link to="/" className="text-cyan-400 hover:underline">Go back home</Link>
      </div>
    );
  }

  // Find vulnerabilities in current selected file
  const currentFileVulns = (scan.vulnerabilities || []).filter(
    (v) => v.file === selectedFilePath
  );

  // Map file lines and matching vulnerabilities
  const lines = fileContent.split('\n');

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] relative overflow-hidden">
      
      {/* LEFT: File Explorer and Code Viewer */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950/60 rounded-2xl border border-white/5 overflow-hidden">
        
        {/* Navigation back and file bar info */}
        <div className="px-4 py-3 bg-slate-900 border-b border-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={`/dashboard/${scan._id}`}
              className="p-1.5 hover:bg-white/5 rounded-lg border border-white/10 text-gray-400 hover:text-white transition shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="truncate">
              <span className="text-[10px] text-gray-500 block uppercase font-bold tracking-wider">Viewing Code</span>
              <span className="text-sm font-mono text-cyan-400 truncate block">{selectedFilePath || 'Select a file'}</span>
            </div>
          </div>

          <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-extrabold uppercase shrink-0">
            {currentFileVulns.length} issue{currentFileVulns.length !== 1 ? 's' : ''} flagged
          </span>
        </div>

        {/* Inner layout split: File Tree + Code Editor */}
        <div className="flex-1 flex min-h-0">
          
          {/* File list drawer */}
          <div className="w-64 border-r border-white/5 bg-slate-900/40 overflow-y-auto hidden md:block select-none">
            <div className="p-3 border-b border-white/5 flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
              <FolderOpen className="w-4 h-4 text-cyan-500" />
              Scan Registry Files
            </div>
            <div className="p-2 space-y-1">
              {scan.analyzedFiles.map((file) => {
                const fileVulns = (scan.vulnerabilities || []).filter(v => v.file === file.path);
                const isSelected = file.path === selectedFilePath;
                return (
                  <button
                    key={file.path}
                    onClick={() => selectFile(file.path)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      {file.path.split('/').pop()}
                    </span>
                    {fileVulns.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[9px] font-bold">
                        {fileVulns.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Code screen */}
          <div className="flex-1 min-w-0 bg-black/40 overflow-y-auto relative p-4 font-mono text-xs leading-relaxed">
            {loadingFile ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 gap-3">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 font-medium">Fetching file contents from GitHub...</p>
              </div>
            ) : (
              <div className="min-w-max select-text">
                {lines.map((line, idx) => {
                  const lineNum = idx + 1;
                  // Look up if any vulnerability is mapped to this exact line
                  const lineVuln = currentFileVulns.find(
                    (v) => lineNum >= v.lineStart && lineNum <= v.lineEnd
                  );

                  let lineClass = 'text-gray-300';
                  if (lineVuln) {
                    if (lineVuln.severity === 'critical') lineClass = 'code-line-vuln-critical text-red-300';
                    else if (lineVuln.severity === 'high') lineClass = 'code-line-vuln-high text-orange-300';
                    else if (lineVuln.severity === 'medium') lineClass = 'code-line-vuln-medium text-yellow-300';
                    else if (lineVuln.severity === 'low') lineClass = 'code-line-vuln-low text-blue-300';
                  }

                  return (
                    <div key={idx} className={`relative flex group hover:bg-white/5 rounded px-1 min-h-[20px] ${lineClass}`}>
                      {/* Line Numbers */}
                      <span className="w-10 text-gray-600 group-hover:text-gray-400 text-right select-none pr-3 sticky left-0 bg-transparent shrink-0">
                        {lineNum}
                      </span>
                      {/* Code line content */}
                      <span className="whitespace-pre pr-4 flex-1">
                        {line || ' '}
                      </span>

                      {/* Line level vulnerability floating card widget on hover */}
                      {lineVuln && (
                        <div className="hidden group-hover:block absolute left-12 top-6 z-20 w-80 bg-slate-900 border border-red-500/30 rounded-lg p-3 shadow-2xl glass-panel space-y-1.5">
                          <div className="flex items-center gap-1.5 text-red-400 font-bold uppercase text-[9px]">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {lineVuln.severity} Alert
                          </div>
                          <h4 className="font-bold text-xs text-white leading-tight">{lineVuln.title}</h4>
                          <p className="text-[10px] text-gray-400 leading-normal">{lineVuln.description}</p>
                          <div className="bg-black/50 p-1.5 rounded border border-white/5 text-[9px] text-gray-300 font-sans">
                            <span className="font-bold text-red-400 block mb-0.5 uppercase tracking-widest text-[8px]">remedy:</span>
                            {lineVuln.recommendation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Docked AI Chatbot Panel */}
      <div className="w-full lg:w-96 bg-slate-950/60 rounded-2xl border border-white/5 flex flex-col overflow-hidden shrink-0 h-[300px] lg:h-auto">
        <div className="px-4 py-3.5 bg-slate-900 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4.5 h-4.5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Security AI Copilot</h3>
          </div>
          <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-400 border border-indigo-500/25">
            Active context
          </span>
        </div>

        {/* Message Log view */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth bg-black/20 select-text">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
              <Terminal className="w-8 h-8 text-cyan-500/40" />
              <div>
                <p className="text-xs text-white font-semibold">Need code remediation advice?</p>
                <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">
                  Ask the assistant to draft code fixes, analyze libraries, or review critical issues.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 w-full pt-2">
                <button
                  onClick={() => setChatInput(`How do I secure the file "${selectedFilePath.split('/').pop()}"?`)}
                  className="text-left px-2.5 py-1.5 rounded bg-white/5 border border-white/5 text-[10px] text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 truncate"
                >
                  "How do I secure this file?"
                </button>
                <button
                  onClick={() => setChatInput("Summarize the top 3 security risks in this repository.")}
                  className="text-left px-2.5 py-1.5 rounded bg-white/5 border border-white/5 text-[10px] text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 truncate"
                >
                  "Summarize the top 3 security risks..."
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] rounded-xl p-3 text-xs leading-relaxed border ${
                    isUser
                      ? 'bg-indigo-600/10 border-indigo-500/25 text-gray-200 self-end ml-auto'
                      : 'bg-slate-900 border-white/5 text-gray-300 self-start mr-auto'
                  }`}
                >
                  <span className={`text-[8px] font-bold uppercase tracking-wider mb-1 block ${isUser ? 'text-indigo-400 text-right' : 'text-cyan-400'}`}>
                    {isUser ? 'User' : 'GITPEN AI'}
                  </span>
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}

          {sendingChat && (
            <div className="flex flex-col max-w-[85%] rounded-xl p-3 text-xs bg-slate-900 border border-white/5 text-gray-400 self-start mr-auto">
              <span className="text-[8px] font-bold uppercase tracking-wider text-cyan-400 mb-1">GITPEN AI</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSendChat} className="p-2 bg-slate-900 border-t border-white/5 flex gap-2">
          <input
            type="text"
            placeholder="Ask AI about this codebase..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={sendingChat}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sendingChat || !chatInput.trim()}
            className="p-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-black rounded-lg transition shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
