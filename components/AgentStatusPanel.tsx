import React, { useEffect, useRef, useState } from 'react';
import { SystemLog } from '../types';

interface AgentStatusPanelProps {
  logs: SystemLog[];
  isOpen: boolean;
  onToggle: () => void;
}

const AgentStatusPanel: React.FC<AgentStatusPanelProps> = ({ logs, isOpen, onToggle }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cpuUsage, setCpuUsage] = useState(0);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  // Mock CPU fluctuation
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 30) + 10); // 10-40%
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const getLogColor = (level: string) => {
    switch (level) {
      case 'ACTION': return 'text-rust-500 font-bold';
      case 'MUTATION': return 'text-arrow-400';
      case 'WARN': return 'text-yellow-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 flex flex-col transition-all duration-300 border-t border-cortex-border bg-[#0A0C10] ${isOpen ? 'h-48' : 'h-8'}`}>
      
      {/* Header / Toggle Bar */}
      <div 
        className="h-8 bg-cortex-panel flex items-center justify-between px-4 cursor-pointer hover:bg-white/5 border-b border-cortex-border"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
           <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></span>
              <span>NEURAL TERMINAL</span>
           </div>
           {isOpen && (
             <>
                <span className="hidden sm:inline text-slate-600">|</span>
                <span>CPU: {cpuUsage}%</span>
                <span className="hidden sm:inline text-slate-600">|</span>
                <span>MEM: 128MB</span>
                <span className="hidden sm:inline text-slate-600">|</span>
                <span>TOKENS: 4.2k/s</span>
             </>
           )}
        </div>
        <div className="text-slate-500">
          {isOpen ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6"/></svg>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      {isOpen && (
        <div className="flex-1 flex overflow-hidden">
            {/* Logs Area */}
            <div className="flex-1 p-2 overflow-y-auto font-mono text-xs space-y-1" ref={scrollRef}>
                {logs.length === 0 && <div className="text-slate-600 italic">System Idle. Waiting for Agent activity...</div>}
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 hover:bg-white/5 p-0.5 rounded">
                        <span className="text-slate-600 w-16 text-right shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second:'2-digit' })}.{Math.floor(log.timestamp % 1000).toString().padStart(3, '0')}
                        </span>
                        <span className={`w-16 shrink-0 ${
                            log.source === 'AGENT' ? 'text-rust-500' : 
                            log.source === 'DOM' ? 'text-blue-400' : 'text-purple-400'
                        }`}>
                            [{log.source}]
                        </span>
                        <span className={`flex-1 break-all ${getLogColor(log.level)}`}>
                            {log.level === 'ACTION' && <span className="mr-2">⚡</span>}
                            {log.message}
                        </span>
                    </div>
                ))}
            </div>

            {/* Side Status Visualization (Mock) */}
            <div className="w-48 border-l border-cortex-border bg-black/30 p-3 hidden sm:flex flex-col gap-3">
                 <div>
                    <div className="text-[9px] text-slate-500 mb-1">AGENT THOUGHT PROCESS</div>
                    <div className="h-1 bg-slate-800 rounded overflow-hidden">
                        <div className="h-full bg-rust-500 w-[60%] animate-pulse"></div>
                    </div>
                 </div>
                 <div>
                    <div className="text-[9px] text-slate-500 mb-1">DOM MUTATION RATE</div>
                    <div className="flex items-end gap-0.5 h-8">
                         {[40, 60, 30, 80, 50, 90, 20, 40].map((h, i) => (
                             <div key={i} className="flex-1 bg-arrow-400/50" style={{ height: `${h}%` }}></div>
                         ))}
                    </div>
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AgentStatusPanel;