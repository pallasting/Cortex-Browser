import React, { useState, useEffect } from 'react';

interface BootScreenProps {
  onComplete: () => void;
}

const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  
  const bootSequence = [
    { text: "CORTEX KERNEL v0.1.0-alpha initializing...", delay: 200 },
    { text: "[ OK ] CPU Threads: 8/8 detected (WASM Backend)", delay: 400 },
    { text: "[ OK ] Allocating Virtual Memory (Arrow Arena)...", delay: 800 },
    { text: "[ OK ] Initializing LanceDB (Local Vector Store)...", delay: 1400 },
    { text: "[ OK ] Loading Polars Engine...", delay: 1800 },
    { text: "[ OK ] Neural Engine: Gemini-2.5-Flash (Quantized)", delay: 2200 },
    { text: "Mounting File System... DONE", delay: 2500 },
    { text: "Starting Window Manager...", delay: 2800 },
    { text: "SYSTEM READY.", delay: 3000 },
  ];

  useEffect(() => {
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    // Schedule lines
    bootSequence.forEach((item, index) => {
      const timeout = setTimeout(() => {
        setLines(prev => [...prev, item.text]);
      }, item.delay);
      timeouts.push(timeout);
    });

    // Complete boot
    const finishTimeout = setTimeout(() => {
      onComplete();
    }, 3500);
    timeouts.push(finishTimeout);

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center p-8 font-mono text-sm">
      <div className="w-full max-w-2xl">
         <div className="mb-6 text-rust-500 font-bold tracking-widest text-xs animate-pulse">
            /// CORTEX BOOTLOADER ///
         </div>
         <div className="space-y-1">
            {lines.map((line, i) => (
                <div key={i} className="flex gap-2">
                    <span className="text-slate-600">{(i * 0.04).toFixed(4)}</span>
                    <span className={line.includes("ERROR") ? "text-red-500" : line.includes("WARN") ? "text-yellow-500" : "text-slate-300"}>
                        {line}
                    </span>
                </div>
            ))}
            <div className="flex gap-2 animate-pulse">
                 <span className="text-slate-600">{((lines.length + 1) * 0.04).toFixed(4)}</span>
                 <span className="text-arrow-400">_</span>
            </div>
         </div>
      </div>
      
      <div className="absolute bottom-8 right-8 text-xs text-slate-700">
         MEMORY_CHECK: PASS
      </div>
    </div>
  );
};

export default BootScreen;
