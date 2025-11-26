
import React, { useEffect, useRef, useState } from 'react';
import { NeuroEngine } from '../neurorust/engine';
import { NeuroConfig } from '../neurorust/types';

const NeuroVis: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<NeuroEngine | null>(null);
    const [stats, setStats] = useState({ energy: 0, temp: 0, gen: 0, synapses: 0 });

    // Initialize Engine
    useEffect(() => {
        const config: NeuroConfig = {
            neuronCount: 50,
            synapseDensity: 0.2,
            temperature: 1.0,
            coolingRate: 0.999
        };
        engineRef.current = new NeuroEngine(config);
    }, []);

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !engineRef.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        // Pre-calculate neuron positions (Circle layout)
        const neurons = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        
        for(let i=0; i<engineRef.current.config.neuronCount; i++) {
            const angle = (i / engineRef.current.config.neuronCount) * Math.PI * 2;
            neurons.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }

        const render = () => {
            const engine = engineRef.current!;
            
            // 1. Run Physics Step (Multiple steps per frame for speed)
            for(let i=0; i<10; i++) engine.step();

            setStats({
                energy: engine.state.energy,
                temp: engine.config.temperature,
                gen: engine.state.generation,
                synapses: engine.state.synapseCount
            });

            // 2. Clear
            ctx.fillStyle = '#0A0C10';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 3. Draw Synapses
            ctx.lineWidth = 1;
            for(let i=0; i<engine.state.synapseCount; i++) {
                const src = engine.state.synapseSources[i];
                const tgt = engine.state.synapseTargets[i];
                const w = engine.state.synapseWeights[i];
                
                if (Math.abs(w) < 0.05) continue; // Don't draw weak links

                const p1 = neurons[src];
                const p2 = neurons[tgt];

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                
                // Color based on weight: Red (Inhibitory), Blue (Excitatory)
                // Opacity based on strength
                const alpha = Math.min(Math.abs(w) * 2, 1);
                ctx.strokeStyle = w > 0 
                    ? `rgba(57, 193, 243, ${alpha})` // Arrow Blue
                    : `rgba(206, 65, 43, ${alpha})`;  // Rust Red
                ctx.stroke();
            }

            // 4. Draw Neurons
            for(let i=0; i<engine.config.neuronCount; i++) {
                const p = neurons[i];
                const act = engine.state.activations[i];

                ctx.beginPath();
                ctx.arc(p.x, p.y, 4 + act * 4, 0, Math.PI * 2);
                
                // Heatmap color for activation
                // Low: Dark, High: Bright White
                const intensity = Math.floor(act * 255);
                ctx.fillStyle = `rgb(${intensity}, ${intensity}, ${intensity})`;
                ctx.fill();
                
                // Ring
                ctx.strokeStyle = '#2A2E37';
                ctx.stroke();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <div className="w-full h-full relative bg-cortex-bg flex items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />
            
            {/* Stats Overlay */}
            <div className="absolute top-4 left-4 font-mono text-xs bg-black/50 p-4 rounded border border-cortex-border backdrop-blur-sm">
                <div className="text-rust-500 font-bold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rust-500 animate-pulse"></span>
                    NEURORUST ENGINE
                </div>
                <div className="space-y-1 text-slate-400">
                    <div className="flex justify-between w-48">
                        <span>SYSTEM ENERGY:</span>
                        <span className={stats.energy < 10 ? "text-green-400" : "text-yellow-400"}>{stats.energy.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between w-48">
                        <span>TEMPERATURE:</span>
                        <span className="text-blue-400">{stats.temp.toFixed(6)} K</span>
                    </div>
                    <div className="flex justify-between w-48">
                        <span>GENERATION:</span>
                        <span className="text-slate-200">{stats.gen}</span>
                    </div>
                    <div className="flex justify-between w-48">
                        <span>ACTIVE SYNAPSES:</span>
                        <span className="text-slate-200">{stats.synapses}</span>
                    </div>
                     <div className="mt-2 text-[9px] text-slate-600 border-t border-slate-800 pt-1">
                        STRATEGY: METROPOLIS-HASTINGS
                        <br/>
                        MEMORY: SOA / ARROW-COMPATIBLE
                    </div>
                </div>
            </div>
            
            {/* Explanation Overlay */}
             <div className="absolute bottom-8 right-8 max-w-sm text-right font-mono pointer-events-none opacity-50">
                <div className="text-[10px] text-slate-500">
                    VISUALIZING THERMODYNAMIC DIFFUSION
                </div>
                <div className="text-[9px] text-slate-600 mt-1">
                    Neurons settle into low-energy configurations via simulated annealing.
                    Blue lines are excitatory connections, Red are inhibitory.
                    Structure evolves dynamically.
                </div>
            </div>
        </div>
    );
};

export default NeuroVis;
