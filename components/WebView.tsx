import React from 'react';
import { DataFrame } from '../types';

interface WebViewProps {
  data: DataFrame;
  onVectorClick?: (id: string) => void;
  onNavigate?: (url: string, title: string) => void;
  agentHighlights?: string[]; // IDs for passive observation (Highlights)
  agentClicks?: string[];     // IDs for active interaction (Clicks)
}

const GhostCursor = () => (
    <div className="absolute z-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-rust-600 drop-shadow-md fill-rust-600/20"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
    </div>
);

const WebView: React.FC<WebViewProps> = ({ data, onVectorClick, onNavigate, agentHighlights = [], agentClicks = [] }) => {
  // Helper to convert Arrow Columns to Row Objects
  const rows = Array.from({ length: data.rowCount }, (_, rowIndex) => {
    const row: Record<string, any> = {};
    data.columns.forEach(col => {
      row[col.name] = col.data[rowIndex];
    });
    return row;
  });

  // Schema Detection
  const isHackerNews = data.columns.some(c => c.name === 'points');
  const isCratesIo = data.columns.some(c => c.name === 'downloads');
  const isArticle = data.columns.some(c => c.name === 'relevance_score');

  // Styles
  const getAgentHighlightStyle = (id: string) => {
      if (agentHighlights.includes(String(id))) {
          return "ring-2 ring-offset-2 ring-offset-[#f6f6ef] ring-rust-500 bg-rust-500/10 transition-all duration-300 relative";
      }
      return "";
  }
  
  const getAgentHighlightStyleDark = (id: string) => {
      if (agentHighlights.includes(String(id))) {
          return "ring-2 ring-offset-2 ring-offset-[#1F2428] ring-green-500 bg-green-500/10 transition-all duration-300";
      }
      return "";
  }

  const isClicked = (id: string) => agentClicks.includes(id);

  // --- TEMPLATE 1: HACKER NEWS ---
  if (isHackerNews) {
    return (
        <div className="w-full h-full bg-[#f6f6ef] text-slate-800 overflow-y-auto font-sans animate-in fade-in duration-300 scroll-smooth">
        <div className="bg-[#ff6600] p-1 pl-4 flex items-center gap-4 text-xs sticky top-0 z-20 shadow-sm">
            <span className="font-bold text-white border border-white p-0.5">Y</span>
            <span className="font-bold text-black">Hacker News</span>
            <span className="cursor-pointer hover:underline">new</span>
            <span className="cursor-pointer hover:underline">past</span>
            <span className="cursor-pointer hover:underline">comments</span>
        </div>

        <div className="p-4 bg-[#f6f6ef] max-w-5xl mx-auto">
            <ol className="list-decimal pl-4 space-y-3 text-sm text-gray-700">
            {rows.map((item, index) => {
                const rowId = String(item.id);
                const voteBtnId = `${rowId}-vote`;

                return (
                <li key={rowId} className={`pl-1 p-2 rounded ${getAgentHighlightStyle(rowId)}`}>
                 {/* Agent Label Overlay */}
                 {agentHighlights.includes(rowId) && (
                    <div className="absolute -right-2 -top-2 bg-rust-600 text-white text-[9px] px-1.5 rounded-full shadow-sm font-mono animate-bounce z-10">
                        TARGET
                    </div>
                 )}
                 
                <div className="inline-block align-top w-full">
                    <div className="flex items-start gap-2">
                        {/* Vote Button with Agent Click support */}
                        <div className="relative pt-1">
                            {isClicked(voteBtnId) && <GhostCursor />}
                            <div 
                                className={`cursor-pointer transition-opacity ${isClicked(voteBtnId) ? 'text-rust-600 scale-125' : 'text-gray-500 opacity-50 hover:opacity-100'}`} 
                                title="upvote"
                                id={voteBtnId}
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>
                            </div>
                        </div>
                        
                        <div className="flex-1">
                            <a 
                                href="#" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    if(onNavigate) onNavigate("example.com/article", String(item.title));
                                }}
                                className="text-black visited:text-gray-500 font-medium hover:underline text-[14px] leading-tight block"
                            >
                                {item.title}
                            </a>
                            <span className="text-[10px] text-gray-500 block mt-0.5">
                                ({item.category === 'Lang' ? 'rust-lang.org' : item.category === 'DB' ? 'lancedb.com' : 'ycombinator.com'})
                            </span>
                        </div>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 pl-4 flex items-center gap-2 flex-wrap">
                        <span>{item.points} points by user_{item.id} 2 hours ago | hide | 12 comments</span>
                        {item.is_vectorized && (
                            <button 
                                onClick={() => onVectorClick && onVectorClick(rowId)}
                                className="inline-flex items-center gap-1 text-[9px] text-rust-600 bg-rust-500/10 px-1.5 rounded border border-rust-500/20 hover:bg-rust-500/20 hover:border-rust-500/40 transition-colors cursor-pointer" 
                                title="Click to view in Vector Space"
                            >
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                                Vectorized
                            </button>
                        )}
                    </div>
                </div>
                </li>
            )})}
            </ol>
        </div>
        </div>
    );
  }

  // --- TEMPLATE 2: CRATES.IO ---
  if (isCratesIo) {
      return (
        <div className="w-full h-full bg-[#1F2428] text-slate-200 overflow-y-auto font-sans animate-in fade-in duration-300 scroll-smooth">
             {/* Crates Header */}
             <div className="bg-[#2D333B] border-b border-[#1F2428] p-4 flex items-center gap-4 sticky top-0 z-20">
                <div className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    📦 <span className="text-white">crates.io</span>
                </div>
                <input type="text" placeholder="Search crates..." className="bg-[#1F2428] border border-gray-700 rounded px-3 py-1 text-sm w-96 focus:border-[#e1b439] outline-none" />
             </div>

             <div className="max-w-5xl mx-auto p-6">
                <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Most Downloaded</h2>
                <div className="space-y-4">
                    {rows.map((item, index) => {
                        const rowId = String(item.crate_name);
                        const actionBtnId = `${rowId}-action`;
                        
                        return (
                        <div key={index} className={`flex items-start justify-between p-4 bg-[#2D333B] rounded-lg border border-gray-800 hover:border-gray-600 transition-colors relative ${getAgentHighlightStyleDark(rowId)}`}>
                            {agentHighlights.includes(rowId) && (
                                <div className="absolute -left-1 -top-1 w-3 h-3 bg-green-500 rounded-full animate-ping z-10"></div>
                            )}
                            
                            <div className="flex-1">
                                <div className="flex items-baseline gap-3">
                                    <h3 
                                        className="text-[#e1b439] font-bold text-lg cursor-pointer hover:underline"
                                        onClick={() => {
                                            if(onNavigate) onNavigate(`crates.io/${item.crate_name}`, `Crate: ${item.crate_name}`);
                                        }}
                                    >
                                        {item.crate_name}
                                    </h3>
                                    <span className="text-gray-500 text-xs">v{item.version}</span>
                                </div>
                                <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                                <div className="mt-3 flex gap-2">
                                     {item.is_vectorized && (
                                        <button 
                                            onClick={() => onVectorClick && onVectorClick(rowId)}
                                            className="text-[10px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded border border-green-900 hover:bg-green-900/60 transition-colors cursor-pointer"
                                        >
                                            Verified Index
                                        </button>
                                    )}
                                     <span className="text-[10px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900">
                                        MIT
                                    </span>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                                <div>
                                    <div className="text-gray-300 font-mono font-bold">{(item.downloads / 1000000).toFixed(1)}M</div>
                                    <div className="text-gray-600 text-xs uppercase tracking-wide">Downloads</div>
                                </div>
                                
                                {/* Action Button with Agent Click Support */}
                                <div className="relative">
                                    {isClicked(actionBtnId) && <GhostCursor />}
                                    <button 
                                        className={`p-1.5 rounded transition-colors relative ${isClicked(actionBtnId) ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' : 'bg-[#3F4851] hover:bg-gray-600 text-gray-300'}`} 
                                        title="Copy Config"
                                        id={actionBtnId}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
             </div>
        </div>
      )
  }

  // --- TEMPLATE 3: GENERIC ARTICLE (Parsed Content) ---
  if (isArticle) {
      return (
         <div className="w-full h-full bg-white text-slate-800 overflow-y-auto font-sans animate-in fade-in duration-300 scroll-smooth">
            <div className="max-w-3xl mx-auto p-8 lg:p-12">
                <div className="mb-8 border-b pb-4">
                     <div className="text-xs font-mono text-rust-600 mb-2 uppercase tracking-wide">Parsed Content Mode</div>
                     <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">
                         Parsed: {rows[0]?.content?.toString().substring(0, 20)}...
                     </h1>
                     <div className="flex gap-2">
                         <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded">Read Time: 3 min</span>
                         <span className="bg-rust-50 text-rust-600 text-xs px-2 py-1 rounded border border-rust-200">Confidence: 98%</span>
                     </div>
                </div>

                <div className="space-y-6">
                    {rows.map((item, index) => (
                        <div key={index} className="group relative">
                            <p className="text-lg leading-relaxed text-slate-700">
                                {item.content}
                            </p>
                            
                            {/* Metadata Sidebar (Floating) */}
                            <div className="absolute -right-32 top-0 w-28 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="text-[10px] font-mono bg-slate-50 border p-2 rounded shadow-sm text-slate-500">
                                    <div>ID: {item.block_id}</div>
                                    <div className="mt-1">Rel: <span className="text-rust-600 font-bold">{item.relevance_score}</span></div>
                                    <div className="mt-1">Entity: <span className="bg-blue-100 text-blue-600 px-1 rounded">{item.top_entity}</span></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         </div>
      );
  }

  // --- FALLBACK GENERIC ---
  return (
    <div className="w-full h-full flex items-center justify-center text-slate-500">
      Unknown Schema Format
    </div>
  );
};

export default WebView;