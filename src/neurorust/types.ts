
// Types for the NeuroRust Simulation

export interface NeuroConfig {
    neuronCount: number;
    synapseDensity: number; // 0 to 1
    temperature: number; // System temperature
    coolingRate: number;
}

export interface NeuroState {
    // Structure of Arrays (SoA) layout - mimicking Arrow Columns
    activations: Float32Array;
    biases: Float32Array;
    
    // Sparse Matrix (COO format)
    synapseSources: Int32Array;
    synapseTargets: Int32Array;
    synapseWeights: Float32Array;
    
    // Metadata
    synapseCount: number;
    energy: number;
    generation: number;
}
