import React from 'react';
import { DataFrame } from '../types';

interface WebViewProps {
  data: DataFrame;
}

const WebView: React.FC<WebViewProps> = ({ data }) => {
  // Helper to convert Arrow Columns to Row Objects (Simulating DOM rendering from data)
  const rows = Array.from({ length: data.rowCount }, (_, rowIndex) => {
    const row: Record<string, any> = {};
    data.columns.forEach(col => {
      row[col.name] = col.data[rowIndex];
    });
    return row;
  });

  // Simple Schema Detection
  const isHackerNews = data.columns.some(c => c.name === 'points');
  const isCratesIo = data.columns.some(c => c.name === 'downloads');

  // --- TEMPLATE 1: HACKER NEWS ---
  if (isHackerNews) {
    return (
        <div className="w-full h-full bg-[#f6f6ef] text-slate-800 overflow-y-auto font-sans animate-in fade-in duration-300">
        <div className="bg-[#ff6600] p-1 pl-4 flex items-center gap-4 text-xs">
            <span className="font-bold text-white border border-white p-0.5">Y</span>
            <span className="font-bold text-black">Hacker News</span>
            <span className="cursor-pointer hover:underline">new</span>
            <span className="cursor-pointer hover:underline">past</span>
            <span className="cursor-pointer hover:underline">comments</span>
        </div>

        <div className="p-4 bg-[#f6f6ef] max-w-5xl mx-auto">
            <ol className="list-decimal pl-4 space-y-2 text-sm text-gray-700">
            {rows.map((item, index) => (
                <li key={item.id} className="pl-1">
                <div className="inline-block align-top">
                    <div className="flex items-baseline gap-2">
                    <a href="#" className="text-black visited:text-gray-500 font-medium hover:underline text-[14px]">
                        {item.title}
                    </a>
                    <span className="text-[10px] text-gray-500">({item.category === 'Lang' ? 'rust-lang.org' : item.category === 'DB' ? 'lancedb.com' : 'ycombinator.com'})</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                    {item.points} points by user_{item.id} 2 hours ago | hide | 12 comments
                    {item.is_vectorized && (
                        <span className="ml-2 text-[9px] text-rust-600 bg-rust-500/10 px-1 rounded border border-rust-500/20" title="Content embedded in local vector store">
                        ✦ Vectorized
                        </span>
                    )}
                    </div>
                </div>
                </li>
            ))}
            </ol>
        </div>
        </div>
    );
  }

  // --- TEMPLATE 2: CRATES.IO ---
  if (isCratesIo) {
      return (
        <div className="w-full h-full bg-[#1F2428] text-slate-200 overflow-y-auto font-sans animate-in fade-in duration-300">
             {/* Crates Header */}
             <div className="bg-[#2D333B] border-b border-[#1F2428] p-4 flex items-center gap-4">
                <div className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    📦 <span className="text-white">crates.io</span>
                </div>
                <input type="text" placeholder="Search crates..." className="bg-[#1F2428] border border-gray-700 rounded px-3 py-1 text-sm w-96 focus:border-[#e1b439] outline-none" />
             </div>

             <div className="max-w-5xl mx-auto p-6">
                <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Most Downloaded</h2>
                <div className="space-y-4">
                    {rows.map((item, index) => (
                        <div key={index} className="flex items-start justify-between p-4 bg-[#2D333B] rounded-lg border border-gray-800 hover:border-gray-600 transition-colors">
                            <div className="flex-1">
                                <div className="flex items-baseline gap-3">
                                    <h3 className="text-[#e1b439] font-bold text-lg">{item.crate_name}</h3>
                                    <span className="text-gray-500 text-xs">v{item.version}</span>
                                </div>
                                <p className="text-gray-400 text-sm mt-1">{item.description}</p>
                                <div className="mt-3 flex gap-2">
                                     {item.is_vectorized && (
                                        <span className="text-[10px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded border border-green-900">
                                        Verified
                                        </span>
                                    )}
                                     <span className="text-[10px] bg-blue-900/40 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900">
                                        MIT
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-gray-300 font-mono font-bold">{(item.downloads / 1000000).toFixed(1)}M</div>
                                <div className="text-gray-600 text-xs uppercase tracking-wide">Downloads</div>
                                <div className="mt-2 text-rust-500 text-xs">
                                     <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        </div>
      )
  }

  // --- FALLBACK GENERIC ---
  return (
    <div className="w-full h-full flex items-center justify-center text-slate-500">
      Unknown Schema Format
    </div>
  );
};

export default WebView;