
import React, { useState, useEffect, useRef } from 'react';
import { VectorGraphData, VectorNode } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (commandId: string, payload?: any) => void;
  vectorData?: VectorGraphData;
}

interface Command {
  id: string;
  label: string;
  category: 'NAVIGATION' | 'VIEW' | 'SYSTEM' | 'MEMORY' | 'ENGINE';
  shortcut?: string;
  payload?: any;
}

const STATIC_COMMANDS: Command[] = [
  { id: 'nav-hn', label: 'Switch to Hacker News', category: 'NAVIGATION' },
  { id: 'nav-crates', label: 'Switch to Crates.io', category: 'NAVIGATION' },
  { id: 'view-web', label: 'Mode: Web Render', category: 'VIEW', shortcut: 'V W' },
  { id: 'view-data', label: 'Mode: Data Table', category: 'VIEW', shortcut: 'V D' },
  { id: 'view-mem', label: 'Mode: Vector Space', category: 'VIEW', shortcut: 'V M' },
  { id: 'view-neuro', label: 'Mode: NeuroRust Simulation', category: 'VIEW', shortcut: 'V N' },
  { id: 'sys-export-pq', label: 'Export to Parquet', category: 'SYSTEM', shortcut: 'Cmd+E' },
  { id: 'sys-export-csv', label: 'Export to CSV', category: 'SYSTEM' },
  { id: 'sys-gc', label: 'Run Garbage Collection', category: 'SYSTEM' },
  { id: 'sys-reindex', label: 'Re-index Vector Embeddings', category: 'SYSTEM' },
  { id: 'sys-toggle-live', label: 'Toggle Live Sync', category: 'SYSTEM' },
  { id: 'eng-thermal', label: 'Thermodynamic Annealing (Start)', category: 'ENGINE' },
];

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onExecute, vectorData }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Combine Static Commands with Dynamic Memory Nodes (Cortex Spotlight)
  const combinedItems: Command[] = [
      ...STATIC_COMMANDS,
      ...(vectorData ? vectorData.nodes.map(node => ({
          id: `mem-${node.id}`,
          label: `${node.title} (${node.url})`,
          category: 'MEMORY' as const,
          payload: node.id
      })) : [])
  ];

  const filteredItems = combinedItems.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        const item = filteredItems[selectedIndex];
        if (item.category === 'MEMORY') {
            onExecute('mem-jump', item.payload);
        } else {
            onExecute(item.id);
        }
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div 
        className="w-[600px] bg-[#13161C] border border-cortex-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-cortex-border gap-3">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            ref={inputRef}
            type="text" 
            className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 flex-1 font-mono text-sm"
            placeholder="Type a command or search memory..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-2">
             <div className="text-[10px] text-slate-600 font-mono border border-slate-700 rounded px-1.5 py-0.5">↑↓</div>
             <div className="text-[10px] text-slate-600 font-mono border border-slate-700 rounded px-1.5 py-0.5">ENTER</div>
             <div className="text-[10px] text-slate-600 font-mono border border-slate-700 rounded px-1.5 py-0.5">ESC</div>
          </div>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto py-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500 text-xs font-mono">No matching results found.</div>
          ) : (
            filteredItems.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => { 
                    if (cmd.category === 'MEMORY') {
                        onExecute('mem-jump', cmd.payload);
                    } else {
                        onExecute(cmd.id);
                    }
                    onClose(); 
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left px-4 py-2.5 flex items-center justify-between group transition-colors ${index === selectedIndex ? 'bg-arrow-400/10' : 'hover:bg-slate-800'}`}
              >
                <div className="flex items-center gap-3 w-full">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border min-w-[70px] text-center ${
                        index === selectedIndex 
                        ? 'border-arrow-400/30 bg-arrow-400/20 text-arrow-400' 
                        : 'border-slate-700 bg-slate-800 text-slate-500'
                    } ${cmd.category === 'MEMORY' ? 'text-rust-500 border-rust-500/30 bg-rust-500/10' : ''} ${cmd.category === 'ENGINE' ? 'text-purple-500 border-purple-500/30 bg-purple-500/10' : ''}`}>
                        {cmd.category}
                    </span>
                    <span className={`text-sm font-medium truncate ${index === selectedIndex ? 'text-white' : 'text-slate-400'}`}>
                        {cmd.label}
                    </span>
                </div>
                {cmd.shortcut && <span className="text-[10px] font-mono text-slate-600 whitespace-nowrap">{cmd.shortcut}</span>}
              </button>
            ))
          )}
        </div>
        
        <div className="bg-[#0A0C10] px-4 py-2 border-t border-cortex-border flex justify-between items-center text-[10px] text-slate-600 font-mono">
            <span>Cortex Spotlight</span>
            <span>Local Index: {vectorData?.nodes.length || 0} Nodes</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
