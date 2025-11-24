import React, { useState, useEffect } from 'react';
import { ViewMode } from '../types';

interface OmniBarProps {
  url: string;
  viewMode: ViewMode;
  onUrlChange: (url: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onAskAI: () => void;
}

const OmniBar: React.FC<OmniBarProps> = ({ url, viewMode, onUrlChange, onViewModeChange, onAskAI }) => {
  const [inputVal, setInputVal] = useState(url);

  // Sync local input with parent url changes (e.g. tab switching)
  useEffect(() => {
    setInputVal(url);
  }, [url]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInputVal(newVal);
    onUrlChange(newVal); // Propagate immediately for instant search in Memory View
  };

  // Icon Components (SVG)
  const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  );
  
  const TableIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18"/></svg>
  );

  const BrainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
  );

  const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4M4 5h2M20 3v4M19 5h2M20 19v4M19 21h2M5 19v4M4 21h2"/></svg>
  );

  return (
    <div className="flex items-center gap-2 p-2 bg-cortex-panel border-b border-cortex-border sticky top-0 z-50">
      {/* Navigation Controls */}
      <div className="flex gap-1 text-slate-400">
        <button className="p-1.5 hover:bg-slate-800 rounded-md transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg></button>
        <button className="p-1.5 hover:bg-slate-800 rounded-md transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg></button>
        <button className="p-1.5 hover:bg-slate-800 rounded-md transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg></button>
      </div>

      {/* URL / Command Input */}
      <div className="flex-1 relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {inputVal.includes('.') && !inputVal.includes(' ') ? <span className="text-green-500 text-xs">🔒</span> : <span className="text-arrow-400 text-xs">🔍</span>}
        </div>
        <input 
          type="text"
          value={inputVal}
          onChange={handleChange}
          placeholder="Enter URL or Search Semantic Memory..."
          className="w-full bg-black/30 text-sm text-slate-200 border border-cortex-border rounded-lg pl-9 pr-24 py-1.5 focus:outline-none focus:border-arrow-400 focus:ring-1 focus:ring-arrow-400 font-mono transition-all"
        />
        {/* Context Stats */}
        <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none gap-2">
            <span className="text-[10px] text-rust-500 bg-rust-500/10 px-1 rounded border border-rust-500/20">Rust</span>
            <span className="text-[10px] text-arrow-400 bg-arrow-400/10 px-1 rounded border border-arrow-400/20">Arrow</span>
        </div>
      </div>

      {/* View Switchers */}
      <div className="flex bg-black/40 rounded-lg p-0.5 border border-cortex-border">
        <button 
          onClick={() => onViewModeChange(ViewMode.WEB)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === ViewMode.WEB ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <GlobeIcon /> Web
        </button>
        <button 
          onClick={() => onViewModeChange(ViewMode.DATA)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === ViewMode.DATA ? 'bg-arrow-400/20 text-arrow-400 border border-arrow-400/30 shadow-sm' : 'text-slate-400 hover:text-arrow-400'}`}
        >
          <TableIcon /> Data
        </button>
        <button 
          onClick={() => onViewModeChange(ViewMode.MEMORY)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === ViewMode.MEMORY ? 'bg-rust-500/20 text-rust-500 border border-rust-500/30 shadow-sm' : 'text-slate-400 hover:text-rust-500'}`}
        >
          <BrainIcon /> Memory
        </button>
      </div>

      {/* AI Trigger */}
      <button 
        onClick={onAskAI}
        className="ml-2 flex items-center gap-2 bg-gradient-to-r from-rust-600 to-rust-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:shadow-lg hover:shadow-rust-500/20 transition-all transform active:scale-95"
      >
        <SparklesIcon /> <span className="hidden sm:inline">Ask Cortex</span>
      </button>
    </div>
  );
};

export default OmniBar;