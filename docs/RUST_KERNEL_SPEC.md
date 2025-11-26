# Rust Kernel Specification

This document defines the implementation details for the `src-tauri` Rust crate.

## 1. Dependencies (`Cargo.toml`)

```toml
[dependencies]
# Core Runtime
tokio = { version = "1", features = ["full"] }
tauri = { version = "2.0.0", features = ["shell", "fs"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
anyhow = "1.0"

# Data Engine
polars = { version = "0.36", features = ["lazy", "ipc", "strings"] }
arrow = "50.0"

# Web Scraping
reqwest = { version = "0.11", features = ["json", "blocking"] }
scraper = "0.18" 

# AI & Vectors
lancedb = "0.4"
fastembed = "3" # Local Embedding generation
candle-core = "0.3" # For local LLM inference
candle-nn = "0.3"

# Parallelism (for NeuroRust)
rayon = "1.8"
rand = "0.8"
```

## 2. Module: `cortex_core` (Data Engine)

Responsible for converting unstructured HTML into Structured Arrow Tables.

```rust
// src/engine/mod.rs

use polars::prelude::*;

pub struct CortexEngine {
    // In-memory registry of active tabs and their dataframes
    tabs: HashMap<String, DataFrame>,
}

impl CortexEngine {
    pub fn parse_url(&mut self, url: &str) -> Result<DataFrame> {
        // 1. Fetch HTML
        // 2. Extract P, H1, A, Table tags
        // 3. Construct Series
        // 4. Return DataFrame
    }
    
    pub fn to_arrow_ipc(&self, df: &DataFrame) -> Vec<u8> {
        // Serialize for frontend
    }
}
```

## 3. Module: `cortex_memory` (Vector Store)

Responsible for long-term semantic storage using LanceDB.

```rust
// src/memory/mod.rs

use lancedb::connect;
use fastembed::{TextEmbedding, InitOptions};

pub struct MemoryStore {
    db: lancedb::Connection,
    model: TextEmbedding,
}

impl MemoryStore {
    pub async fn ingest(&self, content: &str) -> Result<()> {
        // 1. Generate Embedding (384-dim or 768-dim)
        // 2. Store in LanceDB Table
    }
    
    pub async fn recall(&self, query: &str) -> Result<Vec<Record>> {
        // ANN Search
    }
}
```

## 4. Module: `neurorust` (Physics Engine)

**Critical:** This implementation must follow the "Structure of Arrays" layout to align with the frontend's `NeuroState`.

```rust
// src/neurorust/mod.rs

#[repr(C)]
pub struct NeuroState {
    pub activations: Vec<f32>,
    pub biases: Vec<f32>,
    pub weights: Vec<f32>, // Flat array of sparse weights
    pub sources: Vec<u32>, // Adjacency list source indices
    pub targets: Vec<u32>, // Adjacency list target indices
}

impl NeuroState {
    /// The Metropolis-Hastings Step
    pub fn thermodynamic_step(&mut self, temperature: f32) {
        use rayon::prelude::*;
        // Parallel update logic...
    }
}
```
