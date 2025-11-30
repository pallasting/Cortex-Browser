
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import OmniBar from './components/OmniBar';
import DataView from './components/DataView';
import WebView from './components/WebView';
import MemorySpace from './components/MemorySpace';
import NeuroVis from './components/NeuroVis';
import AiSidebar from './components/AiSidebar';
import CommandPalette from './components/CommandPalette';
import Toast, { ToastMessage } from './components/Toast';
import BootScreen from './components/BootScreen';
import AgentStatusPanel from './components/AgentStatusPanel';
import { ViewMode, DataFrame } from './types';
import { useCortex } from './hooks/useCortex';
import { INITIAL_URL, MOCK_HN_DATAFRAME } from './constants';

const App: React.FC = () => {
  const { state, actions } = useCortex();
  
  // UI States (Local, View-specific)
  const [isBooting, setIsBooting] = useState(true);
  const [url, setUrl] = useState(INITIAL_URL);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Agent Interaction State (Transient)
  const [agentHighlights, setAgentHighlights] = useState<string[]>([]);
  const [agentClicks, setAgentClicks] = useState<string[]>([]);

  // Update URL when active tab changes
  useEffect(() => {
      const tab = state.tabs.find(t => t.id === state.activeTabId);
      if (tab) setUrl(`https://${tab.url}`);
      setAgentHighlights([]);
      setAgentClicks([]);
  }, [state.activeTabId, state.tabs]);

  // Boot Sequence Logic
  useEffect(() => {
    if (!isBooting) {
        setTimeout(() => setIsTerminalOpen(false), 2000);
    }
  }, [isBooting]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ id: Date.now().toString(), message, type });
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdPaletteOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
         e.preventDefault();
         setIsTerminalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeData = useMemo(() => 
    state.dataFrames[state.activeTabId] || MOCK_HN_DATAFRAME, 
  [state.activeTabId, state.dataFrames]);

  // --- Handlers ---

  const handleNavigate = (navUrl: string, navTitle: string) => {
      actions.navigate(navUrl, navTitle);
      showToast(`Ingested "${navTitle}" into Vector Memory`, 'success');
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      actions.closeTab(tabId);
  };

  const handleAiAction = (action: string, payload?: any) => {
      if (action === 'WORKFLOW_START') {
          runWorkflow(payload);
          return;
      }
      if (action === 'AGENT_THOUGHT') {
          actions.logAgent('INFO', 'AGENT', `[THOUGHT] ${payload}`);
          return;
      }
      if (action === 'VISUALIZE') {
          actions.setViewMode(ViewMode.DATA);
          setIsChartOpen(true);
          showToast('Agent: Data Visualization Generated', 'success');
          actions.logAgent('ACTION', 'AGENT', 'Triggered D3.js Visualization pipeline');
      }
      if (action === 'AGENT_HIGHLIGHT') {
          if (state.viewMode !== ViewMode.WEB) actions.setViewMode(ViewMode.WEB);
          setAgentHighlights(payload as string[]);
          if ((payload as string[]).length > 0) {
              showToast(`Agent: Identifying ${payload.length} elements`, 'info');
              actions.logAgent('INFO', 'AGENT', `Identified ${payload.length} DOM elements.`);
          }
      }
      if (action === 'AGENT_CLICK') {
          if (state.viewMode !== ViewMode.WEB) actions.setViewMode(ViewMode.WEB);
          const rawIds = payload as string[];
          setAgentClicks(rawIds);
          showToast(`Agent: interacting with ${rawIds.length} nodes...`, 'success');
          actions.logAgent('ACTION', 'AGENT', `Dispatching MouseEvent('click') on ${rawIds.join(', ')}`);
          
          setTimeout(() => {
              rawIds.forEach(rawId => {
                  const idPart = rawId.replace('-vote', '').replace('-action', '');
                  if (!isNaN(Number(idPart))) {
                      actions.mutateData('1', 'points', 1); // HN
                  } else {
                      actions.mutateData('2', 'downloads', 1000); // Crates
                  }
              });
              setAgentClicks([]);
          }, 600);
      }
  };

  const runWorkflow = async (workflow: any) => {
      showToast(`Starting Workflow: ${workflow.name}`, 'info');
      actions.logAgent('INFO', 'AGENT', `Initializing Workflow "${workflow.name}"`);
      setIsTerminalOpen(true);
      
      for (const step of workflow.steps) {
          await new Promise(resolve => setTimeout(resolve, step.delay || 500));
          if (step.type === 'NAV') {
              actions.setActiveTab(step.payload);
              actions.logAgent('ACTION', 'AGENT', `Navigating to Tab ID ${step.payload}`);
          }
          if (step.type === 'ACTION') handleAiAction(step.action, step.payload);
          if (step.type === 'VIEW') {
              actions.setViewMode(step.payload);
              actions.logAgent('ACTION', 'AGENT', `Switching View Mode to ${step.payload}`);
          }
      }
      showToast(`Workflow Completed`, 'success');
  };

  const handleCommandExecute = (commandId: string, payload?: any) => {
      actions.logAgent('INFO', 'SYSTEM', `Command Executed: ${commandId}`);
      switch (commandId) {
        case 'nav-hn': actions.setActiveTab('1'); break;
        case 'nav-crates': actions.setActiveTab('2'); break;
        case 'view-web': actions.setViewMode(ViewMode.WEB); break;
        case 'view-data': actions.setViewMode(ViewMode.DATA); break;
        case 'view-mem': actions.setViewMode(ViewMode.MEMORY); break;
        case 'view-neuro': actions.setViewMode(ViewMode.NEURO); break;
        case 'sys-export-pq': showToast('Exported to data.parquet', 'success'); break;
        case 'sys-export-csv': showToast('Exported to data.csv', 'success'); break;
        case 'sys-gc': actions.runGC(); showToast('Garbage Collection ran.', 'info'); break;
        case 'sys-toggle-live': actions.toggleLiveMode(); break;
        case 'eng-thermal': actions.setViewMode(ViewMode.NEURO); showToast('Thermodynamic Annealing Started', 'success'); break;
        case 'mem-jump': 
            if (payload) {
                actions.setViewMode(ViewMode.MEMORY);
                const node = state.vectorData.nodes.find(n => n.id === payload);
                if (node) {
                    setUrl(node.title);
                    showToast(`Spotlight: Jumped to "${node.title}"`, 'success');
                }
            }
            break;
      }
  };

  // --- Render ---

  const renderContent = () => {
    switch (state.viewMode) {
      case ViewMode.WEB:
        return <WebView 
            data={activeData} 
            onVectorClick={(id) => { showToast(`Retrieving Vector ID ${id}`, 'info'); actions.setViewMode(ViewMode.MEMORY); }}
            onNavigate={handleNavigate}
            agentHighlights={agentHighlights}
            agentClicks={agentClicks}
        />;
      case ViewMode.DATA:
        return <DataView data={activeData} isChartVisible={isChartOpen} />;
      case ViewMode.MEMORY:
        const searchQuery = url.includes('http') || url.includes('www') ? '' : url;
        return <MemorySpace data={state.vectorData} searchQuery={searchQuery} />;
      case ViewMode.NEURO:
        return <NeuroVis />;
      default: return null;
    }
  };

  if (isBooting) return <BootScreen onComplete={() => setIsBooting(false)} />;

  return (
    <div className="flex flex-col h-screen bg-cortex-bg text-slate-200 overflow-hidden font-sans selection:bg-rust-500/30 selection:text-rust-500 relative animate-in fade-in duration-1000">
      
      {/* Dynamic Tab Bar */}
      <div className="flex bg-cortex-bg pt-2 px-2 gap-1 overflow-x-auto border-b border-cortex-border items-center no-scrollbar">
         <div className="flex items-center px-3 text-rust-600 font-bold tracking-widest text-sm mr-2 select-none cursor-default flex-shrink-0">
            CORTEX
         </div>
         {state.tabs.map(tab => (
             <div
                key={tab.id}
                onClick={() => actions.setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-t-lg transition-colors border-t border-l border-r relative group cursor-pointer flex-shrink-0 max-w-[150px] ${
                    state.activeTabId === tab.id 
                    ? 'bg-cortex-panel border-cortex-border text-slate-200' 
                    : 'bg-transparent border-transparent text-slate-500 hover:text-slate-400 hover:bg-white/5'
                }`}
             >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${tab.dataState === 'parsed' ? 'bg-arrow-400' : 'bg-slate-600'}`}></div>
                <span className="truncate">{tab.title}</span>
                <button 
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 rounded-full p-0.5 transition-all"
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
             </div>
         ))}
         <button className="px-3 text-slate-500 hover:text-slate-300">+</button>
         <div className="flex-1"></div>
         <button 
            onClick={() => actions.toggleLiveMode()}
            className={`mr-4 px-2 py-1 text-[10px] font-mono border rounded flex items-center gap-2 transition-all ${
                state.isLiveMode 
                ? 'border-green-500/50 bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                : 'border-slate-700 text-slate-500 hover:border-slate-500'
            }`}
         >
            <div className={`w-1.5 h-1.5 rounded-full ${state.isLiveMode ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
            {state.isLiveMode ? 'LIVE SYNC: ON' : 'LIVE SYNC: OFF'}
         </button>
      </div>

      <OmniBar 
        url={url} 
        viewMode={state.viewMode}
        onUrlChange={setUrl}
        onViewModeChange={actions.setViewMode}
        onAskAI={() => setIsAiOpen(!isAiOpen)}
      />

      <main className="flex-1 relative overflow-hidden pb-8">
        {renderContent()}
        {!isTerminalOpen && (
            <div className="absolute bottom-10 left-4 pointer-events-none z-10 flex flex-col gap-1 text-[9px] font-mono text-slate-600 opacity-50">
                <span>RUST_ENGINE_V0.1.0</span>
                <span>MEM_USAGE: {state.activeTabId === '1' ? '45MB' : '62MB'}</span>
            </div>
        )}
      </main>

      <AgentStatusPanel logs={state.systemLogs} isOpen={isTerminalOpen} onToggle={() => setIsTerminalOpen(!isTerminalOpen)} />
      <AiSidebar isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} contextData={activeData} onAction={handleAiAction} />
      <CommandPalette isOpen={isCmdPaletteOpen} onClose={() => setIsCmdPaletteOpen(false)} onExecute={handleCommandExecute} vectorData={state.vectorData} />
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
