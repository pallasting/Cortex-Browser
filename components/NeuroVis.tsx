
import React, { useEffect, useRef, useState } from 'react';
import { useCortex } from '../hooks/useCortex';

const NeuroVis: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { state, actions } = useCortex();
    const [localConfig, setLocalConfig] = useState(state.neuroConfig);

    // Sync local controls with global state
    useEffect(() => {
        setLocalConfig(state.neuroConfig);
    }, [state.neuroConfig]);

    const handleConfigChange = (key: string, value: number) => {
        const newConfig = { ...localConfig, [key]: value };
        setLocalConfig(newConfig);
        // Debounce update to kernel? For now direct update is fine for sliders
        actions.updateNeuroConfig(newConfig);
    };

    const handleReset = () => {
        actions.updateNeuroConfig({
            neuronCount: 50,
            synapseDensity: 0.2,
            temperature: 1.0,
            coolingRate: 0.995
        });
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        
        // Cache positions to avoid recalculating every frame unless count changes
        // For simulation purposes, we assume static count for this render loop instance
        const neuronCount = state.neuroState.activations.length;
        const neurons: {x: number, y: number}[] = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.7; // Smaller radius to fit screen better
        
        for(let i=0; i<neuronCount; i++) {
            const angle = (i / neuronCount) * Math.PI * 2;
            neurons.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }

        const render = () => {
            // Run a simulation step via IPC (Synchronous logic in Kernel, but triggered here)
            // In a real WASM app, the loop would be inside Rust, and we'd just fetch the buffer.
            actions.neuroStep();
            
            // Read fresh state directly
            // Note: 'state' from hook is a snapshot. We need the latest ref if we want 60fps logic relying on 'actions' to update 'state'.
            // However, useCortex triggers re-render on state change. 
            // So this useEffect actually re-runs often? No, dep array is empty.
            // Problem: 'state' inside here is stale (closure).
            // But 'state.neuroState' is an object reference (SoA). 
            // In 'kernel.ts', 'neuroStep' modifies the TYPED ARRAYS in place.
            // So even if 'state' object is stale, 'state.neuroState.activations' points to the same memory buffer!
            // This is the beauty of Shared Memory / SoA!
            
            const neuroState = state.neuroState;

            // 1. Clear
            ctx.fillStyle = '#0A0C10';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 2. Draw Synapses
            ctx.lineWidth = 1;
            for(let i=0; i<neuroState.synapseCount; i++) {
                const src = neuroState.synapseSources[i];
                const tgt = neuroState.synapseTargets[i];
                const w = neuroState.synapseWeights[i];
                
                // Opacity threshold
                if (Math.abs(w) < 0.05) continue; 

                const p1 = neurons[src];
                const p2 = neurons[tgt];

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                
                const alpha = Math.min(Math.abs(w) * 1.5, 0.8);
                ctx.strokeStyle = w > 0 
                    ? `rgba(57, 193, 243, ${alpha})` // Arrow Blue
                    : `rgba(206, 65, 43, ${alpha})`;  // Rust Red
                ctx.stroke();
            }

            // 3. Draw Neurons
            for(let i=0; i<neuronCount; i++) {
                const p = neurons[i];
                const act = neuroState.activations[i]; // Reading from Shared Buffer

                ctx.beginPath();
                ctx.arc(p.x, p.y, 4 + act * 6, 0, Math.PI * 2);
                
                const intensity = Math.floor(act * 255);
                ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
                ctx.fill();
                ctx.strokeStyle = '#2A2E37';
                ctx.stroke();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();
        return () => cancelAnimationFrame(animationFrameId);
    }, []); // Run once on mount. Relies on Shared Array Buffer mutation for updates.

    return (
        <div className="w-full h-full relative bg-cortex-bg flex items-center justify-center overflow-hidden animate-in fade-in duration-500">
            <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />
            
            {/* Stats Overlay */}
            <div className="absolute top-4 left-4 font-mono text-xs bg-black/50 p-4 rounded border border-cortex-border backdrop-blur-sm pointer-events-none select-none">
                <div className="text-rust-500 font-bold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rust-500 animate-pulse"></span>
                    NEURORUST ENGINE
                </div>
                <div className="space-y-1 text-slate-400">
                    <div className="flex justify-between w-48"><span>ENERGY (LOSS):</span> <span className={state.neuroState.energy < 10 ? "text-green-400" : "text-yellow-400"}>{state.neuroState.energy.toFixed(4)}</span></div>
                    <div className="flex justify-between w-48"><span>GENERATION:</span> <span className="text-slate-200">{state.neuroState.generation}</span></div>
                    <div className="flex justify-between w-48"><span>SYNAPSES:</span> <span className="text-slate-200">{state.neuroState.synapseCount}</span></div>
                </div>
            </div>

            {/* Control Deck */}
            <div className="absolute top-4 right-4 w-64 bg-[#13161C]/90 backdrop-blur-md border border-cortex-border rounded-lg p-4 font-mono text-xs shadow-2xl">
                 <div className="text-arrow-400 font-bold mb-3 border-b border-white/10 pb-2">REACTOR CONTROLS</div>
                 
                 <div className="space-y-4">
                     <div>
                         <div className="flex justify-between mb-1 text-slate-400">
                             <span>TEMPERATURE (T)</span>
                             <span className="text-rust-500">{localConfig.temperature.toFixed(3)}</span>
                         </div>
                         <input 
                            type="range" min="0.001" max="2.0" step="0.001"
                            value={localConfig.temperature}
                            onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rust-500"
                         />
                     </div>

                     <div>
                         <div className="flex justify-between mb-1 text-slate-400">
                             <span>COOLING RATE</span>
                             <span className="text-blue-400">{localConfig.coolingRate.toFixed(4)}</span>
                         </div>
                         <input 
                            type="range" min="0.9000" max="1.0000" step="0.0001"
                            value={localConfig.coolingRate}
                            onChange={(e) => handleConfigChange('coolingRate', parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-arrow-400"
                         />
                     </div>

                     <div>
                         <div className="flex justify-between mb-1 text-slate-400">
                             <span>SYNAPSE DENSITY</span>
                             <span className="text-purple-400">{localConfig.synapseDensity.toFixed(2)}</span>
                         </div>
                         <input 
                            type="range" min="0.05" max="1.0" step="0.05"
                            value={localConfig.synapseDensity}
                            onChange={(e) => handleConfigChange('synapseDensity', parseFloat(e.target.value))}
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                         />
                     </div>

                     <button 
                        onClick={handleReset}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded border border-slate-700 transition-colors mt-2"
                     >
                         RESET TOPOLOGY
                     </button>
                 </div>
            </div>

            {/* Hint */}
             <div className="absolute bottom-12 right-8 max-w-sm text-right font-mono pointer-events-none opacity-50">
                <div className="text-[10px] text-slate-500">
                    THERMODYNAMIC ANNEALING
                </div>
                <div className="text-[9px] text-slate-600 mt-1">
                    Adjust Temperature to control exploration (high T) vs exploitation (low T).
                </div>
            </div>
        </div>
    );
};

export default NeuroVis;