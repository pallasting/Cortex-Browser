
import { NeuroConfig, NeuroState } from './types';

export class NeuroEngine {
    state: NeuroState;
    config: NeuroConfig;
    targetPattern: Float32Array; // The "Goal" state for the network to learn

    constructor(config: NeuroConfig) {
        this.config = config;
        
        // 1. Allocate Memory (Arrow-like Typed Arrays)
        const maxSynapses = config.neuronCount * config.neuronCount;
        
        this.state = {
            activations: new Float32Array(config.neuronCount),
            biases: new Float32Array(config.neuronCount).fill(0.1),
            synapseSources: new Int32Array(maxSynapses),
            synapseTargets: new Int32Array(maxSynapses),
            synapseWeights: new Float32Array(maxSynapses),
            synapseCount: 0,
            energy: 100,
            generation: 0
        };

        // 2. Initialize Random Topology
        let sIdx = 0;
        for (let i = 0; i < config.neuronCount; i++) {
            for (let j = 0; j < config.neuronCount; j++) {
                if (i !== j && Math.random() < config.synapseDensity) {
                    this.state.synapseSources[sIdx] = i;
                    this.state.synapseTargets[sIdx] = j;
                    this.state.synapseWeights[sIdx] = (Math.random() * 2 - 1) * 0.5; // Init weights
                    sIdx++;
                }
            }
        }
        this.state.synapseCount = sIdx;

        // Define a dummy target pattern (e.g., activate even neurons, suppress odd)
        this.targetPattern = new Float32Array(config.neuronCount);
        for(let i=0; i<config.neuronCount; i++) {
            this.targetPattern[i] = i % 2 === 0 ? 1.0 : 0.0;
        }
    }

    // Forward Pass (Sparse Matrix Multiplication)
    forward() {
        // Reset activations (except input layer, effectively)
        this.state.activations.fill(0);

        // Apply Biases
        for(let i=0; i<this.config.neuronCount; i++) {
            this.state.activations[i] = this.state.biases[i];
        }

        // Propagate signals
        for (let i = 0; i < this.state.synapseCount; i++) {
            const src = this.state.synapseSources[i];
            const tgt = this.state.synapseTargets[i];
            const w = this.state.synapseWeights[i];
            
            // Non-linear activation (ReLU-ish)
            const inputVal = Math.max(0, Math.random()); // Simulating input noise
            
            this.state.activations[tgt] += inputVal * w;
        }

        // Activation Function (Sigmoid)
        for(let i=0; i<this.config.neuronCount; i++) {
            this.state.activations[i] = 1 / (1 + Math.exp(-this.state.activations[i]));
        }
    }

    // Calculate System Energy (Loss)
    calculateEnergy(): number {
        let error = 0;
        for(let i=0; i<this.config.neuronCount; i++) {
            const diff = this.state.activations[i] - this.targetPattern[i];
            error += diff * diff;
        }
        return error;
    }

    // The Thermodynamic Step (Simulated Annealing)
    step() {
        const prevEnergy = this.state.energy;
        
        // 1. Perturb: Pick a random synapse and mutate weight
        const mutIdx = Math.floor(Math.random() * this.state.synapseCount);
        const oldWeight = this.state.synapseWeights[mutIdx];
        const noise = (Math.random() * 2 - 1) * 0.5; // Mutation magnitude
        
        this.state.synapseWeights[mutIdx] += noise;

        // 2. Forward & Evaluate
        this.forward();
        const newEnergy = this.calculateEnergy();
        const deltaE = newEnergy - prevEnergy;

        // 3. Metropolis Criterion
        let accepted = false;
        if (deltaE < 0) {
            accepted = true; // Optimization
        } else {
            // Thermal Fluctuation
            const prob = Math.exp(-deltaE / this.config.temperature);
            if (Math.random() < prob) {
                accepted = true;
            }
        }

        if (accepted) {
            this.state.energy = newEnergy;
        } else {
            // Revert
            this.state.synapseWeights[mutIdx] = oldWeight;
        }

        // 4. Structural Plasticity (Topology Adaptation)
        this.structuralPlasticity();

        // 5. Cooling
        this.config.temperature *= this.config.coolingRate;
        this.state.generation++;

        return accepted;
    }

    structuralPlasticity() {
        // Pruning: Weights near zero decay and die
        // In a TypedArray, actual removal is O(N), but we mock it by zeroing
        // Real implementation would use Swap-Remove
        
        // Growth: Hebbian-like check (mocked)
        if (Math.random() < 0.05 && this.state.synapseCount < this.state.synapseWeights.length) {
            // "Grow" a synapse
            const sIdx = this.state.synapseCount;
            this.state.synapseSources[sIdx] = Math.floor(Math.random() * this.config.neuronCount);
            this.state.synapseTargets[sIdx] = Math.floor(Math.random() * this.config.neuronCount);
            this.state.synapseWeights[sIdx] = Math.random() * 0.1;
            this.state.synapseCount++;
        }
    }
}
