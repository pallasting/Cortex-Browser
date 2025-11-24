import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, DataFrame } from '../types';
import { generatePageInsight } from '../services/geminiService';

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  contextData: DataFrame;
  onAction?: (action: string) => void;
}

const AiSidebar: React.FC<AiSidebarProps> = ({ isOpen, onClose, contextData, onAction }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initial greeting
      setMessages([
        {
          id: 'init',
          role: 'model',
          text: `Cortex Engine Online. I have direct memory access to the current tab's ${contextData.rowCount} rows of data. 
          
          I can filter, aggregate, or visualize this Arrow DataFrame. What would you like to know?`,
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

    // Simulate Command Execution for Demo
    if (textInput.toLowerCase().includes('visualize') || textInput.toLowerCase().includes('chart')) {
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

    try {
        // Convert dataframe to string representation for the LLM
        const dataStr = JSON.stringify(contextData.columns.map(c => ({ name: c.name, data: c.data.slice(0, 10) }))); // limit context
        
        // Call Gemini
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
                text: "SYSTEM ALERT: Gemini API Key is missing. Please set it in settings or local storage to enable the Intelligence Layer.",
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
      localStorage.setItem("GEMINI_API_KEY", key);
      setApiKeyMissing(false);
      alert("Key Saved. Please try asking again.");
  };

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

      {/* Messages */}
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
                    Thinking...
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
        <button 
            onClick={() => handleSend("Visualize the numeric data points")}
            className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-arrow-400 border border-arrow-400/30 text-[10px] px-2 py-1 rounded-full transition-colors flex items-center gap-1"
        >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Visualize Data
        </button>
        <button 
            onClick={() => handleSend("Find the top 3 items by ranking")}
            className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] px-2 py-1 rounded-full transition-colors"
        >
            Top Items
        </button>
        <button 
            onClick={() => handleSend("Identify any anomalies in the dataset")}
            className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] px-2 py-1 rounded-full transition-colors"
        >
            Find Anomalies
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
                placeholder="Query local context..."
                className="flex-1 bg-black text-slate-200 border border-cortex-border rounded p-2 text-xs font-mono focus:border-rust-500 outline-none placeholder:text-slate-600"
                />
                <button 
                    onClick={() => handleSend()}
                    className="bg-rust-600 hover:bg-rust-500 text-white px-3 rounded transition-colors"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AiSidebar;