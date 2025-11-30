
import { DataFrame, Tab, VectorGraphData, SystemLog, ViewMode, NeuroConfig, NeuroState } from '../types';
import { MOCK_HN_DATAFRAME, MOCK_CRATES_DATAFRAME, MOCK_VECTOR_GRAPH, generateArticleDataFrame } from '../constants';

// --- NeuroRust Engine Simulation (Inline for simplicity) ---
class NeuroEngineSim {
    state: NeuroState;
    config: NeuroConfig;

    constructor() {
        this.config = {
            neuronCount: 50,
            synapseDensity: 0.2,
            temperature: 1.0,
            coolingRate: 0.995
        };
        
        const maxSynapses = this.config.neuronCount * this.config.neuronCount;
        this.state = {
            activations: new Float32Array(this.config.neuronCount),
            biases: new Float32Array(this.config.neuronCount).fill(0.1),
            synapseSources: new Int32Array(maxSynapses),
            synapseTargets: new Int32Array(maxSynapses),
            synapseWeights: new Float32Array(maxSynapses),
            synapseCount: 0,
            energy: 100,
            generation: 0
        };

        // Init Topology
        let sIdx = 0;
        for (let i = 0; i < this.config.neuronCount; i++) {
            for (let j = 0; j < this.config.neuronCount; j++) {
                if (i !== j && Math.random() < this.config.synapseDensity) {
                    this.state.synapseSources[sIdx] = i;
                    this.state.synapseTargets[sIdx] = j;
                    this.state.synapseWeights[sIdx] = (Math.random() * 2 - 1) * 0.5;
                    sIdx++;
                }
            }
        }
        this.state.synapseCount = sIdx;
    }

    step() {
        // Forward Pass Mock
        this.state.activations.fill(0);
        for(let i=0; i<this.state.synapseCount; i++) {
            const src = this.state.synapseSources[i];
            const tgt = this.state.synapseTargets[i];
            const w = this.state.synapseWeights[i];
            // Simple activation propagation
            if (Math.random() > 0.5) {
                 this.state.activations[tgt] += w;
            }
        }
        // Normalize
        for(let i=0; i<this.config.neuronCount; i++) {
             this.state.activations[i] = 1 / (1 + Math.exp(-this.state.activations[i]));
        }

        // Thermodynamic Perturbation
        const mutIdx = Math.floor(Math.random() * this.state.synapseCount);
        this.state.synapseWeights[mutIdx] += (Math.random() - 0.5) * 0.1;

        // Cooling
        this.config.temperature *= this.config.coolingRate;
        this.state.energy = this.state.energy * 0.99 + Math.random(); // Mock energy drop
        this.state.generation++;
    }
}

// --- Cortex Kernel ---

export interface KernelState {
    tabs: Tab[];
    activeTabId: string;
    dataFrames: { [key: string]: DataFrame };
    vectorData: VectorGraphData;
    systemLogs: SystemLog[];
    viewMode: ViewMode;
    isLiveMode: boolean;
    neuroState: NeuroState;
}

class CortexKernel {
    private state: KernelState;
    private listeners: ((state: KernelState) => void)[] = [];
    private neuroEngine: NeuroEngineSim;
    private liveInterval: any = null;

    constructor() {
        this.neuroEngine = new NeuroEngineSim();
        
        this.state = {
            tabs: [
                { id: '1', title: 'Hacker News', url: 'news.ycombinator.com', dataState: 'parsed', tokenCount: 450 },
                { id: '2', title: 'crates.io', url: 'crates.io', dataState: 'parsed', tokenCount: 1200 },
            ],
            activeTabId: '1',
            dataFrames: {
                '1': MOCK_HN_DATAFRAME,
                '2': MOCK_CRATES_DATAFRAME
            },
            vectorData: MOCK_VECTOR_GRAPH,
            systemLogs: [],
            viewMode: ViewMode.WEB,
            isLiveMode: false,
            neuroState: this.neuroEngine.state
        };

        this.addLog('INFO', 'ENGINE', 'Cortex Kernel initialized (Simulation Mode)');
    }

