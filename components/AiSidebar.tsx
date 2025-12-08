
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, DataFrame } from '../types';
import { generatePageInsight, generateAgentThought, setMemoryApiKey } from '../services/geminiService';

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  contextData: DataFrame;
  onAction?: (action: string, payload?: any) => void;
}

const AiSidebar: React.FC<AiSidebarProps> = ({ isOpen, onClose, contextData, onAction }) => {
  const [mode, setMode] = useState<'CHAT' | 'AUTO'>('CHAT');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'init',
          role: 'model',
          text: `Cortex Engine Online. I have direct memory access to the current tab's ${contextData.rowCount} rows of data. 
          
          I can filter, aggregate, or visualize this Arrow DataFrame. I can also act as an Agent to interact with the page elements.`,
          timestamp: Date.now()
        }
      ]);
    }
  }, [isOpen, contextData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textInput: string = input) => {
    if (!textInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const lowerInput = textInput.toLowerCase();
    
    // --- AGENT SIMULATION LOGIC ---

    // 1. VISUALIZATION AGENT
    if (lowerInput.includes('visualize') || lowerInput.includes('chart')) {
        try {
            // Generate real thought
            const thought = await generateAgentThought("Generate visualization chart");
            if(onAction) onAction('AGENT_THOUGHT', thought);
        } catch (e) { /* ignore */ }

        setTimeout(() => {
            setIsLoading(false);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: "I've generated a visualization of the numeric distributions for this dataset. Switching to Analysis Mode.",
                timestamp: Date.now()
            }]);
            if (onAction) onAction('VISUALIZE');
        }, 800);
        return;
    }

    // 2. PHYSICS AGENT (Bridge to NeuroRust)
    if (lowerInput.includes('stabilize') || lowerInput.includes('cool') || lowerInput.includes('heat') || lowerInput.includes('entropy') || lowerInput.includes('reset physics')) {
        
        try {
            const thought = await generateAgentThought("Adjusting Thermodynamic Parameters");
            if(onAction) onAction('AGENT_THOUGHT', thought);
        } catch (e) {
            if(onAction) onAction('AGENT_THOUGHT', "Accessing NeuroRust Control Plane...");
        }

        setTimeout(() => {
            setIsLoading(false);
            let configUpdate = {};
            let msg = "";

            if (lowerInput.includes('stabilize') || lowerInput.includes('cool')) {
                configUpdate = { temperature: 0.1, coolingRate: 0.95 };
                msg = "Initiating rapid cooling sequence. Stabilizing network topology.";
            } else if (lowerInput.includes('heat') || lowerInput.includes('entropy') || lowerInput.includes('chaos')) {
                configUpdate = { temperature: 2.0, coolingRate: 0.999 };
                msg = "Injecting thermal noise. Increasing system entropy.";
            } else if (lowerInput.includes('reset')) {
                configUpdate = { neuronCount: 50, synapseDensity: 0.2, temperature: 1.0 };
                msg = "Resetting physics engine to default parameters.";
            }

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: msg,
                timestamp: Date.now()
            }]);
            
            if (onAction) onAction('PHYSICS_UPDATE', configUpdate);
        }, 1000);
        return;
    }

    // 3. INTERACTION AGENT (The "Act" Phase)
    if (lowerInput.includes('select') || lowerInput.includes('highlight') || lowerInput.includes('upvote') || lowerInput.includes('download') || lowerInput.includes('copy')) {
        
        // Trigger generic thought immediately
        try {
            const thought = await generateAgentThought(textInput);
            if(onAction) onAction('AGENT_THOUGHT', thought);
        } catch (e) {
             if(onAction) onAction('AGENT_THOUGHT', "Analyzing DOM structure...");
        }

        setTimeout(() => {
            setIsLoading(false);
            
            // Heuristic to find target IDs based on input
            let targetIds: string[] = [];
            const idCol = contextData.columns.find(c => c.name === 'id' || c.name === 'crate_name');
            const criteriaCol = contextData.columns.find(c => c.name === 'title' || c.name === 'category' || c.name === 'crate_name');
            
            if (idCol && criteriaCol) {
                if (lowerInput.includes('rust')) {
                    targetIds = idCol.data.filter((_, i) => String(criteriaCol.data[i]).toLowerCase().includes('rust')).map(String);
                } else if (lowerInput.includes('top')) {
                    targetIds = idCol.data.slice(0, 3).map(String);
                } else if (lowerInput.includes('tokio')) {
                    targetIds = idCol.data.filter((_, i) => String(criteriaCol.data[i]).toLowerCase().includes('tokio')).map(String);
                } else {
                     targetIds = idCol.data.slice(0, 2).map(String);
                }
            }

            // Differentiate Action Type
            const isClickAction = lowerInput.includes('upvote') || lowerInput.includes('download') || lowerInput.includes('copy');

            if (isClickAction) {
                // Generate Action IDs (Shadow DOM Mapping simulation)
                const actionIds = targetIds.map(id => lowerInput.includes('upvote') ? `${id}-vote` : `${id}-action`);

                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: `Executing interaction on ${actionIds.length} elements. Dispatching click events via Shadow DOM...`,
                    timestamp: Date.now()
                }]);
                
                if (onAction) onAction('AGENT_CLICK', actionIds);
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'model',
                    text: `I identified ${targetIds.length} elements matching your criteria. Highlighting DOM nodes...`,
                    timestamp: Date.now()
                }]);
                
                if (onAction) onAction('AGENT_HIGHLIGHT', targetIds);
            }

        }, 1000); 
        return;
    }

    // 4. STANDARD LLM QUERY
    try {
        const dataStr = JSON.stringify(contextData.columns.map(c => ({ name: c.name, data: c.data.slice(0, 10) })));
        
        const responseText = await generatePageInsight(
            `User Question: ${userMsg.text}\n\nContext Data (Arrow Columns): ${dataStr}`
        );

        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMsg]);

    } catch (err: any) {
        if (err.message === "API_KEY_MISSING") {
            setApiKeyMissing(true);
            setMessages(prev => [...prev, {
                id: 'err',
                role: 'model',
                text: "SYSTEM ALERT: Gemini API Key is missing.",
                timestamp: Date.now()
            }]);
        } else {
             setMessages(prev => [...prev, {
                id: 'err',
                role: 'model',
                text: "Error communicating with Cortex Intelligence Layer.",
                timestamp: Date.now()
            }]);
        }
    } finally {
        setIsLoading(false);
    }
  };

  const saveKey = (key: string) => {
      try {
        localStorage.setItem("GEMINI_API_KEY", key);
        alert("Key Saved. Please try asking again.");
      } catch (e) {
          // Security Error (iframe)
          setMemoryApiKey(key);
          alert("Key stored in Session Memory (LocalStorage restricted). It will be lost on refresh.");
      }
      setApiKeyMissing(false);
  };

  const handleWorkflow = (flow: string) => {
      if (flow === 'SCAN') {
        if(onAction) onAction('WORKFLOW_START', {
            name: "Morning Rust Scan",
            steps: [
                { type: 'NAV', payload: '1', delay: 0 },
                { type: 'ACTION', action: 'AGENT_THOUGHT', payload: "Scanning memory for 'Rust' related vectors...", delay: 500 },
                { type: 'ACTION', action: 'AGENT_HIGHLIGHT', payload: ['1001', '1003'], delay: 1000 },
                { type: 'ACTION', action: 'AGENT_THOUGHT', payload: "Calculating click targets for upvote action...", delay: 500 },
                { type: 'ACTION', action: 'AGENT_CLICK', payload: ['1001-vote', '1003-vote'], delay: 1500 },
                { type: 'NAV', payload: '2', delay: 3000 },
                { type: 'ACTION', action: 'AGENT_THOUGHT', payload: "Querying index for 'tokio' crate metadata...", delay: 500 },
                { type: 'ACTION', action: 'AGENT_HIGHLIGHT', payload: ['tokio'], delay: 1000 },
                { type: 'VIEW', payload: 'DATA', delay: 2000 }
            ]
        });
      }
      
      if (flow === 'BACKUP') {
          if(onAction) onAction('WORKFLOW_START', {
            name: "Data Backup & Visualization",
            steps: [
                { type: 'VIEW', payload: 'WEB', delay: 0 },
                { type: 'ACTION', action: 'AGENT_HIGHLIGHT', payload: ['1002', '1006'], delay: 500 },
                { type: 'VIEW', payload: 'DATA', delay: 1000 },
                { type: 'ACTION', action: 'AGENT_THOUGHT', payload: "Compiling column statistics for D3.js render...", delay: 500 },
                { type: 'ACTION', action: 'VISUALIZE', payload: null, delay: 500 }
            ]
        });
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-black/80 backdrop-blur-xl border-l border-cortex-border z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-cortex-border flex justify-between items-center bg-gradient-to-r from-cortex-panel to-transparent">
        <h3 className="text-rust-500 font-bold font-mono flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10h-10V2z" opacity="0.5"/></svg>
            INTELLIGENCE LAYER
        </h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="flex border-b border-cortex-border">
          <button 
            onClick={() => setMode('CHAT')}
            className={`flex-1 py-2 text-xs font-mono transition-colors ${mode === 'CHAT' ? 'bg-rust-500/10 text-rust-500 border-b-2 border-rust-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
              CHAT & AGENT
          </button>
          <button 
             onClick={() => setMode('AUTO')}
             className={`flex-1 py-2 text-xs font-mono transition-colors ${mode === 'AUTO' ? 'bg-arrow-400/10 text-arrow-400 border-b-2 border-arrow-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
              AUTOMATIONS
          </button>
      </div>

      {/* CHAT MODE */}
      {mode === 'CHAT' && (
      <>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-3 text-sm font-mono leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-slate-800 text-slate-200 border border-slate-700' 
                        : 'bg-rust-500/10 text-rust-500 border border-rust-500/20 shadow-[0_0_15px_rgba(206,65,43,0.1)]'
                    }`}>
                        {msg.text.split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex justify-start">
                    <div className="bg-rust-500/10 text-rust-500 border border-rust-500/20 rounded-lg p-3 text-xs font-mono flex items-center gap-2">
                        <span className="w-2 h-2 bg-rust-500 rounded-full animate-ping"></span>
                        Agent Thinking...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            <button 
                onClick={() => handleSend("Upvote top 3 items")}
                className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-rust-500 border border-rust-900/50 text-[10px] px-2 py-1 rounded-full transition-colors flex items-center gap-1"
            >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>
                Upvote Top 3
            </button>
            <button 
                onClick={() => handleSend("Stabilize network")}
                className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-900/50 text-[10px] px-2 py-1 rounded-full transition-colors flex items-center gap-1"
            >
                Stabilize Physics
            </button>
            <button 
                onClick={() => handleSend("Highlight Rust related items")}
                className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] px-2 py-1 rounded-full transition-colors"
            >
                Select Rust
            </button>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-cortex-border bg-cortex-panel">
            {apiKeyMissing ? (
                <div className="flex gap-2">
                    <input 
                    type="password"
                    placeholder="Paste Gemini API Key"
                    className="flex-1 bg-black text-slate-200 border border-red-900/50 rounded p-2 text-xs font-mono focus:border-red-500 outline-none"
                    onKeyDown={(e) => { if(e.key === 'Enter') saveKey(e.currentTarget.value) }}
                    />
                </div>
            ) : (
                <div className="flex gap-2">
                    <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Instruct Agent (e.g. 'Upvote', 'Cool down')..."
                    className="flex-1 bg-black text-slate-200 border border-cortex-border rounded p-2 text-xs font-mono focus:border-rust-500 outline-none placeholder:text-slate-600"
                    />
                    <button 
                        onClick={() => handleSend()}
                        className="bg-rust-600 hover:bg-rust-500 text-white px-3 rounded transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 7-7 7 7 7 7 7 7"/><path d="M12 19V5"/></svg>
                    </button>
                </div>
            )}
        </div>
      </>
      )}

      {/* AUTOMATION MODE */}
      {mode === 'AUTO' && (
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-2">Saved Workflows</div>
              
              <div className="p-3 border border-slate-700 bg-slate-900/50 rounded-lg hover:border-arrow-400 transition-colors group cursor-pointer" onClick={() => handleWorkflow('SCAN')}>
                  <div className="flex justify-between items-start mb-2">
                      <h4 className="text-arrow-400 font-bold font-mono text-sm">Morning Rust Scan</h4>
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">6 STEPS</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                      Scans Hacker News for Rust topics, upvotes top items, then checks Crates.io for 'tokio' updates.
                  </p>
                  <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-arrow-400 transition-colors"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-arrow-400 transition-colors delay-75"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-arrow-400 transition-colors delay-100"></div>
                  </div>
              </div>

               <div className="p-3 border border-slate-700 bg-slate-900/50 rounded-lg hover:border-rust-500 transition-colors group cursor-pointer" onClick={() => handleWorkflow('BACKUP')}>
                  <div className="flex justify-between items-start mb-2">
                      <h4 className="text-rust-500 font-bold font-mono text-sm">Data Viz & Backup</h4>
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">4 STEPS</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                      Highlights key data points, switches to Data View, and auto-generates a distribution chart.
                  </p>
                  <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-rust-500 transition-colors"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-rust-500 transition-colors delay-75"></div>
                  </div>
              </div>

               <div className="p-3 border border-dashed border-slate-800 rounded-lg flex items-center justify-center text-slate-600 text-xs font-mono cursor-not-allowed">
                  + Create New Workflow
              </div>
          </div>
      )}
    </div>
  );
};

export default AiSidebar;
