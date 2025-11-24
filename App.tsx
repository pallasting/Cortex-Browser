import React, { useState, useMemo, useEffect, useCallback } from 'react';
import OmniBar from './components/OmniBar';
import DataView from './components/DataView';
import WebView from './components/WebView';
import MemorySpace from './components/MemorySpace';
import AiSidebar from './components/AiSidebar';
import CommandPalette from './components/CommandPalette';
import Toast, { ToastMessage } from './components/Toast';
import { ViewMode, Tab, DataFrame } from './types';
import { MOCK_HN_DATAFRAME, MOCK_CRATES_DATAFRAME, MOCK_VECTOR_GRAPH, INITIAL_URL } from './constants';

const App: React.FC = () => {
  const [url, setUrl] = useState(INITIAL_URL);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.WEB);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState('1');
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  // UI States
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // State for DataFrames to allow mutation (Live Mode)
  const [dataFrames, setDataFrames] = useState<{ [key: string]: DataFrame }>({
    '1': MOCK_HN_DATAFRAME,
    '2': MOCK_CRATES_DATAFRAME
  });

  const [tabs] = useState<Tab[]>([
    { id: '1', title: 'Hacker News', url: 'news.ycombinator.com', dataState: 'parsed', tokenCount: 450 },
    { id: '2', title: 'crates.io', url: 'crates.io', dataState: 'parsed', tokenCount: 1200 },
  ]);

  // --- Real-time Engine Simulation ---
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (isLiveMode) {
      intervalId = setInterval(() => {
        setDataFrames(prev => {
          const newState = { ...prev };
          
          // Mutate Hacker News Data
          const hn = { ...newState['1'], columns: [...newState['1'].columns] };
          const pointsColIndex = hn.columns.findIndex(c => c.name === 'points');
          if (pointsColIndex !== -1) {
             const newPoints = [...(hn.columns[pointsColIndex].data as number[])];
             // Randomly increment a few rows
             const randomIndex = Math.floor(Math.random() * newPoints.length);
             newPoints[randomIndex] = newPoints[randomIndex] + Math.floor(Math.random() * 5);
             
             hn.columns[pointsColIndex] = { ...hn.columns[pointsColIndex], data: newPoints };
             newState['1'] = hn;
          }

          // Mutate Crates.io Data
          const crates = { ...newState['2'], columns: [...newState['2'].columns] };
          const downloadsColIndex = crates.columns.findIndex(c => c.name === 'downloads');
           if (downloadsColIndex !== -1) {
             const newDownloads = [...(crates.columns[downloadsColIndex].data as number[])];
             const randomIndex = Math.floor(Math.random() * newDownloads.length);
             newDownloads[randomIndex] = newDownloads[randomIndex] + Math.floor(Math.random() * 100);
             
             crates.columns[downloadsColIndex] = { ...crates.columns[downloadsColIndex], data: newDownloads };
             newState['2'] = crates;
          }

          return newState;
        });
      }, 1000); // 1-second tick
    }

    return () => clearInterval(intervalId);
  }, [isLiveMode]);
  // -----------------------------------

  // Keyboard Shortcuts Global Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Command Palette (Meta+K or Ctrl+K)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ id: Date.now().toString(), message, type });
  }, []);

  // Get active data based on tab
  const activeData = useMemo(() => dataFrames[activeTabId], [activeTabId, dataFrames]);

  // Update URL input when tab changes (unless user is typing)
  useEffect(() => {
      const tab = tabs.find(t => t.id === activeTabId);
      if (tab) setUrl(`https://${tab.url}`);
  }, [activeTabId, tabs]);

  const handleAiAction = (action: string) => {
      if (action === 'VISUALIZE') {
          setViewMode(ViewMode.DATA);
          setIsChartOpen(true);
          showToast('Data Visualization Generated', 'success');
      }
  };

  const handleCommandExecute = (commandId: string) => {
    switch (commandId) {
        case 'nav-hn':
            setActiveTabId('1');
            showToast('Switched to Hacker News', 'info');
            break;
        case 'nav-crates':
            setActiveTabId('2');
            showToast('Switched to Crates.io', 'info');
            break;
        case 'view-web':
            setViewMode(ViewMode.WEB);
            break;
        case 'view-data':
            setViewMode(ViewMode.DATA);
            break;
        case 'view-mem':
            setViewMode(ViewMode.MEMORY);
            break;
        case 'sys-export-pq':
            showToast('Exported 12 rows to data.parquet', 'success');
            break;
        case 'sys-export-csv':
            showToast('Exported to data.csv', 'success');
            break;
        case 'sys-gc':
            showToast('Garbage Collection ran. Freed 12MB.', 'info');
            break;
        case 'sys-reindex':
            showToast('LanceDB Index Rebuilt (150ms)', 'success');
            break;
        case 'sys-toggle-live':
            setIsLiveMode(prev => {
                const newState = !prev;
                showToast(`Live Sync ${newState ? 'Enabled' : 'Disabled'}`, newState ? 'success' : 'info');
                return newState;
            });
            break;
        default:
            break;
    }
  };

  const handleVectorClick = (id: string) => {
      showToast(`Vector Retrieval: ID ${id} loaded from LanceDB`, 'info');
      setViewMode(ViewMode.MEMORY);
  };

  // Helper to get active content
  const renderContent = () => {
    switch (viewMode) {
      case ViewMode.WEB:
        return <WebView data={activeData} onVectorClick={handleVectorClick} />;
      case ViewMode.DATA:
        return <DataView data={activeData} isChartVisible={isChartOpen} />;
      case ViewMode.MEMORY:
        // Pass the URL input as the search query if it's not a URL
        const searchQuery = url.includes('http') || url.includes('www') ? '' : url;
        return <MemorySpace data={MOCK_VECTOR_GRAPH} searchQuery={searchQuery} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-cortex-bg text-slate-200 overflow-hidden font-sans selection:bg-rust-500/30 selection:text-rust-500 relative">
      
      {/* Tab Bar (Minimalist) */}
      <div className="flex bg-cortex-bg pt-2 px-2 gap-1 overflow-x-auto border-b border-cortex-border items-center">
         <div className="flex items-center px-3 text-rust-600 font-bold tracking-widest text-sm mr-2 select-none cursor-default">
            CORTEX
         </div>
         {tabs.map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-t-lg transition-colors border-t border-l border-r relative group ${
                    activeTabId === tab.id 
                    ? 'bg-cortex-panel border-cortex-border text-slate-200' 
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-400'
                }`}
             >
                <div className={`w-2 h-2 rounded-full ${tab.dataState === 'parsed' ? 'bg-arrow-400' : 'bg-slate-600'}`}></div>
                {tab.title}
             </button>
         ))}
         <button className="px-3 text-slate-500 hover:text-slate-300">+</button>
         
         <div className="flex-1"></div>

         <div className="mr-4 hidden sm:flex gap-4 text-[10px] font-mono text-slate-600 items-center">
            <span>Cmd+K for Commands</span>
         </div>

         {/* Live Mode Toggle */}
         <button 
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`mr-4 px-2 py-1 text-[10px] font-mono border rounded flex items-center gap-2 transition-all ${
                isLiveMode 
                ? 'border-green-500/50 bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                : 'border-slate-700 text-slate-500 hover:border-slate-500'
            }`}
         >
            <div className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
            {isLiveMode ? 'LIVE SYNC: ON' : 'LIVE SYNC: OFF'}
         </button>
      </div>

      {/* OmniBar Navigation */}
      <OmniBar 
        url={url} 
        viewMode={viewMode}
        onUrlChange={setUrl}
        onViewModeChange={setViewMode}
        onAskAI={() => setIsAiOpen(!isAiOpen)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative">
        {renderContent()}
        
        {/* Decorative Overlay for "Geek" aesthetic */}
        <div className="absolute bottom-4 left-4 pointer-events-none z-10 flex flex-col gap-1 text-[9px] font-mono text-slate-600 opacity-50">
            <span>RUST_ENGINE_V0.1.0</span>
            <span>MEM_USAGE: {activeTabId === '1' ? '45MB' : '62MB'}</span>
            <span>ARROW_IPC: {isLiveMode ? 'STREAMING' : 'IDLE'}</span>
        </div>
      </main>

      {/* AI Sidebar Overlay */}
      <AiSidebar 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        contextData={activeData}
        onAction={handleAiAction}
      />

      {/* Command Palette Overlay */}
      <CommandPalette 
        isOpen={isCmdPaletteOpen} 
        onClose={() => setIsCmdPaletteOpen(false)} 
        onExecute={handleCommandExecute}
      />

      {/* Toast Notifications */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;