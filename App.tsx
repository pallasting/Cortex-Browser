import React, { useState, useMemo, useEffect, useCallback } from 'react';
import OmniBar from './components/OmniBar';
import DataView from './components/DataView';
import WebView from './components/WebView';
import MemorySpace from './components/MemorySpace';
import AiSidebar from './components/AiSidebar';
import CommandPalette from './components/CommandPalette';
import Toast, { ToastMessage } from './components/Toast';
import BootScreen from './components/BootScreen';
import { ViewMode, Tab, DataFrame, VectorGraphData } from './types';
import { MOCK_HN_DATAFRAME, MOCK_CRATES_DATAFRAME, MOCK_VECTOR_GRAPH, INITIAL_URL, generateArticleDataFrame } from './constants';

const App: React.FC = () => {
  const [isBooting, setIsBooting] = useState(true);
  const [url, setUrl] = useState(INITIAL_URL);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.WEB);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState('1');
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  // UI States
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Agent State
  const [agentHighlights, setAgentHighlights] = useState<string[]>([]);
  const [agentClicks, setAgentClicks] = useState<string[]>([]);

  // Dynamic Data States
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'Hacker News', url: 'news.ycombinator.com', dataState: 'parsed', tokenCount: 450 },
    { id: '2', title: 'crates.io', url: 'crates.io', dataState: 'parsed', tokenCount: 1200 },
  ]);

  const [dataFrames, setDataFrames] = useState<{ [key: string]: DataFrame }>({
    '1': MOCK_HN_DATAFRAME,
    '2': MOCK_CRATES_DATAFRAME
  });

  const [vectorData, setVectorData] = useState<VectorGraphData>(MOCK_VECTOR_GRAPH);

  // --- Real-time Engine Simulation ---
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (isLiveMode) {
      intervalId = setInterval(() => {
        setDataFrames(prev => {
          const newState = { ...prev };
          
          // Mutate Hacker News Data
          if (newState['1']) {
            const hn = { ...newState['1'], columns: [...newState['1'].columns] };
            const pointsColIndex = hn.columns.findIndex(c => c.name === 'points');
            if (pointsColIndex !== -1) {
                const newPoints = [...(hn.columns[pointsColIndex].data as number[])];
                const randomIndex = Math.floor(Math.random() * newPoints.length);
                newPoints[randomIndex] = newPoints[randomIndex] + Math.floor(Math.random() * 5);
                
                hn.columns[pointsColIndex] = { ...hn.columns[pointsColIndex], data: newPoints };
                newState['1'] = hn;
            }
          }

          // Mutate Crates.io Data
          if (newState['2']) {
            const crates = { ...newState['2'], columns: [...newState['2'].columns] };
            const downloadsColIndex = crates.columns.findIndex(c => c.name === 'downloads');
            if (downloadsColIndex !== -1) {
                const newDownloads = [...(crates.columns[downloadsColIndex].data as number[])];
                const randomIndex = Math.floor(Math.random() * newDownloads.length);
                newDownloads[randomIndex] = newDownloads[randomIndex] + Math.floor(Math.random() * 100);
                
                crates.columns[downloadsColIndex] = { ...crates.columns[downloadsColIndex], data: newDownloads };
                newState['2'] = crates;
            }
          }

          return newState;
        });
      }, 1000); 
    }

    return () => clearInterval(intervalId);
  }, [isLiveMode]);
  // -----------------------------------

  // Keyboard Shortcuts Global Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const activeData = useMemo(() => dataFrames[activeTabId] || MOCK_HN_DATAFRAME, [activeTabId, dataFrames]);

  useEffect(() => {
      const tab = tabs.find(t => t.id === activeTabId);
      if (tab) setUrl(`https://${tab.url}`);
      setAgentHighlights([]); // Reset highlights on tab change
      setAgentClicks([]);
  }, [activeTabId, tabs]);

  // --- Dynamic Tab Management & Vector Mutation ---
  const handleNavigate = (navUrl: string, navTitle: string) => {
      const newTabId = Date.now().toString();
      const newTab: Tab = {
          id: newTabId,
          title: navTitle.length > 20 ? navTitle.substring(0, 20) + '...' : navTitle,
          url: navUrl,
          dataState: 'parsed',
          tokenCount: 800
      };

      // 1. Add Tab
      setTabs(prev => [...prev, newTab]);
      setActiveTabId(newTabId);

      // 2. Generate Data for Tab (Simulate Parsing)
      const newData = generateArticleDataFrame(newTabId, navTitle);
      setDataFrames(prev => ({ ...prev, [newTabId]: newData }));

      // 3. Mutate Vector Memory (Simulate Ingestion)
      setVectorData(prev => {
          const newNodeId = newTabId;
          const sourceNodeId = activeTabId; // The tab we navigated FROM
          
          const newNode = {
              id: newNodeId,
              title: navTitle,
              url: navUrl,
              similarity: 0.95, // High similarity as it was just clicked
              x: 0, 
              y: 0
          };

          const newLink = {
              source: sourceNodeId,
              target: newNodeId,
              value: 0.8
          };

          showToast(`Ingested "${navTitle}" into Vector Memory`, 'success');

          return {
              nodes: [...prev.nodes, newNode],
              links: [...prev.links, newLink]
          };
      });
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
      e.stopPropagation();
      if (tabs.length === 1) return; // Don't close last tab
      
      const newTabs = tabs.filter(t => t.id !== tabId);
      setTabs(newTabs);
      
      if (activeTabId === tabId) {
          setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      
      // Cleanup data (Optional, in a real browser we might keep it in history)
      setDataFrames(prev => {
          const newState = { ...prev };
          delete newState[tabId];
          return newState;
      });
  };
  // ------------------------------------------------

  // --- Workflow Engine ---
  const runWorkflow = async (workflow: any) => {
      showToast(`Starting Workflow: ${workflow.name}`, 'info');
      
      for (const step of workflow.steps) {
          await new Promise(resolve => setTimeout(resolve, step.delay || 500));
          
          if (step.type === 'NAV') {
              setActiveTabId(step.payload);
              const tabName = tabs.find(t => t.id === step.payload)?.title;
              showToast(`Workflow: Navigating to ${tabName}`, 'info');
          }
          
          if (step.type === 'ACTION') {
              handleAiAction(step.action, step.payload);
          }
          
          if (step.type === 'VIEW') {
              setViewMode(step.payload);
          }
      }
      
      showToast(`Workflow "${workflow.name}" Completed`, 'success');
  };


  // Handle Agent Actions from Sidebar
  const handleAiAction = (action: string, payload?: any) => {
      if (action === 'WORKFLOW_START') {
          runWorkflow(payload);
          return;
      }

      if (action === 'VISUALIZE') {
          setViewMode(ViewMode.DATA);
          setIsChartOpen(true);
          showToast('Agent: Data Visualization Generated', 'success');
      }
      
      if (action === 'AGENT_HIGHLIGHT') {
          if (viewMode !== ViewMode.WEB) setViewMode(ViewMode.WEB);
          
          const ids = payload as string[];
          setAgentHighlights(ids);
          
          if (ids.length > 0) {
              showToast(`Agent: Identifying ${ids.length} elements`, 'info');
          }
      }

      if (action === 'AGENT_CLICK') {
          if (viewMode !== ViewMode.WEB) setViewMode(ViewMode.WEB);

          const rawIds = payload as string[]; // e.g., ["1001-vote", "tokio-action"]
          setAgentClicks(rawIds); // Trigger visual click
          showToast(`Agent: Executing interactions on ${rawIds.length} nodes...`, 'success');

          // --- PERFORM DATA MUTATION ---
          setTimeout(() => {
            setDataFrames(prev => {
                const newState = { ...prev };
                
                // Helper to mutate a specific DataFrame
                const mutateDF = (tabId: string, idVal: string | number, colName: string, delta: number) => {
                    const df = newState[tabId];
                    if (!df) return;
                    
                    const newDF = { ...df, columns: [...df.columns] };
                    
                    const idColIndex = newDF.columns.findIndex(c => c.name === 'id' || c.name === 'crate_name');
                    const targetColIndex = newDF.columns.findIndex(c => c.name === colName);
                    
                    if (idColIndex !== -1 && targetColIndex !== -1) {
                        const rowIndex = newDF.columns[idColIndex].data.findIndex(v => String(v) === String(idVal));
                        if (rowIndex !== -1) {
                            const newData = [...(newDF.columns[targetColIndex].data as any[])];
                            // Assuming numeric for now
                            if (typeof newData[rowIndex] === 'number') {
                                newData[rowIndex] += delta;
                            }
                            newDF.columns[targetColIndex] = { ...newDF.columns[targetColIndex], data: newData };
                            newState[tabId] = newDF;
                        }
                    }
                };

                rawIds.forEach(rawId => {
                    // Extract ID from "1001-vote" or "tokio-action"
                    const idPart = rawId.replace('-vote', '').replace('-action', '');
                    
                    // Try mutating HN (Tab 1) - ID is numeric
                    if (!isNaN(Number(idPart))) {
                        mutateDF('1', Number(idPart), 'points', 1);
                    } 
                    // Try mutating Crates (Tab 2) - ID is string
                    else {
                        mutateDF('2', idPart, 'downloads', 1000); // Add 1000 downloads
                    }
                });

                return newState;
            });
            // Reset click state after animation
            setAgentClicks([]);
          }, 600); // Delay mutation slightly to sync with animation
      }
  };

  const handleCommandExecute = (commandId: string, payload?: any) => {
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
        case 'mem-jump':
            if (payload) {
                // Focus on vector view with this node ID
                setViewMode(ViewMode.MEMORY);
                // In a real app, we'd center the graph. 
                // Here we update URL to simulate "Selection" which MemorySpace picks up via props
                const node = vectorData.nodes.find(n => n.id === payload);
                if (node) {
                    setUrl(node.title); // Hacky way to filter MemorySpace for demo
                    showToast(`Spotlight: Jumped to memory node "${node.title}"`, 'success');
                }
            }
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

  const renderContent = () => {
    switch (viewMode) {
      case ViewMode.WEB:
        return <WebView 
            data={activeData} 
            onVectorClick={handleVectorClick} 
            onNavigate={handleNavigate}
            agentHighlights={agentHighlights}
            agentClicks={agentClicks}
        />;
      case ViewMode.DATA:
        return <DataView data={activeData} isChartVisible={isChartOpen} />;
      case ViewMode.MEMORY:
        const searchQuery = url.includes('http') || url.includes('www') ? '' : url;
        return <MemorySpace data={vectorData} searchQuery={searchQuery} />;
      default:
        return null;
    }
  };

  // --- BOOT SCREEN INTERCEPT ---
  if (isBooting) {
      return <BootScreen onComplete={() => setIsBooting(false)} />;
  }
  // -----------------------------

  return (
    <div className="flex flex-col h-screen bg-cortex-bg text-slate-200 overflow-hidden font-sans selection:bg-rust-500/30 selection:text-rust-500 relative animate-in fade-in duration-1000">
      
      {/* Tab Bar (Dynamic) */}
      <div className="flex bg-cortex-bg pt-2 px-2 gap-1 overflow-x-auto border-b border-cortex-border items-center no-scrollbar">
         <div className="flex items-center px-3 text-rust-600 font-bold tracking-widest text-sm mr-2 select-none cursor-default flex-shrink-0">
            CORTEX
         </div>
         {tabs.map(tab => (
             <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-mono rounded-t-lg transition-colors border-t border-l border-r relative group cursor-pointer flex-shrink-0 max-w-[150px] ${
                    activeTabId === tab.id 
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
      <main className="flex-1 relative overflow-hidden">
        {renderContent()}
        
        {/* Decorative Overlay */}
        <div className="absolute bottom-4 left-4 pointer-events-none z-10 flex flex-col gap-1 text-[9px] font-mono text-slate-600 opacity-50">
            <span>RUST_ENGINE_V0.1.0</span>
            <span>MEM_USAGE: {activeTabId === '1' ? '45MB' : '62MB'}</span>
            <span>ARROW_IPC: {isLiveMode ? 'STREAMING' : 'IDLE'}</span>
            {agentHighlights.length > 0 && <span className="text-green-500">AGENT_OBSERVER: {agentHighlights.length} NODES</span>}
            {agentClicks.length > 0 && <span className="text-rust-500 animate-pulse font-bold">AGENT_ACTION: CLICK_EVENT_DISPATCH</span>}
        </div>
      </main>

      {/* AI Sidebar Overlay */}
      <AiSidebar 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        contextData={activeData}
        onAction={handleAiAction}
      />

      {/* Command Palette Overlay (Spotlight) */}
      <CommandPalette 
        isOpen={isCmdPaletteOpen} 
        onClose={() => setIsCmdPaletteOpen(false)} 
        onExecute={handleCommandExecute}
        vectorData={vectorData}
      />

      {/* Toast Notifications */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
