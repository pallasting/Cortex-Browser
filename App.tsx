import React, { useState, useMemo } from 'react';
import OmniBar from './components/OmniBar';
import DataView from './components/DataView';
import WebView from './components/WebView';
import MemorySpace from './components/MemorySpace';
import AiSidebar from './components/AiSidebar';
import { ViewMode, Tab } from './types';
import { MOCK_HN_DATAFRAME, MOCK_CRATES_DATAFRAME, MOCK_VECTOR_GRAPH, INITIAL_URL } from './constants';

const App: React.FC = () => {
  const [url, setUrl] = useState(INITIAL_URL);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.WEB);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [tabs] = useState<Tab[]>([
    { id: '1', title: 'Hacker News', url: 'news.ycombinator.com', dataState: 'parsed', tokenCount: 450 },
    { id: '2', title: 'crates.io', url: 'crates.io', dataState: 'parsed', tokenCount: 1200 },
  ]);
  const [activeTabId, setActiveTabId] = useState('1');

  // Determine which dataframe is active based on the selected tab
  const activeData = useMemo(() => {
      if (activeTabId === '1') return MOCK_HN_DATAFRAME;
      if (activeTabId === '2') return MOCK_CRATES_DATAFRAME;
      return MOCK_HN_DATAFRAME;
  }, [activeTabId]);

  // Update URL input when tab changes
  useMemo(() => {
      const tab = tabs.find(t => t.id === activeTabId);
      if (tab) setUrl(`https://${tab.url}`);
  }, [activeTabId, tabs]);


  // Helper to get active content
  const renderContent = () => {
    switch (viewMode) {
      case ViewMode.WEB:
        return <WebView data={activeData} />;
      case ViewMode.DATA:
        return <DataView data={activeData} />;
      case ViewMode.MEMORY:
        return <MemorySpace data={MOCK_VECTOR_GRAPH} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-cortex-bg text-slate-200 overflow-hidden font-sans selection:bg-rust-500/30 selection:text-rust-500">
      
      {/* Tab Bar (Minimalist) */}
      <div className="flex bg-cortex-bg pt-2 px-2 gap-1 overflow-x-auto border-b border-cortex-border">
         <div className="flex items-center px-3 text-rust-600 font-bold tracking-widest text-sm mr-2 select-none">
            CORTEX
         </div>
         {tabs.map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-t-lg transition-colors border-t border-l border-r ${
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
            <span>ARROW_IPC: ACTIVE</span>
        </div>
      </main>

      {/* AI Sidebar Overlay */}
      <AiSidebar 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        contextData={activeData}
      />
    </div>
  );
};

export default App;