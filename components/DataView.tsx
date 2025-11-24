import React, { useState, useMemo } from 'react';
import { DataFrame } from '../types';

interface DataViewProps {
  data: DataFrame;
}

const DataView: React.FC<DataViewProps> = ({ data }) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [showCode, setShowCode] = useState(true);

  // Transpose the column-oriented Arrow data to row-oriented for React rendering
  const allRows = useMemo(() => {
    return Array.from({ length: data.rowCount }, (_, rowIndex) => {
      const row: Record<string, any> = {};
      data.columns.forEach(col => {
        row[col.name] = col.data[rowIndex];
      });
      return row;
    });
  }, [data]);

  // Simulate Polars/SQL Filtering
  const filteredRows = useMemo(() => {
    if (!filterQuery) return allRows;
    const lowerQuery = filterQuery.toLowerCase();
    return allRows.filter(row => {
      // Very basic simulation of full-text search or column filtering
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(lowerQuery)
      );
    });
  }, [allRows, filterQuery]);

  // Generate fake Polars code based on current state
  const generatedCode = useMemo(() => {
    const tableName = data.columns.some(c => c.name === 'crate_name') ? 'crates_df' : 'hn_df';
    if (!filterQuery) {
        return `// Rust / Polars Lazy Execution Plan
let df = ${tableName}.lazy();
let result = df.collect()?;`;
    }
    return `// Rust / Polars Lazy Execution Plan
let q = ${tableName}.lazy()
    .filter(
        col("*").map(|s| s.to_string().contains("(?i)${filterQuery}"))
    );

let result = q.collect()?;`;
  }, [filterQuery, data]);

  return (
    <div className="w-full h-full flex flex-col bg-cortex-bg overflow-hidden animate-in fade-in duration-300">
      {/* Toolbar / SQL Simulator */}
      <div className="px-4 py-3 border-b border-cortex-border bg-cortex-panel flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-arrow-400 font-mono text-sm font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-arrow-400 animate-pulse"></span>
              ARROW RECORD BATCH
            </h2>
            <p className="text-slate-500 text-xs mt-0.5 font-mono">
              Memory Address: 0x7F4A9B1C • {data.rowCount} Total Rows • {data.columns.length} Cols
            </p>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => setShowCode(!showCode)}
                className={`text-xs px-3 py-1 rounded border font-mono transition-colors ${showCode ? 'bg-rust-500/20 text-rust-500 border-rust-500/50' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
            >
              {showCode ? 'Hide Engine' : 'Show Engine'}
            </button>
            <button className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700 hover:border-arrow-400 font-mono transition-colors">
              Export Parquet
            </button>
          </div>
        </div>

        {/* Filter Input */}
        <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-500 group-focus-within:text-arrow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
            </div>
            <input 
                type="text" 
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="FILTER (e.g. 'Rust', 'AI', 'true')..." 
                className="block w-full pl-10 pr-3 py-1.5 border border-slate-700 rounded-md leading-5 bg-black/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-arrow-400 sm:text-xs font-mono transition-all"
            />
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[10px] text-slate-500 font-mono">
                    {filteredRows.length} matches
                </span>
            </div>
        </div>
      </div>
      
      {/* Table Area */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left border-collapse">
          <thead className="bg-cortex-panel sticky top-0 z-10 shadow-sm">
            <tr>
              {data.columns.map((col) => (
                <th key={col.name} className="p-2 border-b border-r border-cortex-border text-xs font-mono text-slate-400 uppercase tracking-wider last:border-r-0 bg-cortex-panel">
                  <div className="flex items-center justify-between group cursor-pointer hover:text-white">
                    <span>{col.name}</span>
                    <span className="text-[9px] px-1 bg-slate-800 rounded text-slate-500 group-hover:text-arrow-400">{col.type}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cortex-border bg-cortex-bg">
            {filteredRows.map((row, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group cursor-default">
                {data.columns.map((col) => (
                  <td key={`${i}-${col.name}`} className="p-2 border-r border-cortex-border text-sm text-slate-300 font-mono whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] last:border-r-0">
                    {col.name === 'is_vectorized' ? (
                       row[col.name] ? 
                       <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-900/30 text-green-400 border border-green-900/50">TRUE</span> : 
                       <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-900/30 text-red-400 border border-red-900/50">FALSE</span>
                    ) : col.name === 'category' ? (
                        <span className="text-arrow-400">{row[col.name]}</span>
                    ) : (
                      <span className={col.type === 'UInt64' ? 'text-rust-500' : ''}>{row[col.name]}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {filteredRows.length === 0 && (
                <tr>
                    <td colSpan={data.columns.length} className="p-8 text-center text-slate-500 font-mono text-sm">
                        No records match filter criteria.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Query Inspector (Simulating the Engine) */}
      {showCode && (
        <div className="bg-[#0A0C10] border-t border-cortex-border p-0 animate-in slide-in-from-bottom duration-300 h-32 flex flex-col">
            <div className="bg-[#1e1e1e] px-2 py-1 text-[10px] text-slate-500 font-mono border-b border-white/10 flex justify-between">
                <span>GENERATED_PLAN.rs</span>
                <span>TARGET: WASM</span>
            </div>
            <div className="flex-1 p-3 overflow-auto font-mono text-xs text-slate-300">
                <pre>
                    <code dangerouslySetInnerHTML={{__html: generatedCode.replace(/let/g, '<span class="text-rust-500">let</span>').replace(/lazy/g, '<span class="text-arrow-400">lazy</span>').replace(/filter/g, '<span class="text-arrow-400">filter</span>').replace(/collect/g, '<span class="text-arrow-400">collect</span>')}}></code>
                </pre>
            </div>
        </div>
      )}
      
      {/* Footer Stats */}
      <div className="bg-cortex-panel border-t border-cortex-border p-1 text-[10px] text-slate-500 font-mono flex justify-end gap-4 px-4">
        <span>RAM: 4.2MB</span>
        <span>Parse Time: 2ms</span>
        <span>Engine: Polars (Rust)</span>
      </div>
    </div>
  );
};

export default DataView;