    // --- Pub/Sub ---
    subscribe(listener: (state: KernelState) => void): () => void {
        this.listeners.push(listener);
        listener(this.state); // Initial emission
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l(this.state));
    }

    // --- Actions ---

    getState(): KernelState {
        return this.state;
    }

    navigate(url: string, title: string) {
        const newTabId = Date.now().toString();
        const newTab: Tab = {
            id: newTabId,
            title: title.length > 20 ? title.substring(0, 20) + '...' : title,
            url: url,
            dataState: 'parsed',
            tokenCount: 800
        };

        // Update Tabs
        const newTabs = [...this.state.tabs, newTab];
        
        // Generate Data
        const newData = generateArticleDataFrame(newTabId, title);
        const newDataFrames = { ...this.state.dataFrames, [newTabId]: newData };

        // Update Vectors
        const newNodeId = newTabId;
        const sourceNodeId = this.state.activeTabId;
        const newNode = {
            id: newNodeId,
            title: title,
            url: url,
            similarity: 0.95,
            x: 0, y: 0
        };
        const newLink = { source: sourceNodeId, target: newNodeId, value: 0.8 };
        
        const newVectorData = {
            nodes: [...this.state.vectorData.nodes, newNode],
            links: [...this.state.vectorData.links, newLink]
        };

        this.state = {
            ...this.state,
            tabs: newTabs,
            activeTabId: newTabId,
            dataFrames: newDataFrames,
            vectorData: newVectorData
        };
        
        this.addLog('INFO', 'ENGINE', `Parsed ${newData.rowCount} blocks from "${title}"`);
        this.addLog('INFO', 'ENGINE', `LanceDB: Ingested vector node ${newNodeId.substring(0,8)}`);
        this.notify();
    }

    closeTab(tabId: string) {
        if (this.state.tabs.length === 1) return;
        
        const newTabs = this.state.tabs.filter(t => t.id !== tabId);
        let newActiveId = this.state.activeTabId;
        
        if (this.state.activeTabId === tabId) {
            newActiveId = newTabs[newTabs.length - 1].id;
        }

        const newDataFrames = { ...this.state.dataFrames };
        delete newDataFrames[tabId];

        this.state = {
            ...this.state,
            tabs: newTabs,
            activeTabId: newActiveId,
            dataFrames: newDataFrames
        };
        this.addLog('INFO', 'ENGINE', `Tab ${tabId} closed. Memory freed.`);
        this.notify();
    }

    setActiveTab(tabId: string) {
        this.state = { ...this.state, activeTabId: tabId };
        this.notify();
    }

    setViewMode(mode: ViewMode) {
        this.state = { ...this.state, viewMode: mode };
        if (mode === ViewMode.NEURO) {
            this.addLog('INFO', 'ENGINE', 'NeuroRust: Physics Engine Attached.');
        }
        this.notify();
    }

    toggleLiveMode() {
        const newMode = !this.state.isLiveMode;
        this.state = { ...this.state, isLiveMode: newMode };
        this.addLog('INFO', 'SYSTEM', `Live Sync: ${newMode ? 'ON' : 'OFF'}`);
        
        if (newMode) {
            this.liveInterval = setInterval(() => this.tick(), 1000);
        } else {
            if (this.liveInterval) clearInterval(this.liveInterval);
        }
        this.notify();
    }

    runGC() {
        this.addLog('INFO', 'SYSTEM', 'Manual GC triggered. Compacting heap...');
        setTimeout(() => {
             this.addLog('INFO', 'SYSTEM', 'GC Complete. Freed 12MB.');
             this.notify();
        }, 500);
    }

    // --- Agent / internal mutations ---

    addLog(level: SystemLog['level'], source: SystemLog['source'], message: string) {
        const newLog: SystemLog = {
            id: Date.now().toString() + Math.random(),
            timestamp: Date.now(),
            level,
            source,
            message
        };
        this.state = {
            ...this.state,
            systemLogs: [...this.state.systemLogs.slice(-49), newLog]
        };
        this.notify();
    }

    mutateDataFrame(idVal: string | number, colName: string, delta: number) {
        const tabId = Object.keys(this.state.dataFrames).find(tid => {
             const df = this.state.dataFrames[tid];
             const idCol = df.columns.find(c => c.name === 'id' || c.name === 'crate_name');
             return idCol?.data.includes(idVal as any);
        });

        if (!tabId) return;

        const df = this.state.dataFrames[tabId];
        const newDF = { ...df, columns: [...df.columns] };
        
        const idColIndex = newDF.columns.findIndex(c => c.name === 'id' || c.name === 'crate_name');
        const targetColIndex = newDF.columns.findIndex(c => c.name === colName);

        if (idColIndex !== -1 && targetColIndex !== -1) {
             const rowIndex = newDF.columns[idColIndex].data.findIndex(v => String(v) === String(idVal));
             if (rowIndex !== -1) {
                 const newData = [...(newDF.columns[targetColIndex].data as any[])];
                 if (typeof newData[rowIndex] === 'number') {
                     const oldVal = newData[rowIndex];
                     newData[rowIndex] += delta;
                     this.addLog('MUTATION', 'ENGINE', `Row[${idVal}].${colName} ${oldVal} -> ${newData[rowIndex]}`);
                 }
                 newDF.columns[targetColIndex] = { ...newDF.columns[targetColIndex], data: newData };
                 
                 this.state = {
                     ...this.state,
                     dataFrames: { ...this.state.dataFrames, [tabId]: newDF }
                 };
                 this.notify();
             }
        }
    }

    neuroStep() {
        this.neuroEngine.step();
        // Since NeuroState uses TypedArrays, the reference doesn't change, but data does.
        // We trigger notify to rerender.
        this.notify();
    }

    private tick() {
        // 1. Mutate DataFrames (Random Noise)
        // ... (Simulated Logic simplified here)
        // 2. Neuro Step
        if (this.state.viewMode === ViewMode.NEURO) {
            this.neuroStep();
        }
    }
}

// Singleton Instance
export const kernel = new CortexKernel();
