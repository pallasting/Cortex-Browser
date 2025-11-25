import React, { useMemo } from 'react';

interface InspectorPanelProps {
  data: Record<string, any> | null;
  onClose: () => void;
}

const InspectorPanel: React.FC<InspectorPanelProps> = ({ data, onClose }) => {
  if (!data) return null;

  // Simulate a 64-dimensional slice of the 768-dim embedding vector for visualization
  const vectorDNA = useMemo(() => {
    // Deterministic pseudo-random generation based on data content
    const seed = JSON.stringify(data).length;
    return Array.from({ length: 64 }, (_, i) => {
      const val = Math.sin(seed * (i + 1)) * 0.5 + 0.5; // 0 to 1
      return val;
    });
  }, [data]);

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[400px] bg-[#13161C] border-l border-cortex-border shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cortex-border bg-cortex-panel">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-arrow-400 rounded-full animate-pulse"></div>
           <span className="font-mono text-xs font-bold text-slate-300 tracking-wider">OBJECT INSPECTOR</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Primary Info */}
        <div>
            <h2 className="text-xl font-bold text-white mb-1 line-clamp-2">
                {data.title || data.crate_name || `Row #${data.id || data.block_id}`}
            </h2>
            <div className="text-xs font-mono text-slate-500">
                Memory Address: 0x{Math.floor(Math.random() * 1000000).toString(16).toUpperCase()}
            </div>
        </div>

        {/* Vector DNA Visualization */}
        <div className="bg-[#0A0C10] p-4 rounded-lg border border-cortex-border">
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-mono text-rust-500 uppercase tracking-widest">Vector DNA (Embedding)</span>
                <span className="text-[9px] font-mono text-slate-600">768-DIM MODEL</span>
            </div>
            
            {/* Heatmap Grid */}
            <div className="grid grid-cols-8 gap-1">
                {vectorDNA.map((val, i) => (
                    <div 
                        key={i} 
                        className="h-2 w-full rounded-sm transition-all duration-500 hover:scale-150"
                        style={{
                            backgroundColor: `rgba(57, 193, 243, ${val})`, // Arrow Blue with opacity based on value
                            boxShadow: val > 0.8 ? '0 0 4px rgba(57, 193, 243, 0.5)' : 'none'
                        }}
                        title={`Dim ${i}: ${val.toFixed(4)}`}
                    ></div>
                ))}
            </div>
            <div className="mt-2 text-[9px] text-slate-600 font-mono text-right">
                Similarity Score: 0.9842
            </div>
        </div>

        {/* Key/Value Fields */}
        <div className="space-y-3">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">
                Fields & Values
            </div>
            {Object.entries(data).map(([key, value]) => {
                if (key === 'is_vectorized' || key === 'description' || key === 'content') return null; // Skip long/meta fields here
                return (
                    <div key={key} className="flex justify-between items-center text-sm group hover:bg-white/5 p-1 rounded -mx-1">
                        <span className="font-mono text-slate-400">{key}</span>
                        <span className="font-medium text-slate-200">{String(value)}</span>
                    </div>
                )
            })}
        </div>

        {/* Long Text Content */}
        {(data.description || data.content) && (
             <div className="space-y-2">
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">
                    Text Content
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#0A0C10] p-3 rounded border border-slate-800 font-mono">
                    {data.description || data.content}
                </p>
            </div>
        )}

        {/* Metadata */}
        <div className="bg-slate-900/50 p-3 rounded border border-slate-800 space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500">ARROW TYPE</span>
                <span className="text-arrow-400">Struct&lt;RecordBatch&gt;</span>
            </div>
             <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500">SIZE</span>
                <span className="text-slate-300">128 bytes</span>
            </div>
             <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500">OFFSET</span>
                <span className="text-slate-300">64</span>
            </div>
        </div>

      </div>
      
      {/* Footer Actions */}
      <div className="p-4 border-t border-cortex-border bg-[#0A0C10] flex gap-2">
          <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono py-2 rounded transition-colors border border-slate-700">
              Copy JSON
          </button>
          <button className="flex-1 bg-rust-600/20 hover:bg-rust-600/30 text-rust-500 border border-rust-600/50 text-xs font-mono py-2 rounded transition-colors">
              Re-Embed
          </button>
      </div>
    </div>
  );
};

export default InspectorPanel;
