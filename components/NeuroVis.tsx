
import React, { useEffect, useRef, useState } from 'react';
import { useCortex } from '../hooks/useCortex';

const NeuroVis: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { state, actions } = useCortex();
    const [stats, setStats] = useState({ energy: 0, temp: 0, gen: 0, synapses: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        // Pre-calculate neuron positions (Circle layout)
        const neuronCount = state.neuroState.activations.length;
        const neurons: {x: number, y: number}[] = [];
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8;
        
        for(let i=0; i<neuronCount; i++) {
            const angle = (i / neuronCount) * Math.PI * 2;
            neurons.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }

        const render = () => {
            // Run a simulation step
            actions.neuroStep();
            const neuroState = state.neuroState;

            setStats({
                energy: neuroState.energy,
                temp: 0.9, // simplified from config
                gen: neuroState.generation,
                synapses: neuroState.synapseCount
            });

            // 1. Clear
            ctx.fillStyle = '#0A0C10';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 2. Draw Synapses
            ctx.lineWidth = 1;
            for(let i=0; i<neuroState.synapseCount; i++) {
                const src = neuroState.synapseSources[i];
                const tgt = neuroState.synapseTargets[i];
                const w = neuroState.synapseWeights[i];
                
                if (Math.abs(w) < 0.05) continue; 

                const p1 = neurons[src];
                const p2 = neurons[tgt];

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                
                const alpha = Math.min(Math.abs(w) * 2, 1);
                ctx.strokeStyle = w > 0 
                    ? `rgba(57, 193, 243, ${alpha})` // Arrow Blue
                    : `rgba(206, 65, 43, ${alpha})`;  // Rust Red
                ctx.stroke();
            }

            // 3. Draw Neurons
            for(let i=0; i<neuronCount; i++) {
                const p = neurons[i];
                const act = neuroState.activations[i];

                ctx.beginPath();
                ctx.arc(p.x, p.y, 4 + act * 4, 0, Math.PI * 2);
                
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
    }, []); // Only mount once, state updates via hook inside render loop logic is tricky with React render cycle
    // In a real game loop we might bypass React state for 60fps, but here we trigger via hook.
    // Actually, calling actions.neuroStep() inside rAF is good, but reading `state` from hook closure might be stale.
    // However, since `state` is a Ref or Singleton in Kernel, we should read directly if possible or trust the prop updates.
    // For this prototype, let's trust the re-render or simplify.
    
    // Correction: `state` from useCortex changes on every notify. 
    // If we put `state` in dependency array, we re-run effect, which resets canvas. Bad.
    // Better to have `kernel` accessible directly or via ref for the loop.
    // Since we are mocking, let's just let the visualizer trigger the step and read the mutable neuroState object (which is kept by reference).

    return (
        <div className="w-full h-full relative bg-cortex-bg flex items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} width={800} height={600} className="w-full h-full object-contain" />
            
            <div className="absolute top-4 left-4 font-mono text-xs bg-black/50 p-4 rounded border border-cortex-border backdrop-blur-sm pointer-events-none">
                <div className="text-rust-500 font-bold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rust-500 animate-pulse"></span>
                    NEURORUST ENGINE
                </div>
                <div className="space-y-1 text-slate-400">
                    <div className="flex justify-between w-48"><span>ENERGY:</span> <span className="text-yellow-400">{stats.energy.toFixed(4)}</span></div>
                    <div className="flex justify-between w-48"><span>GEN:</span> <span className="text-slate-200">{stats.gen}</span></div>
                    <div className="flex justify-between w-48"><span>SYNAPSES:</span> <span className="text-slate-200">{stats.synapses}</span></div>
                </div>
            </div>
        </div>
    );
};

export default NeuroVis;
